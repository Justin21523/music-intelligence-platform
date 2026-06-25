"""Logging setup using rich for console output and rotating file handler."""

from __future__ import annotations

import logging
import logging.config
from functools import lru_cache

import yaml

from src.utils.paths import LOGGING_CONFIG_PATH, ensure_dirs


@lru_cache(maxsize=1)
def setup_logging() -> None:
    """Initialize logging from YAML config. Idempotent — safe to call multiple times."""
    ensure_dirs()
    with open(LOGGING_CONFIG_PATH) as f:
        config = yaml.safe_load(f)
    logging.config.dictConfig(config)


def get_logger(name: str) -> logging.Logger:
    """Return a named logger, initializing logging on first call."""
    setup_logging()
    return logging.getLogger(name)
