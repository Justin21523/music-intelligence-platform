"""Tests for recommendation models."""

from __future__ import annotations


def test_popularity_recommend_returns_list_of_tuples(popularity_model, users_df):
    user_id = users_df["user_id"].iloc[0]
    result = popularity_model.recommend(user_id, n=5)
    assert isinstance(result, list)
    for item in result:
        assert len(item) == 2, "Each result should be a (track_id, score) tuple"
        assert isinstance(item[0], str)
        assert isinstance(item[1], float)


def test_popularity_recommend_returns_n_items(popularity_model, users_df):
    user_id = users_df["user_id"].iloc[0]
    result = popularity_model.recommend(user_id, n=10)
    assert len(result) <= 10


def test_popularity_scores_descending(popularity_model, users_df):
    user_id = users_df["user_id"].iloc[0]
    result = popularity_model.recommend(user_id, n=10)
    scores = [s for _, s in result]
    assert scores == sorted(scores, reverse=True)


def test_popularity_recommend_excludes_seen(popularity_model, users_df, listens_df):
    user_id = users_df["user_id"].iloc[0]
    seen = set(listens_df[listens_df["user_id"] == user_id]["track_id"])
    result = popularity_model.recommend(user_id, n=20, exclude_seen=True)
    returned_ids = {t for t, _ in result}
    overlap = returned_ids & seen
    assert len(overlap) == 0, f"Returned seen tracks: {overlap}"


def test_popularity_cold_start_returns_results(popularity_model):
    """Unknown users should still get global popularity recommendations."""
    result = popularity_model.recommend("UNKNOWN_USER_XYZ", n=5)
    assert len(result) > 0, "Cold-start user should get popularity fallback"


def test_item_sim_recommend_returns_results(item_sim_model, users_df):
    user_id = users_df["user_id"].iloc[0]
    result = item_sim_model.recommend(user_id, n=5)
    assert isinstance(result, list)
