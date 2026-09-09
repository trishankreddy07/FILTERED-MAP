import json
import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import engine, Base, SessionLocal
from app.db.models import Place
from app.api.routes import health, places, analytics

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def seed_initial_data(db: Session):
    """Seed sample spatial POI data if the database table is empty."""
    count = db.query(Place).count()
    if count == 0:
        logger.info("Initializing GeoPulse database with initial sample POIs...")
        seed_path = os.path.join(os.path.dirname(__file__), "..", "..", "data", "raw", "seed_places.json")
        if not os.path.exists(seed_path):
            seed_path = os.path.join(os.path.dirname(__file__), "..", "data", "raw", "seed_places.json")
        if os.path.exists(seed_path):
            with open(seed_path, "r", encoding="utf-8") as f:
                records = json.load(f)
                for item in records:
                    p = Place(
                        name=item["name"],
                        category=item["category"],
                        latitude=item["latitude"],
                        longitude=item["longitude"],
                        address=item.get("address"),
                        rating=item.get("rating", 4.5),
                        amenity_type=item.get("amenity_type"),
                        raw_data=item.get("raw_data", {})
                    )
                    db.add(p)
                db.commit()
                logger.info(f"Successfully seeded {len(records)} spatial POI records!")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup logic
    logger.info("Starting GeoPulse Spatial Backend...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_initial_data(db)
    finally:
        db.close()
    yield
    # Shutdown logic
    logger.info("Shutting down GeoPulse Spatial Backend...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    description="Location Intelligence & Spatial Analytics Platform API Engine",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(health.router)
app.include_router(places.router, prefix=settings.API_V1_STR)
app.include_router(analytics.router, prefix=settings.API_V1_STR)

# Mount frontend static distribution if present
dist_candidates = [
    os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist")),
    os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")),
    os.path.abspath(os.path.join(os.path.dirname(__file__), "dist")),
    "/app/frontend/dist"
]

frontend_dist = next((p for p in dist_candidates if os.path.exists(p) and os.path.isdir(p)), None)

if frontend_dist:
    assets_dir = os.path.join(frontend_dist, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        if full_path.startswith("api") or full_path.startswith("docs") or full_path.startswith("health") or full_path == "openapi.json":
            return None
        file_path = os.path.join(frontend_dist, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(frontend_dist, "index.html"))
else:
    @app.get("/")
    def root():
        return {
            "title": "GeoPulse Spatial Engine API",
            "version": "1.0.0",
            "docs": "/docs",
            "health": "/health"
        }
