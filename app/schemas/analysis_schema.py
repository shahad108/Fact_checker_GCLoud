from pydantic import BaseModel, ConfigDict
from datetime import datetime
from uuid import UUID
from typing import Optional, List
from app.schemas.source_schema import SourceRead
from app.schemas.search_schema import SearchRead


class AnalysisCreate(BaseModel):
    claim_id: UUID
    veracity_score: float
    confidence_score: float
    analysis_text: str


class SearchWithSourcesRead(BaseModel):
    id: UUID
    analysis_id: UUID
    prompt: str
    summary: str
    sources: Optional[List[SourceRead]] = None

    model_config = ConfigDict(from_attributes=True)


class AnalysisRead(BaseModel):
    id: UUID
    claim_id: UUID
    veracity_score: float
    confidence_score: float
    analysis_text: str
    created_at: datetime
    sources: Optional[List[SourceRead]] = None
    searches: Optional[List[SearchWithSourcesRead]] = None

    model_config = ConfigDict(from_attributes=True)


class AnalysisList(BaseModel):
    items: list[AnalysisRead]
    total: int
    limit: int
    offset: int

    model_config = ConfigDict(from_attributes=True)
