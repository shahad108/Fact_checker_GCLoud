import logging
from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import List
from uuid import UUID
from datetime import datetime
from collections import defaultdict


from app.api.dependencies import get_source_service, get_current_user, get_search_service
from app.models.domain.user import User
from app.services.source_service import SourceService
from app.services.search_service import SearchService
from app.schemas.source_schema import SourceRead, SourceList
from app.core.exceptions import NotFoundException, NotAuthorizedException

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/sources", tags=["sources"])


@router.get("/{source_id}", response_model=SourceRead, summary="Get source by ID")
async def get_source(
    source_id: UUID,
    include_content: bool = Query(False, description="Include full source content in response"),
    current_user: User = Depends(get_current_user),
    source_service: SourceService = Depends(get_source_service),
) -> SourceRead:
    """
    Get detailed information about a specific source.
    Includes authorization check to ensure user has access to the analysis this source belongs to.
    """
    try:
        source = await source_service.get_source(
            source_id=source_id, user_id=current_user.id, include_content=include_content
        )
        return SourceRead.model_validate(source)
    except NotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except NotAuthorizedException:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to access this source")


@router.get(
    "/analysis/{analysis_id}/all", response_model=List[SourceRead], summary="Get analysis sources, include duplicates"
)
async def get_analysis_sources(
    analysis_id: UUID,
    include_content: bool = Query(False, description="Include full source content in response"),
    current_user: User = Depends(get_current_user),
    source_service: SourceService = Depends(get_source_service),
    search_service: SearchService = Depends(get_search_service),
) -> List[SourceRead]:
    """
    Get all sources used in a specific analysis.
    Verifies that the user has access to the analysis before returning sources.
    """
    # TODO include content does not do anything at the moment, it either needs to be removed or created
    try:
        searches = await search_service.get_analysis_searches(analysis_id=analysis_id, user_id=current_user.id)
        sources = []
        for search in searches:
            temp = await source_service.get_search_sources_without_auth_check(
                search_id=search.id, user_id=current_user.id, include_content=include_content
            )
            sources.append(temp)

        flat_sources = [item for sublist in sources for item in sublist]

        sorted_sources = sorted(flat_sources, key=lambda x: (x.credibility_score is None, -(x.credibility_score or 0)))
        return [SourceRead.model_validate(s) for s in sorted_sources]
    except NotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except NotAuthorizedException:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to access these sources")
    except Exception as e:
        logger.error(f"Error getting sources: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to retrieve sources")


@router.get("/search/{search_id}", response_model=List[SourceRead], summary="Get search sources")
async def get_search_sources(
    search_id: UUID,
    include_content: bool = Query(False, description="Include full source content in response"),
    current_user: User = Depends(get_current_user),
    source_service: SourceService = Depends(get_source_service),
) -> List[SourceRead]:
    """
    Get all sources used in a specific analysis.
    Verifies that the user has access to the analysis before returning sources.
    """
    # TODO include content does not do anything at the moment, it either needs to be removed or created
    try:
        sources = await source_service.get_search_sources(
            search_id=search_id, user_id=current_user.id, include_content=include_content
        )
        return [SourceRead.model_validate(s) for s in sources]
    except NotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except NotAuthorizedException:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to access these sources")
    except Exception as e:
        logger.error(f"Error getting sources: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to retrieve sources")


