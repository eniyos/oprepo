"""Wrapper around sentence-transformers for embedding."""

import logging
import numpy as np

logger = logging.getLogger(__name__)


class EmbeddingModel:
    """Thin wrapper for a sentence-transformers model."""

    def __init__(self, model_name: str):
        from sentence_transformers import SentenceTransformer
        self._model = SentenceTransformer(model_name)
        self.dimension = self._model.get_sentence_embedding_dimension()
        logger.info(f"Model '{model_name}' loaded, dim={self.dimension}")

    def encode(self, texts: list[str]) -> np.ndarray:
        """Return normalized embeddings as an (N, D) float32 array."""
        embeddings = self._model.encode(
            texts,
            convert_to_numpy=True,
            normalize_embeddings=True,
            show_progress_bar=False,
        )
        return embeddings.astype(np.float32)
