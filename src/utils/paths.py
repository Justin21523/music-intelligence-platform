"""Project-wide path constants derived from the repo root."""

from pathlib import Path

ROOT_DIR: Path = Path(__file__).resolve().parents[2]
DATA_DIR: Path = ROOT_DIR / "data"
SAMPLE_DIR: Path = DATA_DIR / "sample"
PROCESSED_DIR: Path = DATA_DIR / "processed"
MODELS_DIR: Path = DATA_DIR / "models"
LOGS_DIR: Path = DATA_DIR / "logs"
CONFIGS_DIR: Path = ROOT_DIR / "configs"

DUCKDB_PATH: Path = DATA_DIR / "warehouse.duckdb"
FAISS_INDEX_PATH: Path = PROCESSED_DIR / "faiss_track.index"
FAISS_ID_MAP_PATH: Path = PROCESSED_DIR / "faiss_id_map.npy"
BM25_INDEX_PATH: Path = PROCESSED_DIR / "bm25_index.pkl"
CONFIG_PATH: Path = CONFIGS_DIR / "config.yaml"
LOGGING_CONFIG_PATH: Path = CONFIGS_DIR / "logging.yaml"


def ensure_dirs() -> None:
    """Create all data subdirectories if they don't exist."""
    for d in (SAMPLE_DIR, PROCESSED_DIR, MODELS_DIR, LOGS_DIR):
        d.mkdir(parents=True, exist_ok=True)
