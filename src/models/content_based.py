"""Content-based recommender combining audio features and tag TF-IDF.

Builds a user profile as the weighted average of listened track feature vectors,
then ranks catalog by cosine similarity to that profile.

Run directly:  python -m src.models.content_based
"""

from __future__ import annotations

import numpy as np
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity

from src.features.audio_features import build_audio_feature_matrix
from src.features.tag_features import build_tag_tfidf_matrix
from src.models.base import BaseRecommender
from src.utils.db import get_pipeline_connection
from src.utils.logging import get_logger
from src.utils.paths import MODELS_DIR

logger = get_logger(__name__)


class ContentBasedRecommender(BaseRecommender):
    """Recommend tracks similar to a user's listening history via content features."""

    name = "content"

    def __init__(self, audio_weight: float = 0.6, tag_weight: float = 0.4) -> None:
        self.audio_weight = audio_weight
        self.tag_weight = tag_weight
        self._feature_matrix: np.ndarray | None = None
        self._track_ids: list[str] = []
        self._track_idx: dict[str, int] = {}
        self._seen: dict[str, set[str]] = {}
        self._user_listen_counts: dict[str, dict[str, int]] = {}

    def fit(self, interactions_df: pd.DataFrame, tracks_df: pd.DataFrame) -> "ContentBasedRecommender":
        """Fit by building combined feature matrix. Requires DB for tag features."""
        self._seen = (
            interactions_df.groupby("user_id")["track_id"]
            .apply(set)
            .to_dict()
        )
        lcount = "listen_count" if "listen_count" in interactions_df.columns else None
        for uid, grp in interactions_df.groupby("user_id"):
            if lcount:
                self._user_listen_counts[uid] = dict(zip(grp["track_id"], grp[lcount]))
            else:
                self._user_listen_counts[uid] = {t: 1 for t in grp["track_id"]}
        logger.warning(
            "ContentBasedRecommender.fit() stub. Call fit_from_matrices() for full use."
        )
        return self

    def fit_from_matrices(
        self,
        interactions_df: pd.DataFrame,
        audio_matrix: np.ndarray,
        audio_ids: list[str],
        tag_matrix: np.ndarray,
        tag_ids: list[str],
    ) -> "ContentBasedRecommender":
        """Combine audio and tag feature matrices into a unified representation."""
        self._seen = (
            interactions_df.groupby("user_id")["track_id"]
            .apply(set)
            .to_dict()
        )
        lcount = "listen_count" if "listen_count" in interactions_df.columns else None
        for uid, grp in interactions_df.groupby("user_id"):
            cnt = grp[lcount] if lcount else pd.Series([1] * len(grp))
            self._user_listen_counts[uid] = dict(zip(grp["track_id"], cnt))

        # Align matrices to same track order
        assert audio_ids == tag_ids, "Audio and tag matrices must share track_ids order"
        self._track_ids = audio_ids
        self._track_idx = {tid: i for i, tid in enumerate(audio_ids)}

        # Normalize each block to unit norm, then weight-combine
        def _norm(m: np.ndarray) -> np.ndarray:
            norms = np.linalg.norm(m, axis=1, keepdims=True)
            return m / (norms + 1e-9)

        combined = np.hstack([
            self.audio_weight * _norm(audio_matrix),
            self.tag_weight * _norm(tag_matrix),
        ]).astype(np.float32)
        self._feature_matrix = combined
        logger.info(
            "ContentBasedRecommender fitted: feature matrix shape %s", combined.shape
        )
        return self

    def recommend(
        self, user_id: str, n: int = 10, exclude_seen: bool = True
    ) -> list[tuple[str, float]]:
        """Build user preference vector as weighted mean of listened tracks."""
        if self._feature_matrix is None:
            return []
        seen = self._seen.get(user_id, set())
        if not seen:
            return []

        # Build weighted mean user vector
        listen_counts = self._user_listen_counts.get(user_id, {})
        indices = [
            self._track_idx[t] for t in seen if t in self._track_idx
        ]
        if not indices:
            return []

        weights = np.array([listen_counts.get(self._track_ids[i], 1) for i in indices], dtype=float)
        weights /= weights.sum()
        user_vec = (self._feature_matrix[indices] * weights[:, None]).sum(axis=0, keepdims=True)

        sims = cosine_similarity(user_vec, self._feature_matrix)[0]

        if exclude_seen:
            for t in seen:
                if t in self._track_idx:
                    sims[self._track_idx[t]] = -1.0

        top_idx = np.argpartition(sims, -n)[-n:]
        top_idx = top_idx[np.argsort(sims[top_idx])[::-1]]
        return [(self._track_ids[i], float(sims[i])) for i in top_idx if sims[i] > 0]

    def similar_items(self, track_id: str, n: int = 10) -> list[tuple[str, float]]:
        """Find tracks similar to track_id by content features."""
        if self._feature_matrix is None or track_id not in self._track_idx:
            return []
        idx = self._track_idx[track_id]
        query = self._feature_matrix[idx:idx+1]
        sims = cosine_similarity(query, self._feature_matrix)[0]
        sims[idx] = -1.0  # exclude self

        n_out = min(n, len(self._track_ids))
        top_idx = np.argpartition(sims, -n_out)[-n_out:]
        top_idx = top_idx[np.argsort(sims[top_idx])[::-1]]
        return [(self._track_ids[i], float(sims[i])) for i in top_idx]


def main() -> None:
    """Train and save content-based model."""
    conn = get_pipeline_connection()
    try:
        interactions = conn.execute(
            "SELECT user_id, track_id, COUNT(*) AS listen_count FROM listens GROUP BY 1, 2"
        ).df()
        audio_matrix, audio_ids = build_audio_feature_matrix(conn)
        tag_matrix, tag_ids, _ = build_tag_tfidf_matrix(conn)
    finally:
        conn.close()

    model = ContentBasedRecommender()
    if audio_ids == tag_ids:
        model.fit_from_matrices(interactions, audio_matrix, audio_ids, tag_matrix, tag_ids)
    else:
        model.fit(interactions, None)

    path = MODELS_DIR / "content.pkl"
    model.save(path)
    logger.info("Saved ContentBasedRecommender → %s", path)


if __name__ == "__main__":
    main()
