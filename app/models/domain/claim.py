from dataclasses import dataclass
from datetime import datetime
from uuid import UUID
from typing import Optional, List

from app.models.database.models import ClaimModel, ClaimStatus


@dataclass
class Claim:
    """Domain model for claims."""

    id: UUID
    user_id: UUID
    claim_text: str
    context: str
    status: str
    language: str
    created_at: datetime
    updated_at: datetime
    batch_user_id: Optional[str] = None
    batch_post_id: Optional[str] = None
    embedding: Optional[List[float]] = None

    @classmethod
    def from_model(cls, model: "ClaimModel") -> "Claim":
        """Create domain model from database model."""
        return cls(
            id=model.id,
            user_id=model.user_id,
            claim_text=model.claim_text,
            context=model.context,
            batch_user_id=model.batch_user_id,
            batch_post_id=model.batch_post_id,
            status=ClaimStatus(model.status),
            language=model.language,
            embedding=model.embedding,
            created_at=model.created_at,
            updated_at=model.updated_at,
        )

    def to_model(self) -> "ClaimModel":
        """Convert to database model."""
        return ClaimModel(
            id=self.id,
            user_id=self.user_id,
            claim_text=self.claim_text,
            context=self.context,
            batch_user_id=self.batch_user_id,
            batch_post_id=self.batch_post_id,
            status=ClaimStatus(self.status).value,
            language=self.language,
            embedding=self.embedding,
        )
