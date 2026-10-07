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
  Sliders,
  Sparkles,
  Bookmark,
  Share2,
  Check,
  Flame,
  Car,
  Footprints,
  Bike,
  X,
  Target
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

const RADIUS_PRESETS = [2, 5, 10, 25, 50];

// 100% Free Public Tile Providers with ZERO API Key Requirements & Zero Watermarks
const TILE_PROVIDERS = {
  dark: {
    name: 'OpenStreetMap Dark',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    subdomains: 'abc',
    maxZoom: 19,
    className: 'osm-dark-tiles'
  },
  cyber: {
    name: 'Cyber Neon OSM',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    subdomains: 'abc',
    maxZoom: 19,
    className: 'osm-cyber-tiles'
  },
  day: {
    name: 'Standard OSM Day',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    subdomains: 'abc',
    maxZoom: 19,
    className: 'osm-day-tiles'
  },
  hot: {
    name: 'Humanitarian OSM',
    url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="https://www.hotosm.org/">HOT</a>',
    subdomains: 'abc',
    maxZoom: 19,
    className: 'osm-day-tiles'
  }
};

// Create Custom Dynamic POI DivIcon with Vector SVG and Priority Z-Index Stacking
const createCustomIcon = (place, isSelected = false) => {
  const category = place.category;
  const color = CATEGORY_COLORS[category] || '#00F0FF';
  const svg = CATEGORY_SVGS[category] || CATEGORY_SVGS.Hospital;

  const is24_7 = category === 'Hospital' || category === 'Hospitals' || category === 'Emergency Services';
  const hasHighRating = place.rating && place.rating >= 4.5;

  let priorityClass = 'marker-priority-normal';
  if (isSelected) {
    priorityClass = 'marker-priority-active';
  } else if (is24_7 || hasHighRating) {
    priorityClass = 'marker-priority-high';
  }

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
    ? `box-shadow: 0 0 0 4px #00F0FF, 0 0 30px rgba(0, 240, 255, 1); transform: scale(1.22);` 
    : `box-shadow: 0 0 14px ${color}88, 0 3px 10px rgba(0, 0, 0, 0.85);`;

  return L.divIcon({
    className: `antigravity-poi-marker ${priorityClass}`,
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
    className: 'antigravity-cluster-marker marker-priority-high',
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
  className: 'custom-user-marker marker-priority-active',
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
  className: 'custom-dest-marker marker-priority-active',
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

// Container Invalidation Controller: Forces Leaflet to Recalculate Dimensions
function InvalidateSizeController({ sidebarCollapsed }) {
  const map = useMap();

  useEffect(() => {
    // Invalidate size immediately on mount and after layout settles
    map.invalidateSize();
    const t1 = setTimeout(() => map.invalidateSize(), 100);
    const t2 = setTimeout(() => map.invalidateSize(), 300);
    const t3 = setTimeout(() => map.invalidateSize(), 600);

    const handleResize = () => {
      map.invalidateSize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      window.removeEventListener('resize', handleResize);
    };
  }, [map, sidebarCollapsed]);

  return null;
}

// Viewport Animation & Auto-Fit Controller
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
    if (routeCoordinates && routeCoordinates.length > 1) {
      const bounds = L.latLngBounds(routeCoordinates);
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 });
      return;
    }

    if (selectedPlace) {
      map.flyTo([selectedPlace.latitude, selectedPlace.longitude], 16, { 
        duration: 1.2,
        easeLinearity: 0.25 
      });
      return;
    }

    if (autoFitView && places && places.length > 0 && places.length !== prevPlacesLength.current) {
      prevPlacesLength.current = places.length;
      const validCoords = places.filter(p => p.latitude && p.longitude).map(p => [p.latitude, p.longitude]);
      if (validCoords.length > 1) {
        const bounds = L.latLngBounds(validCoords);
        map.fitBounds(bounds, { padding: [55, 55], maxZoom: 15 });
        return;
      }
    }

    if (center) {
      map.flyTo(center, zoom || 13, { duration: 1.0 });
    }
  }, [center, zoom, routeCoordinates, selectedPlace, places, autoFitView, map]);

  return null;
}

// Bounding Box Auto-Fetch Viewport Listener
function ViewportListener({ isEnabled, onViewportChange }) {
  const map = useMap();

  useEffect(() => {
    if (!isEnabled || !onViewportChange) return;
    const bounds = map.getBounds();
    onViewportChange({
      min_lat: bounds.getSouth(),
      max_lat: bounds.getNorth(),
      min_lng: bounds.getWest(),
      max_lng: bounds.getEast()
    });
  }, [isEnabled, map, onViewportChange]);

  useMapEvents({
    moveend: () => {
      if (isEnabled && onViewportChange) {
        const bounds = map.getBounds();
        onViewportChange({
          min_lat: bounds.getSouth(),
          max_lat: bounds.getNorth(),
          min_lng: bounds.getWest(),
          max_lng: bounds.getEast()
        });
      }
    }
  });

  return null;
}

