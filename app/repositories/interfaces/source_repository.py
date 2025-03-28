from abc import ABC, abstractmethod
from typing import Optional, List, Tuple
from uuid import UUID
from app.models.domain.source import Source
from datetime import datetime


class SourceRepositoryInterface(ABC):
    """Interface for source repository operations."""

    @abstractmethod
    async def create(self, source: Source) -> Source:
        """Create new source."""
        pass

    @abstractmethod
    async def get(self, source_id: UUID) -> Optional[Source]:
        """Get source by ID."""
        pass

    @abstractmethod
    async def get_by_search(self, search_id: UUID, include_content: bool = False) -> List[Source]:
        """Get all sources for a search."""
        pass

    @abstractmethod
    async def get_by_domain(self, domain_id: UUID, limit: int = 50, offset: int = 0) -> Tuple[List[Source], int]:
        """Get sources from a specific domain."""
        pass

    @abstractmethod
    async def get_sources_filtered_by_date_and_language(
        self, start_date: datetime, end_date: datetime, language: str
    ) -> List[Source]:
        pass
