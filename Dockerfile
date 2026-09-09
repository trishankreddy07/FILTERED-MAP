# -------------------------------------------------------------
# Stage 1: Build React Frontend Assets
# -------------------------------------------------------------
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# -------------------------------------------------------------
# Stage 2: Production Python & Geospatial FastAPI Backend
# -------------------------------------------------------------
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for geospatial libraries (GDAL, GEOS, PROJ)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgdal-dev \
    gdal-bin \
    libgeos-dev \
    libproj-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy Backend Application & Data
COPY backend/ ./backend/
COPY data/ ./data/

# Copy compiled Frontend assets from Stage 1
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Set Python Path to include backend
ENV PYTHONPATH=/app/backend
WORKDIR /app/backend

# Default fallback port if not specified by Render / Cloud host
ENV PORT=8000
EXPOSE 8000

# Start server dynamically bound to $PORT provided by Render
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
