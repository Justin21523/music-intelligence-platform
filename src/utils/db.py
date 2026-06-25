"""DuckDB connection management and schema initialization."""

from __future__ import annotations

from collections.abc import Generator
from pathlib import Path

import duckdb

from src.utils.paths import DUCKDB_PATH, ensure_dirs

_DDL = """
CREATE TABLE IF NOT EXISTS artists (
    artist_id    VARCHAR PRIMARY KEY,
    name         VARCHAR NOT NULL,
    country      VARCHAR,
    genres       VARCHAR[],
    tags         VARCHAR[],
    popularity_score FLOAT DEFAULT 0.0,
    follower_count   INTEGER DEFAULT 0,
    active_since     INTEGER
);

CREATE TABLE IF NOT EXISTS tracks (
    track_id         VARCHAR PRIMARY KEY,
    title            VARCHAR NOT NULL,
    artist_id        VARCHAR,
    album            VARCHAR,
    duration_ms      INTEGER,
    genre            VARCHAR,
    tags             VARCHAR[],
    tempo            FLOAT,
    energy           FLOAT,
    danceability     FLOAT,
    acousticness     FLOAT,
    valence          FLOAT,
    instrumentalness FLOAT,
    loudness         FLOAT,
    speechiness      FLOAT,
    liveness         FLOAT,
    explicit         BOOLEAN DEFAULT FALSE,
    release_year     SMALLINT,
    play_count       INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS users (
    user_id     VARCHAR PRIMARY KEY,
    username    VARCHAR,
    country     VARCHAR,
    age_group   VARCHAR,
    joined_year SMALLINT
);

CREATE TABLE IF NOT EXISTS listens (
    listen_id   VARCHAR PRIMARY KEY,
    user_id     VARCHAR,
    track_id    VARCHAR,
    listened_at TIMESTAMP,
    completed   BOOLEAN DEFAULT TRUE,
    source      VARCHAR DEFAULT 'app'
);

CREATE TABLE IF NOT EXISTS track_embeddings (
    track_id   VARCHAR PRIMARY KEY,
    embedding  BLOB,
    model_name VARCHAR,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS artist_graph_edges (
    source_artist_id VARCHAR,
    target_artist_id VARCHAR,
    weight           FLOAT DEFAULT 1.0,
    relation_type    VARCHAR,
    PRIMARY KEY (source_artist_id, target_artist_id)
);

CREATE TABLE IF NOT EXISTS similar_tracks (
    track_id         VARCHAR,
    similar_track_id VARCHAR,
    similarity_score FLOAT,
    method           VARCHAR,
    PRIMARY KEY (track_id, similar_track_id, method)
);

CREATE TABLE IF NOT EXISTS recommendations (
    user_id    VARCHAR,
    track_id   VARCHAR,
    score      FLOAT,
    method     VARCHAR,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, track_id, method)
);
"""


def initialize_schema(conn: duckdb.DuckDBPyConnection) -> None:
    """Create all tables if they do not exist. Idempotent."""
    conn.execute(_DDL)


def get_pipeline_connection(path: Path = DUCKDB_PATH) -> duckdb.DuckDBPyConnection:
    """Open a read-write DuckDB connection for pipeline scripts.

    Caller is responsible for closing the connection.
    Only one read-write connection should be open at a time.
    """
    ensure_dirs()
    conn = duckdb.connect(str(path))
    initialize_schema(conn)
    return conn


def get_db() -> Generator[duckdb.DuckDBPyConnection, None, None]:
    """FastAPI dependency: yield a read-only DuckDB connection per request."""
    conn = duckdb.connect(str(DUCKDB_PATH), read_only=True)
    try:
        yield conn
    finally:
        conn.close()
