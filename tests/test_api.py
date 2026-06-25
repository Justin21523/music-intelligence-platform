"""Tests for FastAPI endpoints using TestClient with in-memory fixtures."""

from __future__ import annotations


def test_health_returns_200(api_client):
    resp = api_client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert "models_loaded" in data


def test_health_includes_component_flags(api_client):
    resp = api_client.get("/health")
    data = resp.json()
    assert "db_ok" in data
    assert "bm25_loaded" in data
    assert "faiss_loaded" in data


def test_list_tracks_returns_200(api_client):
    resp = api_client.get("/tracks?page=1&page_size=10")
    assert resp.status_code == 200
    data = resp.json()
    assert "tracks" in data
    assert "total" in data
    assert isinstance(data["tracks"], list)


def test_list_tracks_pagination(api_client):
    resp = api_client.get("/tracks?page=1&page_size=5")
    assert resp.status_code == 200
    assert len(resp.json()["tracks"]) <= 5


def test_get_track_detail(api_client, tracks_df):
    track_id = tracks_df["track_id"].iloc[0]
    resp = api_client.get(f"/tracks/{track_id}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["track_id"] == track_id


def test_get_nonexistent_track_returns_404(api_client):
    resp = api_client.get("/tracks/NONEXISTENT_TRACK_ID_XYZ")
    assert resp.status_code == 404


def test_search_tracks_returns_200(api_client):
    resp = api_client.get("/search/tracks?q=rock")
    assert resp.status_code == 200
    data = resp.json()
    assert "results" in data
    assert isinstance(data["results"], list)


def test_search_requires_query(api_client):
    resp = api_client.get("/search/tracks")
    assert resp.status_code == 422  # FastAPI validation error


def test_recommendations_user_returns_200(api_client, users_df):
    user_id = users_df["user_id"].iloc[0]
    resp = api_client.get(f"/recommendations/user/{user_id}?model=popularity")
    assert resp.status_code == 200
    data = resp.json()
    assert "recommendations" in data
    assert isinstance(data["recommendations"], list)


def test_recommendations_unknown_user_no_500(api_client):
    resp = api_client.get("/recommendations/user/UNKNOWN_USER_XXXX?model=popularity")
    assert resp.status_code == 200  # fallback, not 500
