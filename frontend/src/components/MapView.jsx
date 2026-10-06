import React, { useEffect } from 'react';
import { 
  MapContainer, 
  TileLayer, 
  Marker, 
  Popup, 
  Circle, 
  Polyline,
  useMap 
} from 'react-leaflet';
import L from 'leaflet';
import { 
  Compass, 
  ExternalLink,
  Navigation
} from 'lucide-react';

// Antigravity Glowing Vector DivIcons for Leaflet
const createCustomIcon = (category, isSelected = false) => {
  let color = '#00F0FF'; // Electric Cyan default
  let letter = 'P';

  if (category === 'Hospital' || category === 'Hospitals') {
    color = '#F43F5E'; // Neon Rose
    letter = 'H';
  } else if (category === 'Clinic' || category === 'Clinics') {
    color = '#06B6D4'; // Cyan-Emerald
    letter = 'C';
  } else if (category === 'Pharmacy' || category === 'Pharmacies') {
    color = '#10B981'; // Quantum Emerald
    letter = 'Rx';
  } else if (category === 'Emergency Services') {
    color = '#EF4444'; // Emergency Neon Red
    letter = 'E';
  } else if (category === 'Restaurant' || category === 'Dining & Cafe' || category === 'Dining & Cafes') {
    color = '#A855F7'; // Neon Purple
    letter = 'R';
  } else if (category === 'Hotel & Stays' || category === 'Hotels & Stays') {
    color = '#3B82F6'; // Hyper Blue
    letter = 'H';
  } else if (category === 'Bus Stands' || category === 'Bus Stand' || category === 'Transit & Bus') {
    color = '#14B8A6'; // Neon Teal
    letter = 'B';
  } else if (category === 'Tourist Places') {
    color = '#D946EF'; // Neon Fuchsia
    letter = 'T';
  }

  const ringClass = isSelected 
    ? 'box-shadow: 0 0 0 4px #00F0FF, 0 0 28px rgba(0, 240, 255, 1); transform: scale(1.22); z-index: 1000;' 
    : `box-shadow: 0 0 14px ${color}88, 0 2px 10px rgba(0,0,0,0.85);`;

  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="
        background: radial-gradient(circle at 35% 35%, ${color}, #07090E 120%);
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #ffffff;
        font-family: 'JetBrains Mono', monospace;
        font-weight: 800;
        font-size: 12px;
        border: 2px solid rgba(255, 255, 255, 0.85);
        ${ringClass}
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      ">
        ${letter}
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18]
  });
};

