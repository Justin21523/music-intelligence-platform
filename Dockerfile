FROM python:3.11-slim

WORKDIR /app

# Install uv
RUN pip install uv

# Copy dependency files first for layer caching
COPY pyproject.toml ./

# Install dependencies
RUN uv sync --no-dev

# Copy source
COPY src/ ./src/
COPY configs/ ./configs/

# Create data dirs
RUN mkdir -p data/sample data/processed data/models data/logs

# Default command (override in docker-compose)
CMD ["uv", "run", "uvicorn", "src.api.main:app", "--host", "0.0.0.0", "--port", "8000"]
