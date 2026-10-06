import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  MapContainer, 
  TileLayer, 
  Marker, 
  Popup, 
  Tooltip,
  Circle, 
  Polyline,
  useMap,
  useMapEvents 
} from 'react-leaflet';
import L from 'leaflet';
import { 
  Compass, 
  ExternalLink,
  Navigation,
  Phone,
  Clock,
  MapPin,
  Star,
  Layers,
  Maximize2,
  LocateFixed,
  Sparkles,
  ShieldAlert,
  CheckCircle2,
  Sliders,
  Eye,
  EyeOff
} from 'lucide-react';

// Crisp Category Colors
const CATEGORY_COLORS = {
  Hospital: '#F43F5E',
  Hospitals: '#F43F5E',
  Clinic: '#06B6D4',
  Clinics: '#06B6D4',
  Pharmacy: '#10B981',
  Pharmacies: '#10B981',
  'Emergency Services': '#EF4444',
  Restaurant: '#A855F7',
  'Dining & Cafe': '#A855F7',
  'Dining & Cafes': '#A855F7',
  'Hotel & Stays': '#3B82F6',
  'Hotels & Stays': '#3B82F6',
  'Bus Stands': '#14B8A6',
  'Bus Stand': '#14B8A6',
  'Transit & Bus': '#14B8A6',
  'Tourist Places': '#D946EF',
};

// Crisp Category SVG Glyphs
const CATEGORY_SVGS = {
  Hospital: `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>`,
  Clinic: `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/></svg>`,
  Pharmacy: `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/></svg>`,
  'Emergency Services': `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  Restaurant: `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2v6a3 3 0 0 1-3 3 3 3 0 0 1-3-3V2"/><path d="M15 11v11"/><path d="M5 2v4a3 3 0 0 0 3 3v13"/><path d="M8 5h-6"/></svg>`,
  'Hotel & Stays': `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 4v16M2 8h18a2 2 0 0 1 2 2v10M2 17h20M6 8v9"/></svg>`,
  'Bus Stands': `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6v6M15 6v6M2 12h19.6M18 18h3s.5-1.7.5-2.8c0-3.3-2.6-5.2-6.5-5.2h-12c-1.5 0-3 1.2-3 2.8v5.2h3"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>`,
  'Tourist Places': `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" x2="21" y1="22" y2="22"/><line x1="6" x2="6" y1="18"/><line x1="10" x2="10" y1="18"/><line x1="14" x2="14" y1="18"/><line x1="18" x2="18" y1="18"/><polygon points="12 2 20 7 4 7"/></svg>`
};

