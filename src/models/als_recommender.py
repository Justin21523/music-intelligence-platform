"""Alternating Least Squares recommender using the implicit library.

Matrix orientation: implicit expects (n_items, n_users) — reversed from intuition.
Cold-start users fall back to PopularityRecommender automatically.

Run directly:  python -m src.models.als_recommender
"""

from __future__ import annotations

import warnings

import numpy as np
import pandas as pd
import scipy.sparse as sp

from src.models.base import BaseRecommender
from src.utils.db import get_pipeline_connection
from src.utils.logging import get_logger
from src.utils.paths import MODELS_DIR

warnings.filterwarnings("ignore", category=DeprecationWarning, module="implicit")

logger = get_logger(__name__)


class ALSRecommender(BaseRecommender):
    """Matrix factorization recommender using ALS on implicit feedback."""

    name = "als"

    def __init__(
        self,
        factors: int = 64,
        iterations: int = 20,
        regularization: float = 0.01,
        alpha: float = 40.0,
    ) -> None:
        self.factors = factors
        self.iterations = iterations
        self.regularization = regularization
        self.alpha = alpha
        self._model = None
        self._user_idx: dict[str, int] = {}
        self._item_idx: dict[str, int] = {}
        self._idx_user: list[str] = []
        self._idx_item: list[str] = []
        self._user_items_csr: sp.csr_matrix | None = None
        self._popularity_fallback: BaseRecommender | None = None

    def fit(
        self,
        interactions_df: pd.DataFrame,
        tracks_df: pd.DataFrame,
    ) -> "ALSRecommender":
        """Train ALS on user-track listen counts.

        Args:
            interactions_df: Columns user_id, track_id, listen_count.
            tracks_df: Used to build a popularity fallback for cold-start users.
        """
        from implicit.als import AlternatingLeastSquares

        # Build index maps
        users = sorted(interactions_df["user_id"].unique())
        items = sorted(interactions_df["track_id"].unique())
        self._user_idx = {u: i for i, u in enumerate(users)}
        self._item_idx = {t: i for i, t in enumerate(items)}
        self._idx_user = users
        self._idx_item = items

        n_users, n_items = len(users), len(items)

        # Confidence matrix C = 1 + alpha * r
        # implicit 0.7+ uses (n_users, n_items) orientation for both fit() and recommend()
        user_rows = [self._user_idx[u] for u in interactions_df["user_id"]]
        item_cols = [self._item_idx[t] for t in interactions_df["track_id"]]
        lcount = "listen_count" if "listen_count" in interactions_df.columns else "count"
        data = 1 + self.alpha * interactions_df[lcount].values.astype(np.float32)

        # (n_users, n_items) — implicit 0.7+ convention (reversed from older versions)
        user_item_matrix = sp.csr_matrix((data, (user_rows, item_cols)), shape=(n_users, n_items))

        logger.info(
            "Training ALS: %d users × %d items, factors=%d, iterations=%d",
            n_users, n_items, self.factors, self.iterations,
        )
        self._model = AlternatingLeastSquares(
            factors=self.factors,
            iterations=self.iterations,
            regularization=self.regularization,
            calculate_training_loss=False,
        )
        self._model.fit(user_item_matrix, show_progress=True)

        # Store for recommend() calls; shape (n_users, n_items)
        self._user_items_csr = user_item_matrix

        # Popularity fallback for cold-start
        from src.models.popularity import PopularityRecommender
        self._popularity_fallback = PopularityRecommender().fit(interactions_df, tracks_df)

        logger.info("ALS training complete.")
        return self

    def recommend(
        self, user_id: str, n: int = 10, exclude_seen: bool = True
    ) -> list[tuple[str, float]]:
        """Return top-n recommendations. Falls back to popularity for unknown users."""
        if user_id not in self._user_idx:
            if self._popularity_fallback:
                return self._popularity_fallback.recommend(user_id, n, exclude_seen)
            return []

        uid = self._user_idx[user_id]
        # implicit 0.7+: recommend(userid, user_items[userid]) where user_items is (n_users, n_items)
        # Integer indexing on CSR gives (1, n_items); uid is the index within the model
        raw = self._model.recommend(
            userid=uid,
            user_items=self._user_items_csr[uid],
            N=n,
            filter_already_liked_items=exclude_seen,
        )
        return [(self._idx_item[iid], float(score)) for iid, score in zip(raw[0], raw[1])]

    def similar_items(self, track_id: str, n: int = 10) -> list[tuple[str, float]]:
        """Return similar tracks via ALS item factors."""
        if track_id not in self._item_idx:
            return []
        iid = self._item_idx[track_id]
        raw = self._model.similar_items(iid, N=n + 1)
        return [
            (self._idx_item[idx], float(score))
            for idx, score in zip(raw[0], raw[1])
            if self._idx_item[idx] != track_id
        ][:n]


def main() -> None:
    """Train and save ALS recommender."""
    conn = get_pipeline_connection()
    try:
        interactions = conn.execute(
            "SELECT user_id, track_id, COUNT(*) AS listen_count FROM listens GROUP BY 1, 2"
        ).df()
        tracks = conn.execute("SELECT track_id, play_count FROM tracks").df()
    finally:
        conn.close()

    model = ALSRecommender().fit(interactions, tracks)
    path = MODELS_DIR / "als.pkl"
    model.save(path)
    logger.info("Saved ALSRecommender → %s", path)


if __name__ == "__main__":
    main()
