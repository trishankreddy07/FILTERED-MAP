import React, { useEffect } from 'react';
import { 
  MapContainer, 
  TileLayer, 
  Marker, 
  Popup, 
  Circle, 
  useMap 
} from 'react-leaflet';
import L from 'leaflet';
import { 
  Hospital, 
  Stethoscope, 
  Pill, 
  Siren, 
  UtensilsCrossed, 
  MapPin, 
  Star 
} from 'lucide-react';

// Custom colored HTML SVG DivIcons for Leaflet
const createCustomIcon = (category, isSelected = false) => {
  let color = '#06b6d4'; // Cyan default
  let letter = 'P';

  if (category === 'Hospital') {
    color = '#f43f5e'; // Rose
    letter = 'H';
  } else if (category === 'Clinic') {
    color = '#10b981'; // Emerald
    letter = 'C';
  } else if (category === 'Pharmacy') {
    color = '#f59e0b'; // Amber
    letter = 'Rx';
  } else if (category === 'Emergency Services') {
    color = '#dc2626'; // Red
    letter = 'E';
  } else if (category === 'Restaurant') {
    color = '#38bdf8'; // Sky
    letter = 'R';
  }

  const ringClass = isSelected ? 'box-shadow: 0 0 0 4px #38bdf8, 0 0 20px rgba(56, 189, 248, 0.8);' : 'box-shadow: 0 2px 10px rgba(0,0,0,0.5);';

  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 13px;
        border: 2px solid white;
        ${ringClass}
        transition: transform 0.2s ease;
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
    <div style="position: relative; width: 24px; height: 24px;">
      <div style="
        position: absolute;
        width: 24px;
        height: 24px;
        background-color: rgba(6, 182, 212, 0.4);
        border-radius: 50%;
        animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
      "></div>
      <div style="
        position: absolute;
        top: 3px;
        left: 3px;
        width: 18px;
        height: 18px;
        background-color: #06b6d4;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 0 10px rgba(6, 182, 212, 0.8);
      "></div>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

// Component to handle dynamic map panning/zooming
function MapViewController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom || 13, { duration: 1.2 });
    }
  }, [center, zoom, map]);
  return null;
}

export default function MapView({
  places,
  userLocation,
  radiusKm,
  selectedPlace,
  onSelectPlace,
  showIsochrones = false
}) {
  const centerPosition = [userLocation.latitude, userLocation.longitude];

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
      <MapContainer
        center={centerPosition}
        zoom={13}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        {/* OpenStreetMap Standard Tile Layer */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        <MapViewController
          center={selectedPlace ? [selectedPlace.latitude, selectedPlace.longitude] : centerPosition}
          zoom={selectedPlace ? 15 : 13}
        />

        {/* User Origin Center Marker */}
        <Marker position={centerPosition} icon={userLocationIcon}>
          <Popup>
            <div className="p-1 text-slate-100">
              <strong className="text-cyan-400 block mb-1">Active Spatial Origin</strong>
              <div className="text-xs text-slate-300">
                Lat: {userLocation.latitude.toFixed(4)}, Lng: {userLocation.longitude.toFixed(4)}
              </div>
            </div>
          </Popup>
        </Marker>

        {/* Search Catchment Radius Circle */}
        {radiusKm && (
          <Circle
            center={centerPosition}
            radius={radiusKm * 1000}
            pathOptions={{
              color: '#06b6d4',
              fillColor: '#06b6d4',
              fillOpacity: 0.08,
              weight: 1.5,
              dashArray: '6, 6'
            }}
          />
        )}

        {/* Concentric Isochrone Buffer Rings (Optional visual overlay) */}
        {showIsochrones && (
          <>
            <Circle
              center={centerPosition}
              radius={1000}
              pathOptions={{ color: '#10b981', fillOpacity: 0.05, weight: 1 }}
            />
            <Circle
              center={centerPosition}
              radius={3000}
              pathOptions={{ color: '#f59e0b', fillOpacity: 0.04, weight: 1 }}
            />
            <Circle
              center={centerPosition}
              radius={5000}
              pathOptions={{ color: '#f43f5e', fillOpacity: 0.03, weight: 1 }}
            />
          </>
        )}

        {/* POI Place Markers */}
        {places.map((place) => {
          const isSelected = selectedPlace?.id === place.id;
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
                <div className="p-1 text-slate-100 max-w-[220px]">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-xs px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/40">
                      {place.category}
                    </span>
                    {place.rating && (
                      <span className="text-xs text-amber-300 flex items-center gap-1 font-semibold">
                        ★ {place.rating}
                      </span>
                    )}
                  </div>
                  <strong className="text-sm font-semibold text-white block mb-1">
                    {place.name}
                  </strong>
                  {place.address && (
                    <p className="text-xs text-slate-400 mb-2">{place.address}</p>
                  )}
                  {place.distance_km !== undefined && (
                    <div className="text-xs text-cyan-400 font-medium">
                      {place.distance_km} km from active origin
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Floating Map Legend */}
      <div className="absolute bottom-5 right-5 z-[400] bg-slate-900/90 backdrop-blur-md p-3.5 rounded-xl border border-slate-800 shadow-xl text-xs space-y-2">
        <span className="font-semibold text-slate-200 block text-[11px] uppercase tracking-wider">
          POI Categories
        </span>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-slate-300">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500"></span>
            <span>Hospital (H)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
            <span>Clinic (C)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500"></span>
            <span>Pharmacy (Rx)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-600"></span>
            <span>Emergency (E)</span>
          </div>
          <div className="flex items-center gap-2 col-span-2">
            <span className="w-3 h-3 rounded-full bg-sky-400"></span>
            <span>Restaurant (R)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
