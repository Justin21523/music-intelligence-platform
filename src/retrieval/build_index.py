"""Entry point for make index — builds both BM25 and FAISS indexes.

Run directly:  python -m src.retrieval.build_index
"""

from __future__ import annotations

from src.retrieval.hybrid_search import build_index_main


def main() -> None:
    build_index_main()


if __name__ == "__main__":
    main()
