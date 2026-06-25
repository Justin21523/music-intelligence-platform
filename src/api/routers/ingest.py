"""Ingest router — upload CSV data and run the full ML pipeline."""

from __future__ import annotations

import copy
import io
import threading
import time
from pathlib import Path
from typing import Any

import pandas as pd
from fastapi import APIRouter, BackgroundTasks, File, HTTPException, UploadFile
from pydantic import BaseModel

from src.utils.logging import get_logger
from src.utils.paths import (
    BM25_INDEX_PATH,
    FAISS_ID_MAP_PATH,
    FAISS_INDEX_PATH,
    MODELS_DIR,
    SAMPLE_DIR,
    ensure_dirs,
)

logger = get_logger(__name__)
router = APIRouter(prefix="/ingest", tags=["ingest"])

UPLOAD_DIR: Path = Path("data/upload")

PIPELINE_STEPS = [
    "Validating & loading data",
    "Extracting audio features",
    "Training recommendation models",
    "Building search indices",
    "Running evaluation",
    "Reloading API state",
]

EXPECTED_COLUMNS: dict[str, list[str]] = {
    "artists": [
        "artist_id", "name", "country", "genres", "tags",
        "popularity_score", "follower_count", "active_since",
    ],
    "tracks": [
        "track_id", "title", "artist_id", "album", "genre", "tags",
        "tempo", "energy", "danceability", "acousticness", "valence",
        "instrumentalness", "loudness", "speechiness", "liveness",
        "explicit", "release_year", "play_count",
    ],
    "users": ["user_id", "username", "country", "age_group", "joined_year"],
    "listens": ["listen_id", "user_id", "track_id", "listened_at", "completed", "source"],
}

# ── Module-level job state (thread-safe) ──────────────────────────────────────

_lock = threading.Lock()
_job: dict[str, Any] = {
    "status": "idle",   # idle | running | done | error
    "step_idx": -1,
    "step_name": "",
    "pct": 0,
    "logs": [],
    "error": None,
    "used_sample": True,
    "elapsed_s": 0.0,
}

# Reference to the running FastAPI app — set by main.py after app creation
_app_ref: Any = None


def set_app(app: Any) -> None:
    global _app_ref
    _app_ref = app


# ── Internal helpers ──────────────────────────────────────────────────────────

def _log(msg: str) -> None:
    with _lock:
        _job["logs"].append(msg)
        if len(_job["logs"]) > 60:
            _job["logs"] = _job["logs"][-60:]
    logger.info("[ingest] %s", msg)


def _set_step(idx: int, pct: int) -> None:
    with _lock:
        _job["step_idx"] = idx
        _job["step_name"] = PIPELINE_STEPS[idx]
        _job["pct"] = pct


def _load_csvs(use_sample: bool) -> dict[str, pd.DataFrame]:
    data_dir = SAMPLE_DIR if use_sample else UPLOAD_DIR
    dfs: dict[str, pd.DataFrame] = {}
    for name in ["artists", "tracks", "users", "listens"]:
        path = data_dir / f"{name}.csv"
        if not path.exists():
            raise FileNotFoundError(f"Missing required file: {path}")
        dfs[name] = pd.read_csv(path)
    return dfs


def _reload_app_state() -> None:
    """Reload trained models and indices into the running FastAPI app state."""
    app = _app_ref
    if app is None:
        return

    from src.retrieval.bm25_index import BM25Index
    from src.retrieval.vector_index import VectorIndex

    if BM25_INDEX_PATH.exists():
        app.state.bm25 = BM25Index.load(BM25_INDEX_PATH)
        _log("BM25 index reloaded.")

    if FAISS_INDEX_PATH.exists():
        app.state.vector = VectorIndex.load(FAISS_INDEX_PATH, FAISS_ID_MAP_PATH)
        _log("FAISS index reloaded.")

    from src.models.base import BaseRecommender
    app.state.recommenders = {}
    for model_name in ["popularity", "item_similarity", "als", "content", "hybrid"]:
        path = MODELS_DIR / f"{model_name}.pkl"
        if path.exists():
            app.state.recommenders[model_name] = BaseRecommender.load(path)
    _log(f"Reloaded {len(app.state.recommenders)} recommenders.")

    if app.state.bm25 and app.state.vector:
        try:
            from src.features.embedding_builder import EmbeddingBuilder
            from src.retrieval.hybrid_search import HybridSearchEngine
            from src.utils.config import get_config
            cfg = get_config()
            eb = EmbeddingBuilder(model_name=cfg.embedding.model_name)
            app.state.hybrid_engine = HybridSearchEngine(
                bm25=app.state.bm25,
                vector=app.state.vector,
                embedding_builder=eb,
                alpha=cfg.retrieval.hybrid_alpha,
                rrf_k=cfg.retrieval.rrf_k,
            )
            _log("HybridSearchEngine rebuilt.")
        except Exception as exc:
            _log(f"Hybrid engine rebuild failed: {exc}")


