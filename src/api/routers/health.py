"""Health, stats, and evaluation endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Request

from src.api.deps import DbConn
from src.api.schemas.recommendation import HealthResponse
from src.utils.paths import PROCESSED_DIR

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse)
def health_check(request: Request) -> HealthResponse:
    """Return API health status and loaded component inventory."""
    state = request.app.state
    models_loaded = list(getattr(state, "recommenders", {}).keys())
    return HealthResponse(
        status="ok",
        version="0.1.0",
        db_ok=True,
        bm25_loaded=hasattr(state, "bm25") and state.bm25 is not None,
        faiss_loaded=hasattr(state, "vector") and state.vector is not None,
        models_loaded=models_loaded,
    )


@router.get("/stats")
def get_stats(db: DbConn = DbConn) -> dict:
    """Return dataset counts and top 10 tracks by play count."""
    tracks_count = db.execute("SELECT COUNT(*) FROM tracks").fetchone()[0]
    artists_count = db.execute("SELECT COUNT(*) FROM artists").fetchone()[0]
    users_count = db.execute("SELECT COUNT(*) FROM users").fetchone()[0]
    listens_count = db.execute("SELECT COUNT(*) FROM listens").fetchone()[0]
    top_rows = db.execute(
        "SELECT t.track_id, t.title, t.artist_id, a.name AS artist_name, "
        "t.genre, t.play_count "
        "FROM tracks t LEFT JOIN artists a USING(artist_id) "
        "ORDER BY t.play_count DESC LIMIT 10"
    ).fetchall()
    top_tracks = [
        {"track_id": r[0], "title": r[1], "artist_id": r[2],
         "artist_name": r[3], "genre": r[4], "play_count": r[5]}
        for r in top_rows
    ]
    genre_rows = db.execute(
        "SELECT genre, COUNT(*) AS cnt, "
        "       AVG(energy) AS avg_energy, AVG(danceability) AS avg_dance, "
        "       AVG(valence) AS avg_valence, AVG(play_count) AS avg_plays "
        "FROM tracks WHERE genre IS NOT NULL "
        "GROUP BY genre ORDER BY cnt DESC LIMIT 20"
    ).fetchall()
    genres = [
        {"genre": r[0], "count": r[1],
         "avg_energy": round(r[2] or 0, 3),
         "avg_danceability": round(r[3] or 0, 3),
         "avg_valence": round(r[4] or 0, 3),
         "avg_plays": int(r[5] or 0)}
        for r in genre_rows
    ]
    return {
        "tracks": tracks_count,
        "artists": artists_count,
        "users": users_count,
        "listens": listens_count,
        "top_tracks": top_tracks,
        "genres": genres,
    }


@router.get("/evaluation")
def get_evaluation() -> dict:
    """Return evaluation metrics from the last 'make evaluate' run."""
    path = PROCESSED_DIR / "evaluation_results.csv"
    if not path.exists():
        return {"error": "Run 'make evaluate' first", "rows": []}
    import pandas as pd
    df = pd.read_csv(path)
    return {"rows": df.to_dict(orient="records")}
