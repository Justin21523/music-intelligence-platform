"""Build and cache sentence-transformer embeddings for all tracks.

Embeddings are stored as BLOB (pickle.dumps) in the track_embeddings table.
On first run, downloads ~90MB model to ~/.cache/huggingface/.

Run directly:  python -m src.features.embedding_builder
"""

from __future__ import annotations

import pickle
import warnings
from pathlib import Path

import duckdb
import numpy as np
import pandas as pd
from tqdm import tqdm

from src.utils.config import get_config
from src.utils.db import get_pipeline_connection
from src.utils.logging import get_logger
from src.utils.paths import MODELS_DIR, ensure_dirs

logger = get_logger(__name__)

warnings.filterwarnings("ignore", category=FutureWarning, module="transformers")


class EmbeddingBuilder:
    """Encode track metadata to dense vectors using sentence-transformers."""

    def __init__(self, model_name: str = "sentence-transformers/all-MiniLM-L6-v2") -> None:
        self.model_name = model_name
        self._model = None  # lazy load

    @property
    def model(self):
        if self._model is None:
            try:
                from sentence_transformers import SentenceTransformer
                logger.info("Loading embedding model: %s", self.model_name)
                self._model = SentenceTransformer(self.model_name)
            except OSError as e:
                raise OSError(
                    f"Failed to load model '{self.model_name}'. "
                    "Check your internet connection for first-time download (~90MB). "
                    f"Original error: {e}"
                ) from e
        return self._model

    def build_corpus(self, tracks_df: pd.DataFrame) -> list[str]:
        """Build text document per track for embedding.

        Concatenates title, artist (if available), genre, album, and tags.
        """
        docs = []
        for _, row in tracks_df.iterrows():
            parts = [str(row.get("title", ""))]
            if "artist_name" in row and pd.notna(row["artist_name"]):
                parts.append(str(row["artist_name"]))
            if "genre" in row and pd.notna(row["genre"]):
                parts.append(str(row["genre"]))
            if "album" in row and pd.notna(row["album"]):
                parts.append(str(row["album"]))
            tags = row.get("tags", "")
            if isinstance(tags, str) and tags:
                parts.append(tags.replace(",", " "))
            docs.append(" ".join(parts))
        return docs

    def get_embeddings(
        self,
        conn: duckdb.DuckDBPyConnection,
        tracks_df: pd.DataFrame,
        batch_size: int = 128,
    ) -> tuple[np.ndarray, list[str]]:
        """Return embeddings for all tracks, using cache where available.

        Args:
            conn: DuckDB connection with track_embeddings table.
            tracks_df: DataFrame with track_id and metadata columns.
            batch_size: Encoding batch size.

        Returns:
            Tuple of (embeddings float32[n_tracks, 384], track_ids).
        """
        all_ids = tracks_df["track_id"].tolist()
        cached = self._load_from_cache(conn, all_ids)

        missing_ids = [t for t in all_ids if t not in cached]
        if missing_ids:
            logger.info("Encoding %d tracks (cache miss)...", len(missing_ids))
            missing_df = tracks_df[tracks_df["track_id"].isin(missing_ids)]
            docs = self.build_corpus(missing_df)
            new_embeddings = self.model.encode(
                docs, batch_size=batch_size, show_progress_bar=True,
                convert_to_numpy=True, normalize_embeddings=True,
            )
            self._save_to_cache(conn, missing_ids, new_embeddings)
            for tid, emb in zip(missing_ids, new_embeddings):
                cached[tid] = emb

        embeddings = np.stack([cached[tid] for tid in all_ids]).astype(np.float32)
        return embeddings, all_ids

    def _load_from_cache(
        self, conn: duckdb.DuckDBPyConnection, track_ids: list[str]
    ) -> dict[str, np.ndarray]:
        """Load existing embeddings from DuckDB blob cache."""
        if not track_ids:
            return {}
        placeholders = ", ".join(["?"] * len(track_ids))
        rows = conn.execute(
            f"SELECT track_id, embedding FROM track_embeddings "
            f"WHERE track_id IN ({placeholders}) AND model_name = ?",
            track_ids + [self.model_name],
        ).fetchall()
        return {r[0]: pickle.loads(r[1]) for r in rows}  # noqa: S301

    def _save_to_cache(
        self,
        conn: duckdb.DuckDBPyConnection,
        track_ids: list[str],
        embeddings: np.ndarray,
    ) -> None:
        """Persist new embeddings to DuckDB."""
        rows = [
            (tid, pickle.dumps(emb.astype(np.float32)), self.model_name)
            for tid, emb in zip(track_ids, embeddings)
        ]
        conn.executemany(
            "INSERT OR REPLACE INTO track_embeddings (track_id, embedding, model_name) "
            "VALUES (?, ?, ?)",
            rows,
        )
        logger.debug("Cached %d embeddings", len(rows))


def main() -> None:
    """Build embeddings for all tracks and save to DuckDB cache."""
    cfg = get_config()
    ensure_dirs()

    conn = get_pipeline_connection()
    try:
        tracks_df = conn.execute(
            "SELECT t.track_id, t.title, t.genre, t.album, "
            "       array_to_string(t.tags, ',') AS tags, "
            "       a.name AS artist_name "
            "FROM tracks t LEFT JOIN artists a USING (artist_id)"
        ).df()

        if tracks_df.empty:
            logger.error("No tracks found. Run make sample-data and make etl first.")
            return

        builder = EmbeddingBuilder(model_name=cfg.embedding.model_name)
        embeddings, track_ids = builder.get_embeddings(conn, tracks_df, cfg.embedding.batch_size)
        logger.info("Embeddings shape: %s", embeddings.shape)

        # Save ID map for FAISS
        ensure_dirs()
        import numpy as np
        from src.utils.paths import FAISS_ID_MAP_PATH
        np.save(str(FAISS_ID_MAP_PATH), np.array(track_ids))
        logger.info("Saved ID map: %s", FAISS_ID_MAP_PATH)

    finally:
        conn.close()


if __name__ == "__main__":
    main()