// Create Custom Dynamic POI DivIcon with Vector SVG and Status Indicators
const createCustomIcon = (place, isSelected = false) => {
  const category = place.category;
  const color = CATEGORY_COLORS[category] || '#00F0FF';
  const svg = CATEGORY_SVGS[category] || CATEGORY_SVGS.Hospital;

  // Status Indicator logic: Emergency & Hospitals get 24/7 dot; high ratings get star badge
  const is24_7 = category === 'Hospital' || category === 'Hospitals' || category === 'Emergency Services';
  const hasHighRating = place.rating && place.rating >= 4.5;

  let statusBadgeHtml = '';
  if (is24_7) {
    statusBadgeHtml = `
      <span class="status-dot-pulse" style="
        position: absolute;
        top: -3px;
        right: -3px;
        width: 10px;
        height: 10px;
        background-color: #10B981;
        border: 2px solid #07090E;
        border-radius: 50%;
        box-shadow: 0 0 8px #10B981;
      " title="24/7 Active Facility"></span>
    `;
  } else if (hasHighRating) {
    statusBadgeHtml = `
      <span style="
        position: absolute;
        bottom: -4px;
        right: -6px;
        background: rgba(11, 15, 25, 0.95);
        border: 1px solid #F59E0B;
        border-radius: 8px;
        font-size: 9px;
        font-family: 'JetBrains Mono', monospace;
        color: #F59E0B;
        padding: 0 4px;
        font-weight: 700;
        line-height: 12px;
        box-shadow: 0 0 6px rgba(245, 158, 11, 0.5);
      ">★${place.rating}</span>
    `;
  }

  const ringStyle = isSelected 
    ? `box-shadow: 0 0 0 4px #00F0FF, 0 0 28px rgba(0, 240, 255, 1); transform: scale(1.22); z-index: 9999;` 
    : `box-shadow: 0 0 14px ${color}88, 0 3px 10px rgba(0, 0, 0, 0.85);`;

  return L.divIcon({
    className: 'antigravity-poi-marker',
    html: `
      <div style="
        position: relative;
        background: radial-gradient(circle at 35% 35%, ${color}, #07090E 130%);
        width: 34px;
        height: 34px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #ffffff;
        border: 2px solid rgba(255, 255, 255, 0.9);
        ${ringStyle}
        transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
      ">
        ${svg}
        ${statusBadgeHtml}
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -20]
  });
};

// Create Futuristic Cluster Hub Marker
const createClusterIcon = (count, dominantCategory = 'Hospital') => {
  const color = CATEGORY_COLORS[dominantCategory] || '#00F0FF';
  const size = count < 10 ? 40 : count < 50 ? 46 : 52;
  
  return L.divIcon({
    className: 'antigravity-cluster-marker',
    html: `
      <div style="
        position: relative;
        width: ${size}px;
        height: ${size}px;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: ${color};
          opacity: 0.25;
          animation: neonPulse 2s infinite ease-in-out;
        "></div>
        <div style="
          position: absolute;
          inset: 3px;
          border-radius: 50%;
          background: radial-gradient(circle at 35% 35%, ${color}, #07090E 135%);
          border: 2px solid rgba(255, 255, 255, 0.9);
          box-shadow: 0 0 18px ${color}aa, inset 0 0 10px rgba(255, 255, 255, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          font-family: 'JetBrains Mono', monospace;
          font-weight: 800;
          font-size: ${size > 44 ? 13 : 11}px;
          letter-spacing: -0.5px;
        ">
          ${count}
        </div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2]
  });
};

// User GPS Pulse DivIcon
const userLocationIcon = L.divIcon({
  className: 'custom-user-marker',
  html: `
    <div style="position: relative; width: 36px; height: 36px;">
      <div style="
        position: absolute;
        width: 36px;
        height: 36px;
        background-color: rgba(0, 240, 255, 0.35);
        border-radius: 50%;
        animation: radarSweep 2s cubic-bezier(0, 0, 0.2, 1) infinite;
      "></div>
      <div style="
        position: absolute;
        top: 8px;
        left: 8px;
        width: 20px;
        height: 20px;
        background-color: #00F0FF;
        border-radius: 50%;
        border: 2.5px solid #ffffff;
        box-shadow: 0 0 18px rgba(0, 240, 255, 1);
      "></div>
    </div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -18]
});

// Destination Target DivIcon
const destinationIcon = L.divIcon({
  className: 'custom-dest-marker',
  html: `
    <div style="
      background: radial-gradient(circle at 35% 35%, #F43F5E, #881337);
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 16px;
      border: 2.5px solid white;
      box-shadow: 0 0 24px rgba(244, 63, 94, 0.95);
      animation: bounce 1.2s infinite alternate;
    ">
      🏁
    </div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -20]
});

// Smart Viewport, Pan & Auto-Fit Controller
function MapViewController({ 
  center, 
  zoom, 
  routeCoordinates, 
  selectedPlace, 
  places, 
  autoFitView 
}) {
  const map = useMap();
  const prevPlacesLength = useRef(places?.length || 0);

  useEffect(() => {
    // 1. If active navigation route, fit bounds to the whole route path
    if (routeCoordinates && routeCoordinates.length > 1) {
      const bounds = L.latLngBounds(routeCoordinates);
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 });
      return;
    }

    // 2. If a specific POI is selected, smooth flyTo animation with focus zoom
    if (selectedPlace) {
      map.flyTo([selectedPlace.latitude, selectedPlace.longitude], 16, { 
        duration: 1.2,
        easeLinearity: 0.25 
      });
      return;
    }

    // 3. If places changed and auto-fit is enabled, frame all visible places
    if (autoFitView && places && places.length > 0 && places.length !== prevPlacesLength.current) {
      prevPlacesLength.current = places.length;
      const validCoords = places.filter(p => p.latitude && p.longitude).map(p => [p.latitude, p.longitude]);
      if (validCoords.length > 1) {
        const bounds = L.latLngBounds(validCoords);
        map.fitBounds(bounds, { padding: [55, 55], maxZoom: 15 });
        return;
      }
    }

    // 4. Fallback to center position
    if (center) {
      map.flyTo(center, zoom || 13, { duration: 1.0 });
    }
  }, [center, zoom, routeCoordinates, selectedPlace, places, autoFitView, map]);

  return null;
}

