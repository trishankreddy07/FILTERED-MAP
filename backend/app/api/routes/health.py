from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.session import get_db, check_spatial_support
from app.db.models import Place

router = APIRouter(tags=["Health"])

@router.get("/health")
def health_check(db: Session = Depends(get_db)):
    spatial_info = check_spatial_support()
    places_count = db.query(func.count(Place.id)).scalar() or 0
    categories = db.query(Place.category, func.count(Place.id)).group_by(Place.category).all()
    
    category_summary = {cat: count for cat, count in categories} if categories else {}

    return {
        "status": "online",
        "service": "GeoPulse Spatial Engine",
        "database": spatial_info,
        "total_records": places_count,
        "category_breakdown": category_summary
    }
