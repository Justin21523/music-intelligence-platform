"""Recommendation evaluation metrics: P@K, R@K, MAP@K, nDCG@K, Coverage, Novelty, Diversity."""

from __future__ import annotations

import math

import numpy as np


def precision_at_k(recommended: list[str], relevant: set[str], k: int) -> float:
    """Fraction of top-k recommendations that are relevant."""
    if k <= 0:
        return 0.0
    top_k = recommended[:k]
    hits = sum(1 for t in top_k if t in relevant)
    return hits / k


def recall_at_k(recommended: list[str], relevant: set[str], k: int) -> float:
    """Fraction of relevant items retrieved in top-k."""
    if not relevant or k <= 0:
        return 0.0
    top_k = recommended[:k]
    hits = sum(1 for t in top_k if t in relevant)
    return hits / len(relevant)


def average_precision_at_k(recommended: list[str], relevant: set[str], k: int) -> float:
    """Average precision for a single query list."""
    if not relevant:
        return 0.0
    hits, score = 0, 0.0
    for i, item in enumerate(recommended[:k], start=1):
        if item in relevant:
            hits += 1
            score += hits / i
    return score / min(len(relevant), k) if hits else 0.0


def ndcg_at_k(recommended: list[str], relevant: set[str], k: int) -> float:
    """Normalized Discounted Cumulative Gain at k (binary relevance)."""
    if not relevant or k <= 0:
        return 0.0
    dcg = sum(
        1.0 / math.log2(i + 2)
        for i, item in enumerate(recommended[:k])
        if item in relevant
    )
    ideal_hits = min(len(relevant), k)
    idcg = sum(1.0 / math.log2(i + 2) for i in range(ideal_hits))
    return dcg / idcg if idcg > 0 else 0.0


def map_at_k(
    recommendations: list[list[str]],
    relevants: list[set[str]],
    k: int,
) -> float:
    """Mean Average Precision at k across all users."""
    if not recommendations:
        return 0.0
    aps = [
        average_precision_at_k(rec, rel, k)
        for rec, rel in zip(recommendations, relevants)
        if rel
    ]
    return float(np.mean(aps)) if aps else 0.0


def mrr(recommendations: list[list[str]], relevants: list[set[str]]) -> float:
    """Mean Reciprocal Rank across all users."""
    rrs = []
    for rec, rel in zip(recommendations, relevants):
        for rank, item in enumerate(rec, start=1):
            if item in rel:
                rrs.append(1.0 / rank)
                break
        else:
            rrs.append(0.0)
    return float(np.mean(rrs)) if rrs else 0.0


def coverage(recommendations: list[list[str]], catalog_size: int) -> float:
    """Fraction of catalog items that appear in at least one recommendation list."""
    if catalog_size <= 0:
        return 0.0
    unique_items = {item for rec in recommendations for item in rec}
    return len(unique_items) / catalog_size


def novelty(
    recommendations: list[list[str]],
    popularity: dict[str, float],
) -> float:
    """Mean self-information of recommended items (negative log popularity).

    Higher = more novel (less popular items recommended).
    """
    scores = []
    for rec in recommendations:
        for item in rec:
            p = popularity.get(item, 1e-9)
            scores.append(-math.log2(max(p, 1e-9)))
    return float(np.mean(scores)) if scores else 0.0


def diversity(
    recommendations: list[list[str]],
    feature_matrix: np.ndarray,
    track_id_to_idx: dict[str, int],
) -> float:
    """Mean intra-list diversity: average pairwise cosine distance within each list."""
    from sklearn.metrics.pairwise import cosine_similarity

    list_diversities = []
    for rec in recommendations:
        indices = [track_id_to_idx[t] for t in rec if t in track_id_to_idx]
        if len(indices) < 2:
            continue
        vecs = feature_matrix[indices]
        sim_matrix = cosine_similarity(vecs)
        n = len(indices)
        off_diag = (sim_matrix.sum() - n) / (n * (n - 1)) if n > 1 else 0.0
        list_diversities.append(1.0 - off_diag)  # diversity = 1 - mean_similarity

    return float(np.mean(list_diversities)) if list_diversities else 0.0
