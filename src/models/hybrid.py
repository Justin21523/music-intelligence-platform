"""Hybrid recommender: weighted score-level fusion of multiple models.

Run directly:  python -m src.models.hybrid
"""

from __future__ import annotations

import pandas as pd

from src.models.base import BaseRecommender
from src.utils.logging import get_logger
from src.utils.paths import MODELS_DIR

logger = get_logger(__name__)


class HybridRecommender(BaseRecommender):
    """Weighted linear combination of multiple recommenders.

    Scores from each sub-recommender are min-max normalized to [0, 1]
    within each batch before combining.
    """

    name = "hybrid"

    def __init__(
        self,
        recommenders: dict[str, BaseRecommender],
        weights: dict[str, float],
    ) -> None:
        if set(recommenders.keys()) != set(weights.keys()):
            raise ValueError("recommenders and weights must have identical keys")
        total = sum(weights.values())
        self.recommenders = recommenders
        self.weights = {k: v / total for k, v in weights.items()}  # normalize

    def fit(
        self, interactions_df: pd.DataFrame, tracks_df: pd.DataFrame
    ) -> "HybridRecommender":
        """Sub-recommenders should already be fitted before constructing HybridRecommender."""
        logger.info(
            "HybridRecommender: sub-models expected to be pre-fitted. "
            "Weights: %s", self.weights
        )
        return self

    def recommend(
        self, user_id: str, n: int = 10, exclude_seen: bool = True
    ) -> list[tuple[str, float]]:
        """Fuse top-50 results from each sub-recommender."""
        combined: dict[str, float] = {}

        for model_name, model in self.recommenders.items():
            w = self.weights[model_name]
            try:
                raw = model.recommend(user_id, n=50, exclude_seen=exclude_seen)
            except Exception as e:
                logger.warning("Sub-model %s failed for user %s: %s", model_name, user_id, e)
                raw = []
            if not raw:
                continue

            # Min-max normalize scores within this model's batch
            scores = [s for _, s in raw]
            mn, mx = min(scores), max(scores)
            span = mx - mn or 1.0
            for track_id, score in raw:
                norm_score = (score - mn) / span
                combined[track_id] = combined.get(track_id, 0.0) + w * norm_score

        return sorted(combined.items(), key=lambda x: x[1], reverse=True)[:n]

    def similar_items(self, track_id: str, n: int = 10) -> list[tuple[str, float]]:
        """Fuse similar_items from sub-models that support it."""
        combined: dict[str, float] = {}
        for model_name, model in self.recommenders.items():
            try:
                raw = model.similar_items(track_id, n=20)
            except NotImplementedError:
                continue
            w = self.weights[model_name]
            scores = [s for _, s in raw]
            if not scores:
                continue
            mn, mx = min(scores), max(scores)
            span = mx - mn or 1.0
            for sim_id, score in raw:
                if sim_id != track_id:
                    combined[sim_id] = combined.get(sim_id, 0.0) + w * (score - mn) / span

        return sorted(combined.items(), key=lambda x: x[1], reverse=True)[:n]


def main() -> None:
    """Assemble and save hybrid model from pre-fitted sub-models."""
    from src.models.als_recommender import ALSRecommender
    from src.models.base import BaseRecommender
    from src.models.content_based import ContentBasedRecommender
    from src.models.popularity import PopularityRecommender

    # Load pre-trained sub-models
    pop = BaseRecommender.load(MODELS_DIR / "popularity.pkl")
    try:
        als = BaseRecommender.load(MODELS_DIR / "als.pkl")
    except FileNotFoundError:
        logger.warning("ALS model not found, using popularity only")
        als = pop
    try:
        content = BaseRecommender.load(MODELS_DIR / "content.pkl")
    except FileNotFoundError:
        logger.warning("Content model not found, using popularity only")
        content = pop

    hybrid = HybridRecommender(
        recommenders={"popularity": pop, "als": als, "content": content},
        weights={"popularity": 0.1, "als": 0.5, "content": 0.4},
    )
    path = MODELS_DIR / "hybrid.pkl"
    hybrid.save(path)
    logger.info("Saved HybridRecommender → %s", path)


if __name__ == "__main__":
    main()
