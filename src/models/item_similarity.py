"""Item-item cosine similarity recommender using audio features.

Run directly:  python -m src.models.item_similarity
"""

from __future__ import annotations

import numpy as np
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity

from src.features.audio_features import build_audio_feature_matrix
from src.models.base import BaseRecommender
from src.utils.db import get_pipeline_connection
from src.utils.logging import get_logger
from src.utils.paths import MODELS_DIR

logger = get_logger(__name__)


class ItemSimilarityRecommender(BaseRecommender):
    """Item-item cosine similarity on audio feature vectors."""

    name = "item_similarity"

    def __init__(self, n_neighbors: int = 50) -> None:
        self.n_neighbors = n_neighbors
        self._neighbors: dict[str, list[tuple[str, float]]] = {}
        self._seen: dict[str, set[str]] = {}
        self._track_idx: dict[str, int] = {}

    def fit(self, interactions_df: pd.DataFrame, tracks_df: pd.DataFrame) -> "ItemSimilarityRecommender":
        """Build item-item similarity from audio features."""
        # We need the feature matrix directly from a DB connection
        # Accept optional 'feature_matrix' and 'track_ids' via tracks_df metadata
        # In normal usage, call fit_from_matrix instead
        self._seen = (
            interactions_df.groupby("user_id")["track_id"]
            .apply(set)
            .to_dict()
        )
        self._track_ids = tracks_df["track_id"].tolist()
        logger.warning(
            "ItemSimilarityRecommender.fit() called without feature matrix. "
            "Call fit_from_matrix() for full functionality."
        )
        return self

    def fit_from_matrix(
        self,
        interactions_df: pd.DataFrame,
        feature_matrix: np.ndarray,
        track_ids: list[str],
    ) -> "ItemSimilarityRecommender":
        """Build item-item similarity from a precomputed feature matrix."""
        self._seen = (
            interactions_df.groupby("user_id")["track_id"]
            .apply(set)
            .to_dict()
        )
        self._track_ids = track_ids
        self._track_idx = {tid: i for i, tid in enumerate(track_ids)}

        logger.info("Computing item-item similarity for %d tracks...", len(track_ids))
        sim_matrix = cosine_similarity(feature_matrix)  # (n, n)

        # Store only top-n neighbors per item to save memory
        self._neighbors = {}
        n = min(self.n_neighbors + 1, len(track_ids))
        for i, tid in enumerate(track_ids):
            row = sim_matrix[i]
            top_idx = np.argpartition(row, -n)[-n:]
            top_idx = top_idx[np.argsort(row[top_idx])[::-1]]
            self._neighbors[tid] = [
                (track_ids[j], float(row[j]))
                for j in top_idx if track_ids[j] != tid
            ][:self.n_neighbors]

        logger.info("ItemSimilarityRecommender fitted.")
        return self

    def recommend(
        self, user_id: str, n: int = 10, exclude_seen: bool = True
    ) -> list[tuple[str, float]]:
        """Aggregate neighbors of a user's listened tracks."""
        seen = self._seen.get(user_id, set())
        if not seen:
            return []

        scores: dict[str, float] = {}
        for src_track in seen:
            for neighbor, sim in self._neighbors.get(src_track, []):
                if not exclude_seen or neighbor not in seen:
                    scores[neighbor] = scores.get(neighbor, 0.0) + sim

        return sorted(scores.items(), key=lambda x: x[1], reverse=True)[:n]

    def similar_items(self, track_id: str, n: int = 10) -> list[tuple[str, float]]:
        """Return top-n most similar tracks to track_id."""
        return self._neighbors.get(track_id, [])[:n]


def main() -> None:
    """Train and save item similarity model."""
    conn = get_pipeline_connection()
    try:
        interactions = conn.execute(
            "SELECT user_id, track_id, COUNT(*) AS listen_count FROM listens GROUP BY 1, 2"
        ).df()
        tracks = conn.execute("SELECT track_id FROM tracks").df()
        feature_matrix, track_ids = build_audio_feature_matrix(conn)
    finally:
        conn.close()

    model = ItemSimilarityRecommender()
    model.fit_from_matrix(interactions, feature_matrix, track_ids)
    path = MODELS_DIR / "item_similarity.pkl"
    model.save(path)
    logger.info("Saved ItemSimilarityRecommender → %s", path)


if __name__ == "__main__":
    main()
