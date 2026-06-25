# Music Intelligence Platform

Music Intelligence Platform 是一個音樂知識檢索、相似歌曲搜尋、推薦系統與 artist analytics 平台。它整合 Million Song Dataset、Taste Profile、MusicBrainz、ListenBrainz，以及 copyright-safe lyric-derived features，展示 metadata ETL、hybrid recommendation、ANN search、artist graph analytics、FastAPI API 與 Streamlit demo。

> **Data Policy**: This repo contains **no raw music data**. Only synthetic sample data (MIT-licensed) is committed. See [docs/licensing_notes.md](docs/licensing_notes.md).

---

## Why This Is Not Just MovieLens

| Aspect | MovieLens | This Project |
|--------|-----------|--------------|
| Signal sources | Ratings only | Audio features + tag TF-IDF + embeddings + co-listen graph |
| Search | None | BM25 + FAISS vector + hybrid RRF fusion |
| Graph analytics | None | Artist co-listen network with weighted edges |
| Feature depth | Title/genre | Tempo, energy, danceability, valence, instrumentalness, ... |
| Embeddings | None | sentence-transformers MiniLM-L6 (384-dim) |
| API | None | FastAPI with OpenAPI docs |
| Evaluation | RMSE only | P@K, R@K, MAP, nDCG, MRR, Coverage, Novelty, Diversity |

---

## Project Overview

```
music-intelligence-platform/
├── src/
│   ├── ingestion/       # sample generator + dataset adapters (MSD, MB, LB)
│   ├── preprocessing/   # cleaning + normalization → DuckDB
│   ├── features/        # audio features, TF-IDF tags, sentence-transformer embeddings
│   ├── models/          # popularity, item-item, ALS, content-based, hybrid
│   ├── retrieval/       # BM25, FAISS, hybrid RRF search
│   ├── evaluation/      # P@K, R@K, MAP, nDCG, MRR, coverage, novelty, diversity
│   ├── api/             # FastAPI REST API
│   └── app/             # Streamlit multi-page demo
├── tests/               # pytest suite
├── configs/             # config.yaml, logging.yaml
├── docs/                # architecture, data card, model card, evaluation
└── data/sample/         # committed synthetic CSVs (~10k tracks, ~800 artists)
```

---

## Dataset Integration Plan

| Dataset | Status | Integration Path |
|---------|--------|-----------------|
| Million Song Dataset | Stub | `src/ingestion/msd_loader.py` |
| Taste Profile | Stub | `src/ingestion/taste_profile_loader.py` |
| MusicBrainz | Stub | `src/ingestion/musicbrainz_loader.py` |
| ListenBrainz | Stub | `src/ingestion/listenbainz_loader.py` |
| Synthetic sample | ✅ Active | `src/ingestion/sample_generator.py` |

---

## Architecture

```
Ingestion → Preprocessing → DuckDB Warehouse
                                    ↓              ↓
                               Models          Retrieval
                           (ALS / Content)  (BM25 + FAISS)
                                    ↓              ↓
                              FastAPI REST API (port 8000)
                                         ↓
                               Streamlit Demo (port 8501)
```

See [docs/architecture.md](docs/architecture.md) for full diagram.

---

## Data Pipeline

```bash
make sample-data   # Generate ~10k synthetic tracks → data/sample/ + DuckDB
make etl           # Clean + normalize → DuckDB
make train         # Train 5 recommenders → data/models/
make index         # Build BM25 + FAISS (downloads ~90MB model on first run)
make evaluate      # Compute P@K, nDCG, MRR, Coverage, Novelty, Diversity
```

---

## Recommendation Methods

| Model | Method | Cold-Start |
|-------|--------|-----------|
| `popularity` | Global log1p(play_count) rank | ✅ Full catalog |
| `item_similarity` | Cosine similarity on audio features | ✅ Via global fallback |
| `als` | Implicit ALS (Hu et al. 2008) | ✅ Popularity fallback |
| `content` | Weighted mean user profile + cosine rank | ✅ Via global fallback |
| `hybrid` | Weighted score-level fusion (0.1/0.5/0.4) | ✅ Inherits from ALS |

---

## Search Methods

| Mode | Method | Strength |
|------|--------|---------|
| `bm25` | BM25Okapi (k1=1.5, b=0.75) | Exact keyword match |
| `vector` | FAISS FlatIP on MiniLM-L6 embeddings | Semantic similarity |
| `hybrid` | Reciprocal Rank Fusion | Best of both |

---

## Evaluation Metrics

Computed by `make evaluate` on a temporal 80/20 train/test split:

- **Precision@K**, **Recall@K** — recommendation accuracy
- **MAP@K**, **nDCG@K** — ranking quality
- **MRR** — first-hit position
- **Coverage** — catalog utilization
- **Novelty** — mean self-information of recommendations
- **Diversity** — mean intra-list pairwise distance

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check + component status |
| GET | `/search/tracks?q=&mode=` | Track search (bm25/vector/hybrid) |
| GET | `/search/artists?q=` | Artist search |
| GET | `/tracks` | Paginated track list |
| GET | `/tracks/{track_id}` | Track detail + audio features |
| GET | `/tracks/{track_id}/similar` | Similar tracks |
| GET | `/artists/{artist_id}` | Artist profile |
| GET | `/artists/{artist_id}/network` | Artist co-listen graph |
| GET | `/recommendations/user/{user_id}` | Personalized recommendations |
| POST | `/playlist/build` | Build playlist from seed tracks |

OpenAPI docs: http://localhost:8000/docs

