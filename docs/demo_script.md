# Demo Script

A guided walkthrough for presenting Music Intelligence Platform in a portfolio or interview context.

## Quick Setup (5 minutes)

```bash
git clone <repo>
cd music-intelligence-platform
make install        # ~2 min first time
make sample-data    # generates 10k tracks, 800 artists, 500 users
make etl            # clean + load to DuckDB
make train          # train 5 models (~1 min)
make index          # BM25 + embeddings + FAISS (~3 min on first run — downloads ~90MB model)
make evaluate       # compute metrics
make api            # starts API at localhost:8000
# In another terminal:
make app            # starts Streamlit at localhost:8501
```

## Demo Walk-Through

### 1. Architecture Overview (~2 min)
- Show `docs/architecture.md` ASCII diagram
- Explain DuckDB as the local warehouse — no separate database server needed
- Highlight the pipeline chain: ingest → preprocess → features → models → retrieval → evaluate

### 2. Data Quality (~1 min)
- Run `make sample-data` live if not already done
- Show the generated CSVs in `data/sample/`
- Highlight the Zipf play_count distribution (power law matching real streaming data)

### 3. Search Demo (~3 min)
- Open Streamlit → Search page
- Query: "upbeat guitar rock" → show hybrid search results
- Toggle between BM25 / Vector / Hybrid modes
- Point out the RRF fusion combining keyword and semantic signals

### 4. Recommendations Demo (~3 min)
- Open Streamlit → Recommendations page
- Select a user, compare popularity vs. ALS vs. hybrid models
- Show listening history panel alongside recommendations
- Explain cold-start fallback for new users

### 5. Artist Network (~2 min)
- Open Streamlit → Artist Network page
- Select a popular artist
- Show the co-listen graph — artists whose fans overlap
- Explain how edges are built from shared listener signal

### 6. Evaluation (~3 min)
- Open Streamlit → Evaluation page
- Walk through P@K, nDCG@K, Coverage, Novelty, Diversity per model
- Key insight: hybrid model balances personalization with novelty/diversity

### 7. API Documentation (~2 min)
- Open http://localhost:8000/docs
- Demonstrate health check, track search, and recommendation endpoints
- Show Pydantic schemas in the OpenAPI UI

## Key Talking Points

- "This isn't MovieLens — we have audio feature vectors, tag TF-IDF, and graph co-listen edges as distinct signal sources"
- "The hybrid search RRF fusion means users who search for 'chill evening' find semantically relevant tracks even if the exact words don't appear"
- "DuckDB array types let us store and query tag arrays natively without a junction table"
- "The ALS cold-start fallback ensures the API never returns 500 for new users"
- "All of this runs locally on a laptop — no cloud dependencies for the portfolio demo"