// Subcomponent managing Spatial Clustering & Individual Markers
function ClusteredLayer({
  places,
  selectedPlace,
  onSelectPlace,
  onGetDirections,
  isClusteringEnabled
}) {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());

  useMapEvents({
    zoomend: () => setZoom(map.getZoom()),
    moveend: () => setZoom(map.getZoom())
  });

  // Calculate Spatial Clusters at current map zoom
  const clusterData = useMemo(() => {
    if (!places || places.length === 0) return [];

    // When clustering is off or zoomed into street level (zoom >= 15), show individual markers
    if (!isClusteringEnabled || zoom >= 15) {
      return places.map(p => ({
        isCluster: false,
        place: p,
        latitude: p.latitude,
        longitude: p.longitude
      }));
    }

    const clusterRadiusPx = 55;
    const visited = new Set();
    const clusters = [];

    for (let i = 0; i < places.length; i++) {
      if (visited.has(places[i].id)) continue;

      const current = places[i];
      const p1 = map.latLngToLayerPoint([current.latitude, current.longitude]);
      const group = [current];
      visited.add(current.id);

      for (let j = i + 1; j < places.length; j++) {
        if (visited.has(places[j].id)) continue;
        const other = places[j];
        const p2 = map.latLngToLayerPoint([other.latitude, other.longitude]);
        if (p1.distanceTo(p2) <= clusterRadiusPx) {
          group.push(other);
          visited.add(other.id);
        }
      }

      if (group.length === 1) {
        clusters.push({
          isCluster: false,
          place: current,
          latitude: current.latitude,
          longitude: current.longitude
        });
      } else {
        const avgLat = group.reduce((acc, p) => acc + p.latitude, 0) / group.length;
        const avgLng = group.reduce((acc, p) => acc + p.longitude, 0) / group.length;

        // Tally category counts and dominant category
        const counts = {};
        group.forEach(p => counts[p.category] = (counts[p.category] || 0) + 1);

        let dominant = 'Hospital';
        let maxCount = 0;
        for (const [cat, cnt] of Object.entries(counts)) {
          if (cnt > maxCount) {
            maxCount = cnt;
            dominant = cat;
          }
        }

        clusters.push({
          isCluster: true,
          id: `cluster-${current.id}-${group.length}`,
          latitude: avgLat,
          longitude: avgLng,
          count: group.length,
          places: group,
          dominantCategory: dominant,
          categories: counts
        });
      }
    }

    return clusters;
  }, [places, zoom, map, isClusteringEnabled]);

  // Click cluster handler to smoothly zoom into cluster extent
  const handleClusterClick = (cluster) => {
    if (cluster.places.length <= 1) return;
    const coords = cluster.places.map(p => [p.latitude, p.longitude]);
    const bounds = L.latLngBounds(coords);
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 });
    } else {
      map.flyTo([cluster.latitude, cluster.longitude], Math.min(map.getZoom() + 2, 16), { duration: 0.8 });
    }
  };

  return (
    <>
      {clusterData.map((item) => {
        if (item.isCluster) {
          return (
            <Marker
              key={item.id}
              position={[item.latitude, item.longitude]}
              icon={createClusterIcon(item.count, item.dominantCategory)}
              eventHandlers={{
                click: () => handleClusterClick(item)
              }}
            >
              {/* Quick Hover Tooltip for Cluster */}
              <Tooltip direction="top" offset={[0, -22]} opacity={0.95} className="antigravity-tooltip">
                <div className="font-mono text-[11px] text-white flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[item.dominantCategory] || '#00F0FF' }}></span>
                  <span className="font-bold">{item.count} Venues in Sector</span>
                  <span className="text-[#00F0FF]">(Click to Expand)</span>
                </div>
              </Tooltip>
            </Marker>
          );
        }

        const place = item.place;
        const isSelected = selectedPlace?.id === place.id;
        const raw = place.raw_data || {};
        const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}&travelmode=driving`;
        const color = CATEGORY_COLORS[place.category] || '#00F0FF';
        const is24_7 = place.category === 'Hospital' || place.category === 'Hospitals' || place.category === 'Emergency Services';

        return (
          <Marker
            key={place.id}
            position={[place.latitude, place.longitude]}
            icon={createCustomIcon(place, isSelected)}
            eventHandlers={{
              click: () => onSelectPlace(place)
            }}
          >
            {/* Quick Lightweight Hover Tooltip */}
            <Tooltip direction="top" offset={[0, -20]} opacity={0.95} className="antigravity-tooltip">
              <div className="flex items-center gap-1.5 font-mono text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }}></span>
                <span className="font-bold text-white line-clamp-1">{place.name}</span>
                {place.rating > 0 && <span className="text-[#F59E0B] font-bold">★{place.rating}</span>}
              </div>
            </Tooltip>

            {/* Rich High-Density Glassmorphic Popup */}
            <Popup>
              <div className="p-1 text-slate-100 max-w-[270px]">
                {/* Header Pills: Category + Rating + Status */}
                <div className="flex items-center justify-between gap-1.5 mb-2 flex-wrap">
                  <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30">
                    {place.category}
                  </span>
                  
                  <div className="flex items-center gap-1">
                    {is24_7 ? (
                      <span className="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded-md bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30 font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse"></span>
                        24/7
                      </span>
                    ) : (
                      <span className="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded-md bg-[#00F0FF]/15 text-slate-300 border border-white/10">
                        Open
                      </span>
                    )}

                    {place.rating > 0 && (
                      <span className="font-mono text-xs text-[#F59E0B] font-bold flex items-center gap-0.5">
                        ★ {place.rating}
                      </span>
                    )}
                  </div>
                </div>

                {/* Venue Name */}
                <strong className="text-sm font-bold text-white block mb-1.5 leading-snug">
                  {place.name}
                </strong>

                {/* Venue Meta Details */}
                <div className="space-y-1 text-xs text-slate-400 mb-2.5">
                  {place.address && (
                    <div className="flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                      <span className="line-clamp-2 text-slate-300">{place.address}</span>
                    </div>
                  )}

                  {raw.opening_hours && (
                    <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-400">
                      <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="line-clamp-1">{raw.opening_hours}</span>
                    </div>
                  )}

                  {raw.phone && (
                    <div className="flex items-center gap-1.5 font-mono text-[11px] text-[#10B981]">
                      <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <a href={`tel:${raw.phone}`} className="hover:underline">{raw.phone}</a>
                    </div>
                  )}

                  {place.distance_km !== undefined && place.distance_km !== null && (
                    <div className="font-mono text-xs text-[#00F0FF] font-semibold pt-1 flex items-center gap-1">
                      <Navigation className="w-3 h-3 text-[#00F0FF]" />
                      {place.distance_km} km from active GPS
                    </div>
                  )}
                </div>

                {/* Quick Action Buttons */}
                <div className="pt-2.5 border-t border-white/10 flex items-center justify-between gap-1.5 font-mono text-xs">
                  <button
                    onClick={() => onGetDirections(place)}
                    className="flex-1 py-1.5 px-2 rounded-xl bg-[#00F0FF] hover:bg-[#00F0FF]/90 text-[#07090E] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer shadow-[0_0_12px_rgba(0,240,255,0.4)]"
                  >
                    <Compass className="w-3.5 h-3.5" />
                    Route
                  </button>

                  {raw.phone && (
                    <a
                      href={`tel:${raw.phone}`}
                      className="py-1.5 px-2 rounded-xl bg-[#10B981]/15 hover:bg-[#10B981]/25 text-[#10B981] border border-[#10B981]/30 flex items-center justify-center gap-1 transition-all cursor-pointer"
                      title="Call Venue"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      Call
                    </a>
                  )}

                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-1.5 px-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 flex items-center justify-center gap-1 transition-all cursor-pointer border border-white/10"
                    title="Launch Google Maps"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-[#00F0FF]" />
                    Maps
                  </a>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}

// Master MapView Component
export default function MapView({
  places,
  userLocation,
  radiusKm,
  selectedPlace,
  onSelectPlace,
  onGetDirections,
  activeRoute
}) {
  const centerPosition = [userLocation.latitude, userLocation.longitude];

  // Interactive Layer Controls State
  const [isClusteringEnabled, setIsClusteringEnabled] = useState(true);
  const [autoFitView, setAutoFitView] = useState(true);
  const [tileMode, setTileMode] = useState('cyber'); // 'cyber' | 'deepspace' | 'standard'
  const [showLayerPanel, setShowLayerPanel] = useState(false);

  // Tile CSS Filter Mapping
  const tileFilterStyle = useMemo(() => {
    if (tileMode === 'deepspace') {
      return { filter: 'brightness(0.48) invert(1) contrast(3.8) hue-rotate(210deg) saturate(0.2) brightness(0.72)' };
    }
    if (tileMode === 'standard') {
      return { filter: 'brightness(0.85) contrast(1.1)' };
    }
    // Default 'cyber' Antigravity tile filter
    return { filter: 'brightness(0.6) invert(1) contrast(3.4) hue-rotate(200deg) saturate(0.28) brightness(0.78)' };
  }, [tileMode]);

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-[#07090E]">
      <MapContainer
        center={centerPosition}
        zoom={13}
        scrollWheelZoom={true}
        className="w-full h-full bg-[#07090E]"
      >
        {/* OpenStreetMap with Antigravity Tile Filter */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
          className="antigravity-custom-tiles"
          style={tileFilterStyle}
        />

        {/* Viewport Animation & Auto-Fit Controller */}
        <MapViewController
          center={centerPosition}
          zoom={13}
          routeCoordinates={activeRoute?.coordinates}
          selectedPlace={selectedPlace}
          places={places}
          autoFitView={autoFitView}
        />

        {/* User GPS Center Marker with Radar Ping */}
        <Marker position={centerPosition} icon={userLocationIcon}>
          <Popup>
            <div className="p-1 text-slate-100 font-mono">
              <strong className="text-[#00F0FF] text-xs uppercase tracking-wider block mb-1">
                Active GPS Telemetry
              </strong>
              <div className="text-xs text-slate-300">
                LAT: {userLocation.latitude.toFixed(4)}, LNG: {userLocation.longitude.toFixed(4)}
              </div>
              <div className="text-[10px] text-slate-500 mt-1">Accuracy Radius: ~80 meters</div>
            </div>
          </Popup>
        </Marker>

        {/* User Location Radial Accuracy Circle Ring */}
        <Circle
          center={centerPosition}
          radius={80}
          pathOptions={{
            color: '#00F0FF',
            fillColor: '#00F0FF',
            fillOpacity: 0.08,
            weight: 1.5,
            dashArray: '4, 4'
          }}
        />

        {/* Search Catchment Radius Circle */}
        {radiusKm && !activeRoute && (
          <Circle
            center={centerPosition}
            radius={radiusKm * 1000}
            pathOptions={{
              color: '#00F0FF',
              fillColor: '#00F0FF',
              fillOpacity: 0.04,
              weight: 1.5,
              dashArray: '6, 6'
            }}
          />
        )}

        {/* Active Navigation Polyline */}
        {activeRoute?.coordinates && activeRoute.coordinates.length > 0 && (
          <>
            {/* Glow casing line */}
            <Polyline
              positions={activeRoute.coordinates}
              pathOptions={{
                color: '#00F0FF',
                weight: 8,
                opacity: 0.5,
                lineCap: 'round',
                lineJoin: 'round'
              }}
            />
            {/* Foreground crisp path line */}
            <Polyline
              positions={activeRoute.coordinates}
              pathOptions={{
                color: '#38BDF8',
                weight: 4.5,
                opacity: 1,
                lineCap: 'round',
                lineJoin: 'round'
              }}
            />
          </>
        )}

        {/* Destination Pin Marker when Navigation Route Active */}
        {activeRoute?.destination && (
          <Marker
            position={[activeRoute.destination.latitude, activeRoute.destination.longitude]}
            icon={destinationIcon}
          >
            <Popup>
              <div className="p-1 text-slate-100">
                <strong className="text-[#F43F5E] font-mono text-xs uppercase tracking-wider block mb-1">
                  Destination Target
                </strong>
                <div className="text-xs font-semibold">{activeRoute.destination.name}</div>
                <div className="text-xs font-mono text-[#00F0FF] mt-1">
                  {activeRoute.distance_km} km ({activeRoute.duration_mins} mins away)
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Clustered POI Markers with Smart Grouping */}
        <ClusteredLayer
          places={places}
          selectedPlace={selectedPlace}
          onSelectPlace={onSelectPlace}
          onGetDirections={onGetDirections}
          isClusteringEnabled={isClusteringEnabled}
        />
      </MapContainer>

      {/* Interactive Map Overlay Controls (Top Right) */}
      <div className="absolute top-4 right-4 z-[400] flex flex-col items-end gap-2">
        <button
          onClick={() => setShowLayerPanel(!showLayerPanel)}
          className={`p-2.5 rounded-2xl antigravity-glass border border-white/10 text-white shadow-xl transition-all cursor-pointer flex items-center gap-2 text-xs font-mono font-semibold ${
            showLayerPanel ? 'border-[#00F0FF] text-[#00F0FF] shadow-[0_0_15px_rgba(0,240,255,0.3)]' : 'hover:border-white/20'
          }`}
          title="Interactive Map Controls"
        >
          <Sliders className="w-4 h-4 text-[#00F0FF]" />
          <span>MAP CONTROLS</span>
        </button>

        {showLayerPanel && (
          <div className="w-64 antigravity-glass p-4 rounded-2xl border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.8)] backdrop-blur-xl text-xs space-y-3.5 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="font-mono text-[10px] uppercase font-bold text-[#00F0FF] tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                Display Intelligence
              </span>
              <span className="text-[10px] font-mono text-slate-400">{places.length} POIs</span>
            </div>

            {/* Clustering Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-slate-200 font-semibold block">Smart Clustering</span>
                <span className="text-[10px] text-slate-400">Cluster hubs on zoom out</span>
              </div>
              <button
                onClick={() => setIsClusteringEnabled(!isClusteringEnabled)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer border ${
                  isClusteringEnabled 
                    ? 'bg-[#00F0FF]/20 text-[#00F0FF] border-[#00F0FF]/40 shadow-[0_0_8px_rgba(0,240,255,0.2)]'
                    : 'bg-white/5 text-slate-400 border-white/10'
                }`}
              >
                {isClusteringEnabled ? 'ON' : 'OFF'}
              </button>
            </div>

            {/* Auto-Fit Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-slate-200 font-semibold block">Auto-Fit Bounds</span>
                <span className="text-[10px] text-slate-400">Frame results on filter</span>
              </div>
              <button
                onClick={() => setAutoFitView(!autoFitView)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer border ${
                  autoFitView 
                    ? 'bg-[#10B981]/20 text-[#10B981] border-[#10B981]/40 shadow-[0_0_8px_rgba(16,185,129,0.2)]'
                    : 'bg-white/5 text-slate-400 border-white/10'
                }`}
              >
                {autoFitView ? 'ON' : 'OFF'}
              </button>
            </div>

            {/* Base Tile Selector */}
            <div className="space-y-1.5 pt-1 border-t border-white/10">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                Tile Contrast Surface
              </span>
              <div className="grid grid-cols-3 gap-1 font-mono text-[10px]">
                <button
                  onClick={() => setTileMode('cyber')}
                  className={`py-1 rounded-lg border text-center transition-all cursor-pointer ${
                    tileMode === 'cyber' 
                      ? 'bg-[#00F0FF]/20 text-[#00F0FF] border-[#00F0FF]/40 font-bold' 
                      : 'bg-white/5 text-slate-400 border-white/10 hover:text-slate-200'
                  }`}
                >
                  Cyber
                </button>
                <button
                  onClick={() => setTileMode('deepspace')}
                  className={`py-1 rounded-lg border text-center transition-all cursor-pointer ${
                    tileMode === 'deepspace' 
                      ? 'bg-[#00F0FF]/20 text-[#00F0FF] border-[#00F0FF]/40 font-bold' 
                      : 'bg-white/5 text-slate-400 border-white/10 hover:text-slate-200'
                  }`}
                >
                  Deep
                </button>
                <button
                  onClick={() => setTileMode('standard')}
                  className={`py-1 rounded-lg border text-center transition-all cursor-pointer ${
                    tileMode === 'standard' 
                      ? 'bg-[#00F0FF]/20 text-[#00F0FF] border-[#00F0FF]/40 font-bold' 
                      : 'bg-white/5 text-slate-400 border-white/10 hover:text-slate-200'
                  }`}
                >
                  Day
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Floating Map Legend (Bottom Right) */}
      <div className="absolute bottom-5 right-5 z-[400] antigravity-glass p-3.5 rounded-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.6)] text-xs space-y-2.5 backdrop-blur-md">
        <div className="flex items-center justify-between gap-3">
          <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400 block font-bold">
            POI Indicators
          </span>
          <span className="font-mono text-[10px] text-[#00F0FF] font-semibold">
            {isClusteringEnabled ? 'CLUSTERING ACTIVE' : 'RAW NODES'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-slate-300 font-mono text-[11px]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F43F5E] shadow-[0_0_6px_#F43F5E]"></span>
            <span>Hospital</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#06B6D4] shadow-[0_0_6px_#06B6D4]"></span>
            <span>Clinic</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] shadow-[0_0_6px_#10B981]"></span>
            <span>Pharmacy</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444] shadow-[0_0_6px_#EF4444]"></span>
            <span>Emergency</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#A855F7] shadow-[0_0_6px_#A855F7]"></span>
            <span>Dining</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6] shadow-[0_0_6px_#3B82F6]"></span>
            <span>Hotels</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#14B8A6] shadow-[0_0_6px_#14B8A6]"></span>
            <span>Bus Stands</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D946EF] shadow-[0_0_6px_#D946EF]"></span>
            <span>Tourist</span>
          </div>
        </div>
      </div>
    </div>
  );
}
