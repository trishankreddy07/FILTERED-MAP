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
    
    # Overpass multi-mirror list to bypass cloud network/IP restrictions (e.g. on Render)
    OVERPASS_MIRRORS = [
        "https://overpass-api.de/api/interpreter",
        "https://lz4.overpass-api.de/api/interpreter",
        "https://z.overpass-api.de/api/interpreter",
        "https://overpass.k3s.celestial.earth/api/interpreter",
        "https://maps.mail.ru/osm/tools/overpass/api/interpreter"
    ]
    
    query = f"""
    [out:json][timeout:60];
    (
      node["amenity"~"hospital|clinic|pharmacy|restaurant|cafe|fast_food|fire_station|police|bus_station"](around:{radius_meters},{lat},{lng});
      node["highway"="bus_stop"](around:{radius_meters},{lat},{lng});
      node["tourism"~"hotel|guest_house|attraction|museum|viewpoint"](around:{radius_meters},{lat},{lng});
      node["historic"](around:{radius_meters},{lat},{lng});
    );
    out center;
    """
    
    headers = {
        'User-Agent': 'GeoPulse-SpatialEngine/2.0 (geopulse-app@render.com)',
        'Accept': 'application/json'
    }
    
    elements = None
    last_error = None
    
    for mirror_url in OVERPASS_MIRRORS:
        try:
            logger.info(f"Querying Overpass mirror: {mirror_url}")
            response = requests.post(mirror_url, data={'data': query}, headers=headers, timeout=25)
            if response.status_code == 200:
                elements = response.json().get("elements", [])
                logger.info(f"Successfully received {len(elements)} elements from {mirror_url}")
                break
            else:
                logger.warning(f"Mirror {mirror_url} returned status {response.status_code}")
        except Exception as e:
            last_error = str(e)
            logger.warning(f"Mirror {mirror_url} failed: {e}")
            continue
            
    if elements is None:
        raise HTTPException(
            status_code=502,
            detail=f"All Overpass mirrors failed or timed out. Last error: {last_error}"
        )
        
    try:
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
            highway = tags.get("highway", "")
            tourism = tags.get("tourism", "")
            historic = tags.get("historic", "")
            
            if amenity in ["hospital", "clinic", "doctors"]:
                category = "Hospital" if amenity == "hospital" else "Clinic"
            elif amenity == "pharmacy":
                category = "Pharmacy"
            elif amenity in ["fire_station", "police", "ambulance_station"]:
                category = "Emergency Services"
            elif amenity in ["restaurant", "cafe", "fast_food"]:
                category = "Restaurant"
            elif tourism in ["hotel", "guest_house", "hostel", "motel"]:
                category = "Hotel & Stays"
            elif amenity == "bus_station" or highway == "bus_stop":
                category = "Bus Stands"
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
                    amenity_type=amenity or highway or tourism or historic,
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

@router.get("/autocomplete")
def autocomplete_places(
    q: str = Query(..., min_length=1, description="Fuzzy search term"),
    limit: int = Query(8, le=20),
    db: Session = Depends(get_db)
):
    """Search-as-you-type Geo-Autocomplete with fuzzy matching."""
    search_pattern = f"%{q.strip()}%"
    places = db.query(Place).filter(
        or_(
            Place.name.ilike(search_pattern),
            Place.address.ilike(search_pattern),
            Place.amenity_type.ilike(search_pattern)
        )
    ).limit(limit).all()

    return [
        {
            "id": p.id,
            "name": p.name,
            "category": p.category,
            "address": p.address,
            "latitude": p.latitude,
            "longitude": p.longitude,
            "rating": p.rating,
            "amenity_type": p.amenity_type
        }
        for p in places
    ]

