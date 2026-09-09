import math
from typing import Dict, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models import Place
from app.api.routes.places import haversine_distance_km
from app.schemas.place import (
    DensityAnalyticsRequest, DensityAnalyticsResponse, GridCellDensity,
    IsochroneRequest, IsochroneResponse, IsochroneRingDetail,
    ScoreAnalyticsRequest, ScoreAnalyticsResponse
)

router = APIRouter(prefix="/analytics", tags=["Spatial Analytics Engine"])

@router.post("/density", response_model=DensityAnalyticsResponse)
def calculate_spatial_density(
    req: DensityAnalyticsRequest,
    db: Session = Depends(get_db)
):
    """
    Compute spatial point density and grid aggregation matrix across specified bounding box boundaries.
    Divides the extent into a grid_size x grid_size matrix and aggregates POI distribution counts.
    """
    if req.min_lat >= req.max_lat or req.min_lng >= req.max_lng:
        raise HTTPException(status_code=400, detail="Invalid bounding box coordinates (min must be less than max)")

    query = db.query(Place).filter(
        Place.latitude >= req.min_lat,
        Place.latitude <= req.max_lat,
        Place.longitude >= req.min_lng,
        Place.longitude <= req.max_lng
    )

    if req.category and req.category != "All":
        query = query.filter(Place.category == req.category)

    places = query.all()

    grid_dim = max(2, min(req.grid_size, 30))
    lat_step = (req.max_lat - req.min_lat) / grid_dim
    lng_step = (req.max_lng - req.min_lng) / grid_dim

    # Initialize grid buckets
    grid_cells: Dict[str, dict] = {}
    for r in range(grid_dim):
        for c in range(grid_dim):
            cell_id = f"cell_{r}_{c}"
            south = req.min_lat + r * lat_step
            north = south + lat_step
            west = req.min_lng + c * lng_step
            east = west + lng_step
            grid_cells[cell_id] = {
                "cell_id": cell_id,
                "bounds": [[round(south, 5), round(west, 5)], [round(north, 5), round(east, 5)]],
                "center": [round((south + north) / 2, 5), round((west + east) / 2, 5)],
                "count": 0,
                "categories": {}
            }

    # Bin places into grid cells
    for p in places:
        r = int((p.latitude - req.min_lat) / lat_step)
        c = int((p.longitude - req.min_lng) / lng_step)
        r = min(r, grid_dim - 1)
        c = min(c, grid_dim - 1)
        cell_id = f"cell_{r}_{c}"
        if cell_id in grid_cells:
            grid_cells[cell_id]["count"] += 1
            cat = p.category
            grid_cells[cell_id]["categories"][cat] = grid_cells[cell_id]["categories"].get(cat, 0) + 1

    max_count = max([cell["count"] for cell in grid_cells.values()], default=1)

    result_cells: List[GridCellDensity] = []
    for cell_id, cell in grid_cells.items():
        cnt = cell["count"]
        # Classify density level
        if cnt == 0:
            level = "none"
        elif cnt <= max_count * 0.25:
            level = "low"
        elif cnt <= max_count * 0.60:
            level = "medium"
        elif cnt <= max_count * 0.85:
            level = "high"
        else:
            level = "very_high"

        result_cells.append(GridCellDensity(
            cell_id=cell["cell_id"],
            bounds=cell["bounds"],
            center=cell["center"],
            count=cnt,
            density_level=level,
            top_categories=cell["categories"]
        ))

    return DensityAnalyticsResponse(
        total_places=len(places),
        grid_rows=grid_dim,
        grid_cols=grid_dim,
        max_cell_count=max_count,
        cells=result_cells
    )


