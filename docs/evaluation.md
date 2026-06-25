# Evaluation Methodology

## Train/Test Split

- **Method**: Temporal split per user
- **Test fraction**: 20% most recent listens per user
- **Minimum listens**: Users with < 5 total listens excluded
- **Rationale**: Temporal split avoids data leakage from future to past

## Recommendation Metrics

| Metric | Formula | Measures |
|--------|---------|----------|
| Precision@K | hits@K / K | Relevance density in top K |
| Recall@K | hits@K / |relevant| | Coverage of relevant items |
| MAP@K | Mean AP@K across users | Overall ranking quality |
| nDCG@K | DCG / IDCG | Graded ranking quality |
| MRR | Mean 1/first_hit_rank | First relevant item position |
| Coverage | unique_recs / catalog_size | Catalog utilization |
| Novelty | -log2(popularity) mean | Beyond-obvious recommendations |
| Diversity | 1 - mean_pairwise_cosine | Within-list variety |

K values evaluated: 5, 10, 20

## Search Metrics

| Metric | Description |
|--------|-------------|
| MRR | Mean Reciprocal Rank across queries |
| nDCG@K | Normalized DCG for search rankings |
| Recall@K | Fraction of relevant docs retrieved in top K |

## Evaluation Results

Results are written to `data/processed/evaluation_results.csv` after `make evaluate`.

View in the Streamlit app under the **Evaluation** page.

*Note: Metrics here are on synthetic data and will differ significantly on real MSD/ListenBrainz data due to different density and distribution characteristics.*

## Expected Metric Ranges (Synthetic Data)

On synthetic data with power-law popularity, expect:
- PopularityRecommender: good coverage, poor personalization
- ALS: best nDCG@10 for active users (>20 listens)
- ContentBased: good diversity, moderate precision
- Hybrid: balanced across all metrics
