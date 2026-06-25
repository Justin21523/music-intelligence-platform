# Model Card

## Recommendation Models

### 1. PopularityRecommender (baseline)
- **Type**: Non-personalized global ranking
- **Score**: `log1p(play_count)`
- **Use case**: Cold-start fallback, baseline comparison
- **Limitations**: No personalization, identical for all users

### 2. ItemSimilarityRecommender
- **Type**: Item-item collaborative filtering (content-based variant)
- **Features**: 9 audio features (tempo, energy, danceability, etc.)
- **Similarity**: Cosine similarity
- **Top-K neighbors**: 50 per item stored
- **Limitations**: Only captures audio similarity, ignores collaborative signals

### 3. ALSRecommender
- **Type**: Matrix Factorization (Alternating Least Squares)
- **Library**: `implicit` (Hu et al. 2008)
- **Factors**: 64
- **Confidence**: C = 1 + α × listen_count (α=40)
- **Cold-start**: Falls back to PopularityRecommender for unseen users
- **Limitations**: Cannot generalize to new items without re-training

### 4. ContentBasedRecommender
- **Type**: User preference profile similarity
- **Features**: Audio features (60%) + TF-IDF tags (40%)
- **Method**: Weighted mean of user's listened tracks → cosine rank
- **Limitations**: Ignores collaborative signals, filter bubble risk

### 5. HybridRecommender
- **Type**: Score-level fusion
- **Weights**: popularity 0.1 / ALS 0.5 / content 0.4
- **Fusion**: Min-max normalize per-model scores, then weighted sum
- **Limitations**: Fixed weights — production system would tune these per user

## Search Models

### BM25Index
- **Algorithm**: BM25Okapi (Robertson & Zaragoza 2009)
- **k1**: 1.5, **b**: 0.75
- **Corpus**: title + artist + album + genre + tags per track

### VectorIndex
- **Model**: sentence-transformers/all-MiniLM-L6-v2 (384-dim)
- **Index**: FAISS IndexFlatIP (exact search)
- **Normalization**: L2 before insert, L2 on query → inner product = cosine

### HybridSearchEngine
- **Fusion**: Reciprocal Rank Fusion (Cormack et al. 2009)
- **k parameter**: 60 (smoothing constant)
- **Weights**: BM25 0.5 / Vector 0.5 (configurable)

## Artist Graph
- **Method**: Co-listen edge weighting (log1p shared users)
- **Minimum edge weight**: 3 shared users
- **Genre bonding**: +0.5 weight for same primary genre
- **Storage**: `artist_graph_edges` DuckDB table

## Training Data
All models trained on synthetic data (see data_card.md). For production:
1. Replace `make sample-data` with real MSD/ListenBrainz ingestion
2. Re-run `make all` to retrain on real data
3. Tune ALS factors, hybrid weights via Optuna or grid search