def seed_dynamic_local_places(lat: float, lng: float, db: Session) -> List[Place]:
    """Auto-generates local sample POIs across all 8 categories when region has 0 venues."""
    sample_definitions = [
        ("Metro Memorial Hospital", "Hospital", 0.007, 0.005, 4.8, "500 Central Ave", "24/7", "+1-555-0101"),
        ("Apollo Multispecialty Hospital", "Hospital", -0.011, 0.008, 4.7, "120 West Parkway", "24/7", "+1-555-0102"),
        ("City Care Trauma Hospital", "Hospital", 0.015, -0.010, 4.6, "88 North Blvd", "24/7", "+1-555-0103"),
        ("CarePoint Family Healthcare Clinic", "Clinic", 0.004, -0.006, 4.5, "75 Medical Plaza", "Mo-Sa 08:00-20:00", "+1-555-0111"),
        ("Sunrise Health & Polyclinic", "Clinic", -0.007, -0.009, 4.4, "210 Sunrise Blvd", "Mo-Sa 09:00-19:00", "+1-555-0112"),
        ("Prime Dental & Polyclinic", "Clinic", 0.010, 0.012, 4.6, "14 Medical Square", "Mo-Fr 08:30-18:30", "+1-555-0113"),
        ("MedPlus 24/7 Care Chemist", "Pharmacy", 0.003, 0.003, 4.7, "34 Market Square", "24/7", "+1-555-0121"),
        ("Apex Guardian Pharmacy", "Pharmacy", -0.005, 0.004, 4.6, "88 Commerce St", "Mo-Su 08:00-23:00", "+1-555-0122"),
        ("Golden Cross Care Medicals", "Pharmacy", 0.008, -0.004, 4.5, "19 West High St", "Mo-Sa 08:00-22:00", "+1-555-0123"),
        ("Sector Fire & Emergency Station 1", "Emergency Services", 0.008, -0.012, 4.9, "900 Emergency Way", "24/7", "+1-555-0131"),
        ("Metro Trauma Dispatch Center", "Emergency Services", -0.012, -0.004, 4.8, "15 Rescue Road", "24/7", "+1-555-0132"),
        ("The Rustic Bistro & Grill", "Restaurant", 0.002, 0.007, 4.7, "18 Culinary Court", "Mo-Su 11:00-23:00", "+1-555-0141"),
        ("Royal Spice Dining & Lounge", "Restaurant", -0.006, 0.010, 4.5, "102 Royal Lane", "Mo-Su 12:00-23:30", "+1-555-0142"),
        ("Blue Horizon Coffee & Eatery", "Restaurant", 0.009, -0.005, 4.6, "45 Lake View Road", "Mo-Su 07:00-22:00", "+1-555-0143"),
        ("Grand Horizon Luxury Hotel & Suites", "Hotel & Stays", 0.005, 0.013, 4.7, "500 Skyline Drive", "24/7", "+1-555-0151"),
        ("Metro Comfort Inn & Suites", "Hotel & Stays", -0.008, -0.011, 4.4, "72 Downtown Loop", "24/7", "+1-555-0152"),
        ("Central Transit Bus Terminal", "Bus Stands", -0.002, 0.002, 4.2, "1 Terminal Way", "24/7", "+1-555-0161"),
        ("Metro Interchange Bus Stop", "Bus Stands", 0.012, 0.007, 4.1, "25 East Station Ave", "24/7", "+1-555-0162"),
        ("Heritage Botanical Gardens", "Tourist Places", 0.014, 0.014, 4.9, "100 Botanical Way", "Mo-Su 06:00-18:30", "+1-555-0171"),
        ("National Arts & Cultural Museum", "Tourist Places", -0.013, 0.012, 4.8, "60 Museum Row", "Tu-Su 10:00-18:00", "+1-555-0172"),
        ("Historic City Plaza & Viewpoint", "Tourist Places", 0.003, -0.015, 4.6, "1 Historic Square", "24/7", "+1-555-0173")
    ]
    created = []
    for name, cat, d_lat, d_lng, rat, addr, hrs, phone in sample_definitions:
        p = Place(
            name=name,
            category=cat,
            latitude=round(lat + d_lat, 6),
            longitude=round(lng + d_lng, 6),
            rating=rat,
            address=f"{addr}, Local Sector",
            amenity_type=cat.lower(),
            raw_data={
                "phone": phone,
                "opening_hours": hrs,
                "emergency_room": True if cat in ["Hospital", "Emergency Services"] else False
            }
        )
        db.add(p)
        created.append(p)
    try:
        db.commit()
        for p in created:
            db.refresh(p)
        logger.info(f"Auto-seeded {len(created)} local category venues around ({lat}, {lng}).")
    except Exception as e:
        db.rollback()
        logger.error(f"Error seeding local venues: {e}")
    return created

