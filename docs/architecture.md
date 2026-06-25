# Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Music Intelligence Platform                   │
│                                                                   │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────┐   │
│  │   Ingestion  │───▶│  Preprocessing│───▶│  Feature Eng.    │   │
│  │  (ETL / CSV) │    │  (clean/norm) │    │  (audio/tags/emb)│   │
│  └──────────────┘    └──────────────┘    └──────────────────┘   │
│          │                   │                     │             │
│          ▼                   ▼                     ▼             │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                     DuckDB Warehouse                       │  │
│  │  artists │ tracks │ users │ listens │ track_embeddings     │  │
│  │  artist_graph_edges │ similar_tracks │ recommendations     │  │
│  └───────────────────────────────────────────────────────────┘  │
│          │                                    │                  │
│          ▼                                    ▼                  │
│  ┌──────────────┐                   ┌──────────────────────┐    │
│  │   Models     │                   │   Retrieval           │    │
│  │  Popularity  │                   │  BM25 (rank_bm25)    │    │
│  │  Item-Item   │                   │  FAISS (IndexFlatIP)  │    │
│  │  ALS         │                   │  Hybrid (RRF)         │    │
│  │  Content     │                   └──────────────────────┘    │
│  │  Hybrid      │                            │                  │
│  └──────────────┘                            │                  │
│          │                                   │                  │
│          └────────────────┬──────────────────┘                  │
│                           ▼                                      │
│              ┌────────────────────────┐                         │
│              │      FastAPI REST API   │                         │
│              │  GET /health            │                         │
│              │  GET /search/tracks     │                         │
│              │  GET /tracks/{id}       │                         │
│              │  GET /tracks/{id}/similar│                        │
│              │  GET /artists/{id}      │                         │
│              │  GET /artists/{id}/network│                       │
│              │  GET /recommendations/  │                         │
│              │  POST /playlist/build   │                         │
│              └────────────┬───────────┘                         │
│                           │                                      │
│              ┌────────────▼───────────┐                         │
│              │    Streamlit Demo       │                         │
│              │  Search │ Similar       │                         │
│              │  Recommend │ Network    │                         │
│              │  Dashboard │ Evaluation │                         │
│              └────────────────────────┘                         │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

1. **`make sample-data`** — generates synthetic data → DuckDB + CSV
2. **`make etl`** — cleans and normalizes data, reloads DuckDB
3. **`make train`** — trains 5 recommenders, saves .pkl to data/models/
4. **`make index`** — builds BM25 (pickle) + FAISS (binary) + caches embeddings
5. **`make evaluate`** — temporal split, runs all models, writes metrics CSV
6. **`make api`** — starts FastAPI (loads indexes/models at startup)
7. **`make app`** — starts Streamlit (direct Python imports, no API needed)

## Technology Choices

| Layer | Tool | Reason |
|-------|------|--------|
| Storage | DuckDB | Columnar analytics, no server needed |
| Embeddings | sentence-transformers | High-quality, multilingual, ~90MB |
| ANN Search | FAISS FlatIP | Exact cosine, easy to replace with IVF at scale |
| BM25 | rank-bm25 | Pure Python, no index server needed |
| Fusion | RRF | Robust, no score calibration required |
| MF | implicit | Battle-tested ALS on implicit feedback |
| API | FastAPI | Auto OpenAPI docs, async-ready, Pydantic v2 |
| UI | Streamlit | Rapid data-app prototyping |
| Warehouse | DuckDB | Same engine for both pipeline and API |

## Scalability Notes

- FAISS: swap `IndexFlatIP` → `IndexIVFFlat` or HNSW for >100k tracks
- DuckDB: can be swapped for MotherDuck (managed DuckDB) or Postgres for write-heavy workloads
- Models: ALS factors/iterations are tunable in configs/config.yaml
- Embedding dim: changing the model requires rebuilding the FAISS index (dim changes)
