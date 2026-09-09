from sqlalchemy import Column, Integer, String, Float, JSON, DateTime, func
from app.db.session import Base, is_sqlite

# Try importing GeoAlchemy2 for PostGIS integration if available
try:
    from geoalchemy2 import Geometry
    HAS_GEOALCHEMY = True
except ImportError:
    HAS_GEOALCHEMY = False

class Place(Base):
    __tablename__ = "places"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    category = Column(String(100), nullable=False, index=True)
    latitude = Column(Float, nullable=False, index=True)
    longitude = Column(Float, nullable=False, index=True)
    address = Column(String(500), nullable=True)
    rating = Column(Float, default=4.0)
    amenity_type = Column(String(100), nullable=True)
    raw_data = Column(JSON, nullable=True, default={})
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Optional PostGIS spatial geometry column
    if HAS_GEOALCHEMY and not is_sqlite:
        geom = Column(Geometry(geometry_type='POINT', srid=4326), nullable=True)

    def __init__(self, **kwargs):
        if "lat" in kwargs and "latitude" not in kwargs:
            kwargs["latitude"] = kwargs.pop("lat")
        if "lng" in kwargs and "longitude" not in kwargs:
            kwargs["longitude"] = kwargs.pop("lng")
        super().__init__(**kwargs)

    @property
    def lat(self):
        return self.latitude
    
    @lat.setter
    def lat(self, value):
        self.latitude = value

    @property
    def lng(self):
        return self.longitude

    @lng.setter
    def lng(self, value):
        self.longitude = value

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "category": self.category,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "lat": self.latitude,
            "lng": self.longitude,
            "address": self.address,
            "rating": self.rating,
            "amenity_type": self.amenity_type,
            "raw_data": self.raw_data or {},
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
