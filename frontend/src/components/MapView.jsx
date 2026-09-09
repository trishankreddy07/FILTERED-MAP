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
  Hospital, 
  Stethoscope, 
  Pill, 
  Siren, 
  UtensilsCrossed, 
  Hotel,
  Landmark,
  MapPin, 
  Star,
  Compass,
  ExternalLink,
  Flag
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
  } else if (category === 'Hotel & Stays') {
    color = '#8b5cf6'; // Indigo / Violet
    letter = 'H';
  } else if (category === 'Tourist Places') {
    color = '#d946ef'; // Fuchsia / Magenta
    letter = 'T';
  }

  const ringClass = isSelected ? 'box-shadow: 0 0 0 4px #38bdf8, 0 0 22px rgba(56, 189, 248, 0.9); transform: scale(1.15);' : 'box-shadow: 0 2px 10px rgba(0,0,0,0.5);';

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
        transition: all 0.25s ease;
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
    <div style="position: relative; width: 28px; height: 28px;">
      <div style="
        position: absolute;
        width: 28px;
        height: 28px;
        background-color: rgba(6, 182, 212, 0.4);
        border-radius: 50%;
        animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
      "></div>
      <div style="
        position: absolute;
        top: 4px;
        left: 4px;
        width: 20px;
        height: 20px;
        background-color: #06b6d4;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 0 12px rgba(6, 182, 212, 0.9);
      "></div>
    </div>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 14]
});

const destinationIcon = L.divIcon({
  className: 'custom-dest-marker',
  html: `
    <div style="
      background-color: #ef4444;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 16px;
      border: 3px solid white;
      box-shadow: 0 0 15px rgba(239, 68, 68, 0.8);
      animation: bounce 1s infinite alternate;
    ">
      🏁
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
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
  activeRoute,
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
          routeCoordinates={activeRoute?.coordinates}
        />

        {/* User Origin Center Marker */}
        <Marker position={centerPosition} icon={userLocationIcon}>
          <Popup>
            <div className="p-1 text-slate-100">
              <strong className="text-cyan-400 block mb-1">Active GPS Position</strong>
              <div className="text-xs text-slate-300">
                Lat: {userLocation.latitude.toFixed(4)}, Lng: {userLocation.longitude.toFixed(4)}
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
              color: '#06b6d4',
              fillColor: '#06b6d4',
              fillOpacity: 0.08,
              weight: 1.5,
              dashArray: '6, 6'
            }}
          />
        )}

        {/* Active Navigation Polyline */}
        {activeRoute?.coordinates && activeRoute.coordinates.length > 0 && (
          <>
            {/* Glow background casing line */}
            <Polyline
              positions={activeRoute.coordinates}
              pathOptions={{
                color: '#0284c7',
                weight: 8,
                opacity: 0.45,
                lineCap: 'round',
                lineJoin: 'round'
              }}
            />
            {/* Foreground crisp path line */}
            <Polyline
              positions={activeRoute.coordinates}
              pathOptions={{
                color: '#38bdf8',
                weight: 5,
                opacity: 0.95,
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
                <strong className="text-rose-400 block mb-1">🏁 Destination</strong>
                <div className="text-xs font-semibold">{activeRoute.destination.name}</div>
                <div className="text-xs text-cyan-400 mt-1">
                  {activeRoute.distance_km} km ({activeRoute.duration_mins} mins away)
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
                <div className="p-1 text-slate-100 max-w-[240px]">
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
                    <div className="text-xs text-cyan-400 font-medium mb-3">
                      {place.distance_km} km from active GPS
                    </div>
                  )}

                  {/* Popup Action Buttons */}
                  <div className="pt-2 border-t border-slate-700/80 flex items-center justify-between gap-2">
                    <button
                      onClick={() => onGetDirections(place)}
                      className="flex-1 py-1.5 px-2 rounded-md bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1 transition-all cursor-pointer"
                    >
                      <Compass className="w-3.5 h-3.5" />
                      Directions
                    </button>
                    <a
                      href={googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-1.5 px-2 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center justify-center gap-1 transition-all cursor-pointer border border-slate-700"
                    >
                      <ExternalLink className="w-3 h-3 text-cyan-400" />
                      Google
                    </a>
                  </div>
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
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-sky-400"></span>
            <span>Restaurant (R)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-indigo-500"></span>
            <span>Hotels (H)</span>
          </div>
          <div className="flex items-center gap-2 col-span-2">
            <span className="w-3 h-3 rounded-full bg-fuchsia-500"></span>
            <span>Tourist Places (T)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
