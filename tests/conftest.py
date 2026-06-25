"""Shared pytest fixtures: in-memory DuckDB, small synthetic datasets, models."""

from __future__ import annotations

import duckdb
import pytest

from src.ingestion.sample_generator import (
    generate_artists,
    generate_listens,
    generate_tracks,
    generate_users,
)
from src.utils.db import initialize_schema

N_ARTISTS = 20
N_TRACKS = 100
N_USERS = 30
N_LISTENS = 500


@pytest.fixture(scope="session")
def artists_df():
    return generate_artists(n=N_ARTISTS, seed=0)


@pytest.fixture(scope="session")
def tracks_df(artists_df):
    return generate_tracks(artists_df, n=N_TRACKS, seed=0)


@pytest.fixture(scope="session")
def users_df():
    return generate_users(n=N_USERS, seed=0)


@pytest.fixture(scope="session")
def listens_df(users_df, tracks_df):
    return generate_listens(users_df, tracks_df, n=N_LISTENS, seed=0)


@pytest.fixture(scope="session")
def mem_db(artists_df, tracks_df, users_df, listens_df):
    """In-memory DuckDB populated with synthetic test data."""
    conn = duckdb.connect(":memory:")
    initialize_schema(conn)

    # artists
    conn.register("_artists", artists_df)
    conn.execute("""
        INSERT INTO artists
        SELECT artist_id, name, country,
               string_split(COALESCE(genres,''), ','),
               string_split(COALESCE(tags,''), ','),
               COALESCE(popularity_score, 0.0),
               COALESCE(follower_count, 0),
               active_since
        FROM _artists
    """)

    # tracks
    conn.register("_tracks", tracks_df)
    conn.execute("""
        INSERT INTO tracks
        SELECT track_id, title, artist_id, album, duration_ms, genre,
               string_split(COALESCE(tags,''), ','),
               tempo, energy, danceability, acousticness, valence,
               instrumentalness, loudness, speechiness, liveness,
               explicit, release_year, play_count
        FROM _tracks
    """)

    # users
    conn.register("_users", users_df)
    conn.execute("INSERT INTO users SELECT user_id, username, country, age_group, joined_year FROM _users")

    # listens
    conn.register("_listens", listens_df)
    conn.execute("""
        INSERT INTO listens
        SELECT listen_id, user_id, track_id,
               TRY_CAST(listened_at AS TIMESTAMP), completed, source
        FROM _listens
    """)

    yield conn
    conn.close()


@pytest.fixture(scope="session")
def bm25_idx(tracks_df):
    """In-memory BM25 index built from test tracks."""
    from src.retrieval.bm25_index import BM25Index
    idx = BM25Index()
    idx.build(tracks_df)
    return idx


@pytest.fixture(scope="session")
def popularity_model(listens_df, tracks_df):
    """Fitted PopularityRecommender."""
    from src.models.popularity import PopularityRecommender
    interactions = listens_df.groupby(["user_id", "track_id"]).size().reset_index(name="listen_count")
    return PopularityRecommender().fit(interactions, tracks_df)


@pytest.fixture(scope="session")
def item_sim_model(listens_df, tracks_df):
    """Fitted ItemSimilarityRecommender."""
    from src.features.audio_features import AUDIO_FEATURE_COLS
    from src.models.item_similarity import ItemSimilarityRecommender
    import numpy as np
    interactions = listens_df.groupby(["user_id", "track_id"]).size().reset_index(name="listen_count")
    track_ids = tracks_df["track_id"].tolist()
    matrix = tracks_df[AUDIO_FEATURE_COLS].fillna(0).values.astype(np.float32)
    model = ItemSimilarityRecommender(n_neighbors=10)
    return model.fit_from_matrix(interactions, matrix, track_ids)


@pytest.fixture
def api_client(mem_db, bm25_idx, popularity_model):
    """FastAPI TestClient with mocked dependencies."""
    from fastapi.testclient import TestClient
    from src.api import deps
    from src.api.main import app

    app.dependency_overrides[deps.get_db] = lambda: mem_db
    app.dependency_overrides[deps.get_bm25_index] = lambda: bm25_idx
    app.dependency_overrides[deps.get_hybrid_engine] = lambda: None
    app.dependency_overrides[deps.get_recommenders] = lambda: {"popularity": popularity_model}

    with TestClient(app, raise_server_exceptions=False) as client:
        yield client

    app.dependency_overrides.clear()
