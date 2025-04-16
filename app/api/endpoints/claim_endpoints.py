from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Optional, List
from uuid import UUID
import logging
from datetime import datetime

from app.api.dependencies import get_claim_service, get_current_user, get_embedding_generator, get_orchestrator_service
from app.models.database.models import ClaimStatus
from app.models.domain.user import User
from app.schemas.claim_schema import (
    ClaimCreate,
    ClaimList,
    ClaimRead,
    ClaimStatusUpdate,
    WordCloudRequest,
    BatchAnalysisResponse,
)
from app.services.claim_service import ClaimService
from app.services.analysis_orchestrator import AnalysisOrchestrator
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
            batch_user_id=data.batch_user_id,
        )
        return ClaimRead.model_validate(claim)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to create claim: {str(e)}"
        )


@router.post("/batch", response_model=BatchAnalysisResponse, status_code=status.HTTP_201_CREATED)
async def create_claims_batch(
    claims: List[ClaimCreate],
    current_user: User = Depends(get_current_user),
    claim_service: ClaimService = Depends(get_claim_service),
    analysis_orchestrator: AnalysisOrchestrator = Depends(get_orchestrator_service),
) -> BatchAnalysisResponse:
    if len(claims) > 100:
        raise HTTPException(status_code=400, detail="Maximum of 100 claims allowed.")

    try:
        created_claims = await claim_service.create_claims_batch(claims, current_user.id)

        successes = []
        failures = []
        for claim in created_claims:
            try:
                result = await analysis_orchestrator.analyze_claim_direct(claim.id, current_user.id)
                analysis = result.get("analysis")

                searches = []
                if analysis.searches:
                    searches = analysis.searches
                sources = []
                for search in searches:
                    if search.sources: 
                        sources.append(search.sources)

                flat_sources = [item for sublist in sources for item in sublist]

                seen_urls = set()
                unique_sources = []

                for source in flat_sources:
                    if source.url not in seen_urls:
                        unique_sources.append(source)
                        seen_urls.add(source.url)
                
                valid_scores = [source.credibility_score for source in unique_sources if source.credibility_score is not None]

                avg_source_cred = 0.0
                if valid_scores:
                    avg_source_cred = sum(valid_scores) / len(valid_scores)

                successes.append(
                    {
                        "claim_id": str(claim.id),
                        "analysis_id": str(analysis.id),
                        "batch_user_id": claim.batch_user_id,
                        "batch_post_id": claim.batch_post_id,
                        "veracity_score": analysis.veracity_score,
                        "average_source_credibility": avg_source_cred,
                        "num_sources": len(valid_scores),
                    }
                )
            except Exception as e:
                failures.append(
                    {
                        "claim_id": str(claim.id),
                        "status": "error",
                        "message": str(e),
                    }
                )
        return {"successes": successes, "failures": failures}

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to process batch: {str(e)}"
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

        plot = await claim_service.generate_clustering_graph(claims=claims, num_clusters=3)

        return plot
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to generate clustering graph: {str(e)}"
        )


@router.get("/length/total", response_model=dict, summary="Get total claims by language")
async def get_all_claim(
    start_date: datetime,
    end_date: datetime,
    language: str = "english",
    claim_service: ClaimService = Depends(get_claim_service),
) -> dict:
    """Get total claims by language."""
    try:
        claims = await claim_service.list_time_bound_claims(start_date=start_date, end_date=end_date, language=language)
        return {"total_claims": len(claims)}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to get list of claim: {str(e)}"
        )
