"""Track detail and similar tracks endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query

from src.api.deps import DbConn, get_recommenders
from src.api.schemas.recommendation import RecommendedItem, SimilarTracksResponse
from src.api.schemas.track import TrackDetail, TrackListResponse

router = APIRouter(prefix="/tracks", tags=["tracks"])


@router.get("", response_model=TrackListResponse)
def list_tracks(
    genre: str | None = Query(None),
    artist_id: str | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: DbConn = DbConn,
) -> TrackListResponse:
    """List tracks with optional genre/artist filter and pagination."""
    conditions = []
    params = []
    if genre:
        conditions.append("LOWER(t.genre) = LOWER(?)")
        params.append(genre)
    if artist_id:
        conditions.append("t.artist_id = ?")
        params.append(artist_id)

    where = "WHERE " + " AND ".join(conditions) if conditions else ""
    offset = (page - 1) * page_size

    total_row = db.execute(
        f"SELECT COUNT(*) FROM tracks t {where}", params
    ).fetchone()
    total = total_row[0] if total_row else 0

    rows = db.execute(
        f"SELECT t.track_id, t.title, t.artist_id, t.album, t.genre, "
        f"       t.release_year, t.duration_ms, t.play_count "
        f"FROM tracks t {where} "
        f"ORDER BY t.play_count DESC LIMIT ? OFFSET ?",
        params + [page_size, offset],
    ).fetchall()

    tracks = [
        TrackDetail(
            track_id=r[0], title=r[1], artist_id=r[2],
            album=r[3], genre=r[4], release_year=r[5],
            duration_ms=r[6], play_count=r[7],
        )
        for r in rows
    ]
    return TrackListResponse(tracks=tracks, total=total, page=page, page_size=page_size)


@router.get("/browse")
def browse_tracks(
    genre: str | None = Query(None),
    year_min: int = Query(1960),
    year_max: int = Query(2025),
    energy_min: float = Query(0.0, ge=0.0, le=1.0),
    energy_max: float = Query(1.0, ge=0.0, le=1.0),
    explicit: bool | None = Query(None),
    sort_by: str = Query("play_count"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: DbConn = DbConn,
) -> dict:
    """Browse tracks with facet filters."""
    ALLOWED_SORT = {"play_count", "release_year", "energy", "danceability", "tempo"}
    if sort_by not in ALLOWED_SORT:
        sort_by = "play_count"

    where_parts = [
        "t.release_year BETWEEN ? AND ?",
        "t.energy BETWEEN ? AND ?",
    ]
    params: list = [year_min, year_max, energy_min, energy_max]

    if genre:
        where_parts.append("LOWER(t.genre) = LOWER(?)")
        params.append(genre)
    if explicit is not None:
        where_parts.append("t.explicit = ?")
        params.append(explicit)

    where_clause = " AND ".join(where_parts)

    rows = db.execute(
        f"SELECT t.track_id, t.title, t.genre, t.release_year, t.energy, "
        f"t.danceability, t.play_count, a.name AS artist_name "
        f"FROM tracks t LEFT JOIN artists a USING(artist_id) "
        f"WHERE {where_clause} ORDER BY t.{sort_by} DESC LIMIT ? OFFSET ?",
        params + [limit, offset],
    ).fetchall()

    genre_counts = dict(
        db.execute(
            "SELECT genre, COUNT(*) FROM tracks WHERE genre IS NOT NULL "
            "GROUP BY genre ORDER BY COUNT(*) DESC"
        ).fetchall()
    )

    total = db.execute(
        f"SELECT COUNT(*) FROM tracks t WHERE {where_clause}", params
    ).fetchone()[0]

    return {
        "tracks": [
            {
                "track_id": r[0],
                "title": r[1],
                "genre": r[2],
                "release_year": r[3],
                "energy": round(float(r[4] or 0), 3),
                "danceability": round(float(r[5] or 0), 3),
                "play_count": int(r[6] or 0),
                "artist_name": r[7],
            }
            for r in rows
        ],
        "total": int(total),
        "genre_counts": {k: int(v) for k, v in genre_counts.items()},
    }


@router.get("/{track_id}", response_model=TrackDetail)
def get_track(track_id: str, db: DbConn = DbConn) -> TrackDetail:
    """Get detailed track info including audio features."""
    row = db.execute(
        "SELECT t.track_id, t.title, t.artist_id, t.album, t.genre, "
        "       t.release_year, t.duration_ms, t.play_count, "
        "       t.tempo, t.energy, t.danceability, t.acousticness, t.valence, "
        "       t.loudness, t.explicit, array_to_string(t.tags, ',') AS tags, "
        "       a.name AS artist_name "
        "FROM tracks t LEFT JOIN artists a USING (artist_id) "
        "WHERE t.track_id = ?",
        [track_id],
    ).fetchone()

    if not row:
        raise HTTPException(status_code=404, detail=f"Track '{track_id}' not found")

    return TrackDetail(
        track_id=row[0], title=row[1], artist_id=row[2], album=row[3],
        genre=row[4], release_year=row[5], duration_ms=row[6], play_count=row[7],
        tempo=row[8], energy=row[9], danceability=row[10], acousticness=row[11],
        valence=row[12], loudness=row[13], explicit=bool(row[14]),
        tags=[t.strip() for t in (row[15] or "").split(",") if t.strip()],
        artist_name=row[16],
    )


@router.get("/{track_id}/similar", response_model=SimilarTracksResponse)
def similar_tracks(
    track_id: str,
    n: int = Query(10, ge=1, le=50),
    model: str = Query("hybrid"),
    db: DbConn = DbConn,
    recommenders: dict = Depends(get_recommenders),
) -> SimilarTracksResponse:
    """Find tracks similar to the given track."""
    rec = recommenders.get(model) or recommenders.get("item_similarity") or next(iter(recommenders.values()), None)
    if rec is None:
        raise HTTPException(status_code=503, detail="No recommenders loaded")

    try:
        raw = rec.similar_items(track_id, n=n)
    except NotImplementedError:
        raw = []

    similar = []
    for sim_id, score in raw:
        row = db.execute(
            "SELECT t.title, a.name, t.genre, t.energy, t.danceability, t.valence "
            "FROM tracks t LEFT JOIN artists a USING (artist_id) WHERE t.track_id = ?",
            [sim_id],
        ).fetchone()
        similar.append(RecommendedItem(
            track_id=sim_id, score=score,
            title=row[0] if row else None,
            artist_name=row[1] if row else None,
            genre=row[2] if row else None,
            energy=row[3] if row else None,
            danceability=row[4] if row else None,
            valence=row[5] if row else None,
        ))

    return SimilarTracksResponse(track_id=track_id, similar=similar)
