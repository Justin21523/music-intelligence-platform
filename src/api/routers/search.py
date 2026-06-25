"""Track and artist search endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Query

from src.api.deps import DbConn, get_bm25_index, get_hybrid_engine
from src.api.schemas.recommendation import SearchResponse, SearchResult

router = APIRouter(prefix="/search", tags=["search"])


@router.get("/tracks", response_model=SearchResponse)
def search_tracks(
    q: str = Query(..., min_length=1, description="Search query"),
    mode: str = Query("hybrid", pattern="^(bm25|vector|hybrid)$"),
    limit: int = Query(10, ge=1, le=50),
    db: DbConn = DbConn,
    bm25=Depends(get_bm25_index),
    engine=Depends(get_hybrid_engine),
) -> SearchResponse:
    """Search tracks by title, artist, genre, album, or tags."""
    if engine is not None:
        raw = engine.search(q, n=limit, mode=mode)
    elif bm25 is not None:
        raw = bm25.search(q, n=limit)
    else:
        raw = []

    # Enrich results with metadata
    results = []
    if raw:
        track_ids = [t for t, _ in raw]
        scores = {t: s for t, s in raw}
        placeholders = ", ".join(["?"] * len(track_ids))
        rows = db.execute(
            f"SELECT t.track_id, t.title, t.genre, t.album, a.name AS artist_name "
            f"FROM tracks t LEFT JOIN artists a USING (artist_id) "
            f"WHERE t.track_id IN ({placeholders})",
            track_ids,
        ).fetchall()
        meta = {r[0]: r for r in rows}
        for tid, score in raw:
            r = meta.get(tid, (tid, tid, None, None, None))
            results.append(SearchResult(
                track_id=tid,
                score=score,
                title=r[1],
                genre=r[2],
                album=r[3],
                artist_name=r[4],
            ))

    return SearchResponse(query=q, mode=mode, results=results, total=len(results))


@router.get("/artists", response_model=SearchResponse)
def search_artists(
    q: str = Query(..., min_length=1),
    limit: int = Query(10, ge=1, le=50),
    db: DbConn = DbConn,
) -> SearchResponse:
    """Search artists by name, genre, or tag."""
    rows = db.execute(
        "SELECT artist_id, name, array_to_string(genres, ',') AS genre "
        "FROM artists WHERE name ILIKE ? OR array_to_string(genres, ',') ILIKE ? LIMIT ?",
        [f"%{q}%", f"%{q}%", limit],
    ).fetchall()

    results = [
        SearchResult(
            track_id=r[0],  # reuse track_id field for artist_id
            score=1.0,
            title=r[1],
            genre=r[2],
        )
        for r in rows
    ]
    return SearchResponse(query=q, mode="keyword", results=results, total=len(results))