# ── Pipeline thread ────────────────────────────────────────────────────────────

def _run_pipeline(use_sample: bool) -> None:  # noqa: C901
    t0 = time.time()
    try:
        from src.utils.db import get_pipeline_connection

        # ── Step 0: load data ────────────────────────────────────────────────
        _set_step(0, 5)
        _log("Loading CSV files…")
        dfs = _load_csvs(use_sample)
        n_tracks = len(dfs["tracks"])
        n_artists = len(dfs["artists"])
        n_users = len(dfs["users"])
        n_listens = len(dfs["listens"])
        _log(f"Loaded: {n_tracks:,} tracks · {n_artists:,} artists · {n_users:,} users · {n_listens:,} listens")

        _set_step(0, 12)
        _log("Clearing database and inserting new data…")
        conn = get_pipeline_connection()
        try:
            from src.ingestion.sample_generator import _load_to_duckdb
            _load_to_duckdb(conn, dfs)
        finally:
            conn.close()
        _set_step(0, 20)
        _log("Data loaded to DuckDB ✓")

        # ── Step 1: audio features ───────────────────────────────────────────
        _set_step(1, 22)
        _log("Building audio feature matrix…")
        # Features are derived from tracks table — just verify readiness
        conn = get_pipeline_connection()
        try:
            from src.features.audio_features import build_audio_feature_matrix
            audio_matrix, audio_ids = build_audio_feature_matrix(conn)
            _log(f"Audio matrix: {audio_matrix.shape[0]}×{audio_matrix.shape[1]}")
        finally:
            conn.close()
        _set_step(1, 35)
        _log("Audio feature matrix ready ✓")

        # ── Step 2: train models ─────────────────────────────────────────────
        _set_step(2, 36)
        ensure_dirs()
        conn = get_pipeline_connection()
        try:
            from src.features.audio_features import build_audio_feature_matrix
            from src.features.tag_features import build_tag_tfidf_matrix
            from src.models.popularity import PopularityRecommender
            from src.models.item_similarity import ItemSimilarityRecommender
            from src.models.als_recommender import ALSRecommender
            from src.models.content_based import ContentBasedRecommender
            from src.models.hybrid import HybridRecommender

            interactions = conn.execute(
                "SELECT user_id, track_id, COUNT(*) AS listen_count FROM listens GROUP BY 1, 2"
            ).df()
            tracks_meta = conn.execute("SELECT track_id, play_count FROM tracks").df()

            _log("Training PopularityRecommender…")
            pop = PopularityRecommender().fit(interactions, tracks_meta)
            pop.save(MODELS_DIR / "popularity.pkl")
            _set_step(2, 42)

            _log("Training ItemSimilarityRecommender…")
            audio_matrix, audio_ids = build_audio_feature_matrix(conn)
            item_sim = ItemSimilarityRecommender()
            item_sim.fit_from_matrix(interactions, audio_matrix, audio_ids)
            item_sim.save(MODELS_DIR / "item_similarity.pkl")
            _set_step(2, 49)

            _log("Training ALSRecommender…")
            als = ALSRecommender().fit(interactions, tracks_meta)
            als.save(MODELS_DIR / "als.pkl")
            _set_step(2, 55)

            _log("Training ContentBasedRecommender…")
            tag_matrix, tag_ids, _ = build_tag_tfidf_matrix(conn)
            content = ContentBasedRecommender()
            if audio_ids == tag_ids:
                content.fit_from_matrices(interactions, audio_matrix, audio_ids, tag_matrix, tag_ids)
            else:
                content.fit(interactions, tracks_meta)
            content.save(MODELS_DIR / "content.pkl")
            _set_step(2, 61)

        finally:
            conn.close()

        _log("Assembling HybridRecommender…")
        hybrid = HybridRecommender(
            recommenders={"popularity": pop, "als": als, "content": content},
            weights={"popularity": 0.1, "als": 0.5, "content": 0.4},
        )
        hybrid.save(MODELS_DIR / "hybrid.pkl")
        _set_step(2, 65)
        _log("All 5 models trained ✓")

        # ── Step 3: build indices ────────────────────────────────────────────
        _set_step(3, 66)
        _log("Building BM25 full-text index…")
        from src.retrieval.bm25_index import main as bm25_main
        bm25_main()
        _set_step(3, 73)

        _log("Building FAISS vector index…")
        from src.retrieval.vector_index import main as vector_main
        vector_main()
        _set_step(3, 80)
        _log("Search indices built ✓")

        # ── Step 4: evaluate ─────────────────────────────────────────────────
        _set_step(4, 81)
        _log("Running evaluation suite…")
        from src.evaluation.evaluator import main as eval_main
        eval_main()
        _set_step(4, 95)
        _log("Evaluation complete ✓")

        # ── Step 5: reload API state ─────────────────────────────────────────
        _set_step(5, 96)
        _log("Reloading live API state…")
        _reload_app_state()

        elapsed = time.time() - t0
        with _lock:
            _job["elapsed_s"] = round(elapsed, 1)
            _job["status"] = "done"
            _job["pct"] = 100
            _job["step_idx"] = len(PIPELINE_STEPS)
            _job["step_name"] = "Complete"
        _log(f"Pipeline complete in {elapsed:.1f}s ✓")

    except Exception as exc:  # noqa: BLE001
        import traceback
        err = f"{type(exc).__name__}: {exc}"
        _log(f"PIPELINE ERROR: {err}")
        _log(traceback.format_exc())
        with _lock:
            _job["status"] = "error"
            _job["error"] = err
            _job["elapsed_s"] = round(time.time() - t0, 1)


