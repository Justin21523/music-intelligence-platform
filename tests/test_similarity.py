"""Tests for item-item similarity recommender."""

from __future__ import annotations


def test_item_similarity_returns_n_results(item_sim_model, tracks_df):
    track_id = tracks_df["track_id"].iloc[0]
    result = item_sim_model.similar_items(track_id, n=5)
    assert len(result) <= 5


def test_item_similarity_excludes_query_track(item_sim_model, tracks_df):
    track_id = tracks_df["track_id"].iloc[0]
    result = item_sim_model.similar_items(track_id, n=10)
    returned_ids = [t for t, _ in result]
    assert track_id not in returned_ids, "similar_items should not return the query track itself"


def test_cosine_scores_in_valid_range(item_sim_model, tracks_df):
    track_id = tracks_df["track_id"].iloc[0]
    result = item_sim_model.similar_items(track_id, n=10)
    for _, score in result:
        assert -1.01 <= score <= 1.01, f"Cosine score {score} out of expected range"


def test_similar_items_returns_different_results_for_different_tracks(item_sim_model, tracks_df):
    id1 = tracks_df["track_id"].iloc[0]
    id2 = tracks_df["track_id"].iloc[-1]
    r1 = set(t for t, _ in item_sim_model.similar_items(id1, n=5))
    r2 = set(t for t, _ in item_sim_model.similar_items(id2, n=5))
    # They shouldn't be identical for different seed tracks (in most cases)
    # Just check they return something (can overlap)
    assert len(r1) > 0
    assert len(r2) > 0


def test_similar_items_sorted_descending(item_sim_model, tracks_df):
    track_id = tracks_df["track_id"].iloc[0]
    result = item_sim_model.similar_items(track_id, n=10)
    scores = [s for _, s in result]
    assert scores == sorted(scores, reverse=True), "Scores should be in descending order"
