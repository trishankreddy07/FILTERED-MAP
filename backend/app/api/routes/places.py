import math
import logging
import requests
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.db.session import get_db
from app.db.models import Place
from app.schemas.place import (
    PlaceResponse, PlaceCreate, GeoJSONFeatureCollection,
    GeoJSONFeature, GeoJSONGeometry
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/places", tags=["Places & POIs"])

def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the great-circle distance between two points on the Earth in kilometers."""
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

@router.post("/sync-osm")
def sync_osm_data(
    lat: float = Query(..., description="Latitude of active map center"),
    lng: float = Query(..., description="Longitude of active map center"),
    radius_km: float = Query(25.0, description="Radius in km to scan"),
    db: Session = Depends(get_db)
):
    """
    Robust Overpass API sync endpoint with strict timeout and safe category mapping.
    """
    radius_meters = int(radius_km * 1000)
    
    # Overpass QL - Optimized to prevent 504 Timeouts on 50km radius
    overpass_url = "https://overpass-api.de/api/interpreter"
    query = f"""
    [out:json][timeout:90];
    (
      node["amenity"~"hospital|clinic|pharmacy|restaurant|cafe|fast_food|fire_station|police"](around:{radius_meters},{lat},{lng});
      node["tourism"~"hotel|guest_house|attraction|museum|viewpoint"](around:{radius_meters},{lat},{lng});
      node["historic"](around:{radius_meters},{lat},{lng});
    );
    out center;
    """
    
    try:
        response = requests.post(overpass_url, data={'data': query}, timeout=95)
        response.raise_for_status()
        elements = response.json().get("elements", [])
        
        added_count = 0
        for el in elements:
            tags = el.get("tags", {})
            name = tags.get("name")
            if not name:
                continue # Skip unnamed places
                
            lat_val = el.get("lat") or el.get("center", {}).get("lat")
            lon_val = el.get("lon") or el.get("center", {}).get("lon")
            if not lat_val or not lon_val:
                continue
            
            # Map OSM tags to categories
            category = "Other"
            amenity = tags.get("amenity", "")
            tourism = tags.get("tourism", "")
            historic = tags.get("historic", "")
            
            if amenity in ["hospital", "clinic", "doctors"]:
                category = "Hospitals"
            elif amenity == "pharmacy":
                category = "Pharmacies"
            elif amenity in ["fire_station", "police", "ambulance_station"]:
                category = "Emergency Services"
            elif amenity in ["restaurant", "cafe", "fast_food"]:
                category = "Dining & Cafe"
            elif tourism in ["hotel", "guest_house", "hostel", "motel"]:
                category = "Hotels & Stays"
            elif tourism in ["attraction", "museum", "viewpoint", "theme_park"] or historic:
                category = "Tourist Places"
            
            # Check if exists to avoid duplicates
            existing = db.query(Place).filter(
                Place.latitude == lat_val,
                Place.longitude == lon_val
            ).first()

            if not existing:
                new_place = Place(
                    name=name,
                    category=category,
                    latitude=lat_val,
                    longitude=lon_val,
                    rating=4.0,
                    amenity_type=amenity or tourism or historic,
                    address=tags.get("addr:street", tags.get("addr:city", f"Near {name}")),
                    raw_data={
                        "phone": tags.get("phone") or tags.get("contact:phone"),
                        "opening_hours": tags.get("opening_hours"),
                        "website": tags.get("website"),
                        "osm_id": el.get("id")
                    }
                )
                db.add(new_place)
                added_count += 1
                
        db.commit()
        logger.info(f"Successfully synced {added_count} locations from Overpass API.")
        return {"message": f"Successfully synced {added_count} new locations from OpenStreetMap.", "added": added_count}
        
    except requests.exceptions.RequestException as e:
        logger.error(f"Failed to fetch from OpenStreetMap: {e}")
        raise HTTPException(status_code=502, detail=f"Failed to fetch from OpenStreetMap: {str(e)}")
    except Exception as e:
        db.rollback()
        logger.error(f"Database error during OSM sync: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# Alias for sync-live to guarantee backward compatibility
@router.post("/sync-live")
def sync_live_alias(
    latitude: float = Query(..., description="Latitude"),
    longitude: float = Query(..., description="Longitude"),
    radius_km: float = Query(25.0, description="Radius in km"),
    db: Session = Depends(get_db)
):
    return sync_osm_data(lat=latitude, lng=longitude, radius_km=radius_km, db=db)

@router.get("", response_model=List[PlaceResponse])
def get_places(
    latitude: Optional[float] = Query(None, description="Center latitude"),
    longitude: Optional[float] = Query(None, description="Center longitude"),
    radius_km: Optional[float] = Query(25.0, description="Max radius filter in km"),
    category: Optional[str] = Query(None, description="Filter by category"),
    search: Optional[str] = Query(None, description="Search term"),
    min_rating: Optional[float] = Query(0.0, description="Minimum rating"),
    limit: int = Query(1000, ge=1, le=5000),
    db: Session = Depends(get_db)
):
    """Retrieve POIs matching filters and radius."""
    query = db.query(Place)

    # Normalize category filtering to handle plural/singular equivalents
    if category and category != "All":
        cat_map = {
            "Hospital": ["Hospital", "Hospitals"],
            "Hospitals": ["Hospital", "Hospitals"],
            "Clinic": ["Clinic", "Clinics", "Hospital", "Hospitals"],
            "Clinics": ["Clinic", "Clinics", "Hospital", "Hospitals"],
            "Pharmacy": ["Pharmacy", "Pharmacies"],
            "Pharmacies": ["Pharmacy", "Pharmacies"],
            "Emergency Services": ["Emergency Services"],
            "Restaurant": ["Restaurant", "Dining & Cafe", "Dining & Cafes"],
            "Dining & Cafe": ["Restaurant", "Dining & Cafe", "Dining & Cafes"],
            "Dining & Cafes": ["Restaurant", "Dining & Cafe", "Dining & Cafes"],
            "Hotel & Stays": ["Hotel & Stays", "Hotels & Stays"],
            "Hotels & Stays": ["Hotel & Stays", "Hotels & Stays"],
            "Tourist Places": ["Tourist Places"]
        }
        allowed = cat_map.get(category, [category])
        query = query.filter(Place.category.in_(allowed))

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
    place = db.query(Place).filter(Place.id == place_id).first()
    if not place:
        raise HTTPException(status_code=404, detail="Place not found")
    return place.to_dict()
