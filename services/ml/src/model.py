"""Wrapper around sentence-transformers for embedding and cross-encoder reranking."""

import logging
import numpy as np

logger = logging.getLogger(__name__)


class EmbeddingModel:
    """Thin wrapper for a sentence-transformers bi-encoder model."""

    def __init__(self, model_name: str):
        from sentence_transformers import SentenceTransformer
        self._model = SentenceTransformer(model_name)
        self.dimension = self._model.get_sentence_embedding_dimension()
        logger.info(f"Bi-encoder '{model_name}' loaded, dim={self.dimension}")

    def encode(self, texts: list[str]) -> np.ndarray:
        """Return normalized embeddings as an (N, D) float32 array."""
        embeddings = self._model.encode(
            texts,
            convert_to_numpy=True,
            normalize_embeddings=True,
            show_progress_bar=False,
        )
        return embeddings.astype(np.float32)


class CrossEncoderModel:
    """Wrapper for a cross-encoder reranker model."""

    def __init__(self, model_name: str):
        from sentence_transformers import CrossEncoder
        self._model = CrossEncoder(model_name)
        logger.info(f"Cross-encoder '{model_name}' loaded")

    def score(self, query: str, texts: list[str]) -> list[float]:
        """Score (query, text) pairs. Returns list of relevance scores."""
        pairs = [[query, text] for text in texts]
        scores = self._model.predict(pairs, show_progress_bar=False)
        return scores.tolist() if hasattr(scores, 'tolist') else list(scores)