---

## Streamlit Demo

6-page interactive demo:
1. **Home** — dataset stats, top tracks
2. **Search** — BM25/vector/hybrid comparison
3. **Similar Songs** — item-item explorer
4. **Recommendations** — user-personalized with model comparison
5. **Artist Network** — Plotly ego-graph
6. **Evaluation** — metric charts per model

---

## How to Run Locally

### Prerequisites
- [uv](https://docs.astral.sh/uv/) (`pip install uv` or `curl -LsSf https://astral.sh/uv/install.sh | sh`)
- Docker (optional, for containerized run)

### Local Run

```bash
# 1. Clone and install
git clone https://github.com/<you>/music-intelligence-platform
cd music-intelligence-platform
make install

# 2. Run full pipeline
make all            # sample-data → etl → train → index → evaluate

# 3. Start API (in one terminal)
make api            # http://localhost:8000

# 4. Start Streamlit (in another terminal)
make app            # http://localhost:8501
```

### Docker

```bash
docker compose up --build
# API: http://localhost:8000
# App: http://localhost:8501
```

### Tests

```bash
make test           # runs pytest suite (no heavy ML deps required)
```

---

## Limitations and Future Work

- **Synthetic data**: Models trained on synthetic data. Performance on real MSD/Taste Profile will differ.
- **Embeddings**: ~90MB download on first `make index`. Subsequent runs use DuckDB cache.
- **ALS scale**: ItemSimilarity builds full N×N cosine matrix in RAM — replace with ANN for >100k tracks.
- **Artist graph**: Edges built from synthetic co-listens; replace with real ListenBrainz data for meaningful clusters.
- **Search**: BM25 tokenization is whitespace-only; add a proper tokenizer (e.g., spaCy) for production.

### Future Work
- [ ] Real MSD/ListenBrainz adapter implementations
- [ ] Online ALS update (incremental re-fitting)
- [ ] Optuna hyperparameter optimization
- [ ] HNSW FAISS index for faster ANN at scale
- [ ] API authentication (API key middleware)
- [ ] CI/CD (GitHub Actions)
- [ ] musiXmatch lyric-derived features
- [ ] PostgreSQL write path for production

---

## Screenshots & Demo

> All screenshots captured via Playwright automated browser testing across all 20 pages.

### Pipeline Journey Tour — Mandatory Onboarding (22 Steps)

Every visitor sees this fullscreen interactive tour before entering the platform.

| Step 01 · Data Generation | Step 05 · Model Training | Step 10 · Artist Network |
|:---:|:---:|:---:|
| ![tour-01](docs/screenshots/tour-step-01.png) | ![tour-05](docs/screenshots/tour-step-05.png) | ![tour-10](docs/screenshots/tour-step-10.png) |

| Step 13 · User DNA | Step 20 · Decision Tree | Step 22 · Pipeline Runner |
|:---:|:---:|:---:|
| ![tour-13](docs/screenshots/tour-step-13.png) | ![tour-20](docs/screenshots/tour-step-20.png) | ![tour-22](docs/screenshots/tour-step-22.png) |

📹 **[Full Tour Video](docs/screenshots/demo-tour.webm)** — Playwright recording of the complete 22-step onboarding

---

### Core Pages

| Homepage | Search + Results | Recommendations |
|:---:|:---:|:---:|
| ![home](docs/screenshots/page-home.png) | ![search](docs/screenshots/page-search-results.png) | ![recommend](docs/screenshots/page-recommend.png) |

| Evaluation + Model Profiles | Pipeline Node Graph | Upload & Run Pipeline |
|:---:|:---:|:---:|
| ![eval](docs/screenshots/page-evaluation.png) | ![pipeline](docs/screenshots/page-pipeline.png) | ![upload](docs/screenshots/page-upload.png) |

---

### Analytics Dashboard

| Artist Network Graph | Genre Dashboard | Decision Tree (SVG) |
|:---:|:---:|:---:|
| ![artists](docs/screenshots/page-artists.png) | ![genres](docs/screenshots/page-genres.png) | ![tree](docs/screenshots/page-tree.png) |

| User DNA Radar | Model Disagreement | Catalog Timeline |
|:---:|:---:|:---:|
| ![dna](docs/screenshots/page-dna.png) | ![disagree](docs/screenshots/page-disagreement.png) | ![timeline](docs/screenshots/page-timeline.png) |

| Popularity Bias | Feature Correlation | Listening Patterns |
|:---:|:---:|:---:|
| ![pop](docs/screenshots/page-popularity.png) | ![corr](docs/screenshots/page-correlation.png) | ![patterns](docs/screenshots/page-patterns.png) |

---

## Resume Bullets

- Built end-to-end music recommendation platform: ETL → feature engineering → hybrid model training → REST API → Streamlit demo, using Python/DuckDB/FastAPI
- Implemented hybrid search engine combining BM25 and FAISS 384-dim vector index via Reciprocal Rank Fusion, achieving semantic + keyword retrieval without score calibration
- Trained and evaluated 5 recommendation models (Popularity, Item-Item, ALS, Content-Based, Hybrid) with P@K, nDCG@K, MAP, MRR, Coverage, Novelty, and Diversity metrics
- Integrated sentence-transformers embeddings with DuckDB BLOB cache to avoid re-encoding 10k tracks; built artist co-listen graph analytics with NetworkX + Plotly
- Designed production-like repo with uv dependency management, pytest test suite (32+ tests), OpenAPI docs, docker-compose deployment, and full Makefile pipeline
