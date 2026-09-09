from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

# Determine database driver
is_sqlite = settings.DATABASE_URL.startswith("sqlite")

connect_args = {"check_same_thread": False} if is_sqlite else {}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def check_spatial_support() -> dict:
    """Check if PostGIS spatial extension is available or running under SQLite fallback mode."""
    if is_sqlite:
        return {"mode": "SQLite (Haversine Spatial Math Fallback)", "postgis": False}
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT PostGIS_Version()")).scalar()
            return {"mode": "PostgreSQL with PostGIS", "postgis": True, "version": result}
    except Exception as e:
        logger.warning(f"PostGIS check failed: {e}. Defaulting to standard query mode.")
        return {"mode": "PostgreSQL (Standard Math Fallback)", "postgis": False, "error": str(e)}
