"""User recommendation endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Query

from src.api.deps import DbConn, get_recommenders
from src.api.schemas.recommendation import RecommendationResponse, RecommendedItem

router = APIRouter(prefix="/recommendations", tags=["recommendations"])


@router.get("/user/{user_id}", response_model=RecommendationResponse)
def recommend_for_user(
    user_id: str,
    model: str = Query("hybrid", description="Model name: popularity, als, content, hybrid"),
    n: int = Query(10, ge=1, le=50),
    db: DbConn = DbConn,
    recommenders: dict = Depends(get_recommenders),
) -> RecommendationResponse:
    """Get personalized track recommendations for a user."""
    rec = recommenders.get(model) or recommenders.get("popularity")
    if rec is None:
        return RecommendationResponse(user_id=user_id, model=model, recommendations=[])

    raw = rec.recommend(user_id, n=n)

    recommendations = []
    for track_id, score in raw:
        row = db.execute(
            "SELECT t.title, a.name, t.genre, t.energy, t.danceability, t.valence "
            "FROM tracks t LEFT JOIN artists a USING (artist_id) WHERE t.track_id = ?",
            [track_id],
        ).fetchone()
        recommendations.append(RecommendedItem(
            track_id=track_id, score=score,
            title=row[0] if row else None,
            artist_name=row[1] if row else None,
            genre=row[2] if row else None,
            energy=row[3] if row else None,
            danceability=row[4] if row else None,
            valence=row[5] if row else None,
        ))

    return RecommendationResponse(user_id=user_id, model=model, recommendations=recommendations)
