"""Normalize features and load cleaned data into DuckDB.

Run directly:  python -m src.preprocessing.normalizer
"""

from __future__ import annotations

import numpy as np
import pandas as pd

from src.utils.db import get_pipeline_connection
from src.utils.logging import get_logger
from src.utils.paths import PROCESSED_DIR, SAMPLE_DIR, ensure_dirs

logger = get_logger(__name__)

AUDIO_COLS = [
    "tempo", "energy", "danceability", "acousticness",
    "valence", "instrumentalness", "loudness", "speechiness", "liveness",
]


def normalize_audio_features(df: pd.DataFrame) -> pd.DataFrame:
    """Add log1p-normalized play_count and z-score tempo to tracks DataFrame.

    Returns a copy with an additional 'play_count_norm' column and 'tempo_norm'.
    """
    df = df.copy()
    df["play_count_norm"] = np.log1p(df["play_count"].clip(lower=0))
    if "tempo" in df.columns:
        tempo_mean = df["tempo"].mean()
        tempo_std = df["tempo"].std() or 1.0
        df["tempo_norm"] = (df["tempo"] - tempo_mean) / tempo_std
    return df


def normalize_play_counts(df: pd.DataFrame) -> pd.DataFrame:
    """Min-max normalize play_count to [0, 1] for popularity scoring."""
    df = df.copy()
    mn, mx = df["play_count"].min(), df["play_count"].max()
    df["popularity_score"] = (df["play_count"] - mn) / (mx - mn + 1e-9)
    return df


def build_tag_vocabulary(df: pd.DataFrame, col: str = "tags") -> list[str]:
    """Return sorted list of unique tags across all rows."""
    all_tags: set[str] = set()
    for val in df[col].dropna():
        all_tags.update(t.strip() for t in str(val).split(",") if t.strip())
    return sorted(all_tags)


def main() -> None:
    """Load cleaned CSVs, normalize, and push to DuckDB."""
    ensure_dirs()
    cleaned_dir = PROCESSED_DIR / "cleaned"

    # Fall back to sample/ if cleaned/ doesn't exist yet
    def read(name: str) -> pd.DataFrame:
        for d in (cleaned_dir, SAMPLE_DIR):
            p = d / f"{name}.csv"
            if p.exists():
                return pd.read_csv(p)
        raise FileNotFoundError(f"No CSV found for {name}. Run make sample-data and make etl.")

    artists = read("artists")
    tracks = read("tracks")
    users = read("users")
    listens = read("listens")

    tracks = normalize_audio_features(tracks)

    conn = get_pipeline_connection()
    try:
        _reload_table(conn, "artists", artists, _insert_artists)
        _reload_table(conn, "tracks", tracks, _insert_tracks)
        _reload_table(conn, "users", users, _insert_users)
        _reload_table(conn, "listens", listens, _insert_listens)
        logger.info("All tables reloaded into DuckDB.")
    finally:
        conn.close()


def _reload_table(conn, table: str, df: pd.DataFrame, insert_fn) -> None:
    conn.execute(f"DELETE FROM {table}")
    insert_fn(conn, df)
    count = conn.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]
    logger.info("Loaded %s: %d rows", table, count)


def _insert_artists(conn, df: pd.DataFrame) -> None:
    conn.register("_a", df)
    conn.execute("""
        INSERT INTO artists
        SELECT artist_id, name, country,
               string_split(COALESCE(genres, ''), ','),
               string_split(COALESCE(tags, ''), ','),
               COALESCE(popularity_score, 0.0),
               COALESCE(follower_count, 0),
               active_since
        FROM _a
    """)


def _insert_tracks(conn, df: pd.DataFrame) -> None:
    conn.register("_t", df)
    conn.execute("""
        INSERT INTO tracks
        SELECT track_id, title, artist_id, album, duration_ms, genre,
               string_split(COALESCE(tags, ''), ','),
               tempo, energy, danceability, acousticness, valence,
               instrumentalness, loudness, speechiness, liveness,
               explicit, release_year, play_count
        FROM _t
    """)


def _insert_users(conn, df: pd.DataFrame) -> None:
    conn.register("_u", df)
    conn.execute("INSERT INTO users SELECT user_id, username, country, age_group, joined_year FROM _u")


def _insert_listens(conn, df: pd.DataFrame) -> None:
    conn.register("_l", df)
    conn.execute("""
        INSERT INTO listens
        SELECT listen_id, user_id, track_id,
               TRY_CAST(listened_at AS TIMESTAMP),
               COALESCE(completed, true),
               COALESCE(source, 'app')
        FROM _l
    """)


if __name__ == "__main__":
    main()
