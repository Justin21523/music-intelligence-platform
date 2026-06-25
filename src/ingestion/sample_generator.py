"""Generate realistic synthetic music dataset for local development and testing.

Produces ~10k tracks, ~800 artists, ~500 users and ~50k listens with:
- Power-law (Zipf) play_count distribution mimicking real music streaming
- Audio features sampled from musically-plausible distributions
- Genre + tag vocabulary that mirrors MSD/Spotify conventions
- Listens sampled with popularity weighting (popular tracks appear more)

Run directly:  python -m src.ingestion.sample_generator
"""

from __future__ import annotations

import warnings
from pathlib import Path

import numpy as np
import pandas as pd
from faker import Faker
from rich.console import Console
from rich.table import Table

from src.utils.config import get_config
from src.utils.db import get_pipeline_connection, initialize_schema
from src.utils.logging import get_logger
from src.utils.paths import SAMPLE_DIR, ensure_dirs

logger = get_logger(__name__)
console = Console()
fake = Faker()
Faker.seed(42)

GENRES = [
    "Rock", "Pop", "Hip-Hop", "Electronic", "Jazz",
    "Classical", "R&B", "Country", "Metal", "Folk",
    "Reggae", "Blues", "Latin", "Indie", "Ambient",
]

TAG_VOCABULARY = [
    "guitar", "piano", "bass", "drums", "synth", "vocals", "acoustic",
    "electric", "live", "studio", "instrumental", "remix", "cover",
    "slow", "fast", "upbeat", "melancholic", "energetic", "chill",
    "dance", "groove", "soul", "funk", "psychedelic", "progressive",
    "classic", "modern", "experimental", "mainstream", "underground",
    "60s", "70s", "80s", "90s", "2000s", "2010s", "2020s",
    "love", "heartbreak", "party", "road-trip", "workout", "study",
    "summer", "winter", "rainy-day", "night", "morning",
    "male-vocal", "female-vocal", "group", "duo", "solo",
    "british", "american", "european", "latin", "african",
    "folk-rock", "art-rock", "post-rock", "neo-soul", "trap",
    "drill", "lo-fi", "house", "techno", "trance", "ambient",
    "drone", "noise", "spoken-word", "a-cappella", "choir",
]

COUNTRIES = [
    "US", "UK", "CA", "AU", "DE", "FR", "JP", "BR",
    "SE", "NO", "NG", "KR", "MX", "AR", "IT",
]

AGE_GROUPS = ["18-24", "25-34", "35-44", "45-54", "55+"]


# ---------------------------------------------------------------------------
# Generators
# ---------------------------------------------------------------------------


def generate_artists(n: int = 800, seed: int = 42) -> pd.DataFrame:
    """Generate n synthetic artist records with realistic metadata."""
    rng = np.random.default_rng(seed)

    artist_ids = [f"A{i:04d}" for i in range(n)]
    names = [fake.unique.name() for _ in range(n)]
    countries = rng.choice(COUNTRIES, size=n, p=_country_weights())
    genre_main = rng.choice(GENRES, size=n)
    popularity = rng.beta(1.5, 5, size=n).astype(np.float32)
    followers = (rng.zipf(1.8, size=n) * 1000).clip(100, 5_000_000)
    active_since = rng.integers(1960, 2023, size=n)

    # Each artist has 1-3 genre tags
    genre_tags = [
        ",".join(rng.choice(GENRES, size=rng.integers(1, 4), replace=False).tolist())
        for _ in range(n)
    ]
    tag_strs = [
        ",".join(rng.choice(TAG_VOCABULARY, size=rng.integers(2, 6), replace=False).tolist())
        for _ in range(n)
    ]

    return pd.DataFrame({
        "artist_id": artist_ids,
        "name": names,
        "country": countries,
        "genres": genre_tags,
        "tags": tag_strs,
        "popularity_score": popularity,
        "follower_count": followers.astype(int),
        "active_since": active_since,
    })


