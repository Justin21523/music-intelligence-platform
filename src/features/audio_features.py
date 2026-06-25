"""Build audio feature matrices from DuckDB track data."""

from __future__ import annotations

import numpy as np
import duckdb

AUDIO_FEATURE_COLS = [
    "tempo", "energy", "danceability", "acousticness",
    "valence", "instrumentalness", "loudness", "speechiness", "liveness",
]


def build_audio_feature_matrix(
    conn: duckdb.DuckDBPyConnection,
    normalize: bool = True,
) -> tuple[np.ndarray, list[str]]:
    """Query tracks table and return a float32 feature matrix.

    Args:
        conn: DuckDB connection.
        normalize: If True, min-max normalize each feature to [0, 1].

    Returns:
        Tuple of (matrix shape [n_tracks, n_features], list of track_ids).
    """
    cols = ", ".join(AUDIO_FEATURE_COLS)
    rows = conn.execute(
        f"SELECT track_id, {cols} FROM tracks ORDER BY track_id"
    ).fetchall()

    if not rows:
        return np.empty((0, len(AUDIO_FEATURE_COLS)), dtype=np.float32), []

    track_ids = [r[0] for r in rows]
    matrix = np.array([[r[i + 1] for i in range(len(AUDIO_FEATURE_COLS))]
                       for r in rows], dtype=np.float32)

    # Fill NaN with column median
    for j in range(matrix.shape[1]):
        col = matrix[:, j]
        nan_mask = np.isnan(col)
        if nan_mask.any():
            col[nan_mask] = np.nanmedian(col)

    if normalize:
        mn = matrix.min(axis=0, keepdims=True)
        mx = matrix.max(axis=0, keepdims=True)
        matrix = (matrix - mn) / (mx - mn + 1e-9)

    return matrix, track_ids
