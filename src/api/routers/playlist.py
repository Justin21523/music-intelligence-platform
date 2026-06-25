"""Playlist builder endpoint."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from src.api.deps import DbConn, get_recommenders
from src.api.schemas.recommendation import PlaylistRequest, PlaylistResponse, RecommendedItem

router = APIRouter(prefix="/playlist", tags=["playlist"])


@router.post("/build", response_model=PlaylistResponse)
def build_playlist(
    request: PlaylistRequest,
    db: DbConn = DbConn,
    recommenders: dict = Depends(get_recommenders),
) -> PlaylistResponse:
    """Build a playlist starting from seed tracks.

    Uses item-item similarity to expand from seed tracks.
    The diversity parameter controls how much to balance
    similarity vs. variety (higher = more diverse picks).
    """
    rec = recommenders.get("item_similarity") or recommenders.get("hybrid")
    if rec is None:
        raise HTTPException(status_code=503, detail="No recommender loaded")

    seen = set(request.seed_track_ids)
    scores: dict[str, float] = {}

    for seed_id in request.seed_track_ids:
        try:
            similar = rec.similar_items(seed_id, n=request.n * 3)
        except NotImplementedError:
            continue
        for sim_id, score in similar:
            if sim_id not in seen:
                # diversity: downweight items that appear similar to many seeds
                existing = scores.get(sim_id, 0.0)
                penalty = request.diversity * existing * 0.5
                scores[sim_id] = score - penalty

    ranked = sorted(scores.items(), key=lambda x: x[1], reverse=True)[:request.n]

    tracks = []
    for track_id, score in ranked:
        row = db.execute(
            "SELECT t.title, a.name, t.genre FROM tracks t "
            "LEFT JOIN artists a USING (artist_id) WHERE t.track_id = ?",
            [track_id],
        ).fetchone()
        tracks.append(RecommendedItem(
            track_id=track_id, score=score,
            title=row[0] if row else None,
            artist_name=row[1] if row else None,
            genre=row[2] if row else None,
        ))

    return PlaylistResponse(tracks=tracks, seed_tracks=request.seed_track_ids)