const userLocationIcon = L.divIcon({
  className: 'custom-user-marker',
  html: `
    <div style="position: relative; width: 32px; height: 32px;">
      <div style="
        position: absolute;
        width: 32px;
        height: 32px;
        background-color: rgba(0, 240, 255, 0.35);
        border-radius: 50%;
        animation: radar-pulse 2s cubic-bezier(0, 0, 0.2, 1) infinite;
      "></div>
      <div style="
        position: absolute;
        top: 6px;
        left: 6px;
        width: 20px;
        height: 20px;
        background-color: #00F0FF;
        border-radius: 50%;
        border: 2.5px solid #ffffff;
        box-shadow: 0 0 16px rgba(0, 240, 255, 1);
      "></div>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 16]
});

const destinationIcon = L.divIcon({
  className: 'custom-dest-marker',
  html: `
    <div style="
      background: radial-gradient(circle at 35% 35%, #F43F5E, #881337);
      width: 34px;
      height: 34px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 15px;
      border: 2.5px solid white;
      box-shadow: 0 0 20px rgba(244, 63, 94, 0.9);
      animation: bounce 1.2s infinite alternate;
    ">
      🏁
    </div>
  `,
  iconSize: [34, 34],
  iconAnchor: [17, 17],
  popupAnchor: [0, -18]
});

// Component to handle dynamic map panning/zooming and route fitting
function MapViewController({ center, zoom, routeCoordinates }) {
  const map = useMap();

  useEffect(() => {
    if (routeCoordinates && routeCoordinates.length > 1) {
      const bounds = L.latLngBounds(routeCoordinates);
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 });
    } else if (center) {
      map.flyTo(center, zoom || 13, { duration: 1.2 });
    }
  }, [center, zoom, routeCoordinates, map]);

  return null;
}

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

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-[#07090E]">
      <MapContainer
        center={centerPosition}
        zoom={13}
        scrollWheelZoom={true}
        className="w-full h-full bg-[#07090E]"
      >
        {/* OpenStreetMap with Antigravity Dark Filter */}
        <TileLayer
          className="antigravity-tiles"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        <MapViewController
          center={selectedPlace ? [selectedPlace.latitude, selectedPlace.longitude] : centerPosition}
          zoom={selectedPlace ? 15 : 13}
          routeCoordinates={activeRoute?.coordinates}
        />

        {/* User Origin Center Marker */}
        <Marker position={centerPosition} icon={userLocationIcon}>
          <Popup>
            <div className="p-1 text-slate-100">
              <strong className="text-[#00F0FF] font-mono text-xs uppercase tracking-wider block mb-1">
                Active GPS Center
              </strong>
              <div className="font-mono text-xs text-slate-300">
                {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
              </div>
            </div>
          </Popup>
        </Marker>

        {/* Search Catchment Radius Circle */}
        {radiusKm && !activeRoute && (
          <Circle
            center={centerPosition}
            radius={radiusKm * 1000}
            pathOptions={{
              color: '#00F0FF',
              fillColor: '#00F0FF',
              fillOpacity: 0.05,
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
                opacity: 0.45,
                lineCap: 'round',
                lineJoin: 'round'
              }}
            />
            {/* Foreground crisp neon line */}
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

        {/* Destination Pin Marker when Route Active */}
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
                  {activeRoute.distance_km} km ({activeRoute.duration_mins} mins)
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* POI Place Markers */}
        {places.map((place) => {
          const isSelected = selectedPlace?.id === place.id;
          const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}&travelmode=driving`;

          return (
            <Marker
              key={place.id}
              position={[place.latitude, place.longitude]}
              icon={createCustomIcon(place.category, isSelected)}
              eventHandlers={{
                click: () => onSelectPlace(place)
              }}
            >
              <Popup>
                <div className="p-1 text-slate-100 max-w-[250px]">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30">
                      {place.category}
                    </span>
                    {place.rating && (
                      <span className="font-mono text-xs text-[#F59E0B] font-semibold">
                        ★ {place.rating}
                      </span>
                    )}
                  </div>
                  <strong className="text-sm font-semibold text-white block mb-1">
                    {place.name}
                  </strong>
                  {place.address && (
                    <p className="text-xs text-slate-400 mb-2 line-clamp-2">{place.address}</p>
                  )}
                  {place.distance_km !== undefined && (
                    <div className="font-mono text-xs text-[#00F0FF] font-semibold mb-3">
                      {place.distance_km} km from active GPS
                    </div>
                  )}

                  {/* Popup Action Buttons */}
                  <div className="pt-2.5 border-t border-white/10 flex items-center justify-between gap-2">
                    <button
                      onClick={() => onGetDirections(place)}
                      className="flex-1 py-1.5 px-2 rounded-xl bg-[#00F0FF] hover:bg-[#00F0FF]/90 text-[#07090E] font-mono font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-[0_0_12px_rgba(0,240,255,0.4)]"
                    >
                      <Compass className="w-3.5 h-3.5" />
                      Directions
                    </button>
                    <a
                      href={googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-1.5 px-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 font-mono text-xs flex items-center justify-center gap-1 transition-all cursor-pointer border border-white/10"
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
      </MapContainer>

      {/* Floating Map Legend */}
      <div className="absolute bottom-5 right-5 z-[400] antigravity-glass p-3.5 rounded-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.6)] text-xs space-y-2.5 backdrop-blur-md">
        <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400 block font-bold">
          Venue Indicators
        </span>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-slate-300 font-mono text-[11px]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F43F5E] shadow-[0_0_6px_#F43F5E]"></span>
            <span>Hospital (H)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#06B6D4] shadow-[0_0_6px_#06B6D4]"></span>
            <span>Clinic (C)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] shadow-[0_0_6px_#10B981]"></span>
            <span>Pharmacy (Rx)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444] shadow-[0_0_6px_#EF4444]"></span>
            <span>Emergency (E)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#A855F7] shadow-[0_0_6px_#A855F7]"></span>
            <span>Dining (R)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6] shadow-[0_0_6px_#3B82F6]"></span>
            <span>Hotels (H)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#14B8A6] shadow-[0_0_6px_#14B8A6]"></span>
            <span>Bus Stands (B)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D946EF] shadow-[0_0_6px_#D946EF]"></span>
            <span>Tourist (T)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
