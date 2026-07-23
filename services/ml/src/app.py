"""OpRepo ML Service — Embeddings, similarity, and two-stage retrieval."""

import os
import logging
from contextlib import asynccontextmanager
from typing import Optional

import numpy as np
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from .model import EmbeddingModel, CrossEncoderModel

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("oprepo-ml")

# Global model instances
embedder: Optional[EmbeddingModel] = None
reranker: Optional[CrossEncoderModel] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global embedder, reranker
    model_name = os.getenv("MODEL_NAME", "all-MiniLM-L6-v2")
    cross_model = os.getenv("CROSS_ENCODER_MODEL", "cross-encoder/ms-marco-MiniLM-L-6-v2")

    logger.info(f"Loading bi-encoder: {model_name}")
    embedder = EmbeddingModel(model_name)

    logger.info(f"Loading cross-encoder: {cross_model}")
    reranker = CrossEncoderModel(cross_model)

    logger.info("All models loaded")
    yield
    logger.info("Shutting down")


app = FastAPI(
    title="OpRepo ML Service",
    version="0.2.0",
    lifespan=lifespan,
)


class EmbedRequest(BaseModel):
    texts: list[str]


class EmbedResponse(BaseModel):
    embeddings: list[list[float]]
    dimension: int


class SimilarityRequest(BaseModel):
    query: list[float]
    candidates: list[list[float]]


class SimilarityResponse(BaseModel):
    scores: list[float]


class RerankRequest(BaseModel):
    query: str
    texts: list[str]


class RerankResponse(BaseModel):
    scores: list[float]
    indices: list[int]


class RetrieveRequest(BaseModel):
    query: str
    candidates_texts: list[str]
    candidates_ids: list[str]
    top_k: int = 10


class RetrieveItem(BaseModel):
    id: str
    score: float
    rerank_score: float
    combined_score: float


class RetrieveResponse(BaseModel):
    results: list[RetrieveItem]


@app.get("/health")
def health():
    return {
        "status": "ok",
        "bi_encoder_loaded": embedder is not None,
        "cross_encoder_loaded": reranker is not None,
    }


@app.post("/embed", response_model=EmbedResponse)
def embed(req: EmbedRequest):
    if embedder is None:
        raise HTTPException(503, "Model not loaded")
    embeddings = embedder.encode(req.texts)
    return EmbedResponse(
        embeddings=[e.tolist() for e in embeddings],
        dimension=embeddings.shape[1],
    )


@app.post("/similarity", response_model=SimilarityResponse)
def similarity(req: SimilarityRequest):
    query = np.array(req.query, dtype=np.float32)
    candidates = np.array(req.candidates, dtype=np.float32)

    # Normalize
    query = query / np.linalg.norm(query)
    norms = np.linalg.norm(candidates, axis=1, keepdims=True)
    norms = np.where(norms == 0, 1, norms)
    candidates = candidates / norms

    scores = (candidates @ query).tolist()
    return SimilarityResponse(scores=scores)


@app.post("/rerank", response_model=RerankResponse)
def rerank(req: RerankRequest):
    """Cross-encoder reranking: score (query, text) pairs, return sorted."""
    if reranker is None:
        raise HTTPException(503, "Cross-encoder not loaded")

    scores = reranker.score(req.query, req.texts)
    # Sort by score descending
    indexed = list(enumerate(scores))
    indexed.sort(key=lambda x: x[1], reverse=True)
    indices = [i for i, _ in indexed]
    sorted_scores = [s for _, s in indexed]
    return RerankResponse(scores=sorted_scores, indices=indices)


@app.post("/retrieve", response_model=RetrieveResponse)
def retrieve(req: RetrieveRequest):
    """
    Two-stage retrieval:
    1. Bi-encoder: embed query, score all candidates (fast)
    2. Cross-encoder: rerank top-N candidates (accurate but slow)

    Returns combined results with both scores.
    """
    if embedder is None or reranker is None:
        raise HTTPException(503, "Models not fully loaded")

    # Stage 1: Bi-encoder scoring
    query_emb = embedder.encode([req.query])[0]
    candidate_embs = embedder.encode(req.candidates_texts)

    # Cosine similarity
    q_norm = query_emb / np.linalg.norm(query_emb)
    c_norms = np.linalg.norm(candidate_embs, axis=1, keepdims=True)
    c_norms = np.where(c_norms == 0, 1, c_norms)
    candidate_embs_norm = candidate_embs / c_norms
    bi_scores = (candidate_embs_norm @ q_norm).tolist()

    # Take top candidates for cross-encoder rerank
    top_count = min(req.top_k * 3, len(req.candidates_texts))
    indexed_scores = list(enumerate(bi_scores))
    indexed_scores.sort(key=lambda x: x[1], reverse=True)
    top_indices = [i for i, _ in indexed_scores[:top_count]]

    # Stage 2: Cross-encoder rerank top candidates
    top_texts = [req.candidates_texts[i] for i in top_indices]
    ce_scores = reranker.score(req.query, top_texts)

    # Normalize cross-encoder scores to [0, 1]
    if len(ce_scores) > 1:
        min_ce, max_ce = min(ce_scores), max(ce_scores)
        range_ce = max_ce - min_ce
        if range_ce > 0:
            ce_scores_norm = [(s - min_ce) / range_ce for s in ce_scores]
        else:
            ce_scores_norm = [0.5] * len(ce_scores)
    else:
        ce_scores_norm = [0.5] * len(ce_scores)

    # Combine: 40% bi-encoder + 60% cross-encoder
    results = []
    for rank, (orig_idx, bi_score) in enumerate(zip(top_indices, ce_scores_norm)):
        results.append(RetrieveItem(
            id=req.candidates_ids[orig_idx],
            score=bi_scores[orig_idx],
            rerank_score=ce_scores_norm[rank],
            combined_score=bi_scores[orig_idx] * 0.4 + ce_scores_norm[rank] * 0.6,
        ))

    # Sort by combined score
    results.sort(key=lambda x: x.combined_score, reverse=True)
    return RetrieveResponse(results=results[: req.top_k])
