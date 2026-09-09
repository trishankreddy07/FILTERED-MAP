import os
import sys
import json
import logging
import requests
from typing import List, Dict, Any

# Ensure backend path is in python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.db.session import SessionLocal, engine, Base
from app.db.models import Place

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger("ETL_OSM_Ingest")

OVERPASS_URL = "https://overpass-api.de/api/interpreter"

# Mapping OSM tags to GeoPulse categories
AMENITY_CATEGORY_MAP = {
    "hospital": "Hospital",
    "clinic": "Clinic",
    "doctors": "Clinic",
    "pharmacy": "Pharmacy",
    "fire_station": "Emergency Services",
    "police": "Emergency Services",
    "ambulance_station": "Emergency Services",
    "restaurant": "Restaurant",
    "cafe": "Restaurant",
    "fast_food": "Restaurant"
}

def fetch_osm_pois(bbox: tuple = (37.70, -122.52, 37.82, -122.35)) -> List[Dict[str, Any]]:
    """
    Fetch POI node elements from Overpass API within specified bounding box (min_lat, min_lon, max_lat, max_lon).
    """
    min_lat, min_lon, max_lat, max_lon = bbox
    logger.info(f"Querying Overpass API for bounding box: {bbox}...")

    overpass_query = f"""
    [out:json][timeout:25];
    (
      node["amenity"~"hospital|clinic|doctors|pharmacy|fire_station|police|restaurant|cafe"]({min_lat},{min_lon},{max_lat},{max_lon});
    );
    out body;
    """

    try:
        response = requests.post(OVERPASS_URL, data={"data": overpass_query}, timeout=30)
        response.raise_for_status()
        data = response.json()
        elements = data.get("elements", [])
        logger.info(f"Received {len(elements)} raw elements from OpenStreetMap Overpass API.")
        return elements
    except Exception as e:
        logger.error(f"Error requesting Overpass API: {e}")
        return []

def transform_osm_element(element: Dict[str, Any]) -> Dict[str, Any] or None:
    """Transform raw OSM node element into GeoPulse Place object structure."""
    tags = element.get("tags", {})
    name = tags.get("name") or tags.get("name:en")
    
    amenity = tags.get("amenity", "").lower()
    category = AMENITY_CATEGORY_MAP.get(amenity)

    if not category or not name:
        return None

    lat = element.get("lat")
    lon = element.get("lon")
    if not lat or not lon:
        return None

    # Format address string from OSM tags
    addr_parts = [
        tags.get("addr:housenumber", ""),
        tags.get("addr:street", ""),
        tags.get("addr:suburb", ""),
        tags.get("addr:city", tags.get("addr:county", ""))
    ]
    formatted_address = ", ".join([p for p in addr_parts if p.strip()]) or f"{category} on {tags.get('addr:street', 'Local Street')}"

    return {
        "name": name,
        "category": category,
        "latitude": float(lat),
        "longitude": float(lon),
        "address": formatted_address,
        "rating": round(4.0 + (hash(name) % 10) * 0.1, 1), # Realistic pseudo rating
        "amenity_type": amenity,
        "raw_data": {
            "osm_id": element.get("id"),
            "phone": tags.get("phone") or tags.get("contact:phone"),
            "opening_hours": tags.get("opening_hours"),
            "website": tags.get("website"),
            "wheelchair": tags.get("wheelchair")
        }
    }

def run_etl_pipeline(bbox=(37.70, -122.52, 37.82, -122.35)):
    """Extract, Transform, and Load OSM spatial data into database."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        raw_elements = fetch_osm_pois(bbox)
        if not raw_elements:
            logger.warning("No OSM elements retrieved. Exiting ETL pipeline.")
            return

        inserted_count = 0
        updated_count = 0

        for elem in raw_elements:
            record = transform_osm_element(elem)
            if not record:
                continue

            # Check if POI already exists by name & coords
            existing = db.query(Place).filter(
                Place.name == record["name"],
                Place.latitude == record["latitude"],
                Place.longitude == record["longitude"]
            ).first()

            if existing:
                existing.address = record["address"]
                existing.raw_data = record["raw_data"]
                updated_count += 1
            else:
                p = Place(
                    name=record["name"],
                    category=record["category"],
                    latitude=record["latitude"],
                    longitude=record["longitude"],
                    address=record["address"],
                    rating=record["rating"],
                    amenity_type=record["amenity_type"],
                    raw_data=record["raw_data"]
                )
                db.add(p)
                inserted_count += 1

        db.commit()
        logger.info(f"ETL Execution Summary -> Inserted: {inserted_count}, Updated: {updated_count}")

    except Exception as e:
        logger.error(f"ETL pipeline failed: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    logger.info("Starting OpenStreetMap spatial ETL ingest pipeline...")
    run_etl_pipeline()
