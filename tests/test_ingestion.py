"""Tests for sample data generation."""

from __future__ import annotations

import pandas as pd
import pytest

from src.ingestion.sample_generator import GENRES


def test_generate_artists_returns_correct_count(artists_df):
    assert len(artists_df) == 20


def test_generate_artists_has_required_columns(artists_df):
    required = ["artist_id", "name", "country", "genres", "popularity_score"]
    for col in required:
        assert col in artists_df.columns, f"Missing column: {col}"


def test_generate_tracks_correct_count(tracks_df):
    assert len(tracks_df) == 100


def test_generate_tracks_has_required_columns(tracks_df):
    required = ["track_id", "title", "artist_id", "genre", "play_count",
                "tempo", "energy", "danceability"]
    for col in required:
        assert col in tracks_df.columns, f"Missing column: {col}"


def test_no_null_required_track_fields(tracks_df):
    for col in ["track_id", "title", "artist_id"]:
        assert tracks_df[col].notna().all(), f"Null values found in {col}"


def test_play_count_positive(tracks_df):
    assert (tracks_df["play_count"] > 0).all()


def test_audio_features_in_valid_range(tracks_df):
    for col in ["energy", "danceability", "acousticness", "valence"]:
        assert tracks_df[col].between(0.0, 1.0).all(), f"{col} out of [0, 1] range"


def test_genre_in_known_vocabulary(tracks_df):
    genres_lower = [g.lower() for g in GENRES]
    for g in tracks_df["genre"].dropna():
        assert g.lower() in genres_lower, f"Unknown genre: {g}"


def test_listens_reference_valid_tracks(listens_df, tracks_df):
    valid_ids = set(tracks_df["track_id"])
    assert set(listens_df["track_id"]).issubset(valid_ids), "Listens reference unknown track_ids"


def test_listens_reference_valid_users(listens_df, users_df):
    valid_ids = set(users_df["user_id"])
    assert set(listens_df["user_id"]).issubset(valid_ids), "Listens reference unknown user_ids"
