"""Build TF-IDF tag feature vectors from track tag arrays."""

from __future__ import annotations

import duckdb
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer


def build_tag_tfidf_matrix(
    conn: duckdb.DuckDBPyConnection,
) -> tuple[np.ndarray, list[str], list[str]]:
    """Build a TF-IDF matrix over track tags.

    Args:
        conn: DuckDB connection with tracks table populated.

    Returns:
        Tuple of (dense float32 matrix [n_tracks, n_vocab],
                  list of track_ids,
                  list of vocabulary terms).
    """
    rows = conn.execute(
        "SELECT track_id, array_to_string(tags, ' ') FROM tracks ORDER BY track_id"
    ).fetchall()

    if not rows:
        return np.empty((0, 0), dtype=np.float32), [], []

    track_ids = [r[0] for r in rows]
    docs = [r[1] or "" for r in rows]

    vectorizer = TfidfVectorizer(max_features=500, min_df=2, sublinear_tf=True)
    sparse = vectorizer.fit_transform(docs)
    matrix = sparse.toarray().astype(np.float32)
    vocabulary = vectorizer.get_feature_names_out().tolist()

    return matrix, track_ids, vocabulary
