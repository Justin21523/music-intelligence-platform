.DEFAULT_GOAL := help
PYTHON        := uv run python
PYTEST        := uv run pytest tests/ -v

.PHONY: help install sample-data etl train index evaluate api frontend-dev frontend-build test \
        lint fmt typecheck all clean docker-up docker-down notebooks

help: ## Show available targets
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
	  awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

install: ## Install all deps including dev extras
	uv sync --all-groups

sample-data: ## Generate synthetic CSVs to data/sample/ and load into DuckDB
	$(PYTHON) -m src.ingestion.sample_generator

etl: ## Clean, normalize, and load data into DuckDB
	$(PYTHON) -m src.preprocessing.cleaner
	$(PYTHON) -m src.preprocessing.normalizer

train: ## Train all recommendation models, save to data/models/
	$(PYTHON) -m src.models.train_all

index: ## Build text embeddings, BM25 index, and FAISS ANN index
	$(PYTHON) -m src.features.embedding_builder
	$(PYTHON) -m src.retrieval.build_index

evaluate: ## Run full evaluation suite and write metrics report
	$(PYTHON) -m src.evaluation.evaluator

api: ## Start FastAPI server on :8000 (blocking — run pipeline first)
	uv run uvicorn src.api.main:app --reload --host 0.0.0.0 --port 8000

frontend-dev: ## Start React dev server on :5173 (blocking)
	cd frontend && npm run dev

frontend-build: ## Build React app for production
	cd frontend && npm run build

test: ## Run pytest suite with coverage
	$(PYTEST) --cov=src --cov-report=term-missing

lint: ## Lint with ruff
	uv run ruff check src/ tests/

fmt: ## Format with ruff
	uv run ruff format src/ tests/

typecheck: ## Type-check with mypy
	uv run mypy src/ --ignore-missing-imports

notebooks: ## Launch JupyterLab
	uv run jupyter lab notebooks/

all: sample-data etl train index evaluate ## Run full end-to-end pipeline

clean: ## Remove generated artifacts (keeps data/sample/ and DuckDB)
	rm -rf data/processed/ data/models/ data/logs/
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -name "*.pyc" -delete 2>/dev/null || true

docker-up: ## Start all services via docker-compose
	docker compose up --build -d

docker-down: ## Stop all services
	docker compose down
