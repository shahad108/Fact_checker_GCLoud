from dataclasses import dataclass
from datetime import datetime
from typing import Optional, List
from uuid import UUID

from app.models.database.models import AnalysisModel, AnalysisStatus
from app.models.domain.feedback import Feedback
from app.models.domain.search import Search


@dataclass
class Analysis:
    """Domain model for claim analysis."""

    id: UUID
    claim_id: UUID
    veracity_score: float
    confidence_score: float
    analysis_text: str
    status: str
    created_at: datetime
    updated_at: datetime
    searches: Optional[List["Search"]] = None
    feedback: Optional[List["Feedback"]] = None

    @classmethod
    def from_model(cls, model: "AnalysisModel") -> "Analysis":
        """Create domain model from database model."""
        return cls(
            id=model.id,
            claim_id=model.claim_id,
            veracity_score=model.veracity_score,
            confidence_score=model.confidence_score,
            analysis_text=model.analysis_text,
            status=model.status.value,
            created_at=model.created_at,
            updated_at=model.updated_at,
            searches=[Search.from_model(s) for s in model.searches] if model.searches else None,
            feedback=[Feedback.from_model(f) for f in model.feedbacks] if model.feedbacks else None,
        )

    def to_model(self) -> "AnalysisModel":
        """Convert to database model."""
        return AnalysisModel(
            id=self.id,
            claim_id=self.claim_id,
            veracity_score=self.veracity_score,
            confidence_score=self.confidence_score,
            analysis_text=self.analysis_text,
            status=AnalysisStatus(self.status),
        )
