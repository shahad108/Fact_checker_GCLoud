from typing import List, Optional
import logging
from app.services.interfaces.embedding_generator import EmbeddingGeneratorInterface

logger = logging.getLogger(__name__)


class EmbeddingGenerator(EmbeddingGeneratorInterface):
    def __init__(self):
        self._model: Optional[object] = None
        self.model_name = "all-MiniLM-L6-v2"
        self._initialization_error: Optional[Exception] = None

    def _initialize_model(self):
        """Lazy initialization of the sentence transformer model."""
        if self._model is not None:
            return
        
        if self._initialization_error is not None:
            # If we previously failed to initialize, raise the same error
            raise self._initialization_error
        
        try:
            logger.info(f"Initializing sentence transformer model: {self.model_name}")
            from sentence_transformers import SentenceTransformer
            self._model = SentenceTransformer(self.model_name)
            logger.info("Model initialized successfully")
        except ImportError as e:
            logger.error(f"Failed to import sentence_transformers: {e}")
            self._initialization_error = ImportError(
                "sentence_transformers is not installed. Please install it with: pip install sentence-transformers"
            )
            raise self._initialization_error
        except Exception as e:
            logger.error(f"Failed to initialize model {self.model_name}: {e}")
            self._initialization_error = e
            raise

    @property
    def model(self):
        """Get the model, initializing it if necessary."""
        if self._model is None:
            self._initialize_model()
        return self._model

    async def generate_embedding(self, claim: str) -> List[float]:
        try:
            embedding = self.model.encode(claim)
            return embedding.tolist() if hasattr(embedding, 'tolist') else embedding
        except Exception as e:
            logger.error(f"Failed to generate embedding for claim: {e}")
            raise
