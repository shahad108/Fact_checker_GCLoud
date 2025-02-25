from abc import ABC, abstractmethod
from typing import List

class EmbeddingGeneratorInterface(ABC):

    @abstractmethod
    async def generate_embedding(self, claim: str) -> List[float]:
        pass
