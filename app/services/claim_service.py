from datetime import datetime, UTC
from typing import List, Optional, Tuple
from uuid import UUID, uuid4
from wordcloud import WordCloud, STOPWORDS
import json
import plotly.graph_objects as go
import logging

from sklearn.manifold import TSNE
from sklearn.cluster import KMeans
import plotly.express as px
import pandas as pd
import numpy as np

from app.models.database.models import ClaimStatus
from app.models.domain.claim import Claim
from app.repositories.implementations.claim_repository import ClaimRepository
from app.core.exceptions import NotFoundException, NotAuthorizedException

from nltk.corpus import stopwords

import nltk

nltk.download("stopwords")

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

        if len(claim_texts) <= 0:
            wordcloud = WordCloud(background_color="white", colormap="rainbow", margin=0).generate("Empty")

            image = wordcloud.to_array()
            fig = go.Figure(go.Image(z=image))

            fig.update_layout(
                xaxis=dict(showgrid=False, zeroline=False, visible=False),
                yaxis=dict(showgrid=False, zeroline=False, visible=False),
                paper_bgcolor="white",
                plot_bgcolor="white",
                margin=dict(l=20, r=20, t=20, b=20),
            )
            fig_json = fig.to_json()
            graph = json.loads(fig_json)
            return graph

        french_stopwords = set(stopwords.words("french"))
        custom_stopwords = french_stopwords.union(STOPWORDS)

        text = " ".join(claim_texts)
        wordcloud = WordCloud(
            background_color="white", colormap="rainbow", margin=0, stopwords=custom_stopwords
        ).generate(text)

        image = wordcloud.to_array()
        fig = go.Figure(go.Image(z=image))

        fig.update_layout(
            xaxis=dict(showgrid=False, zeroline=False, visible=False),
            yaxis=dict(showgrid=False, zeroline=False, visible=False),
            paper_bgcolor="white",
            plot_bgcolor="white",
            margin=dict(l=20, r=20, t=20, b=20),
        )
        fig_json = fig.to_json()
        graph = json.loads(fig_json)

        logger.debug("generated word cloud picture")

        return graph

    async def generate_clustering_graph(self, claims: List[Claim], num_clusters: int) -> str:

        claim_embed = list(map(lambda claim: claim.embedding, filter(lambda c: c.embedding is not None, claims)))

        if len(claim_embed) < 3:
            fig = go.Figure()
            fig.update_layout(
                title=None,  # Remove title
                xaxis_title=None,  # Remove x-axis title
                yaxis_title=None,  # Remove y-axis title
                xaxis=dict(showticklabels=False),  # Hide x-axis numbers
                yaxis=dict(showticklabels=False),  # Hide y-axis numbers
                template="plotly_white",
            )
            fig_json = fig.to_json()
            graph = json.loads(fig_json)
            return graph
        else:
            # Reduce embedding size
            X = np.array(claim_embed)
            X_embedded = TSNE(n_components=2, learning_rate="auto", init="random", perplexity=3).fit_transform(X)
            kmeans = KMeans(n_clusters=num_clusters, random_state=0, n_init="auto").fit(X_embedded)

            df = pd.DataFrame(X_embedded, columns=["x", "y"])
            df["cluster"] = kmeans.labels_  # Assign KMeans labels

            df["claim_text"] = [claim.claim_text for claim in claims if claim.embedding is not None]

            fig = px.scatter(
                df,
                x="x",
                y="y",
                color=df["cluster"].astype(str),
                title=None,
                labels={"cluster": "Cluster", "claim_text": "Claim text"},
                color_discrete_sequence=px.colors.qualitative.Set1,  # Custom color scheme
                template="plotly_white",
                hover_data={
                    "x": False,  # Remove x-axis data from hover
                    "y": False,  # Remove y-axis data from hover
                    "cluster": True,  # Rename the color to 'cluster'
                    "claim_text": True,  # Show claim_text
                },
            )

            fig.update_layout(
                xaxis_title=None,
                yaxis_title=None,
                xaxis=dict(showticklabels=False),
                yaxis=dict(showticklabels=False),
                legend_title="Cluster",  # Set custom legend title
            )

            fig_json = fig.to_json()
            graph = json.loads(fig_json)

            return graph
