"""Train all recommendation models in sequence.

Run directly:  python -m src.models.train_all
"""

from __future__ import annotations

from rich.console import Console

from src.features.audio_features import build_audio_feature_matrix
from src.features.tag_features import build_tag_tfidf_matrix
from src.models.als_recommender import ALSRecommender
from src.models.content_based import ContentBasedRecommender
from src.models.item_similarity import ItemSimilarityRecommender
from src.models.popularity import PopularityRecommender
from src.utils.db import get_pipeline_connection
from src.utils.logging import get_logger
from src.utils.paths import MODELS_DIR, ensure_dirs

logger = get_logger(__name__)
console = Console()


def main() -> None:
    """Train and save all models."""
    ensure_dirs()

    conn = get_pipeline_connection()
    try:
        interactions = conn.execute(
            "SELECT user_id, track_id, COUNT(*) AS listen_count FROM listens GROUP BY 1, 2"
        ).df()
        tracks = conn.execute("SELECT track_id, play_count FROM tracks").df()

        if interactions.empty:
            logger.error("No listens found. Run make sample-data and make etl first.")
            return

        console.print("[cyan]Training PopularityRecommender...[/cyan]")
        pop = PopularityRecommender().fit(interactions, tracks)
        pop.save(MODELS_DIR / "popularity.pkl")

        console.print("[cyan]Training ItemSimilarityRecommender...[/cyan]")
        audio_matrix, audio_ids = build_audio_feature_matrix(conn)
        item_sim = ItemSimilarityRecommender()
        item_sim.fit_from_matrix(interactions, audio_matrix, audio_ids)
        item_sim.save(MODELS_DIR / "item_similarity.pkl")

        console.print("[cyan]Training ALSRecommender...[/cyan]")
        als = ALSRecommender().fit(interactions, tracks)
        als.save(MODELS_DIR / "als.pkl")

        console.print("[cyan]Training ContentBasedRecommender...[/cyan]")
        tag_matrix, tag_ids, _ = build_tag_tfidf_matrix(conn)
        if audio_ids == tag_ids:
            content = ContentBasedRecommender()
            content.fit_from_matrices(interactions, audio_matrix, audio_ids, tag_matrix, tag_ids)
        else:
            content = ContentBasedRecommender().fit(interactions, tracks)
        content.save(MODELS_DIR / "content.pkl")

    finally:
        conn.close()

    console.print("[cyan]Assembling HybridRecommender...[/cyan]")
    from src.models.hybrid import HybridRecommender
    hybrid = HybridRecommender(
        recommenders={"popularity": pop, "als": als, "content": content},
        weights={"popularity": 0.1, "als": 0.5, "content": 0.4},
    )
    hybrid.save(MODELS_DIR / "hybrid.pkl")

    console.print("[bold green]All models saved to data/models/[/bold green]")


if __name__ == "__main__":
    main()
