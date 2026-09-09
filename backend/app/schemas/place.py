from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class PlaceBase(BaseModel):
    name: str = Field(..., example="St. Jude Central Hospital")
    category: str = Field(..., example="Hospital")
    latitude: float = Field(..., example=37.7749)
    longitude: float = Field(..., example=-122.4194)
    address: Optional[str] = Field(None, example="500 Van Ness Ave, San Francisco, CA")
    rating: Optional[float] = Field(4.0, ge=0.0, le=5.0)
    amenity_type: Optional[str] = Field(None, example="healthcare")
    raw_data: Optional[Dict[str, Any]] = Field(default_factory=dict)

class PlaceCreate(PlaceBase):
    pass

class PlaceResponse(PlaceBase):
    id: int
    distance_km: Optional[float] = None

    class Config:
        from_attributes = True

# GeoJSON Schemas
class GeoJSONGeometry(BaseModel):
    type: str = "Point"
    coordinates: List[float] # [longitude, latitude]

class GeoJSONFeature(BaseModel):
    type: str = "Feature"
    geometry: GeoJSONGeometry
    properties: Dict[str, Any]

class GeoJSONFeatureCollection(BaseModel):
    type: str = "FeatureCollection"
    features: List[GeoJSONFeature]

# Spatial Query Schemas
class SpatialQueryParams(BaseModel):
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    radius_km: Optional[float] = Field(default=5.0, description="Search radius in kilometers")
    category: Optional[str] = None
    search: Optional[str] = None
    min_rating: Optional[float] = 0.0
    limit: Optional[int] = 100

# Analytics Schemas
class DensityAnalyticsRequest(BaseModel):
    min_lat: float = Field(..., example=37.70)
    max_lat: float = Field(..., example=37.85)
    min_lng: float = Field(..., example=-122.50)
    max_lng: float = Field(..., example=-122.35)
    grid_size: int = Field(default=10, description="Grid dimension N x N")
    category: Optional[str] = None

class GridCellDensity(BaseModel):
    cell_id: str
    bounds: List[List[float]] # [[south, west], [north, east]]
    center: List[float] # [lat, lng]
    count: int
    density_level: str # 'low', 'medium', 'high', 'very_high'
    top_categories: Dict[str, int]

class DensityAnalyticsResponse(BaseModel):
    total_places: int
    grid_rows: int
    grid_cols: int
    max_cell_count: int
    cells: List[GridCellDensity]

class IsochroneRequest(BaseModel):
    latitude: float = Field(..., example=37.7749)
    longitude: float = Field(..., example=-122.4194)
    buffer_radii_km: List[float] = Field(default=[1.0, 3.0, 5.0], description="Radius rings in kilometers")

class IsochroneRingDetail(BaseModel):
    radius_km: float
    est_travel_time_mins: float # Estimated travel time by road
    poi_count: int
    categories: Dict[str, int]
    coverage_area_sq_km: float

class IsochroneResponse(BaseModel):
    center: List[float]
    rings: List[IsochroneRingDetail]

class ScoreAnalyticsRequest(BaseModel):
    latitude: float = Field(..., example=37.7749)
    longitude: float = Field(..., example=-122.4194)
    weight_healthcare: float = Field(default=0.4, description="Weight for Hospitals & Clinics (0-1)")
    weight_emergency: float = Field(default=0.3, description="Weight for Emergency Services (0-1)")
    weight_pharmacy: float = Field(default=0.2, description="Weight for Pharmacies (0-1)")
    weight_dining: float = Field(default=0.1, description="Weight for Restaurants (0-1)")

class ScoreAnalyticsResponse(BaseModel):
    location: List[float]
    overall_score: float # 0 to 100
    score_breakdown: Dict[str, float]
    nearby_summary: Dict[str, int]
    assessment_tier: str # 'Excellent Accessibility', 'Moderate Coverage', 'Underserved Zone'

class OSMDataIngestRequest(BaseModel):
    city_name: str = Field(default="San Francisco", example="San Francisco")
    category_filter: Optional[str] = None
