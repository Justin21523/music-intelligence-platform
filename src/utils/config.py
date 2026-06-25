"""Application configuration loaded from configs/config.yaml."""

from __future__ import annotations

from dataclasses import dataclass, field
from functools import lru_cache
from pathlib import Path
from typing import Any

import yaml

from src.utils.paths import CONFIG_PATH


@dataclass
class GenerationConfig:
    n_artists: int = 800
    n_tracks: int = 10000
    n_users: int = 500
    n_listens: int = 50000
    seed: int = 42


@dataclass
class EmbeddingConfig:
    model_name: str = "sentence-transformers/all-MiniLM-L6-v2"
    dim: int = 384
    batch_size: int = 128


@dataclass
class RetrievalConfig:
    bm25_k1: float = 1.5
    bm25_b: float = 0.75
    faiss_index_type: str = "FlatIP"
    hybrid_alpha: float = 0.5
    rrf_k: int = 60


@dataclass
class EvaluationConfig:
    k_values: list[int] = field(default_factory=lambda: [5, 10, 20])
    test_fraction: float = 0.2
    min_listens_for_eval: int = 5
    output_path: str = "data/processed/evaluation_results.csv"


@dataclass
class AppConfig:
    generation: GenerationConfig = field(default_factory=GenerationConfig)
    embedding: EmbeddingConfig = field(default_factory=EmbeddingConfig)
    retrieval: RetrievalConfig = field(default_factory=RetrievalConfig)
    evaluation: EvaluationConfig = field(default_factory=EvaluationConfig)
    genres: list[str] = field(default_factory=list)
    raw: dict[str, Any] = field(default_factory=dict)


def _load_yaml(path: Path) -> dict[str, Any]:
    with open(path) as f:
        return yaml.safe_load(f)


@lru_cache(maxsize=1)
def get_config() -> AppConfig:
    """Load and return the singleton application config."""
    raw = _load_yaml(CONFIG_PATH)
    gen = raw.get("generation", {})
    emb = raw.get("embedding", {})
    ret = raw.get("retrieval", {})
    eva = raw.get("evaluation", {})
    return AppConfig(
        generation=GenerationConfig(**gen),
        embedding=EmbeddingConfig(**emb),
        retrieval=RetrievalConfig(**ret),
        evaluation=EvaluationConfig(**eva),
        genres=raw.get("genres", []),
        raw=raw,
    )