def generate_tracks(artists_df: pd.DataFrame, n: int = 10_000, seed: int = 42) -> pd.DataFrame:
    """Generate n synthetic track records linked to artists_df."""
    rng = np.random.default_rng(seed)
    n_artists = len(artists_df)

    track_ids = [f"T{i:06d}" for i in range(n)]

    # Weight artist selection by popularity so popular artists have more tracks
    artist_pop = artists_df["popularity_score"].values.astype(float)
    artist_pop /= artist_pop.sum()
    artist_indices = rng.choice(n_artists, size=n, p=artist_pop)
    artist_ids = artists_df["artist_id"].iloc[artist_indices].values

    # Albums: each artist has ~5 albums on average
    album_counts = rng.integers(1, 10, size=n_artists)
    albums_per_artist = {
        aid: [f"{fake.catch_phrase()[:30]}" for _ in range(cnt)]
        for aid, cnt in zip(artists_df["artist_id"], album_counts)
    }
    albums = [
        rng.choice(albums_per_artist[aid]) for aid in artist_ids
    ]

    genres = artists_df["genre"].values if "genre" in artists_df.columns else None
    genre_list = [
        artists_df.loc[artists_df["artist_id"] == aid, "genres"].values[0].split(",")[0]
        if len(artists_df.loc[artists_df["artist_id"] == aid]) > 0 else rng.choice(GENRES)
        for aid in artist_ids
    ]

    tag_strs = [
        ",".join(rng.choice(TAG_VOCABULARY, size=rng.integers(2, 7), replace=False).tolist())
        for _ in range(n)
    ]

    # Audio features with musically-plausible distributions
    tempo = rng.uniform(60, 200, size=n).astype(np.float32)
    energy = rng.beta(2, 2, size=n).astype(np.float32)
    danceability = rng.beta(2, 1.5, size=n).astype(np.float32)
    acousticness = rng.beta(1.5, 3, size=n).astype(np.float32)
    valence = rng.beta(2, 2, size=n).astype(np.float32)
    instrumentalness = rng.beta(1, 5, size=n).astype(np.float32)
    loudness = rng.uniform(-30, 0, size=n).astype(np.float32)
    speechiness = rng.beta(1, 8, size=n).astype(np.float32)
    liveness = rng.beta(1, 5, size=n).astype(np.float32)

    # Power-law play counts (popular tracks dominate)
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        raw_counts = rng.zipf(1.5, size=n)
    play_count = np.clip(raw_counts * 100, 1, 500_000).astype(int)

    duration_ms = rng.integers(90_000, 420_000, size=n)  # 1.5–7 min
    release_year = rng.integers(1960, 2025, size=n).astype(np.int16)
    explicit = rng.random(size=n) < 0.15  # ~15% explicit

    titles = [_generate_track_title(rng) for _ in range(n)]

    return pd.DataFrame({
        "track_id": track_ids,
        "title": titles,
        "artist_id": artist_ids,
        "album": albums,
        "duration_ms": duration_ms,
        "genre": genre_list,
        "tags": tag_strs,
        "tempo": tempo,
        "energy": energy,
        "danceability": danceability,
        "acousticness": acousticness,
        "valence": valence,
        "instrumentalness": instrumentalness,
        "loudness": loudness,
        "speechiness": speechiness,
        "liveness": liveness,
        "explicit": explicit,
        "release_year": release_year,
        "play_count": play_count,
    })


def generate_users(n: int = 500, seed: int = 42) -> pd.DataFrame:
    """Generate n synthetic user profiles."""
    rng = np.random.default_rng(seed)

    user_ids = [f"U{i:04d}" for i in range(n)]
    usernames = [fake.unique.user_name() for _ in range(n)]
    countries = rng.choice(COUNTRIES, size=n, p=_country_weights())
    age_groups = rng.choice(AGE_GROUPS, size=n, p=[0.25, 0.35, 0.20, 0.12, 0.08])
    joined_year = rng.integers(2005, 2025, size=n).astype(np.int16)

    return pd.DataFrame({
        "user_id": user_ids,
        "username": usernames,
        "country": countries,
        "age_group": age_groups,
        "joined_year": joined_year,
    })


def generate_listens(
    users_df: pd.DataFrame,
    tracks_df: pd.DataFrame,
    n: int = 50_000,
    seed: int = 42,
) -> pd.DataFrame:
    """Generate n listen events with popularity-weighted track sampling."""
    rng = np.random.default_rng(seed)

    n_users = len(users_df)
    n_tracks = len(tracks_df)

    # Sample users with uniform weight (all users active)
    user_indices = rng.integers(0, n_users, size=n)

    # Sample tracks with popularity weighting
    track_weights = tracks_df["play_count"].values.astype(float)
    track_weights /= track_weights.sum()
    track_indices = rng.choice(n_tracks, size=n, p=track_weights)

    user_ids = users_df["user_id"].iloc[user_indices].values
    track_ids = tracks_df["track_id"].iloc[track_indices].values

    listen_ids = [f"L{i:08d}" for i in range(n)]

    # Timestamps: uniform over past 3 years (approximately)
    base_ts = pd.Timestamp("2022-01-01")
    offsets = pd.to_timedelta(rng.integers(0, 365 * 3 * 24 * 3600, size=n), unit="s")
    listened_at = base_ts + offsets

    completed = rng.random(size=n) < 0.75
    sources = rng.choice(["app", "web", "api", "widget"], size=n, p=[0.6, 0.25, 0.1, 0.05])

    return pd.DataFrame({
        "listen_id": listen_ids,
        "user_id": user_ids,
        "track_id": track_ids,
        "listened_at": listened_at,
        "completed": completed,
        "source": sources,
    })


