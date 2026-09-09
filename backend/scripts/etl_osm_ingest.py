import os
import sys
import json
import logging
import requests
from typing import List, Dict, Any, Optional

# Ensure backend path is in python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.db.session import SessionLocal, engine, Base
from app.db.models import Place

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger("ETL_OSM_Ingest")

OVERPASS_URL = "https://overpass-api.de/api/interpreter"

# Comprehensive mapping of OSM tags to GeoPulse categories
AMENITY_CATEGORY_MAP = {
    # Healthcare
    "hospital": "Hospital",
    "clinic": "Clinic",
    "doctors": "Clinic",
    "dentist": "Clinic",
    "pharmacy": "Pharmacy",
    "health_post": "Clinic",
    
    # Dining & Food
    "restaurant": "Restaurant",
    "cafe": "Restaurant",
    "fast_food": "Restaurant",
    "food_court": "Restaurant",
    "bar": "Restaurant",
    "pub": "Restaurant",
    
    # Hospitality & Stays
    "hotel": "Hotel & Stays",
    "guest_house": "Hotel & Stays",
    "hostel": "Hotel & Stays",
    "motel": "Hotel & Stays",
    "lodging": "Hotel & Stays",
    
    # Tourist Places & Attractions
    "attraction": "Tourist Places",
    "museum": "Tourist Places",
    "viewpoint": "Tourist Places",
    "theme_park": "Tourist Places",
    "gallery": "Tourist Places",
    "zoo": "Tourist Places",
    "aquarium": "Tourist Places",
    "artwork": "Tourist Places",
    "monument": "Tourist Places",
    "memorial": "Tourist Places",
    "castle": "Tourist Places",
    "archaeological_site": "Tourist Places",
    "ruins": "Tourist Places",
    
    # Emergency Services
    "fire_station": "Emergency Services",
    "police": "Emergency Services",
    "ambulance_station": "Emergency Services"
}

def fetch_osm_around(lat: float, lon: float, radius_m: int = 25000) -> List[Dict[str, Any]]:
    """
    Fetch comprehensive POIs (nodes & ways) around given coordinates within radius in meters.
    """
    radius_meters = int(min(max(radius_m, 1000), 100000)) # Clamped between 1,000m and 100,000m
    logger.info(f"Querying Overpass API for center: ({lat}, {lon}) with radius: {radius_meters}m...")

    overpass_query = f"""
    [out:json][timeout:50];
    (
      // Healthcare
      node["amenity"~"hospital|clinic|pharmacy|doctors|dentist"](around:{radius_meters},{lat},{lon});
      way["amenity"~"hospital|clinic|pharmacy|doctors|dentist"](around:{radius_meters},{lat},{lon});
      node["healthcare"](around:{radius_meters},{lat},{lon});
      way["healthcare"](around:{radius_meters},{lat},{lon});

      // Dining & Food
      node["amenity"~"restaurant|cafe|fast_food|food_court|bar|pub"](around:{radius_meters},{lat},{lon});
      way["amenity"~"restaurant|cafe|fast_food|food_court|bar|pub"](around:{radius_meters},{lat},{lon});

      // Hospitality & Hotels
      node["tourism"~"hotel|guest_house|hostel|motel"](around:{radius_meters},{lat},{lon});
      way["tourism"~"hotel|guest_house|hostel|motel"](around:{radius_meters},{lat},{lon});

      // Tourist Places & Cultural Heritage
      node["tourism"~"attraction|museum|viewpoint|theme_park|gallery|zoo|aquarium"](around:{radius_meters},{lat},{lon});
      way["tourism"~"attraction|museum|viewpoint|theme_park|gallery|zoo|aquarium"](around:{radius_meters},{lat},{lon});
      node["historic"](around:{radius_meters},{lat},{lon});
      way["historic"](around:{radius_meters},{lat},{lon});

      // Emergency Services
      node["amenity"~"fire_station|police|ambulance_station"](around:{radius_meters},{lat},{lon});
      way["amenity"~"fire_station|police|ambulance_station"](around:{radius_meters},{lat},{lon});
    );
    out center;
    """

    try:
        response = requests.post(OVERPASS_URL, data={"data": overpass_query}, timeout=45)
        response.raise_for_status()
        data = response.json()
        elements = data.get("elements", [])
        logger.info(f"Received {len(elements)} raw elements from Overpass API.")
        return elements
    except Exception as e:
        logger.error(f"Error querying Overpass API: {e}")
        return []

