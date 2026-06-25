"""Search evaluation metrics: MRR, nDCG, Recall for search queries."""

from __future__ import annotations

import math

import numpy as np

from src.evaluation.metrics import ndcg_at_k, recall_at_k


def mean_mrr(query_results: list[list[str]], relevants: list[set[str]]) -> float:
    """Mean Reciprocal Rank for search results."""
    rrs = []
    for results, rel in zip(query_results, relevants):
        for rank, item in enumerate(results, start=1):
            if item in rel:
                rrs.append(1.0 / rank)
                break
        else:
            rrs.append(0.0)
    return float(np.mean(rrs)) if rrs else 0.0


def mean_ndcg_at_k(query_results: list[list[str]], relevants: list[set[str]], k: int) -> float:
    """Mean nDCG@K across all queries."""
    scores = [ndcg_at_k(res, rel, k) for res, rel in zip(query_results, relevants)]
    return float(np.mean(scores)) if scores else 0.0


def mean_recall_at_k(query_results: list[list[str]], relevants: list[set[str]], k: int) -> float:
    """Mean Recall@K across all queries."""
    scores = [recall_at_k(res, rel, k) for res, rel in zip(query_results, relevants)]
    return float(np.mean(scores)) if scores else 0.0


def evaluate_query_batch(
    query_results: list[list[str]],
    relevants: list[set[str]],
    k_values: list[int] = (5, 10, 20),
) -> dict[str, float]:
    """Compute all search metrics for a batch of queries."""
    results = {
        "mrr": mean_mrr(query_results, relevants),
    }
    for k in k_values:
        results[f"ndcg@{k}"] = mean_ndcg_at_k(query_results, relevants, k)
        results[f"recall@{k}"] = mean_recall_at_k(query_results, relevants, k)
    return results