// High-Performance Density Heatmap Canvas Overlay
function HeatmapCanvasLayer({ places, isActive }) {
  const map = useMap();
  const canvasRef = useRef(null);

  const drawHeatmap = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (!isActive || !places || places.length === 0) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    const size = map.getSize();
    canvas.width = size.x;
    canvas.height = size.y;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'lighter';

    const zoom = map.getZoom();
    const baseRadius = Math.max(26, Math.min(70, zoom * 4.5));

    places.forEach((p) => {
      if (!p.latitude || !p.longitude) return;
      const point = map.latLngToContainerPoint([p.latitude, p.longitude]);
      if (point.x < -100 || point.x > size.x + 100 || point.y < -100 || point.y > size.y + 100) return;

      const catColor = CATEGORY_COLORS[p.category] || '#00F0FF';
      const rad = baseRadius;

      const grad = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, rad);
      grad.addColorStop(0, `${catColor}cc`);
      grad.addColorStop(0.35, 'rgba(0, 240, 255, 0.45)');
      grad.addColorStop(0.7, 'rgba(168, 85, 247, 0.25)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(point.x, point.y, rad, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  useEffect(() => {
    drawHeatmap();
  }, [places, isActive, map]);

  useMapEvents({
    move: drawHeatmap,
    zoom: drawHeatmap,
    resize: drawHeatmap,
    viewreset: drawHeatmap
  });

  if (!isActive) return null;

  return (
    <div 
      className="leaflet-pane leaflet-overlay-pane" 
      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 450 }}
    >
      <canvas
        ref={canvasRef}
        className="antigravity-heatmap-canvas"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          pointerEvents: 'none',
          mixBlendMode: 'screen',
          opacity: 0.88
        }}
      />
    </div>
  );
}

