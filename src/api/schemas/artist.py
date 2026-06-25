"""Pydantic schemas for artist-related API responses."""

from __future__ import annotations

from pydantic import BaseModel, Field


class ArtistBase(BaseModel):
    artist_id: str
    name: str
    country: str | None = None
    genres: list[str] = Field(default_factory=list)
    popularity_score: float = 0.0
    follower_count: int = 0
    active_since: int | None = None


class ArtistDetail(ArtistBase):
    tags: list[str] = Field(default_factory=list)
    top_tracks: list[str] = Field(default_factory=list)


class NetworkNode(BaseModel):
    id: str
    name: str
    genre: str | None = None
    popularity: float = 0.0


class NetworkEdge(BaseModel):
    source: str
    target: str
    weight: float = 1.0
    relation_type: str = "co_listen"


class ArtistNetwork(BaseModel):
    artist_id: str
    nodes: list[NetworkNode]
    edges: list[NetworkEdge]