# ── API endpoints ─────────────────────────────────────────────────────────────

class StartRequest(BaseModel):
    use_sample: bool = True


@router.post("/start")
async def start_pipeline(req: StartRequest, background_tasks: BackgroundTasks):
    """Start the full ML pipeline (sample data or uploaded CSVs)."""
    with _lock:
        if _job["status"] == "running":
            raise HTTPException(status_code=409, detail="Pipeline is already running")
        if not req.use_sample:
            for name in ["artists", "tracks", "users", "listens"]:
                if not (UPLOAD_DIR / f"{name}.csv").exists():
                    raise HTTPException(status_code=400, detail=f"Upload missing: {name}.csv — call /ingest/upload first")
        _job.update({
            "status": "running",
            "step_idx": -1,
            "step_name": "Starting…",
            "pct": 0,
            "logs": ["Pipeline started."],
            "error": None,
            "used_sample": req.use_sample,
            "elapsed_s": 0.0,
        })

    background_tasks.add_task(_run_pipeline, req.use_sample)
    return {"status": "started", "use_sample": req.use_sample}


@router.post("/upload")
async def upload_files(
    artists_file: UploadFile = File(...),
    tracks_file: UploadFile = File(...),
    users_file: UploadFile = File(...),
    listens_file: UploadFile = File(...),
):
    """Validate and save uploaded CSV files for the pipeline."""
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    errors: list[str] = []

    file_map = {
        "artists": artists_file,
        "tracks": tracks_file,
        "users": users_file,
        "listens": listens_file,
    }

    for name, upload in file_map.items():
        content = await upload.read()
        try:
            df = pd.read_csv(io.StringIO(content.decode("utf-8")))
        except Exception as exc:
            errors.append(f"{name}: Failed to parse CSV — {exc}")
            continue

        expected = EXPECTED_COLUMNS[name]
        missing = [c for c in expected if c not in df.columns]
        if missing:
            errors.append(f"{name}.csv: Missing columns: {missing}")
            continue

        (UPLOAD_DIR / f"{name}.csv").write_bytes(content)

    return {"valid": len(errors) == 0, "errors": errors}


@router.get("/status")
async def get_status():
    """Return current pipeline job state."""
    with _lock:
        return copy.copy(_job)


@router.post("/reset")
async def reset_pipeline():
    """Reset pipeline state to idle (only when not running)."""
    with _lock:
        if _job["status"] == "running":
            raise HTTPException(status_code=409, detail="Cannot reset while pipeline is running")
        _job.update({
            "status": "idle",
            "step_idx": -1,
            "step_name": "",
            "pct": 0,
            "logs": [],
            "error": None,
            "elapsed_s": 0.0,
        })
    return {"status": "idle"}
