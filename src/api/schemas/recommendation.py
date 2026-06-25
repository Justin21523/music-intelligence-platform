"""Pydantic schemas for recommendations and search responses."""

from __future__ import annotations

from pydantic import BaseModel, Field


class RecommendedItem(BaseModel):
    track_id: str
    score: float
    title: str | None = None
    artist_name: str | None = None
    genre: str | None = None
    energy: float | None = None
    danceability: float | None = None
    valence: float | None = None


class RecommendationResponse(BaseModel):
    user_id: str
    model: str
    recommendations: list[RecommendedItem]


class SimilarTracksResponse(BaseModel):
    track_id: str
    similar: list[RecommendedItem]


class SearchResult(BaseModel):
    track_id: str
    score: float
    title: str | None = None
    artist_name: str | None = None
    genre: str | None = None
    album: str | None = None


class SearchResponse(BaseModel):
    query: str
    mode: str
    results: list[SearchResult]
    total: int


class PlaylistRequest(BaseModel):
    seed_track_ids: list[str] = Field(min_length=1, max_length=10)
    n: int = Field(default=20, ge=1, le=100)
    diversity: float = Field(default=0.5, ge=0.0, le=1.0)


class PlaylistResponse(BaseModel):
    tracks: list[RecommendedItem]
    seed_tracks: list[str]


class HealthResponse(BaseModel):
    status: str
    version: str
    db_ok: bool
    bm25_loaded: bool
    faiss_loaded: bool
    models_loaded: list[str]