def generate_all(
    output_dir: Path = SAMPLE_DIR,
    n_artists: int = 800,
    n_tracks: int = 10_000,
    n_users: int = 500,
    n_listens: int = 50_000,
    seed: int = 42,
) -> dict[str, pd.DataFrame]:
    """Generate all synthetic datasets, write CSVs to output_dir, and return them."""
    ensure_dirs()
    output_dir.mkdir(parents=True, exist_ok=True)

    logger.info("Generating %d artists...", n_artists)
    artists = generate_artists(n=n_artists, seed=seed)

    logger.info("Generating %d tracks...", n_tracks)
    tracks = generate_tracks(artists, n=n_tracks, seed=seed)

    logger.info("Generating %d users...", n_users)
    users = generate_users(n=n_users, seed=seed)

    logger.info("Generating %d listens...", n_listens)
    listens = generate_listens(users, tracks, n=n_listens, seed=seed)

    dfs = {"artists": artists, "tracks": tracks, "users": users, "listens": listens}
    for name, df in dfs.items():
        path = output_dir / f"{name}.csv"
        df.to_csv(path, index=False)
        logger.info("Saved %s → %s (%d rows)", name, path, len(df))

    return dfs


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _country_weights() -> list[float]:
    weights = [0.35, 0.15, 0.08, 0.06, 0.06, 0.05, 0.05, 0.04,
               0.03, 0.03, 0.02, 0.02, 0.02, 0.02, 0.02]
    return weights


def _generate_track_title(rng: np.random.Generator) -> str:
    patterns = [
        lambda: fake.catch_phrase()[:40],
        lambda: fake.word().title() + " " + fake.word().title(),
        lambda: "The " + fake.word().title(),
        lambda: fake.word().title() + " of " + fake.word().title(),
        lambda: fake.first_name() + "'s " + fake.word().title(),
    ]
    return patterns[rng.integers(0, len(patterns))]()


# ---------------------------------------------------------------------------
# CLI entry point
# ---------------------------------------------------------------------------


def main() -> None:
    """Generate sample data and load it into DuckDB."""
    cfg = get_config()
    gen = cfg.generation

    dfs = generate_all(
        n_artists=gen.n_artists,
        n_tracks=gen.n_tracks,
        n_users=gen.n_users,
        n_listens=gen.n_listens,
        seed=gen.seed,
    )

    # Load into DuckDB
    conn = get_pipeline_connection()
    try:
        _load_to_duckdb(conn, dfs)
    finally:
        conn.close()

    # Print summary
    table = Table(title="[bold]Sample Data Generated[/bold]", show_header=True)
    table.add_column("Table", style="cyan")
    table.add_column("Rows", justify="right", style="green")
    table.add_column("Columns", justify="right")
    for name, df in dfs.items():
        table.add_row(name, f"{len(df):,}", str(len(df.columns)))
    console.print(table)
    console.print("[green]✓[/green] DuckDB loaded at data/warehouse.duckdb")


def _load_to_duckdb(conn, dfs: dict[str, pd.DataFrame]) -> None:
    """Insert generated DataFrames into DuckDB, replacing existing rows."""
    for table in ["listens", "recommendations", "similar_tracks",
                  "track_embeddings", "artist_graph_edges", "users",
                  "tracks", "artists"]:
        conn.execute(f"DELETE FROM {table}")

    # artists — convert comma-sep strings to arrays via string_split
    a = dfs["artists"]
    conn.register("_artists", a)
    conn.execute("""
        INSERT INTO artists
        SELECT
            artist_id, name, country,
            string_split(genres, ','),
            string_split(tags, ','),
            popularity_score, follower_count, active_since
        FROM _artists
    """)

    # tracks
    t = dfs["tracks"]
    conn.register("_tracks", t)
    conn.execute("""
        INSERT INTO tracks
        SELECT
            track_id, title, artist_id, album, duration_ms, genre,
            string_split(tags, ','),
            tempo, energy, danceability, acousticness, valence,
            instrumentalness, loudness, speechiness, liveness,
            explicit, release_year, play_count
        FROM _tracks
    """)

    # users
    conn.register("_users", dfs["users"])
    conn.execute("INSERT INTO users SELECT * FROM _users")

    # listens
    conn.register("_listens", dfs["listens"])
    conn.execute("INSERT INTO listens SELECT * FROM _listens")

    # artist co-listen graph
    _build_artist_graph(conn)


def _build_artist_graph(conn) -> None:
    """Compute co-listen edges: pairs of artists that share ≥2 common listeners."""
    conn.execute("""
        INSERT INTO artist_graph_edges
        SELECT
            l1.artist_id  AS source_artist_id,
            l2.artist_id  AS target_artist_id,
            COUNT(DISTINCT l1.user_id)::FLOAT AS weight,
            'co-listen'   AS relation_type
        FROM (
            SELECT DISTINCT li.user_id, t.artist_id
            FROM listens li JOIN tracks t ON li.track_id = t.track_id
        ) l1
        JOIN (
            SELECT DISTINCT li.user_id, t.artist_id
            FROM listens li JOIN tracks t ON li.track_id = t.track_id
        ) l2 ON l1.user_id = l2.user_id AND l1.artist_id < l2.artist_id
        GROUP BY l1.artist_id, l2.artist_id
        HAVING COUNT(DISTINCT l1.user_id) >= 2
    """)


if __name__ == "__main__":
    main()
