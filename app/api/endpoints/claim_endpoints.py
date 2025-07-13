from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from typing import Optional, List
from uuid import UUID
import logging
from datetime import datetime

from app.api.dependencies import get_claim_service, get_current_user, get_embedding_generator, get_orchestrator_service
from app.repositories.implementations.user_repository import UserRepository
from app.db.session import AsyncSessionLocal
from app.models.database.models import ClaimStatus
from app.models.domain.user import User
from app.schemas.claim_schema import (
    ClaimCreate,
    ClaimList,
    ClaimRead,
    ClaimStatusUpdate,
    WordCloudRequest,
    BatchAnalysisResponse,
    BatchResponse,
)
from app.schemas.analysis_schema import AnalysisRead
from app.services.claim_service import ClaimService
from app.services.analysis_orchestrator import AnalysisOrchestrator
from app.core.exceptions import NotFoundException, NotAuthorizedException
from app.services.interfaces.embedding_generator import EmbeddingGeneratorInterface

router = APIRouter(prefix="/claims", tags=["claims"])
logger = logging.getLogger(__name__)


@router.post("/analyze", summary="Create and analyze claim in one step")
async def analyze_claim(
    data: ClaimCreate,
    current_user: User = Depends(get_current_user),
    claim_service: ClaimService = Depends(get_claim_service),
    analysis_orchestrator: AnalysisOrchestrator = Depends(get_orchestrator_service),
):
    """Create a claim and run full analysis, returning complete results."""
    try:
        # Step 1: Create the claim
        claim = await claim_service.create_claim(
            user_id=current_user.id,
            claim_text=data.claim_text,
            context=data.context,
            language=data.language,
            batch_user_id=data.batch_user_id,
            batch_post_id=data.batch_post_id,
        )
        logger.info(f"Created claim {claim.id} for analysis")
        
        # Step 2: Run complete analysis
        analysis_result = await analysis_orchestrator.analyze_claim_direct(
            claim_id=claim.id, user_id=current_user.id
        )
        
        # Step 3: Get the updated claim with analysis
        updated_claim = await claim_service.get_claim(claim_id=claim.id, user_id=current_user.id)
        
        # Step 4: Format response to match frontend expectations
        response = {
            "claim": ClaimRead.model_validate(updated_claim),
            "analysis": analysis_result,
            "message": "Analysis completed successfully"
        }
        
        return response
        
    except Exception as e:
        logger.error(f"Analysis failed for claim: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail=f"Failed to analyze claim: {str(e)}"
        )


@router.post("/analyze-test", summary="Create and analyze claim (NO AUTH - for testing)")
async def analyze_claim_test(
    data: ClaimCreate,
    claim_service: ClaimService = Depends(get_claim_service),
    analysis_orchestrator: AnalysisOrchestrator = Depends(get_orchestrator_service),
):
    """Create a claim and run full analysis without authentication - FOR TESTING ONLY."""
    try:
        # Create a default test user
        async with AsyncSessionLocal() as session:
            user_repo = UserRepository(session)
            # Try to get an existing user or create a default one
            try:
                users = await user_repo.get_all()
                if users and len(users) > 0:
                    test_user = users[0]
                else:
                    # Create a test user if none exists
                    from app.models.domain.user import User
                    from datetime import datetime
                    import uuid
                    test_user_domain = User(
                        id=uuid.uuid4(),
                        auth0_id="test-user-123",
                        email="test@example.com",
                        username="testuser",
                        is_active=True,
                        last_login=None,
                        created_at=datetime.utcnow(),
                        updated_at=datetime.utcnow()
                    )
                    test_user = await user_repo.create(test_user_domain)
                logger.info(f"Using test user: {test_user.id}")
            except Exception as e:
                logger.error(f"Error with test user: {e}")
                raise
                
        # Step 1: Create the claim
        claim = await claim_service.create_claim(
            user_id=test_user.id,
            claim_text=data.claim_text,
            context=data.context or "",
            language=data.language or "english",
        )
        logger.info(f"Created claim {claim.id} for analysis")
        
        # Step 2: Run complete analysis
        analysis_result = await analysis_orchestrator.analyze_claim_direct(
            claim_id=claim.id, user_id=test_user.id
        )
        
        # Step 3: Get the updated claim with analysis
        updated_claim = await claim_service.get_claim(claim_id=claim.id, user_id=test_user.id)
        
        # Step 4: Format response to match frontend expectations  
        # The analysis_result contains the analysis object with searches and sources
        analysis = analysis_result["analysis"]
        
        # Flatten sources from all searches for easier frontend consumption
        all_sources = []
        if hasattr(analysis, 'searches') and analysis.searches:
            for search in analysis.searches:
                if hasattr(search, 'sources') and search.sources:
                    all_sources.extend(search.sources)
        
        # Create properly formatted analysis response
        analysis_response = {
            "id": str(analysis.id),
            "claim_id": str(analysis.claim_id),
            "veracity_score": analysis.veracity_score,
            "confidence_score": analysis.confidence_score,
            "analysis_text": analysis.analysis_text,
            "created_at": analysis.created_at.isoformat() if hasattr(analysis.created_at, 'isoformat') else str(analysis.created_at),
            "sources": [
                {
                    "id": str(source.id),
                    "url": source.url,
                    "title": source.title,
                    "snippet": source.snippet,
                    "credibility_score": source.credibility_score or 0,
                    "domain_name": source.domain.domain_name if (hasattr(source, 'domain') and source.domain) else "",
                    "domain_credibility": source.domain.credibility if (hasattr(source, 'domain') and source.domain) else 0,
                    "created_at": source.created_at.isoformat() if hasattr(source.created_at, 'isoformat') else str(source.created_at),
                    "updated_at": source.updated_at.isoformat() if hasattr(source.updated_at, 'isoformat') else str(source.updated_at)
                }
                for source in all_sources
            ]
        }
        
        response = {
            "claim": ClaimRead.model_validate(updated_claim),
            "analysis": analysis_response,
            "message": "Analysis completed successfully"
        }
        
        return response
        
    except Exception as e:
        logger.error(f"Test analysis failed for claim: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail=f"Failed to analyze claim: {str(e)}"
        )


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
            batch_post_id=data.batch_post_id,
        )
        return ClaimRead.model_validate(claim)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to create claim: {str(e)}"
        )


@router.post("/batch", response_model=BatchResponse, status_code=status.HTTP_200_OK)
async def create_claims_batch(
    claims: List[ClaimCreate],
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    claim_service: ClaimService = Depends(get_claim_service),
    analysis_orchestrator: AnalysisOrchestrator = Depends(get_orchestrator_service),
) -> BatchResponse:
    if len(claims) > 100:
        raise HTTPException(status_code=400, detail="Maximum of 100 claims allowed.")

    try:
        created_claims = await claim_service.create_claims_batch(claims, current_user.id)
        claim_ids = [str(claim.id) for claim in created_claims]
        background_tasks.add_task(
            claim_service.process_claims_batch_async, created_claims, current_user.id, analysis_orchestrator
        )
        return {"message": f"Processing {len(created_claims)} claims in the background.", "claim_ids": claim_ids}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to queue batch: {str(e)}"
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


@router.post("/batch/results", response_model=BatchAnalysisResponse, summary="Get a batch results")
async def get_batch_results(
    claim_ids: List[UUID],
    claim_service: ClaimService = Depends(get_claim_service),
):
    try:
        return await claim_service.get_analysis_results_for_claim_ids(claim_ids=claim_ids)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to get analysis for claims: {str(e)}"
        )


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
