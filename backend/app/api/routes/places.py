import math
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.db.session import get_db
from app.db.models import Place
from app.schemas.place import (
    PlaceResponse, PlaceCreate, GeoJSONFeatureCollection,
    GeoJSONFeature, GeoJSONGeometry, OSMDataIngestRequest
)

router = APIRouter(prefix="/places", tags=["Places & POIs"])

def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the great-circle distance between two points on the Earth in kilometers."""
    R = 6371.0 # Earth's radius in kilometers
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

@router.get("", response_model=List[PlaceResponse])
def get_places(
    latitude: Optional[float] = Query(None, description="Center latitude for spatial radius query"),
    longitude: Optional[float] = Query(None, description="Center longitude for spatial radius query"),
    radius_km: Optional[float] = Query(10.0, description="Max radius filter in km"),
    category: Optional[str] = Query(None, description="Filter by category (Restaurant, Hospital, Clinic, Pharmacy, Emergency Services)"),
    search: Optional[str] = Query(None, description="Text search by place name or address"),
    min_rating: Optional[float] = Query(0.0, description="Filter by minimum rating (0 to 5)"),
    limit: int = Query(200, ge=1, le=1000),
    db: Session = Depends(get_db)
):
    """Retrieve POIs with optional category, search, min rating, and distance spatial filtering."""
    query = db.query(Place)

    if category and category != "All":
        query = query.filter(Place.category == category)

    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                Place.name.ilike(search_pattern),
                Place.address.ilike(search_pattern),
                Place.amenity_type.ilike(search_pattern)
            )
        )

    if min_rating > 0:
        query = query.filter(Place.rating >= min_rating)

    results = query.all()

    # Apply spatial distance calculations & radius filtering
    output = []
    for place in results:
        dist = None
        if latitude is not None and longitude is not None:
            dist = round(haversine_distance_km(latitude, longitude, place.latitude, place.longitude), 2)
            if dist > radius_km:
                continue

        item_dict = place.to_dict()
        item_dict["distance_km"] = dist
        output.append(item_dict)

    # Sort by distance if center location provided, else by rating
    if latitude is not None and longitude is not None:
        output.sort(key=lambda x: x["distance_km"] if x["distance_km"] is not None else 99999)
    else:
        output.sort(key=lambda x: x["rating"] or 0, reverse=True)

    return output[:limit]

@router.get("/geojson", response_model=GeoJSONFeatureCollection)
def get_places_geojson(
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Return POI places formatted as a standard GeoJSON FeatureCollection."""
    query = db.query(Place)
    if category and category != "All":
        query = query.filter(Place.category == category)
    if search:
        query = query.filter(Place.name.ilike(f"%{search}%"))

    places = query.all()
    features = []
    for p in places:
        features.append(GeoJSONFeature(
            type="Feature",
            geometry=GeoJSONGeometry(
                type="Point",
                coordinates=[p.longitude, p.latitude]
            ),
            properties={
                "id": p.id,
                "name": p.name,
                "category": p.category,
                "rating": p.rating,
                "address": p.address,
                "amenity_type": p.amenity_type,
                "raw_data": p.raw_data or {}
            }
        ))
    return GeoJSONFeatureCollection(features=features)

@router.post("", response_model=PlaceResponse)
def create_place(place_in: PlaceCreate, db: Session = Depends(get_db)):
    """Add a new custom POI location."""
    db_place = Place(
        name=place_in.name,
        category=place_in.category,
        latitude=place_in.latitude,
        longitude=place_in.longitude,
        address=place_in.address,
        rating=place_in.rating or 4.0,
        amenity_type=place_in.amenity_type,
        raw_data=place_in.raw_data or {}
    )
    db.add(db_place)
    db.commit()
    db.refresh(db_place)
    return db_place.to_dict()

@router.get("/{place_id}", response_model=PlaceResponse)
def get_place_detail(place_id: int, db: Session = Depends(get_db)):
    """Get single POI details."""
    place = db.query(Place).filter(Place.id == place_id).first()
    if not place:
        raise HTTPException(status_code=404, detail="Place not found")
    return place.to_dict()