@router.get("/analysis/{analysis_id}", response_model=List[SourceRead], summary="Get analysis sources that are unique")
async def get_analysis_sources_unique(
    analysis_id: UUID,
    include_content: bool = Query(False, description="Include full source content in response"),
    current_user: User = Depends(get_current_user),
    source_service: SourceService = Depends(get_source_service),
    search_service: SearchService = Depends(get_search_service),
) -> List[SourceRead]:
    """
    Get all sources used in a specific analysis.
    Verifies that the user has access to the analysis before returning sources.
    """
    # TODO include content does not do anything at the moment, it either needs to be removed or created
    try:
        searches = await search_service.get_analysis_searches(analysis_id=analysis_id, user_id=current_user.id)
        sources = []
        for search in searches:
            temp = await source_service.get_search_sources_without_auth_check(
                search_id=search.id, user_id=current_user.id, include_content=include_content
            )
            sources.append(temp)

        flat_sources = [item for sublist in sources for item in sublist]

        seen_urls = set()
        unique_sources = []

        for source in flat_sources:
            if source.url not in seen_urls:
                unique_sources.append(source)
                seen_urls.add(source.url)

        sorted_sources = sorted(
            unique_sources, key=lambda x: (x.credibility_score is None, -(x.credibility_score or 0))
        )
        return [SourceRead.model_validate(s) for s in sorted_sources]
    except NotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except NotAuthorizedException:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to access these sources")
    except Exception as e:
        logger.error(f"Error getting sources: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to retrieve sources")


@router.get("/domain/{domain_id}", response_model=SourceList, summary="Get domain sources")
async def get_domain_sources(
    domain_id: UUID,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    source_service: SourceService = Depends(get_source_service),
) -> SourceList:
    """
    Get all sources from a specific domain with pagination.
    Only returns sources from analyses the user has access to.
    """
    try:
        sources, total = await source_service.get_domain_sources(
            domain_id=domain_id, user_id=current_user.id, limit=limit, offset=offset
        )
        return SourceList(
            items=[SourceRead.model_validate(s) for s in sources], total=total, limit=limit, offset=offset
        )
    except NotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except NotAuthorizedException:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to access these sources")


@router.get("/search", response_model=SourceList, summary="Search sources")
async def search_sources(
    query: str = Query(..., min_length=3),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    source_service: SourceService = Depends(get_source_service),
) -> SourceList:
    """
    Search through sources based on title, content, or URL.
    Only searches through sources from analyses the user has access to.
    """
    try:
        sources, total = await source_service.search_sources(
            query=query, user_id=current_user.id, limit=limit, offset=offset
        )
        return SourceList(
            items=[SourceRead.model_validate(s) for s in sources], total=total, limit=limit, offset=offset
        )
    except Exception as e:
        logger.error(f"Error searching sources: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to search sources")


# @router.get("/aggregate/table", response_model=SourceList, summary="Source Summary")
# async def source_table(
#     start_date: datetime,
#     end_date: datetime,
#     language: str = "english",
#     source_service: SourceService = Depends(get_source_service),
# ) -> SourceList:
#     """
#     Search through sources based on title, content, or URL.
#     Only searches through sources from analyses the user has access to.
#     """
#     try:
#         sources, total = await source_service.search_sources(
#             query=query, user_id=current_user.id, limit=limit, offset=offset
#         )
#         return SourceList(
#             items=[SourceRead.model_validate(s) for s in sources], total=total, limit=limit, offset=offset
#         )
#     except Exception as e:
#         logger.error(f"Error searching sources: {str(e)}")
#         raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to search sources")
    
@router.get("/total/table", response_model=dict, summary="Total Sources")
async def source_total(
    start_date: datetime,
    end_date: datetime,
    language: str = "english",
    source_service: SourceService = Depends(get_source_service),
) -> List[dict]:
    """Get total claims by language."""
    try:
        sources = await source_service.list_time_bound_sources(start_date=start_date, end_date=end_date, language=language)
        
        total_sources = len(sources)
        grouped_sources = defaultdict(list)
        for source in sources:
            domain_url = source.domain.domain_name
            grouped_sources[domain_url].append(source)

        # Convert to list of lists
        groups = list(grouped_sources.values())

        aggregates = await source_service.calculate_domain_stats(groups, total_sources)
        
        sorted_aggregates = sorted(aggregates, key=lambda x: x['percent_retrieved'], reverse=True)

        return {"sorted_aggregates": sorted_aggregates,
                "total_sources": total_sources
                }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to get list of sources: {str(e)}"
        )