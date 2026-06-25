"""Pydantic schemas for track-related API responses."""

from __future__ import annotations

from pydantic import BaseModel, Field


class TrackBase(BaseModel):
    track_id: str
    title: str
    artist_id: str
    album: str | None = None
    genre: str | None = None
    release_year: int | None = None
    duration_ms: int | None = None
    play_count: int = 0


class TrackDetail(TrackBase):
    tags: list[str] = Field(default_factory=list)
    tempo: float | None = None
    energy: float | None = None
    danceability: float | None = None
    acousticness: float | None = None
    valence: float | None = None
    loudness: float | None = None
    explicit: bool = False
    artist_name: str | None = None


class TrackListResponse(BaseModel):
    tracks: list[TrackBase]
    total: int
    page: int = 1
    page_size: int = 20
