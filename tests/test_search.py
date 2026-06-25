"""Tests for BM25 search index."""

from __future__ import annotations


def test_bm25_search_returns_results(bm25_idx):
    results = bm25_idx.search("rock guitar", n=5)
    assert isinstance(results, list)


def test_bm25_search_returns_track_id_score_tuples(bm25_idx):
    results = bm25_idx.search("guitar rock", n=5)
    for item in results:
        assert len(item) == 2
        assert isinstance(item[0], str)
        assert isinstance(item[1], float)


def test_bm25_search_limit_respected(bm25_idx):
    results = bm25_idx.search("music", n=3)
    assert len(results) <= 3


def test_bm25_empty_query_returns_empty(bm25_idx):
    results = bm25_idx.search("   ")
    assert results == []


def test_bm25_scores_non_negative(bm25_idx):
    results = bm25_idx.search("pop electronic", n=10)
    for _, score in results:
        assert score >= 0.0, f"Negative BM25 score: {score}"


def test_bm25_scores_descending(bm25_idx):
    results = bm25_idx.search("guitar solo acoustic", n=10)
    if len(results) > 1:
        scores = [s for _, s in results]
        assert scores == sorted(scores, reverse=True)
