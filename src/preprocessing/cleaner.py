"""Data cleaning: normalize strings, drop nulls on critical fields, deduplicate.

Run directly:  python -m src.preprocessing.cleaner
"""

from __future__ import annotations

import pandas as pd

from src.utils.logging import get_logger
from src.utils.paths import PROCESSED_DIR, SAMPLE_DIR, ensure_dirs

logger = get_logger(__name__)

CRITICAL_TRACK_COLS = ["track_id", "title", "artist_id"]
CRITICAL_ARTIST_COLS = ["artist_id", "name"]
CRITICAL_LISTEN_COLS = ["listen_id", "user_id", "track_id"]


def clean_artists(df: pd.DataFrame) -> pd.DataFrame:
    """Normalize and validate artists DataFrame."""
    before = len(df)
    df = df.drop_duplicates(subset=["artist_id"])
    df = df.dropna(subset=CRITICAL_ARTIST_COLS)
    df["name"] = df["name"].str.strip()
    df["country"] = df["country"].str.upper().fillna("XX")
    df["popularity_score"] = df["popularity_score"].clip(0.0, 1.0).fillna(0.0)
    df["follower_count"] = df["follower_count"].fillna(0).astype(int)
    logger.debug("Artists cleaned: %d → %d rows", before, len(df))
    return df.reset_index(drop=True)


def clean_tracks(df: pd.DataFrame) -> pd.DataFrame:
    """Normalize and validate tracks DataFrame."""
    before = len(df)
    df = df.drop_duplicates(subset=["track_id"])
    df = df.dropna(subset=CRITICAL_TRACK_COLS)
    df["title"] = df["title"].str.strip()
    df["album"] = df["album"].fillna("Unknown Album").str.strip()
    df["genre"] = df["genre"].str.strip().str.title().fillna("Unknown")

    audio_cols = ["tempo", "energy", "danceability", "acousticness",
                  "valence", "instrumentalness", "loudness", "speechiness", "liveness"]
    for col in audio_cols:
        if col in df.columns:
            df[col] = df[col].fillna(df[col].median())

    # Clip 0-1 bounded features
    bounded = [c for c in audio_cols if c != "tempo" and c != "loudness"]
    for col in bounded:
        df[col] = df[col].clip(0.0, 1.0)

    df["play_count"] = df["play_count"].fillna(0).clip(lower=0).astype(int)
    df["duration_ms"] = df["duration_ms"].fillna(210_000).clip(lower=1).astype(int)
    df["explicit"] = df["explicit"].fillna(False).astype(bool)

    logger.debug("Tracks cleaned: %d → %d rows", before, len(df))
    return df.reset_index(drop=True)


def clean_users(df: pd.DataFrame) -> pd.DataFrame:
    """Normalize and validate users DataFrame."""
    before = len(df)
    df = df.drop_duplicates(subset=["user_id"])
    df = df.dropna(subset=["user_id"])
    df["username"] = df["username"].fillna(df["user_id"]).str.strip()
    df["country"] = df["country"].str.upper().fillna("XX")
    logger.debug("Users cleaned: %d → %d rows", before, len(df))
    return df.reset_index(drop=True)


def clean_listens(df: pd.DataFrame) -> pd.DataFrame:
    """Normalize and validate listens DataFrame."""
    before = len(df)
    df = df.drop_duplicates(subset=["listen_id"])
    df = df.dropna(subset=CRITICAL_LISTEN_COLS)
    df["completed"] = df["completed"].fillna(True).astype(bool)
    df["source"] = df["source"].fillna("app")
    df["listened_at"] = pd.to_datetime(df["listened_at"], errors="coerce")
    df = df.dropna(subset=["listened_at"])
    logger.debug("Listens cleaned: %d → %d rows", before, len(df))
    return df.reset_index(drop=True)


def main() -> None:
    """Read CSVs from data/sample/, clean, and write to data/processed/cleaned/."""
    ensure_dirs()
    cleaned_dir = PROCESSED_DIR / "cleaned"
    cleaned_dir.mkdir(exist_ok=True)

    for name, fn in [
        ("artists", clean_artists),
        ("tracks", clean_tracks),
        ("users", clean_users),
        ("listens", clean_listens),
    ]:
        src = SAMPLE_DIR / f"{name}.csv"
        if not src.exists():
            logger.warning("Sample file not found: %s — run make sample-data first", src)
            continue
        df = pd.read_csv(src)
        cleaned = fn(df)
        out = cleaned_dir / f"{name}.csv"
        cleaned.to_csv(out, index=False)
        logger.info("Cleaned %s: %d rows → %s", name, len(cleaned), out)


if __name__ == "__main__":
    main()