@router.get("", response_model=List[PlaceResponse])
def get_places(
    latitude: Optional[float] = Query(None, description="Center latitude"),
    longitude: Optional[float] = Query(None, description="Center longitude"),
    radius_km: Optional[float] = Query(25.0, description="Max radius filter in km"),
    min_lat: Optional[float] = Query(None, description="Bounding box min latitude"),
    max_lat: Optional[float] = Query(None, description="Bounding box max latitude"),
    min_lng: Optional[float] = Query(None, description="Bounding box min longitude"),
    max_lng: Optional[float] = Query(None, description="Bounding box max longitude"),
    category: Optional[str] = Query(None, description="Filter by category"),
    search: Optional[str] = Query(None, description="Search term"),
    min_rating: Optional[float] = Query(0.0, description="Minimum rating"),
    open_now: Optional[bool] = Query(False, description="Filter places open now or with hours"),
    is_24_7: Optional[bool] = Query(False, description="Filter 24/7 emergency facilities"),
    has_phone: Optional[bool] = Query(False, description="Filter places with phone number"),
    limit: int = Query(1000, ge=1, le=5000),
    db: Session = Depends(get_db)
):
    """Retrieve POIs matching filters, radial radius, or bounding box extent."""
    query = db.query(Place)

    # 1. Bounding box spatial filter (if provided)
    if min_lat is not None and max_lat is not None and min_lng is not None and max_lng is not None:
        query = query.filter(
            Place.latitude >= min_lat,
            Place.latitude <= max_lat,
            Place.longitude >= min_lng,
            Place.longitude <= max_lng
        )

    # 2. Normalize category filtering to handle plural/singular equivalents
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
            "Bus Stands": ["Bus Stands", "Bus Stand", "Transit & Bus"],
            "Tourist Places": ["Tourist Places"]
        }
        allowed = cat_map.get(category, [category])
        query = query.filter(Place.category.in_(allowed))

    # 3. 24/7 filter
    if is_24_7:
        query = query.filter(
            or_(
                Place.category.in_(["Hospital", "Hospitals", "Emergency Services"]),
                Place.amenity_type.in_(["hospital", "fire_station", "police"])
            )
        )

    # 4. Text search
    if search:
        search_pattern = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Place.name.ilike(search_pattern),
                Place.address.ilike(search_pattern),
                Place.amenity_type.ilike(search_pattern)
            )
        )

    # 5. Rating filter
    if min_rating > 0:
        query = query.filter(Place.rating >= min_rating)

    results = query.all()

    output = []
    for place in results:
        # Check boolean filters against raw_data if requested
        raw = place.raw_data or {}
        if has_phone and not raw.get("phone"):
            continue
        if open_now:
            # Check if 24/7 or has opening hours defined
            is_emergency = place.category in ["Hospital", "Hospitals", "Emergency Services"]
            if not is_emergency and not raw.get("opening_hours"):
                continue

        dist = None
        if latitude is not None and longitude is not None:
            dist = round(haversine_distance_km(latitude, longitude, place.latitude, place.longitude), 2)
            # If not using bbox, enforce circular radius_km
            if min_lat is None and radius_km is not None and dist > radius_km:
                continue

        item_dict = place.to_dict()
        item_dict["distance_km"] = dist
        output.append(item_dict)

    # If no venues found within active radius and no text search query, auto-generate local fallback POIs across all categories
    if len(output) == 0 and latitude is not None and longitude is not None and not search:
        logger.info(f"0 venues found near ({latitude}, {longitude}). Auto-seeding category fallback POIs...")
        new_places = seed_dynamic_local_places(latitude, longitude, db)
        for place in new_places:
            if category and category != "All":
                cat_map = {
                    "Hospital": ["Hospital", "Hospitals"],
                    "Clinic": ["Clinic", "Clinics"],
                    "Pharmacy": ["Pharmacy", "Pharmacies"],
                    "Emergency Services": ["Emergency Services"],
                    "Restaurant": ["Restaurant", "Dining & Cafe", "Dining & Cafes"],
                    "Hotel & Stays": ["Hotel & Stays", "Hotels & Stays"],
                    "Bus Stands": ["Bus Stands", "Bus Stand", "Transit & Bus"],
                    "Tourist Places": ["Tourist Places"]
                }
                allowed = cat_map.get(category, [category])
                if place.category not in allowed:
                    continue

            dist = round(haversine_distance_km(latitude, longitude, place.latitude, place.longitude), 2)
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
