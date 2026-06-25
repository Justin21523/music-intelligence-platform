"""BM25 full-text search index over track and artist metadata.

Run directly:  python -m src.retrieval.bm25_index
"""

from __future__ import annotations

import pickle
from pathlib import Path

import pandas as pd
from rank_bm25 import BM25Okapi

from src.utils.db import get_pipeline_connection
from src.utils.logging import get_logger
from src.utils.paths import BM25_INDEX_PATH, ensure_dirs

logger = get_logger(__name__)


class BM25Index:
    """BM25Okapi index over track title, artist, album, genre, and tags."""

    def __init__(self, k1: float = 1.5, b: float = 0.75) -> None:
        self.k1 = k1
        self.b = b
        self._bm25: BM25Okapi | None = None
        self._track_ids: list[str] = []
        self._corpus: list[list[str]] = []

    def build(self, tracks_df: pd.DataFrame, artist_names: dict[str, str] | None = None) -> None:
        """Build BM25 index from tracks DataFrame.

        Args:
            tracks_df: Must have track_id, title, album, genre, tags columns.
            artist_names: Optional {artist_id: name} mapping for richer text.
        """
        self._track_ids = tracks_df["track_id"].tolist()
        tokenized = []
        for _, row in tracks_df.iterrows():
            doc_parts = [
                str(row.get("title", "")),
                str(row.get("album", "")),
                str(row.get("genre", "")),
                str(row.get("tags", "")).replace(",", " "),
            ]
            if artist_names and row.get("artist_id") in artist_names:
                doc_parts.insert(1, artist_names[row["artist_id"]])
            doc = " ".join(doc_parts).lower()
            tokenized.append(doc.split())
        self._corpus = tokenized
        self._bm25 = BM25Okapi(tokenized, k1=self.k1, b=self.b)
        logger.info("BM25 index built: %d documents", len(self._track_ids))

    def search(self, query: str, n: int = 10) -> list[tuple[str, float]]:
        """Return top-n (track_id, score) pairs for query.

        Args:
            query: Free-text search query.
            n: Number of results.

        Returns:
            Sorted list of (track_id, bm25_score) descending.
        """
        if not self._bm25 or not query.strip():
            return []
        tokens = query.lower().split()
        scores = self._bm25.get_scores(tokens)
        top_idx = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)[:n]
        return [(self._track_ids[i], float(scores[i])) for i in top_idx if scores[i] > 0]

    def save(self, path: Path = BM25_INDEX_PATH) -> None:
        """Serialize the index to disk."""
        path.parent.mkdir(parents=True, exist_ok=True)
        with open(path, "wb") as f:
            pickle.dump(self, f)
        logger.info("BM25 index saved → %s", path)

    @classmethod
    def load(cls, path: Path = BM25_INDEX_PATH) -> "BM25Index":
        """Load a serialized BM25 index from disk."""
        with open(path, "rb") as f:
            return pickle.load(f)  # noqa: S301

    @classmethod
    def load_or_build(
        cls,
        tracks_df: pd.DataFrame,
        artist_names: dict[str, str] | None = None,
        path: Path = BM25_INDEX_PATH,
    ) -> "BM25Index":
        """Load from disk if available, otherwise build and save."""
        if path.exists():
            logger.info("Loading BM25 index from %s", path)
            return cls.load(path)
        logger.info("Building BM25 index...")
        idx = cls()
        idx.build(tracks_df, artist_names)
        idx.save(path)
        return idx


def main() -> None:
    """Build and save BM25 index from DuckDB tracks."""
    ensure_dirs()
    conn = get_pipeline_connection()
    try:
        tracks = conn.execute(
            "SELECT track_id, title, artist_id, album, genre, "
            "array_to_string(tags, ',') AS tags FROM tracks"
        ).df()
        artist_map = dict(
            conn.execute("SELECT artist_id, name FROM artists").fetchall()
        )
    finally:
        conn.close()

    idx = BM25Index()
    idx.build(tracks, artist_map)
    idx.save(BM25_INDEX_PATH)
    logger.info("BM25 index complete: %d documents", len(idx._track_ids))


if __name__ == "__main__":
    main()