def transform_osm_element(element: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Transform raw OSM node/way element into GeoPulse Place object."""
    tags = element.get("tags", {})
    name = tags.get("name") or tags.get("name:en")
    
    amenity = tags.get("amenity", "").lower()
    tourism = tags.get("tourism", "").lower()
    historic = tags.get("historic", "").lower()
    healthcare = tags.get("healthcare", "").lower()

    category = None
    if historic or tourism in ["attraction", "museum", "viewpoint", "theme_park", "gallery", "zoo", "aquarium", "artwork"]:
        category = "Tourist Places"
    elif tourism in ["hotel", "guest_house", "hostel", "motel", "lodging"]:
        category = "Hotel & Stays"
    elif amenity in AMENITY_CATEGORY_MAP:
        category = AMENITY_CATEGORY_MAP[amenity]
    elif healthcare:
        category = "Hospital" if healthcare == "hospital" else "Clinic"

    if not category:
        return None

    if not name:
        name = f"{category} ({historic or tourism or amenity or 'Local Venue'})"

    # Extract coordinates (handles both node lat/lon and way center lat/lon)
    lat = element.get("lat") or element.get("center", {}).get("lat")
    lon = element.get("lon") or element.get("center", {}).get("lon")
    if not lat or not lon:
        return None

    # Format address
    addr_parts = [
        tags.get("addr:housenumber", ""),
        tags.get("addr:street", ""),
        tags.get("addr:suburb", ""),
        tags.get("addr:city", tags.get("addr:county", ""))
    ]
    formatted_address = ", ".join([p for p in addr_parts if p.strip()]) or f"Near {name}"

    # Generate deterministic realistic rating
    hash_val = sum(ord(c) for c in name)
    rating = round(4.0 + (hash_val % 10) * 0.1, 1)

    return {
        "name": name,
        "category": category,
        "latitude": float(lat),
        "longitude": float(lon),
        "address": formatted_address,
        "rating": rating,
        "amenity_type": historic or tourism or amenity or healthcare,
        "raw_data": {
            "osm_id": element.get("id"),
            "osm_type": element.get("type"),
            "phone": tags.get("phone") or tags.get("contact:phone"),
            "opening_hours": tags.get("opening_hours"),
            "website": tags.get("website"),
            "cuisine": tags.get("cuisine"),
            "historic": tags.get("historic"),
            "stars": tags.get("stars"),
            "wheelchair": tags.get("wheelchair")
        }
    }

def ingest_osm_for_coordinates(lat: float, lon: float, radius_m: int = 25000, db: SessionLocal = None) -> int:
    """Extract and load live OSM POIs for a target coordinate."""
    close_db = False
    if db is None:
        Base.metadata.create_all(bind=engine)
        db = SessionLocal()
        close_db = True

    try:
        raw_elements = fetch_osm_around(lat, lon, radius_m)
        if not raw_elements:
            return 0

        inserted_count = 0
        for elem in raw_elements:
            rec = transform_osm_element(elem)
            if not rec:
                continue

            # Check if place already exists
            existing = db.query(Place).filter(
                Place.name == rec["name"],
                Place.latitude == rec["latitude"],
                Place.longitude == rec["longitude"]
            ).first()

            if not existing:
                p = Place(
                    name=rec["name"],
                    category=rec["category"],
                    latitude=rec["latitude"],
                    longitude=rec["longitude"],
                    address=rec["address"],
                    rating=rec["rating"],
                    amenity_type=rec["amenity_type"],
                    raw_data=rec["raw_data"]
                )
                db.add(p)
                inserted_count += 1

        db.commit()
        logger.info(f"Successfully ingested {inserted_count} new POIs for ({lat}, {lon}) with radius {radius_m}m")
        return inserted_count
    except Exception as e:
        logger.error(f"Error during OSM ingestion: {e}")
        db.rollback()
        return 0
    finally:
        if close_db:
            db.close()

if __name__ == "__main__":
    logger.info("Executing sample Overpass ingest for San Francisco...")
    ingest_osm_for_coordinates(37.7749, -122.4194, 25000)
