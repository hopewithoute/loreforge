# ==========================================
# Stage 1: Build Frontend (Node.js)
# ==========================================
FROM node:22-slim AS frontend-builder

WORKDIR /app/frontend

# Copy package files and install dependencies
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install

# Copy the rest of the frontend source code
COPY frontend/ .

# Build the frontend (outputs to /app/frontend/dist)
RUN npm run build


# ==========================================
# Stage 2: Build Backend & Final Image (Python + uv)
# ==========================================
FROM python:3.14-slim

# Install uv by copying the binary from the official image
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Set working directory for the app
WORKDIR /app

# Copy the frontend build artifacts from Stage 1
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

# Switch to backend directory
WORKDIR /app/backend

# Copy backend dependencies definition
COPY backend/pyproject.toml backend/uv.lock ./

# Install dependencies using uv (installs to system since it's a container)
RUN uv sync --frozen --no-dev

# Copy backend source code
COPY backend/ .

# Create directories for persistent data
RUN mkdir -p /app/backend/data /app/backend/media

# Define environment variables
ENV NODE_ENV=production
ENV PYTHONUNBUFFERED=1

# Expose FastAPI port
EXPOSE 8000

# Run Alembic migrations and start Uvicorn with 4 workers to handle CPU-bound PIL processing
CMD uv run alembic upgrade head && uv run uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
