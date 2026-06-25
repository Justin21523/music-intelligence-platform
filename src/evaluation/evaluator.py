"""End-to-end evaluation orchestrator for all recommenders.

Performs temporal train/test split, evaluates each model, and writes a metrics CSV.

Run directly:  python -m src.evaluation.evaluator
"""

from __future__ import annotations

from pathlib import Path

import numpy as np
import pandas as pd
from rich.console import Console
from rich.table import Table

from src.evaluation.metrics import (
    coverage,
    diversity,
    map_at_k,
    mrr,
    ndcg_at_k,
    novelty,
    precision_at_k,
    recall_at_k,
)
from src.features.audio_features import build_audio_feature_matrix
from src.models.base import BaseRecommender
from src.utils.config import get_config
from src.utils.db import get_pipeline_connection
from src.utils.logging import get_logger
from src.utils.paths import MODELS_DIR, PROCESSED_DIR, ensure_dirs

logger = get_logger(__name__)
console = Console()


class Evaluator:
    """Evaluate all recommenders on a held-out test set."""

    def __init__(
        self,
        models: dict[str, BaseRecommender],
        conn,
        k_values: list[int] | None = None,
    ) -> None:
        self.models = models
        self.conn = conn
        self.k_values = k_values or [5, 10, 20]

    def create_test_split(
        self,
        listens_df: pd.DataFrame,
        test_fraction: float = 0.2,
        min_listens: int = 5,
    ) -> tuple[pd.DataFrame, pd.DataFrame]:
        """Temporal split: most recent test_fraction of each user's listens → test set.

        Users with fewer than min_listens total listens are excluded from evaluation.
        """
        listens_df = listens_df.sort_values(["user_id", "listened_at"])
        active_users = (
            listens_df.groupby("user_id").size()
            .loc[lambda s: s >= min_listens]
            .index
        )
        listens_df = listens_df[listens_df["user_id"].isin(active_users)]

        train_rows, test_rows = [], []
        for _, grp in listens_df.groupby("user_id"):
            n = len(grp)
            cut = max(1, int(n * (1 - test_fraction)))
            train_rows.append(grp.iloc[:cut])
            test_rows.append(grp.iloc[cut:])

        return pd.concat(train_rows, ignore_index=True), pd.concat(test_rows, ignore_index=True)

    def evaluate_model(
        self,
        model: BaseRecommender,
        train_df: pd.DataFrame,
        test_df: pd.DataFrame,
        catalog_size: int,
        feature_matrix: np.ndarray | None = None,
        track_id_to_idx: dict[str, int] | None = None,
        popularity: dict[str, float] | None = None,
    ) -> dict[str, float]:
        """Evaluate a single model across all users in the test set."""
        test_users = test_df["user_id"].unique()
        all_recs = []
        all_rels = []

        for user_id in test_users:
            user_test = test_df[test_df["user_id"] == user_id]["track_id"].tolist()
            if not user_test:
                continue
            try:
                recs = [t for t, _ in model.recommend(user_id, n=max(self.k_values))]
            except Exception as e:
                logger.debug("Model %s failed for user %s: %s", model.name, user_id, e)
                recs = []
            all_recs.append(recs)
            all_rels.append(set(user_test))

        if not all_recs:
            return {}

        results: dict[str, float] = {}
        for k in self.k_values:
            results[f"precision@{k}"] = float(np.mean([
                precision_at_k(r, rel, k) for r, rel in zip(all_recs, all_rels)
            ]))
            results[f"recall@{k}"] = float(np.mean([
                recall_at_k(r, rel, k) for r, rel in zip(all_recs, all_rels)
            ]))
            results[f"ndcg@{k}"] = float(np.mean([
                ndcg_at_k(r, rel, k) for r, rel in zip(all_recs, all_rels)
            ]))

        results["map@10"] = map_at_k(all_recs, all_rels, 10)
        results["mrr"] = mrr(all_recs, all_rels)
        results["coverage"] = coverage(all_recs, catalog_size)

        if popularity:
            results["novelty"] = novelty(all_recs, popularity)
        if feature_matrix is not None and track_id_to_idx:
            results["diversity"] = diversity(all_recs, feature_matrix, track_id_to_idx)

        return results

    def run(self, output_path: Path | None = None) -> pd.DataFrame:
        """Evaluate all models and return a results DataFrame."""
        cfg = get_config()

        listens_df = self.conn.execute(
            "SELECT user_id, track_id, listened_at FROM listens"
        ).df()
        tracks_df = self.conn.execute("SELECT track_id, play_count FROM tracks").df()

        train_df, test_df = self.create_test_split(
            listens_df,
            test_fraction=cfg.evaluation.test_fraction,
            min_listens=cfg.evaluation.min_listens_for_eval,
        )
        logger.info(
            "Split: %d train listens / %d test listens across %d users",
            len(train_df), len(test_df), test_df["user_id"].nunique(),
        )

        catalog_size = len(tracks_df)
        feature_matrix, track_ids = build_audio_feature_matrix(self.conn)
        track_id_to_idx = {tid: i for i, tid in enumerate(track_ids)}

        total_listens = tracks_df["play_count"].sum()
        popularity = {
            row.track_id: row.play_count / total_listens
            for row in tracks_df.itertuples()
        }

        all_results = {}
        for model_name, model in self.models.items():
            console.print(f"[cyan]Evaluating {model_name}...[/cyan]")
            metrics = self.evaluate_model(
                model, train_df, test_df, catalog_size,
                feature_matrix, track_id_to_idx, popularity,
            )
            all_results[model_name] = metrics

        results_df = pd.DataFrame(all_results).T
        results_df.index.name = "model"

        path = output_path or Path(cfg.evaluation.output_path)
        path.parent.mkdir(parents=True, exist_ok=True)
        results_df.to_csv(path)
        logger.info("Evaluation results saved → %s", path)

        return results_df


def print_report(results_df: pd.DataFrame) -> None:
    """Pretty-print evaluation results as a rich table."""
    table = Table(title="Recommendation Evaluation Results", show_header=True)
    table.add_column("Model", style="cyan")
    for col in results_df.columns:
        table.add_column(col, justify="right")

    for model_name, row in results_df.iterrows():
        table.add_row(str(model_name), *[f"{v:.4f}" if pd.notna(v) else "-" for v in row])

    console.print(table)


def main() -> None:
    """Load models from disk and run full evaluation."""
    ensure_dirs()

    def _load(name: str) -> BaseRecommender | None:
        path = MODELS_DIR / f"{name}.pkl"
        if not path.exists():
            logger.warning("Model not found: %s", path)
            return None
        return BaseRecommender.load(path)

    models = {k: m for k, m in {
        "popularity": _load("popularity"),
        "item_similarity": _load("item_similarity"),
        "als": _load("als"),
        "content": _load("content"),
        "hybrid": _load("hybrid"),
    }.items() if m is not None}

    if not models:
        logger.error("No models found. Run make train first.")
        return

    conn = get_pipeline_connection()
    try:
        evaluator = Evaluator(models, conn)
        results = evaluator.run()
        print_report(results)
    finally:
        conn.close()


if __name__ == "__main__":
    main()
