"""FAISS ANN vector index for semantic track search.

Uses IndexFlatIP (exact cosine search on L2-normalized vectors).
For scale: swap to IndexIVFFlat or HNSW without changing the interface.

Run directly:  python -m src.retrieval.vector_index
"""

from __future__ import annotations

from pathlib import Path

import faiss
import numpy as np

from src.utils.logging import get_logger
from src.utils.paths import FAISS_ID_MAP_PATH, FAISS_INDEX_PATH, ensure_dirs

logger = get_logger(__name__)

EMBEDDING_DIM = 384  # sentence-transformers/all-MiniLM-L6-v2


class VectorIndex:
    """FAISS inner-product index for cosine similarity search (with L2 normalization)."""

    def __init__(self, dim: int = EMBEDDING_DIM) -> None:
        self.dim = dim
        self._index: faiss.Index | None = None
        self._track_ids: list[str] = []

    def build(self, embeddings: np.ndarray, track_ids: list[str]) -> None:
        """Add L2-normalized embeddings to a new IndexFlatIP.

        Args:
            embeddings: float32 array of shape (n, dim).
            track_ids: Ordered list of track_ids matching embedding rows.
        """
        assert embeddings.shape[1] == self.dim, (
            f"Expected embedding dim {self.dim}, got {embeddings.shape[1]}"
        )
        vecs = embeddings.copy().astype(np.float32)
        faiss.normalize_L2(vecs)
        self._index = faiss.IndexFlatIP(self.dim)
        self._index.add(vecs)
        self._track_ids = track_ids
        logger.info("FAISS index built: %d vectors (dim=%d)", len(track_ids), self.dim)

    def search(self, query_embedding: np.ndarray, n: int = 10) -> list[tuple[str, float]]:
        """Find n nearest neighbors of query_embedding.

        Args:
            query_embedding: 1-D or 2-D float32 array of shape (dim,) or (1, dim).
            n: Number of results.

        Returns:
            List of (track_id, cosine_score) sorted descending.
        """
        if self._index is None:
            return []
        query = query_embedding.reshape(1, -1).astype(np.float32)
        faiss.normalize_L2(query)
        distances, indices = self._index.search(query, n)
        return [
            (self._track_ids[idx], float(dist))
            for idx, dist in zip(indices[0], distances[0])
            if idx >= 0
        ]

    def save(
        self,
        index_path: Path = FAISS_INDEX_PATH,
        map_path: Path = FAISS_ID_MAP_PATH,
    ) -> None:
        """Write FAISS index and ID map to disk."""
        ensure_dirs()
        faiss.write_index(self._index, str(index_path))
        np.save(str(map_path), np.array(self._track_ids))
        logger.info("FAISS index saved → %s", index_path)

    @classmethod
    def load(
        cls,
        index_path: Path = FAISS_INDEX_PATH,
        map_path: Path = FAISS_ID_MAP_PATH,
    ) -> "VectorIndex":
        """Load FAISS index and ID map from disk."""
        vi = cls()
        vi._index = faiss.read_index(str(index_path))
        vi.dim = vi._index.d
        vi._track_ids = np.load(str(map_path), allow_pickle=True).tolist()
        logger.info("FAISS index loaded: %d vectors", vi._index.ntotal)
        return vi

    @classmethod
    def load_or_build(
        cls,
        embeddings: np.ndarray,
        track_ids: list[str],
        index_path: Path = FAISS_INDEX_PATH,
        map_path: Path = FAISS_ID_MAP_PATH,
    ) -> "VectorIndex":
        """Load from disk if available, otherwise build and save."""
        if index_path.exists() and map_path.exists():
            return cls.load(index_path, map_path)
        vi = cls()
        vi.build(embeddings, track_ids)
        vi.save(index_path, map_path)
        return vi


def main() -> None:
    """Build FAISS index from cached embeddings in DuckDB."""
    import pickle

    from src.utils.db import get_pipeline_connection
    ensure_dirs()

    conn = get_pipeline_connection()
    try:
        rows = conn.execute(
            "SELECT track_id, embedding FROM track_embeddings ORDER BY track_id"
        ).fetchall()
    finally:
        conn.close()

    if not rows:
        logger.error(
            "No embeddings found. Run 'make index' step 1 (embedding_builder) first."
        )
        return

    track_ids = [r[0] for r in rows]
    embeddings = np.stack([pickle.loads(r[1]) for r in rows]).astype(np.float32)  # noqa: S301

    vi = VectorIndex()
    vi.build(embeddings, track_ids)
    vi.save()
    logger.info("FAISS index complete.")


if __name__ == "__main__":
    main()
