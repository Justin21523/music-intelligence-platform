"""FastAPI application entry point with lifespan resource management."""

from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.api.routers import analysis, artists, health, ingest, playlist, recommendations, search, tracks, users
from src.utils.logging import get_logger
from src.utils.paths import BM25_INDEX_PATH, FAISS_ID_MAP_PATH, FAISS_INDEX_PATH, MODELS_DIR

logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load indexes and models at startup, clean up at shutdown."""
    app.state.bm25 = None
    app.state.vector = None
    app.state.hybrid_engine = None
    app.state.recommenders = {}

    # BM25 index
    try:
        from src.retrieval.bm25_index import BM25Index
        if BM25_INDEX_PATH.exists():
            app.state.bm25 = BM25Index.load(BM25_INDEX_PATH)
            logger.info("BM25 index loaded.")
        else:
            logger.warning("BM25 index not found at %s. Run 'make index'.", BM25_INDEX_PATH)
    except Exception as e:
        logger.warning("Failed to load BM25 index: %s", e)

    # FAISS vector index
    try:
        from src.retrieval.vector_index import VectorIndex
        if FAISS_INDEX_PATH.exists():
            app.state.vector = VectorIndex.load(FAISS_INDEX_PATH, FAISS_ID_MAP_PATH)
            logger.info("FAISS index loaded.")
        else:
            logger.warning("FAISS index not found. Run 'make index'.")
    except Exception as e:
        logger.warning("Failed to load FAISS index: %s", e)

    # Hybrid search engine
    if app.state.bm25 and app.state.vector:
        try:
            from src.features.embedding_builder import EmbeddingBuilder
            from src.retrieval.hybrid_search import HybridSearchEngine
            from src.utils.config import get_config
            cfg = get_config()
            eb = EmbeddingBuilder(model_name=cfg.embedding.model_name)
            app.state.hybrid_engine = HybridSearchEngine(
                bm25=app.state.bm25,
                vector=app.state.vector,
                embedding_builder=eb,
                alpha=cfg.retrieval.hybrid_alpha,
                rrf_k=cfg.retrieval.rrf_k,
            )
            logger.info("HybridSearchEngine ready.")
        except Exception as e:
            logger.warning("Failed to build HybridSearchEngine: %s", e)

    # Recommender models
    from src.models.base import BaseRecommender
    for model_name in ["popularity", "item_similarity", "als", "content", "hybrid"]:
        path = MODELS_DIR / f"{model_name}.pkl"
        if path.exists():
            try:
                app.state.recommenders[model_name] = BaseRecommender.load(path)
                logger.info("Loaded recommender: %s", model_name)
            except Exception as e:
                logger.warning("Failed to load %s: %s", model_name, e)

    if not app.state.recommenders:
        logger.warning("No recommenders loaded. Run 'make train' first.")

    yield
    logger.info("API shutting down.")


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    app = FastAPI(
        title="Music Intelligence Platform API",
        description=(
            "Search tracks, get recommendations, explore artist networks, "
            "and evaluate recommendation quality."
        ),
        version="0.1.0",
        lifespan=lifespan,
        docs_url="/docs",
        redoc_url="/redoc",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_methods=["GET", "POST"],
        allow_headers=["*"],
    )

    app.include_router(health.router)
    app.include_router(search.router)
    app.include_router(tracks.router)
    app.include_router(artists.router)
    app.include_router(users.router)
    app.include_router(recommendations.router)
    app.include_router(playlist.router)
    app.include_router(analysis.router)
    app.include_router(ingest.router)

    # Give the ingest router a reference to this app so it can reload state
    ingest.set_app(app)

    return app


app = create_app()
