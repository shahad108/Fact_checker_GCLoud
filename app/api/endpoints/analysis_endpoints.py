import json
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from typing import List
from uuid import UUID
import logging

from app.api.dependencies import get_analysis_service, get_auth_middleware, get_orchestrator_service, get_current_user
from app.core.auth.auth0_middleware import Auth0Middleware
from app.models.domain.user import User
from app.services.analysis_service import AnalysisService
from app.services.analysis_orchestrator import AnalysisOrchestrator
from app.schemas.analysis_schema import AnalysisRead
from app.core.exceptions import NotFoundException
from fastapi.responses import StreamingResponse

router = APIRouter(prefix="/analysis", tags=["analysis"])
logger = logging.getLogger(__name__)


@router.get("/{analysis_id}", response_model=AnalysisRead)
async def get_analysis(
    analysis_id: UUID,
    include_sources: bool = Query(False),
    include_feedback: bool = Query(False),
    current_user: User = Depends(get_current_user),
    analysis_service: AnalysisService = Depends(get_analysis_service),
) -> AnalysisRead:
    try:
        analysis = await analysis_service.get_analysis(
            analysis_id=analysis_id, include_sources=include_sources, include_feedback=include_feedback
        )
        return AnalysisRead.model_validate(analysis)
    except NotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.get("/claim/{claim_id}/stream", response_class=StreamingResponse)
async def stream_claim_analysis(
    request: Request,
    claim_id: UUID,
    auth_middleware: Auth0Middleware = Depends(get_auth_middleware),
    analysis_orchestrator: AnalysisOrchestrator = Depends(get_orchestrator_service),
) -> StreamingResponse:
    """Stream the analysis process for a claim in real-time."""
    try:
        current_user = await auth_middleware.authenticate_request(request)

        async def event_generator():
            try:
                logger.info(f"Starting analysis stream for claim {claim_id}")
                yield f"data: {json.dumps({'type': 'status', 'content': 'Initializing analysis...'})}\n\n"

                async for event in analysis_orchestrator.analyze_claim_stream(
                    claim_id=claim_id, user_id=current_user.id
                ):
                    if isinstance(event, dict):
                        yield f"data: {json.dumps(event)}\n\n"

            except Exception as e:
                logger.error(f"Error in analysis stream: {str(e)}", exc_info=True)
                yield f"data: {json.dumps({'type': 'error', 'content': str(e)})}\n\n"
            finally:
                yield "data: [DONE]\n\n"

        return StreamingResponse(
            event_generator(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Credentials": "true",
            },
        )
    except Exception as e:
        logger.error(f"Stream error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/claim/{claim_id}", response_model=List[AnalysisRead])
async def get_claim_analyses(
    claim_id: UUID,
    include_sources: bool = Query(False),
    include_feedback: bool = Query(False),
    current_user: User = Depends(get_current_user),
    analysis_service: AnalysisService = Depends(get_analysis_service),
) -> List[AnalysisRead]:
    try: 
        logger.info("Fetching analysis...")
        analyses = await analysis_service.get_claim_analyses(
            claim_id=claim_id, include_sources=include_sources, include_feedback=include_feedback
        )
        return [AnalysisRead.model_validate(a) for a in analyses]
    except Exception as e:
        logger.error("Could not find the analysis for the claim")
        raise HTTPException(status_code=500, detail=str(e))