@router.post("/isochrone", response_model=IsochroneResponse)
def calculate_isochrone_buffers(
    req: IsochroneRequest,
    db: Session = Depends(get_db)
):
    """
    Calculate concentric travel-time and distance buffer zones around a target coordinate.
    Calculates POI counts, category breakdowns, estimated drive times, and coverage area per ring.
    """
    all_places = db.query(Place).all()
    
    # Sort buffer radii ascending
    radii = sorted(req.buffer_radii_km)
    rings: List[IsochroneRingDetail] = []

    # Urban driving speed assumption: 30 km/h average city speed (2 mins per km)
    AVG_URBAN_SPEED_KMH = 30.0

    for r_km in radii:
        matching_pois = []
        cat_counts: Dict[str, int] = {}

        for p in all_places:
            dist = haversine_distance_km(req.latitude, req.longitude, p.latitude, p.longitude)
            if dist <= r_km:
                matching_pois.append(p)
                cat_counts[p.category] = cat_counts.get(p.category, 0) + 1

        travel_time_mins = round((r_km / AVG_URBAN_SPEED_KMH) * 60.0, 1)
        surface_area_sq_km = round(math.pi * (r_km ** 2), 2)

        rings.append(IsochroneRingDetail(
            radius_km=r_km,
            est_travel_time_mins=travel_time_mins,
            poi_count=len(matching_pois),
            categories=cat_counts,
            coverage_area_sq_km=surface_area_sq_km
        ))

    return IsochroneResponse(
        center=[req.latitude, req.longitude],
        rings=rings
    )


@router.post("/score", response_model=ScoreAnalyticsResponse)
def calculate_accessibility_score(
    req: ScoreAnalyticsRequest,
    db: Session = Depends(get_db)
):
    """
    Calculate a multi-criteria spatial accessibility and service coverage score (0 - 100)
    for a location using distance decay functions across Hospitals, Clinics, Pharmacies, Emergency Services, and Dining.
    """
    all_places = db.query(Place).all()

    # Category buckets and distance weights
    cat_distances: Dict[str, List[float]] = {
        "Hospital": [],
        "Clinic": [],
        "Pharmacy": [],
        "Emergency Services": [],
        "Restaurant": []
    }

    category_summary: Dict[str, int] = {}

    for p in all_places:
        dist = haversine_distance_km(req.latitude, req.longitude, p.latitude, p.longitude)
        cat = p.category
        if cat in cat_distances:
            cat_distances[cat].append(dist)
        if dist <= 5.0: # Within 5km local catchment area
            category_summary[cat] = category_summary.get(cat, 0) + 1

    def compute_subscore(distances: List[float]) -> float:
        if not distances:
            return 0.0
        min_d = min(distances)
        # Distance decay function: score 100 if within 0.5km, decays exponentially beyond
        if min_d <= 0.5:
            base = 100.0
        else:
            base = max(0.0, 100.0 * math.exp(-0.35 * (min_d - 0.5)))
        # Bonus for density of options (up to +20 points)
        density_bonus = min(20.0, len([d for d in distances if d <= 3.0]) * 4.0)
        return min(100.0, round(base + density_bonus, 1))

    score_hospital = compute_subscore(cat_distances["Hospital"] + cat_distances["Clinic"])
    score_emergency = compute_subscore(cat_distances["Emergency Services"])
    score_pharmacy = compute_subscore(cat_distances["Pharmacy"])
    score_dining = compute_subscore(cat_distances["Restaurant"])

    # Normalize user weights to sum to 1.0
    total_w = req.weight_healthcare + req.weight_emergency + req.weight_pharmacy + req.weight_dining
    if total_w <= 0:
        total_w = 1.0

    w_h = req.weight_healthcare / total_w
    w_e = req.weight_emergency / total_w
    w_p = req.weight_pharmacy / total_w
    w_d = req.weight_dining / total_w

    overall = round(
        (score_hospital * w_h) +
        (score_emergency * w_e) +
        (score_pharmacy * w_p) +
        (score_dining * w_d),
        1
    )

    if overall >= 80:
        tier = "Excellent Accessibility & High Coverage"
    elif overall >= 55:
        tier = "Moderate Accessibility & Average Coverage"
    elif overall >= 30:
        tier = "Limited Services Coverage"
    else:
        tier = "Underserved Spatial Zone"

    return ScoreAnalyticsResponse(
        location=[req.latitude, req.longitude],
        overall_score=overall,
        score_breakdown={
            "Healthcare & Clinics": score_hospital,
            "Emergency Services": score_emergency,
            "Pharmacies": score_pharmacy,
            "Dining & Amenities": score_dining
        },
        nearby_summary=category_summary,
        assessment_tier=tier
    )
