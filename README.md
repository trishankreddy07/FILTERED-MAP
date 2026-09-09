# 🌐 GeoPulse: Location Intelligence & Spatial Analytics Platform

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React_18_(Vite)-61DAFB.svg?style=flat&logo=react)](https://react.dev)
[![Leaflet](https://img.shields.io/badge/Maps-Leaflet-199900.svg?style=flat&logo=leaflet)](https://leafletjs.com)
[![Tailwind CSS](https://img.shields.io/badge/UI-Tailwind_CSS_v4-38B2AC.svg?style=flat&logo=tailwind-css)](https://tailwindcss.com)
[![PostGIS](https://img.shields.io/badge/Database-PostgreSQL_/_PostGIS-336791.svg?style=flat&logo=postgresql)](https://postgis.net)
[![CI](https://github.com/trishankreddy07/Rainfall_Early_Warning/actions/workflows/ci.yml/badge.svg)](https://github.com/trishankreddy07/Rainfall_Early_Warning/actions)

**GeoPulse** is an enterprise-grade location intelligence platform and spatial analytics engine. It enables users to discover, filter, and analyze nearby critical points of interest (**Hospitals, Clinics, Pharmacies, Emergency Services, and Restaurants**) while executing advanced real-time geospatial analytics—including service coverage density, travel-time boundaries (isochrones), and multi-criteria accessibility ranking scores.

---

## 🏗️ Technical Architecture & Stack

```
                                  ┌────────────────────────────────┐
                                  │      React + Vite Frontend     │
                                  │  (React-Leaflet, Tailwind v4)  │
                                  └──────────────┬─────────────────┘
                                                 │ HTTP / GeoJSON
                                                 ▼
                                  ┌────────────────────────────────┐
                                  │     FastAPI Spatial Engine     │
                                  │    (Pydantic v2, SQLAlchemy)   │
                                  └───────┬────────────────┬───────┘
                                          │                │
                        ┌─────────────────┴─┐            ┌─┴─────────────────┐
                        │ PostGIS / SQLite  │            │ Overpass API / OSM│
                        │ Spatial DB Engine │            │ Live ETL Ingest   │
                        └───────────────────┘            └───────────────────┘
```

1. **Frontend**:
   - **React 18 + Vite**: Lightning-fast hot reloading and optimized production bundles.
   - **Tailwind CSS**: Modern slate/dark-mode theme with glowing accent palettes.
   - **React-Leaflet & Leaflet.js**: Dynamic interactive map rendering, custom SVG POI pins, radius buffer circles, and popups.
   - **Lucide React**: Clean, modern iconography for categories and spatial metrics.

2. **Backend**:
   - **Python 3.11 + FastAPI**: High-performance asynchronous RESTful API framework.
   - **Pydantic v2**: Type validation, request serialization, and GeoJSON schemas.
   - **SQLAlchemy 2.0 & GeoAlchemy2**: Spatial ORM with dynamic PostGIS detection.
   - **Zero-Config Fallback Engine**: Runs out-of-the-box on SQLite with spherical Haversine spatial math, switching seamlessly to PostGIS when connected to Docker Compose.

3. **Data Pipeline & Spatial Analytics**:
   - **Live OpenStreetMap Ingest (`etl_osm_ingest.py`)**: Real-time Overpass API parser to extract, transform, and load POIs into the database.
   - **Isochrone Buffer Engine**: Multi-ring concentric travel-time and catchment area computation.
   - **Service Density Matrix**: N x N spatial grid binning and heat classification.
   - **Multi-Criteria Accessibility Scoring**: Distance decay scoring algorithms with customizable weight distribution.

---

## 📂 Repository Structure

```
geopulse/
├── .github/
│   └── workflows/
│       └── ci.yml                 # GitHub Actions automated CI workflow
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── routes/
│   │   │   │   ├── places.py      # Spatial filtering & POI endpoints
│   │   │   │   ├── analytics.py   # Isochrones, Density, Accessibility score
│   │   │   │   └── health.py      # Health & PostGIS detection status
│   │   ├── core/
│   │   │   └── config.py          # Environment settings & CORS
│   │   ├── db/
│   │   │   ├── session.py         # SQLAlchemy & PostGIS session setup
│   │   │   └── models.py          # Spatial Place ORM Model
│   │   ├── schemas/
│   │   │   └── place.py           # Pydantic v2 & GeoJSON schemas
│   │   └── main.py                # FastAPI initialization & seed loader
│   ├── scripts/
│   │   └── etl_osm_ingest.py      # OpenStreetMap Overpass ETL pipeline
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── MapView.jsx        # Interactive Leaflet map container
│   │   │   ├── FilterPanel.jsx    # Category, radius & rating controls
│   │   │   ├── PlaceCard.jsx      # POI cards with navigation actions
│   │   │   └── AnalyticsModal.jsx # Multi-criteria analytics dashboard
│   │   ├── hooks/
│   │   │   └── useGeolocation.js  # Browser geolocation hook
│   │   ├── App.jsx                # Main unified dashboard
│   │   ├── main.jsx
│   │   └── index.css
│   ├── Dockerfile
│   └── package.json
├── data/
│   └── raw/
│       └── seed_places.json       # Pre-packaged spatial POI seed data
├── docker-compose.yml             # PostGIS + Backend + Frontend stack
├── .gitignore
├── README.md
└── setup_git.sh                   # Automated Git repository setup script
```

---

## 🚀 Quickstart Guide

### Option 1: Zero-Config Local Testing (Fastest)

You can run the entire platform locally without installing PostgreSQL or PostGIS. The backend will automatically initialize a local SQLite database and seed initial spatial POIs.

#### 1. Start the Backend
```bash
cd geopulse/backend
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
- API Docs: [http://localhost:8000/docs](http://localhost:8000/docs)
- Health Check: [http://localhost:8000/health](http://localhost:8000/health)

#### 2. Start the Frontend
```bash
cd geopulse/frontend
npm install
npm run dev
```
- Web App: [http://localhost:5173](http://localhost:5173)

---

### Option 2: Docker Compose (Production PostGIS Stack)

To run the complete production containerized stack with **PostgreSQL + PostGIS**:

```bash
cd geopulse
docker compose up --build
```

- Frontend: [http://localhost](http://localhost)
- Backend API: [http://localhost:8000](http://localhost:8000)
- Interactive API Docs: [http://localhost:8000/docs](http://localhost:8000/docs)
- PostGIS Database: `localhost:5432` (`geopulse_db`)

---

## 📡 Live OpenStreetMap (OSM) Data Ingestion

To ingest live POI data for any bounding box or urban center using OpenStreetMap's Overpass API:

```bash
cd geopulse/backend
python scripts/etl_osm_ingest.py
```

This ETL script extracts:
- `amenity=hospital`, `amenity=clinic`, `amenity=doctors` (Healthcare)
- `amenity=pharmacy` (Pharmacies)
- `amenity=fire_station`, `amenity=police`, `amenity=ambulance_station` (Emergency)
- `amenity=restaurant`, `amenity=cafe`, `amenity=fast_food` (Dining)

It parses metadata (phone, opening hours, wheelchair accessibility, address), normalizes coordinates, and writes records into the spatial database.

---

## 📊 Spatial Analytics Engine & Algorithms

### 1. Distance Calculation (Great-Circle Haversine)
$$d = 2R \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right)}\right)$$
Calculates direct point-to-point spherical distance in kilometers between origin coordinates and POIs.

### 2. Multi-Criteria Accessibility Ranking Score
Uses distance-decay functions combined with user-weighted parameters:
$$S = \sum_{k \in \text{Categories}} W_k \cdot \left( 100 \cdot e^{-\lambda (d_{k,\min} - 0.5)} + B_{\text{density}} \right)$$
- **Score 80–100**: *Excellent Accessibility & High Coverage*
- **Score 55–79**: *Moderate Accessibility & Average Coverage*
- **Score 30–54**: *Limited Services Coverage*
- **Score 0–29**: *Underserved Spatial Zone*

### 3. Travel-Time Isochrone Estimation
Generates concentric travel-time and service reachability zones based on urban velocity models ($v_{\text{urban}} \approx 30\text{ km/h}$).

---

## 🛠️ Git Initialization

To initialize the Git repository with the standard structure:

```bash
cd geopulse
bash setup_git.sh
```

---

## 📄 License
This project is open-source and available under the **MIT License**.
