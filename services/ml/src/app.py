"""OpRepo ML Service — Embeddings & similarity for the recommendation engine."""

import os
import logging
from contextlib import asynccontextmanager

import numpy as np
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from .model import EmbeddingModel

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("oprepo-ml")

# Global model instance
model: EmbeddingModel | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global model
    model_name = os.getenv("MODEL_NAME", "all-MiniLM-L6-v2")
    logger.info(f"Loading model: {model_name}")
    model = EmbeddingModel(model_name)
    logger.info("Model loaded")
    yield
    logger.info("Shutting down")


app = FastAPI(
    title="OpRepo ML Service",
    version="0.1.0",
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


@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": model is not None}


@app.post("/embed", response_model=EmbedResponse)
def embed(req: EmbedRequest):
    if model is None:
        raise HTTPException(503, "Model not loaded")
    embeddings = model.encode(req.texts)
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