// Subcomponent managing Spatial Clustering & Individual Markers
function ClusteredLayer({
  places,
  selectedPlace,
  onSelectPlace,
  onGetDirections,
  isClusteringEnabled,
  bookmarkedIds,
  onToggleBookmark,
  onToast
}) {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());

  useMapEvents({
    zoomend: () => setZoom(map.getZoom()),
    moveend: () => setZoom(map.getZoom())
  });

  const clusterData = useMemo(() => {
    if (!places || places.length === 0) return [];

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

  const handleShare = (e, place) => {
    e.stopPropagation();
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}&travelmode=driving`;
    const shareText = `${place.name} (${place.category}) - ${place.address || 'Location'}\nGoogle Maps: ${googleMapsUrl}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText);
      if (onToast) onToast(`Copied ${place.name} link!`);
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
        const isBookmarked = bookmarkedIds ? (
          bookmarkedIds instanceof Set ? bookmarkedIds.has(place.id) : bookmarkedIds.includes?.(place.id)
        ) : false;

        const raw = place.raw_data || {};
        const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}&travelmode=driving`;
        const appleMapsUrl = `https://maps.apple.com/?daddr=${place.latitude},${place.longitude}&dirflg=d`;
        const wazeUrl = `https://waze.com/ul?ll=${place.latitude},${place.longitude}&navigate=yes`;
        const color = CATEGORY_COLORS[place.category] || '#00F0FF';
        const is24_7 = place.category === 'Hospital' || place.category === 'Hospitals' || place.category === 'Emergency Services';

        const dist = place.distance_km || 0;
        const driveMinutes = Math.max(1, Math.round(dist * 1.5 + 2));
        const walkMinutes = Math.max(2, Math.round(dist * 12));

        return (
          <Marker
            key={place.id}
            position={[place.latitude, place.longitude]}
            icon={createCustomIcon(place, isSelected)}
            eventHandlers={{
              click: () => onSelectPlace(place)
            }}
          >
            <Tooltip direction="top" offset={[0, -20]} opacity={0.95} className="antigravity-tooltip">
              <div className="flex items-center gap-1.5 font-mono text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }}></span>
                <span className="font-bold text-white line-clamp-1">{place.name}</span>
                {place.rating > 0 && <span className="text-[#F59E0B] font-bold">★{place.rating}</span>}
              </div>
            </Tooltip>

            {/* Rich High-Density Glassmorphic Popup */}
            <Popup>
              <div className="p-1 text-slate-100 max-w-[280px]">
                {/* Header: Category + 24/7/Open + Rating + Bookmark Toggle */}
                <div className="flex items-center justify-between gap-1.5 mb-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30">
                      {place.category}
                    </span>
                    
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

                  <div className="flex items-center gap-1 shrink-0">
                    {onToggleBookmark && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleBookmark(place);
                        }}
                        className={`p-1 rounded-md transition-all cursor-pointer ${
                          isBookmarked 
                            ? 'text-[#F59E0B] bg-[#F59E0B]/20' 
                            : 'text-slate-400 hover:text-white hover:bg-white/10'
                        }`}
                        title={isBookmarked ? 'Bookmarked' : 'Add to bookmarks'}
                      >
                        <Bookmark className="w-3.5 h-3.5 fill-current" />
                      </button>
                    )}
                    <button
                      onClick={(e) => handleShare(e, place)}
                      className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                      title="Share link"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Venue Name */}
                <strong className="text-sm font-bold text-white block mb-1.5 leading-snug">
                  {place.name}
                </strong>

                {/* Travel Time & Distance Chips */}
                {place.distance_km !== undefined && place.distance_km !== null && (
                  <div className="flex items-center gap-1.5 mb-2 font-mono text-[10px]">
                    <span className="px-2 py-0.5 rounded-lg bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/25 flex items-center gap-1">
                      🚗 ~{driveMinutes}m ({place.distance_km} km)
                    </span>
                    <span className="px-2 py-0.5 rounded-lg bg-white/5 text-slate-300 border border-white/10 flex items-center gap-1">
                      🚶 ~{walkMinutes}m
                    </span>
                  </div>
                )}

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
                </div>

                {/* Action Buttons: Route + Call + External Navigation Bridges */}
                <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-1.5 font-mono text-xs">
                  <button
                    onClick={() => onGetDirections(place)}
                    className="flex-1 py-1.5 px-2 rounded-xl bg-[#00F0FF] hover:bg-[#00F0FF]/90 text-[#07090E] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer shadow-[0_0_12px_rgba(0,240,255,0.4)]"
                  >
                    <Compass className="w-3.5 h-3.5" />
                    Route
                  </button>

                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-1.5 px-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 flex items-center justify-center gap-1 transition-all cursor-pointer border border-white/10"
                    title="Google Maps"
                  >
                    <ExternalLink className="w-3 h-3 text-[#00F0FF]" />
                    Maps
                  </a>

                  <a
                    href={appleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-1.5 px-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 flex items-center justify-center transition-all cursor-pointer border border-white/10"
                    title="Apple Maps"
                  >
                    Apple
                  </a>

                  <a
                    href={wazeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-1.5 px-2 rounded-xl bg-[#00F0FF]/15 hover:bg-[#00F0FF]/25 text-[#00F0FF] flex items-center justify-center transition-all cursor-pointer border border-[#00F0FF]/30"
                    title="Waze"
                  >
                    Waze
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
  places = [],
  userLocation,
  radiusKm = 25,
  setRadiusKm,
  selectedPlace,
  onSelectPlace,
  onGetDirections,
  activeRoute,
  onClearRoute,
  travelMode = 'driving',
  onTravelModeChange,
  viewportMode = false,
  setViewportMode,
  onViewportChange,
  bookmarkedIds,
  onToggleBookmark,
  onToast,
  sidebarCollapsed = false
}) {
  const centerPosition = [userLocation.latitude, userLocation.longitude];

  // Interactive Layer Controls State
  const [isClusteringEnabled, setIsClusteringEnabled] = useState(true);
  const [autoFitView, setAutoFitView] = useState(true);
  const [tileMode, setTileMode] = useState('dark'); // 'dark' | 'cyber' | 'day' | 'hot'
  const [isHeatmapActive, setIsHeatmapActive] = useState(false);
  const [showLayerPanel, setShowLayerPanel] = useState(false);

  const currentTileConfig = TILE_PROVIDERS[tileMode] || TILE_PROVIDERS.dark;

  return (
    <div 
      id="map"
      className="relative w-full h-full min-h-[100vh] rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-[#07090E]"
      style={{ height: '100%', width: '100%', minHeight: '100vh', position: 'relative' }}
    >
      <MapContainer
        center={centerPosition}
        zoom={13}
        scrollWheelZoom={true}
        className="w-full h-full bg-[#07090E]"
        style={{ height: '100%', width: '100%', minHeight: '100vh', position: 'relative' }}
      >
        {/* Container Size Invalidator to prevent blank/unrendered tiles on mount & sidebar toggle */}
        <InvalidateSizeController sidebarCollapsed={sidebarCollapsed} />

        {/* Reliable High-Performance Dark Tile Layer (CartoDB Dark Matter / Voyager) */}
        <TileLayer
          key={tileMode}
          attribution={currentTileConfig.attribution}
          url={currentTileConfig.url}
          subdomains={currentTileConfig.subdomains}
          maxZoom={currentTileConfig.maxZoom}
          className={currentTileConfig.className}
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

        {/* Bounding Box Viewport Listener */}
        <ViewportListener
          isEnabled={viewportMode}
          onViewportChange={onViewportChange}
        />

        {/* Density Heatmap Canvas Overlay */}
        <HeatmapCanvasLayer
          places={places}
          isActive={isHeatmapActive}
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

        {/* Active Navigation Polyline with glowing cyan casing */}
        {activeRoute?.coordinates && activeRoute.coordinates.length > 0 && (
          <>
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
          bookmarkedIds={bookmarkedIds}
          onToggleBookmark={onToggleBookmark}
          onToast={onToast}
        />
      </MapContainer>

      {/* Navigation In-App Multi-Modal Flight Deck (When Route is Active) */}
      {activeRoute && (
        <div className="absolute top-4 left-4 z-[400] antigravity-glass p-3 rounded-2xl border border-[#00F0FF]/40 shadow-[0_0_25px_rgba(0,240,255,0.25)] flex items-center gap-3 backdrop-blur-xl animate-in fade-in slide-in-from-top-3">
          <div className="flex items-center gap-1.5 font-mono text-xs">
            <button
              onClick={() => onTravelModeChange && onTravelModeChange('driving')}
              className={`px-2.5 py-1 rounded-xl flex items-center gap-1 transition-all cursor-pointer border ${
                travelMode === 'driving'
                  ? 'bg-[#00F0FF] text-[#07090E] font-bold border-[#00F0FF]'
                  : 'bg-white/5 text-slate-300 border-white/10 hover:text-white'
              }`}
            >
              <Car className="w-3.5 h-3.5" />
              Drive
            </button>
            <button
              onClick={() => onTravelModeChange && onTravelModeChange('walking')}
              className={`px-2.5 py-1 rounded-xl flex items-center gap-1 transition-all cursor-pointer border ${
                travelMode === 'walking'
                  ? 'bg-[#00F0FF] text-[#07090E] font-bold border-[#00F0FF]'
                  : 'bg-white/5 text-slate-300 border-white/10 hover:text-white'
              }`}
            >
              <Footprints className="w-3.5 h-3.5" />
              Walk
            </button>
            <button
              onClick={() => onTravelModeChange && onTravelModeChange('cycling')}
              className={`px-2.5 py-1 rounded-xl flex items-center gap-1 transition-all cursor-pointer border ${
                travelMode === 'cycling'
                  ? 'bg-[#00F0FF] text-[#07090E] font-bold border-[#00F0FF]'
                  : 'bg-white/5 text-slate-300 border-white/10 hover:text-white'
              }`}
            >
              <Bike className="w-3.5 h-3.5" />
              Transit
            </button>
          </div>

          <div className="h-4 w-px bg-white/20"></div>

          <div className="font-mono text-xs">
            <span className="text-[#00F0FF] font-bold">{activeRoute.duration_mins}m</span>
            <span className="text-slate-400 ml-1.5">({activeRoute.distance_km} km)</span>
          </div>

          {onClearRoute && (
            <button
              onClick={onClearRoute}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              title="Close Route"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* On-Map Radial Radius Presets HUD (Bottom Left) */}
      {setRadiusKm && !activeRoute && (
        <div className="absolute bottom-5 left-5 z-[400] antigravity-glass p-2 px-3 rounded-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.6)] backdrop-blur-md flex items-center gap-2">
          <div className="flex items-center gap-1 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mr-1">
            <Target className="w-3 h-3 text-[#00F0FF]" />
            Radius:
          </div>
          <div className="flex items-center gap-1">
            {RADIUS_PRESETS.map((preset) => (
              <button
                key={preset}
                onClick={() => setRadiusKm(preset)}
                className={`px-2 py-0.5 rounded-lg font-mono text-[11px] font-bold transition-all cursor-pointer border ${
                  radiusKm === preset
                    ? 'bg-[#00F0FF] text-[#07090E] border-[#00F0FF] shadow-[0_0_10px_rgba(0,240,255,0.4)]'
                    : 'bg-white/5 text-slate-300 border-white/10 hover:text-white hover:bg-white/10'
                }`}
              >
                {preset}k
              </button>
            ))}
          </div>
        </div>
      )}

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

            {/* Density Heatmap Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-slate-200 font-semibold flex items-center gap-1">
                  <Flame className="w-3 h-3 text-[#A855F7]" />
                  Density Heatmap
                </span>
                <span className="text-[10px] text-slate-400">Canvas density glow</span>
              </div>
              <button
                onClick={() => setIsHeatmapActive(!isHeatmapActive)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer border ${
                  isHeatmapActive 
                    ? 'bg-[#A855F7]/25 text-[#A855F7] border-[#A855F7]/50 shadow-[0_0_10px_rgba(168,85,247,0.3)]'
                    : 'bg-white/5 text-slate-400 border-white/10'
                }`}
              >
                {isHeatmapActive ? 'ON' : 'OFF'}
              </button>
            </div>

            {/* Viewport Auto-Filter Toggle */}
            {setViewportMode && (
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-slate-200 font-semibold block">Viewport Filter</span>
                  <span className="text-[10px] text-slate-400">Only visible screen area</span>
                </div>
                <button
                  onClick={() => setViewportMode(!viewportMode)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer border ${
                    viewportMode 
                      ? 'bg-[#00F0FF]/20 text-[#00F0FF] border-[#00F0FF]/40 shadow-[0_0_8px_rgba(0,240,255,0.2)]'
                      : 'bg-white/5 text-slate-400 border-white/10'
                  }`}
                >
                  {viewportMode ? 'ON' : 'OFF'}
                </button>
              </div>
            )}

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
                Tile Contrast Surface (No Key Required)
              </span>
              <div className="grid grid-cols-3 gap-1 font-mono text-[10px]">
                <button
                  onClick={() => setTileMode('dark')}
                  className={`py-1 rounded-lg border text-center transition-all cursor-pointer ${
                    tileMode === 'dark' 
                      ? 'bg-[#00F0FF]/20 text-[#00F0FF] border-[#00F0FF]/40 font-bold' 
                      : 'bg-white/5 text-slate-400 border-white/10 hover:text-slate-200'
                  }`}
                  title="OpenStreetMap Dark"
                >
                  Dark
                </button>
                <button
                  onClick={() => setTileMode('cyber')}
                  className={`py-1 rounded-lg border text-center transition-all cursor-pointer ${
                    tileMode === 'cyber' 
                      ? 'bg-[#00F0FF]/20 text-[#00F0FF] border-[#00F0FF]/40 font-bold' 
                      : 'bg-white/5 text-slate-400 border-white/10 hover:text-slate-200'
                  }`}
                  title="Cyber Neon Layer"
                >
                  Cyber
                </button>
                <button
                  onClick={() => setTileMode('day')}
                  className={`py-1 rounded-lg border text-center transition-all cursor-pointer ${
                    tileMode === 'day' 
                      ? 'bg-[#00F0FF]/20 text-[#00F0FF] border-[#00F0FF]/40 font-bold' 
                      : 'bg-white/5 text-slate-400 border-white/10 hover:text-slate-200'
                  }`}
                  title="Standard OpenStreetMap Day"
                >
                  Day
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Floating Map Legend (Bottom Right) */}
      <div className="absolute bottom-5 right-5 z-[400] antigravity-glass p-3 rounded-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.6)] text-xs space-y-2 backdrop-blur-md hidden sm:block">
        <div className="flex items-center justify-between gap-3">
          <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400 block font-bold">
            POI Indicators
          </span>
          <span className="font-mono text-[10px] text-[#00F0FF] font-semibold">
            {isClusteringEnabled ? 'CLUSTERING' : 'NODES'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-x-3.5 gap-y-1 text-slate-300 font-mono text-[10px]">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#F43F5E] shadow-[0_0_6px_#F43F5E]"></span>
            <span>Hospital</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#06B6D4] shadow-[0_0_6px_#06B6D4]"></span>
            <span>Clinic</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#10B981] shadow-[0_0_6px_#10B981]"></span>
            <span>Pharmacy</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#EF4444] shadow-[0_0_6px_#EF4444]"></span>
            <span>Emergency</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#A855F7] shadow-[0_0_6px_#A855F7]"></span>
            <span>Dining</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#3B82F6] shadow-[0_0_6px_#3B82F6]"></span>
            <span>Hotels</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#14B8A6] shadow-[0_0_6px_#14B8A6]"></span>
            <span>Bus Stands</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#D946EF] shadow-[0_0_6px_#D946EF]"></span>
            <span>Tourist</span>
          </div>
        </div>
      </div>
    </div>
  );
}
