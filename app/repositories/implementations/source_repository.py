from typing import Optional, List
from uuid import UUID
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime

from app.models.domain.source import Source
from app.repositories.base import BaseRepository
from app.models.database.models import SourceModel, SearchModel, AnalysisModel, ClaimModel


class SourceRepository(BaseRepository[SourceModel, Source]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, SourceModel)

    async def get_by_url(self, url: str) -> Optional[SourceModel]:
        """Get a source by its URL."""
        query = (
            select(self._model_class)
            .where(self._model_class.url == url)
            .order_by(desc(self._model_class.created_at))
            .options(selectinload(self._model_class.domain))
        )
        result = await self._session.execute(query)
        return result.scalars().first()

    async def get_by_search(self, search_id: UUID, include_domain: bool = True) -> List[SourceModel]:
        query = select(self._model_class).where(self._model_class.search_id == search_id)

        if include_domain:
            query = query.options(selectinload(self._model_class.domain))

        result = await self._session.execute(query)
        sources = list(result.scalars().all())

        if not sources:
            return []

        return sources

    async def create_with_domain(self, source: SourceModel) -> Optional[SourceModel]:
        """Create a source with its domain relationship."""
        try:
            self._session.add(source)
            await self._session.flush()
            await self._session.refresh(source, ["domain"])
            await self._session.commit()
            return source
        except Exception as e:
            await self._session.rollback()
            raise e

    async def update(self, source: SourceModel) -> SourceModel:
        """Update a source."""
        try:
            merged = await self._session.merge(source)
            await self._session.commit()
            return merged
        except Exception as e:
            await self._session.rollback()
            raise e
        
    async def get_sources_filtered_by_date_and_language(self, start_date: datetime, end_date: datetime, language: str) -> List[SourceModel]:
        query = (
            select(SourceModel)
            .join(SearchModel, SourceModel.search_id == SearchModel.id)
            .join(AnalysisModel, SearchModel.analysis_id == AnalysisModel.id)
            .join(ClaimModel, AnalysisModel.claim_id == ClaimModel.id)
            .where(
                SourceModel.created_at.between(start_date, end_date),
                ClaimModel.language == language
            )
            .order_by(desc(SourceModel.created_at))
            .options(selectinload(self._model_class.domain))  # Adjust this based on relationships
        )

        result = await self._session.execute(query)
        return result.scalars().all()
