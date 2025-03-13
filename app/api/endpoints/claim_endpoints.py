from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Optional
from uuid import UUID
import logging

from app.api.dependencies import get_claim_service, get_current_user, get_embedding_generator
from app.models.database.models import ClaimStatus
from app.models.domain.user import User
from app.schemas.claim_schema import ClaimCreate, ClaimList, ClaimRead, ClaimStatusUpdate, WordCloudRequest
from app.services.claim_service import ClaimService
from app.core.exceptions import NotFoundException, NotAuthorizedException
from app.services.interfaces.embedding_generator import EmbeddingGeneratorInterface

router = APIRouter(prefix="/claims", tags=["claims"])
logger = logging.getLogger(__name__)


@router.post("/", response_model=ClaimRead, status_code=status.HTTP_201_CREATED, summary="Create a new claim")
async def create_claim(
    data: ClaimCreate,
    current_user: User = Depends(get_current_user),
    claim_service: ClaimService = Depends(get_claim_service),
) -> ClaimRead:
    """Create a new claim for the authenticated user."""
    try:
        claim = await claim_service.create_claim(
            user_id=current_user.id,
            claim_text=data.claim_text,
            context=data.context,
            language=data.language,
        )
        return ClaimRead.model_validate(claim)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to create claim: {str(e)}"
        )


@router.get("/", response_model=ClaimList, summary="List user claims")
async def list_claims(
    status: Optional[ClaimStatus] = None,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    claim_service: ClaimService = Depends(get_claim_service),
) -> ClaimList:
    """List claims for the authenticated user with pagination."""
    try:
        claims, total = await claim_service.list_user_claims(
            user_id=current_user.id, status=status, limit=limit, offset=offset
        )
        return ClaimList(items=[ClaimRead.model_validate(c) for c in claims], total=total, limit=limit, offset=offset)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to list claims: {str(e)}"
        )


@router.get("/{claim_id}", response_model=ClaimRead, summary="Get claim by ID")
async def get_claim(
    claim_id: UUID,
    current_user: User = Depends(get_current_user),
    claim_service: ClaimService = Depends(get_claim_service),
) -> ClaimRead:
    """Get a specific claim by ID."""
    try:
        claim = await claim_service.get_claim(claim_id=claim_id, user_id=current_user.id)
        return ClaimRead.model_validate(claim)
    except NotFoundException:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Claim not found")
    except NotAuthorizedException:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to access this claim")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to get claim: {str(e)}")


@router.patch("/{claim_id}/status", response_model=ClaimRead, summary="Update claim status")
async def update_claim_status(
    claim_id: UUID,
    data: ClaimStatusUpdate,
    current_user: User = Depends(get_current_user),
    claim_service: ClaimService = Depends(get_claim_service),
) -> ClaimRead:
    """Update a claim's status."""
    try:
        claim = await claim_service.update_claim_status(
            claim_id=claim_id, status=ClaimStatus(data.status), user_id=current_user.id
        )
        return ClaimRead.model_validate(claim)
    except NotFoundException:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Claim not found")
    except NotAuthorizedException:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to update this claim")
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to update claim status: {str(e)}"
        )


@router.patch("/{claim_id}/embedding", response_model=ClaimRead, summary="Update claim embedding")
async def update_claim_embedding(
    claim_id: UUID,
    current_user: User = Depends(get_current_user),
    claim_service: ClaimService = Depends(get_claim_service),
    embedding_generator: EmbeddingGeneratorInterface = Depends(get_embedding_generator),
) -> ClaimRead:
    """Generate and update a claim's embedding."""
    try:
        claim = await claim_service.get_claim(claim_id=claim_id, user_id=current_user.id)
        embedding = await embedding_generator.generate_embedding(claim.claim_text)
        claim = await claim_service.update_claim_embedding(
            claim_id=claim_id, embedding=embedding, user_id=current_user.id
        )
        return ClaimRead.model_validate(claim)
    except NotFoundException:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Claim not found")
    except NotAuthorizedException:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to update this claim")
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to update claim status: {str(e)}"
        )


@router.post("/wordcloud/generate", response_model=dict, summary="Get the JSON for plotting a word cloud")
async def generate_word_cloud(
    data: WordCloudRequest,
    claim_service: ClaimService = Depends(get_claim_service),
) -> dict:
    """Generate and update a claim's embedding."""
    try:
        claims = await claim_service.list_time_bound_claims(
            start_date=data.start_date, end_date=data.end_date, language=data.language
        )
        if len(claims) == 0:
            return {}

        plot = await claim_service.generate_word_cloud(claims)

        return plot
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to generate word cloud: {str(e)}"
        )


@router.post("/clustering/generate", response_model=dict, summary="Get the JSON for plotting a clustering graph")
async def generate_clustering_graph(
    data: WordCloudRequest,
    claim_service: ClaimService = Depends(get_claim_service),
) -> dict:
    """Generate and update a claim's embedding."""
    try:
        claims = await claim_service.list_time_bound_claims(
            start_date=data.start_date, end_date=data.end_date, language=data.language
        )
        # logger.info(claims)
        if len(claims) == 0:
            return {}

        plot = await claim_service.generate_clustering_graph(claims=claims, num_clusters=3)

        return plot
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to generate clustering graph: {str(e)}"
        )
