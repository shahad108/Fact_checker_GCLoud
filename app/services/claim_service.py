from datetime import datetime, UTC
from typing import List, Optional, Tuple
from uuid import UUID, uuid4
from wordcloud import WordCloud
import json
import plotly.graph_objects as go
import logging

from app.models.database.models import ClaimStatus
from app.models.domain.claim import Claim
from app.repositories.implementations.claim_repository import ClaimRepository
from app.core.exceptions import NotFoundException, NotAuthorizedException

logger = logging.getLogger(__name__)


class ClaimService:
    def __init__(self, claim_repository: ClaimRepository):
        self._claim_repo = claim_repository

    async def create_claim(self, user_id: UUID, claim_text: str, context: str, language: str) -> Claim:
        """Create a new claim."""
        now = datetime.now(UTC)
        claim = Claim(
            id=uuid4(),
            user_id=user_id,
            claim_text=claim_text,
            context=context,
            language=language,
            status=ClaimStatus.pending,
            created_at=now,
            updated_at=now,
        )

        return await self._claim_repo.create(claim)

    async def update_claim_status(self, claim_id: UUID, status: ClaimStatus, user_id: UUID) -> Claim:
        """Update claim status."""
        claim = await self.get_claim(claim_id, user_id)
        claim.status = status
        claim.updated_at = datetime.now(UTC)
        return await self._claim_repo.update(claim)

    async def update_claim_embedding(self, claim_id: UUID, embedding: List[float], user_id: UUID) -> Claim:
        """Update claim status."""
        claim = await self.get_claim(claim_id, user_id)
        claim.embedding = embedding
        claim.updated_at = datetime.now(UTC)
        return await self._claim_repo.update(claim)

    async def get_claim(self, claim_id: UUID, user_id: Optional[UUID] = None) -> Claim:
        """Get a claim and optionally verify ownership."""
        claim = await self._claim_repo.get(claim_id)
        if not claim:
            raise NotFoundException("Claim not found")

        if user_id and claim.user_id != user_id:
            raise NotAuthorizedException("Not authorized to access this claim")

        return claim

    async def list_user_claims(
        self, user_id: UUID, status: Optional[ClaimStatus] = None, limit: int = 50, offset: int = 0
    ) -> Tuple[List[Claim], int]:
        """List claims for a user with pagination."""
        return await self._claim_repo.get_user_claims(user_id=user_id, status=status, limit=limit, offset=offset)

    async def list_time_bound_claims(
        self, start_date: datetime, end_date: datetime, language: str = "english"
    ) -> List[Claim]:
        """List claims for a specific date range."""
        return await self._claim_repo.get_claims_in_date_range(
            start_date=start_date, end_date=end_date, language=language
        )

    async def generate_word_cloud(self, claims: List[Claim]) -> str:
        claim_texts = list(map(lambda claim: claim.claim_text, claims))

        text = " ".join(claim_texts)
        wordcloud = WordCloud(background_color="white", colormap="rainbow").generate(text)

        image = wordcloud.to_array()
        fig = go.Figure(go.Image(z=image))

        fig.update_layout(
            xaxis=dict(showgrid=False, zeroline=False, visible=False),
            yaxis=dict(showgrid=False, zeroline=False, visible=False),
            paper_bgcolor="white",
            plot_bgcolor="white",
        )
        fig_json = fig.to_json()
        graph = json.loads(fig_json)

        logger.debug("generated word cloud picture")

        return graph
