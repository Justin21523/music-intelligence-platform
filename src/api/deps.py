"""FastAPI dependency injectors for shared resources."""

from __future__ import annotations

from typing import Annotated

import duckdb
from fastapi import Depends, Request

from src.utils.db import get_db


def get_bm25_index(request: Request):
    """Return the BM25Index singleton loaded at startup."""
    return request.app.state.bm25


def get_vector_index(request: Request):
    """Return the VectorIndex singleton loaded at startup."""
    return request.app.state.vector


def get_hybrid_engine(request: Request):
    """Return the HybridSearchEngine singleton."""
    return request.app.state.hybrid_engine


def get_recommenders(request: Request) -> dict:
    """Return the dict of fitted recommender models."""
    return request.app.state.recommenders


DbConn = Annotated[duckdb.DuckDBPyConnection, Depends(get_db)]
