"""Hybrid search combining BM25 and vector similarity via Reciprocal Rank Fusion."""

from __future__ import annotations

import numpy as np

from src.retrieval.bm25_index import BM25Index
from src.retrieval.vector_index import VectorIndex


def reciprocal_rank_fusion(
    rankings: list[list[tuple[str, float]]],
    k: int = 60,
    weights: list[float] | None = None,
) -> list[tuple[str, float]]:
    """Combine ranked lists using Reciprocal Rank Fusion.

    RRF score = sum_over_lists( weight / (k + rank) )

    Args:
        rankings: Each element is a ranked list of (doc_id, score).
        k: Smoothing constant (default 60, as in original Cormack 2009).
        weights: Optional per-list weights (default equal weighting).

    Returns:
        Merged ranked list of (doc_id, rrf_score) sorted descending.
    """
    if weights is None:
        weights = [1.0] * len(rankings)

    scores: dict[str, float] = {}
    for ranked_list, w in zip(rankings, weights):
        for rank, (doc_id, _) in enumerate(ranked_list, start=1):
            scores[doc_id] = scores.get(doc_id, 0.0) + w / (k + rank)

    return sorted(scores.items(), key=lambda x: x[1], reverse=True)


class HybridSearchEngine:
    """Combines BM25 keyword search and FAISS vector search."""

    def __init__(
        self,
        bm25: BM25Index,
        vector: VectorIndex,
        embedding_builder,
        alpha: float = 0.5,
        rrf_k: int = 60,
    ) -> None:
        """
        Args:
            bm25: Fitted BM25Index.
            vector: Loaded VectorIndex.
            embedding_builder: EmbeddingBuilder instance for encoding queries.
            alpha: Weight for vector results (1-alpha for BM25).
            rrf_k: Smoothing constant for RRF.
        """
        self.bm25 = bm25
        self.vector = vector
        self.embedding_builder = embedding_builder
        self.alpha = alpha
        self.rrf_k = rrf_k

    def search(
        self,
        query: str,
        n: int = 10,
        mode: str = "hybrid",
        candidate_pool: int = 50,
    ) -> list[tuple[str, float]]:
        """Search tracks by query string.

        Args:
            query: Free-text query.
            n: Number of results to return.
            mode: One of "hybrid", "bm25", "vector".
            candidate_pool: Number of candidates to fetch from each index.

        Returns:
            List of (track_id, score) sorted descending.
        """
        if mode == "bm25":
            return self.bm25.search(query, n=n)

        if mode == "vector":
            query_emb = self.embedding_builder.model.encode(
                [query], convert_to_numpy=True, normalize_embeddings=True
            )[0]
            return self.vector.search(query_emb, n=n)

        # Hybrid: RRF over BM25 + vector
        bm25_results = self.bm25.search(query, n=candidate_pool)
        query_emb = self.embedding_builder.model.encode(
            [query], convert_to_numpy=True, normalize_embeddings=True
        )[0]
        vector_results = self.vector.search(query_emb, n=candidate_pool)

        merged = reciprocal_rank_fusion(
            [bm25_results, vector_results],
            k=self.rrf_k,
            weights=[1.0 - self.alpha, self.alpha],
        )
        return merged[:n]


def build_index_main() -> None:
    """Build both BM25 and FAISS indexes."""
    from src.retrieval.bm25_index import main as bm25_main
    from src.retrieval.vector_index import main as vector_main

    bm25_main()
    vector_main()
