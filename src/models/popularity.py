"""Popularity-based recommendation baseline.

Ranks all tracks globally by log1p(play_count). No personalization.
Used as a baseline and cold-start fallback.

Run directly:  python -m src.models.popularity
"""

from __future__ import annotations

import numpy as np
import pandas as pd

from src.models.base import BaseRecommender
from src.utils.db import get_pipeline_connection
from src.utils.logging import get_logger
from src.utils.paths import MODELS_DIR

logger = get_logger(__name__)


class PopularityRecommender(BaseRecommender):
    """Non-personalized recommender based on global track popularity."""

    name = "popularity"

    def __init__(self) -> None:
        self._ranked: list[tuple[str, float]] = []
        self._seen: dict[str, set[str]] = {}

    def fit(self, interactions_df: pd.DataFrame, tracks_df: pd.DataFrame) -> "PopularityRecommender":
        """Compute log1p popularity scores for the full catalog."""
        # Aggregate listen counts per track
        if "listen_count" in interactions_df.columns:
            track_counts = interactions_df.groupby("track_id")["listen_count"].sum()
        else:
            track_counts = interactions_df.groupby("track_id").size()

        # Merge with catalog to capture tracks with 0 listens
        scores = tracks_df[["track_id", "play_count"]].copy()
        scores = scores.set_index("track_id")
        for tid, cnt in track_counts.items():
            scores.loc[tid, "play_count"] = cnt

        scores["score"] = np.log1p(scores["play_count"].fillna(0))
        self._ranked = sorted(
            scores["score"].items(), key=lambda x: x[1], reverse=True
        )

        # Record seen items per user for exclusion
        self._seen = (
            interactions_df.groupby("user_id")["track_id"]
            .apply(set)
            .to_dict()
        )
        logger.info("PopularityRecommender fitted on %d tracks", len(self._ranked))
        return self

    def recommend(
        self, user_id: str, n: int = 10, exclude_seen: bool = True
    ) -> list[tuple[str, float]]:
        """Return top-n popular tracks, optionally excluding seen ones."""
        seen = self._seen.get(user_id, set()) if exclude_seen else set()
        results = []
        for track_id, score in self._ranked:
            if track_id not in seen:
                results.append((track_id, float(score)))
            if len(results) >= n:
                break
        return results

    def similar_items(self, track_id: str, n: int = 10) -> list[tuple[str, float]]:
        """Return n globally popular tracks (no item-specific similarity)."""
        return [(tid, sc) for tid, sc in self._ranked[:n + 1] if tid != track_id][:n]


def main() -> None:
    """Train and save popularity model."""
    conn = get_pipeline_connection()
    try:
        interactions = conn.execute(
            "SELECT user_id, track_id, COUNT(*) AS listen_count FROM listens GROUP BY 1, 2"
        ).df()
        tracks = conn.execute("SELECT track_id, play_count FROM tracks").df()
    finally:
        conn.close()

    model = PopularityRecommender().fit(interactions, tracks)
    path = MODELS_DIR / "popularity.pkl"
    model.save(path)
    logger.info("Saved PopularityRecommender → %s", path)


if __name__ == "__main__":
    main()
