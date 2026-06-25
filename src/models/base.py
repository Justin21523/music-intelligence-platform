"""Abstract base class for all recommendation models."""

from __future__ import annotations

import pickle
from abc import ABC, abstractmethod
from pathlib import Path

import pandas as pd


class BaseRecommender(ABC):
    """Common interface for all recommenders.

    Subclasses must implement fit() and recommend().
    """

    name: str = "base"

    @abstractmethod
    def fit(self, interactions_df: pd.DataFrame, tracks_df: pd.DataFrame) -> "BaseRecommender":
        """Train the model on user-track interactions.

        Args:
            interactions_df: Must contain columns user_id, track_id, listen_count (or equivalent).
            tracks_df: Full track catalog with metadata.

        Returns:
            self (for chaining).
        """
        ...

    @abstractmethod
    def recommend(
        self,
        user_id: str,
        n: int = 10,
        exclude_seen: bool = True,
    ) -> list[tuple[str, float]]:
        """Return top-n (track_id, score) pairs for a user.

        Args:
            user_id: Target user.
            n: Number of recommendations.
            exclude_seen: Whether to exclude tracks the user has already heard.

        Returns:
            List of (track_id, score) sorted by score descending.
        """
        ...

    def similar_items(self, track_id: str, n: int = 10) -> list[tuple[str, float]]:
        """Return n tracks similar to track_id. Not all models support this."""
        raise NotImplementedError(f"{self.name} does not support similar_items()")

    def save(self, path: Path) -> None:
        """Serialize the model to disk."""
        path.parent.mkdir(parents=True, exist_ok=True)
        with open(path, "wb") as f:
            pickle.dump(self, f)

    @classmethod
    def load(cls, path: Path) -> "BaseRecommender":
        """Deserialize a model from disk."""
        with open(path, "rb") as f:
            return pickle.load(f)  # noqa: S301
