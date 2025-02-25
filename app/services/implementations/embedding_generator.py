from typing import List
import logging
from app.services.interfaces.embedding_generator import EmbeddingGeneratorInterface
from sentence_transformers import SentenceTransformer

logger = logging.getLogger(__name__)

# TODO: Maybe move that to the config file eventually/settings
model = SentenceTransformer("all-MiniLM-L6-v2")


class EmbeddingGenerator(EmbeddingGeneratorInterface):
    def __init__(self):
        self.model = model

    async def generate_embedding(self, claim: str) -> List[float]:

        embedding = self.model.encode(claim)
        return embedding
