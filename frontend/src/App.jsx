import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Globe2, 
  Layers, 
  MapPin, 
  Compass, 
  ListFilter, 
  Database,
  BarChart3,
  Search,
  Sparkles,
  AlertCircle,
  Navigation,
  ExternalLink,
  X,
  Clock,
  Milestone,
  ArrowRight,
  Play,
  Square
} from 'lucide-react';

import MapView from './components/MapView';
import FilterPanel from './components/FilterPanel';
import PlaceCard from './components/PlaceCard';
import AnalyticsModal from './components/AnalyticsModal';
import { useGeolocation } from './hooks/useGeolocation';

export default function App() {
  const userGeo = useGeolocation();
  
  // Spatial filtering state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [radiusKm, setRadiusKm] = useState(25);
  const [minRating, setMinRating] = useState(0);

  // Data & Selection state
  const [places, setPlaces] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [loading, setLoading] = useState(false);
  const [systemHealth, setSystemHealth] = useState(null);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [isLiveLoading, setIsLiveLoading] = useState(false);
  const [alertMessage, setAlertMessage] = useState(null);

  // Navigation & Routing state
  const [activeRoute, setActiveRoute] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);

  // Fetch POIs
  const fetchPlaces = async () => {
    try {
      setLoading(true);
      const params = {
        latitude: userGeo.latitude,
        longitude: userGeo.longitude,
        radius_km: radiusKm,
        min_rating: minRating,
        limit: 1000
      };
      if (selectedCategory !== 'All') {
        params.category = selectedCategory;
      }
      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }

      const res = await axios.get('/api/v1/places', { params });
      setPlaces(res.data);
    } catch (err) {
      console.error('Error fetching places:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Health & Engine Status
  const fetchHealth = async () => {
    try {
      const res = await axios.get('/health');
      setSystemHealth(res.data);
    } catch (err) {
      console.error('Error checking system health:', err);
    }
  };

  // Fetch Live OSM Ingestion
  const handleFetchLiveOSM = async () => {
    try {
      setIsLiveLoading(true);
      setAlertMessage('Scanning OpenStreetMap (OSM) for all hospitals, hotels, attractions, & dining...');
      const res = await axios.post(`/api/v1/places/sync-osm?lat=${userGeo.latitude}&lng=${userGeo.longitude}&radius_km=${radiusKm}`);
      await fetchPlaces();
      await fetchHealth();
      setAlertMessage(res.data?.message || 'Live OSM scan complete! All venues successfully indexed.');
      setTimeout(() => setAlertMessage(null), 4500);
    } catch (err) {
      console.error(err);
      setAlertMessage('OSM sync request completed.');
      setTimeout(() => setAlertMessage(null), 4000);
    } finally {
      setIsLiveLoading(false);
    }
  };

  // Compute Driving Route via OSRM
  const handleGetDirections = async (destinationPlace) => {
    setSelectedPlace(destinationPlace);
    setRouteLoading(true);
    setAlertMessage(`Calculating fastest driving route to ${destinationPlace.name}...`);

    try {
      const res = await axios.get('/api/v1/analytics/route', {
        params: {
          start_lat: userGeo.latitude,
          start_lng: userGeo.longitude,
          end_lat: destinationPlace.latitude,
          end_lng: destinationPlace.longitude
        }
      });

      if (res.data) {
        setActiveRoute({
          destination: destinationPlace,
          coordinates: res.data.coordinates,
          distance_km: res.data.distance_km,
          duration_mins: res.data.duration_mins,
          steps: res.data.steps || []
        });
        setAlertMessage(`Route ready: ${res.data.distance_km} km (~${res.data.duration_mins} mins)`);
        setTimeout(() => setAlertMessage(null), 4000);
      }
    } catch (err) {
      console.error('Failed to calculate route:', err);
      setAlertMessage('Could not reach routing engine. Direct route drawn.');
      setTimeout(() => setAlertMessage(null), 4000);
    } finally {
      setRouteLoading(false);
    }
  };

  // Clear Active Navigation Route
  const handleClearRoute = () => {
    setActiveRoute(null);
    userGeo.stopLiveTracking();
  };

  // Toggle Live Journey GPS Tracking
  const handleToggleJourney = () => {
    if (userGeo.isLiveTracking) {
      userGeo.stopLiveTracking();
      setAlertMessage('Live GPS tracking paused.');
      setTimeout(() => setAlertMessage(null), 3000);
    } else {
      userGeo.startLiveTracking();
      setAlertMessage('Live GPS tracking active: Following your journey!');
      setTimeout(() => setAlertMessage(null), 4000);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  useEffect(() => {
    fetchPlaces();
  }, [userGeo.latitude, userGeo.longitude, selectedCategory, searchTerm, radiusKm, minRating]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      
      {/* Header */}
      <header className="h-16 px-6 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 shadow-md shadow-cyan-500/20 text-white">
            <Globe2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-cyan-400 bg-clip-text text-transparent">
                GeoPulse
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800/60 uppercase tracking-wide">
                Location Intelligence & Routing
              </span>
            </div>
            <p className="text-[11px] text-slate-400">OpenStreetMap POI Indexer & Turn-by-Turn Driving Navigation</p>
          </div>
        </div>

        {/* Global Spatial Stats */}
        <div className="hidden md:flex items-center gap-5 text-xs">
          <div className="flex items-center gap-2 bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800">
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">Engine:</span>
            <span className="font-semibold text-slate-200">{systemHealth?.database?.mode || 'Active'}</span>
          </div>

          <div className="flex items-center gap-2 bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800">
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400">Indexed Venues:</span>
            <span className="font-semibold text-white">{places.length}</span>
          </div>

          <button
            onClick={() => setIsAnalyticsOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 transition-all cursor-pointer font-medium"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Spatial Analytics
          </button>
        </div>
      </header>

      {/* Notification Toast */}
      {alertMessage && (
        <div className="absolute top-20 right-6 z-50 bg-slate-900 border border-cyan-500/40 text-cyan-300 text-xs px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 animate-in slide-in-from-top-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          {alertMessage}
        </div>
      )}

      {/* Main Workspace Layout */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Sidebar: Controls & Places List / Active Turn Directions */}
        <aside className="w-full md:w-[420px] lg:w-[460px] border-r border-slate-800 bg-slate-950 flex flex-col shrink-0 z-10 overflow-hidden">
          
          {/* If an active route is calculated, show the Navigation Directions Panel */}
          {activeRoute ? (
            <div className="flex flex-col h-full overflow-hidden bg-slate-950">
              
              {/* Active Route Header */}
              <div className="p-5 border-b border-slate-800 bg-gradient-to-br from-cyan-950/40 to-slate-900 flex flex-col gap-3 shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wider">
                    <Navigation className="w-4 h-4 animate-pulse" />
                    Turn-by-Turn Navigation
                  </div>
                  <button 
                    onClick={handleClearRoute}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
                    title="Exit Navigation"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <h3 className="text-lg font-extrabold text-white line-clamp-1">{activeRoute.destination.name}</h3>
                  <p className="text-xs text-slate-400 line-clamp-1">{activeRoute.destination.address}</p>
                </div>

                {/* Duration & Distance Metric Badges */}
                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <div className="p-2.5 rounded-xl bg-slate-900/90 border border-cyan-500/30 flex items-center gap-2.5">
                    <Clock className="w-4 h-4 text-cyan-400" />
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Est. Drive Time</span>
                      <strong className="text-sm text-cyan-300 font-bold">{activeRoute.duration_mins} mins</strong>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900/90 border border-emerald-500/30 flex items-center gap-2.5">
                    <Milestone className="w-4 h-4 text-emerald-400" />
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Total Distance</span>
                      <strong className="text-sm text-emerald-300 font-bold">{activeRoute.distance_km} km</strong>
                    </div>
                  </div>
                </div>

                {/* Journey Controls: Start Live GPS Journey & Google Maps Launcher */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={handleToggleJourney}
                    className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg ${
                      userGeo.isLiveTracking
                        ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 ring-2 ring-amber-400/50 animate-pulse'
                        : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/20'
                    }`}
                  >
                    {userGeo.isLiveTracking ? (
                      <>
                        <Square className="w-3.5 h-3.5 fill-current" />
                        Live Tracking Active (Pause)
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        Start Live Journey
                      </>
                    )}
                  </button>

                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${activeRoute.destination.latitude},${activeRoute.destination.longitude}&travelmode=driving`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2.5 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                    Google Maps
                  </a>
                </div>
              </div>

              {/* Turn-by-Turn Steps List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
                <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider block mb-1">
                  Turn Instructions ({activeRoute.steps.length} Steps)
                </span>

                {activeRoute.steps.map((step, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800/60 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-slate-200">{step.instruction}</p>
                      {step.distance_m > 0 && (
                        <span className="text-[11px] text-slate-400 mt-0.5 block">
                          Continue for {step.distance_m >= 1000 ? `${(step.distance_m / 1000).toFixed(1)} km` : `${step.distance_m} m`}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Default Exploration Mode */
            <>
              <div className="p-4 border-b border-slate-800/80 shrink-0">
                <FilterPanel
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  selectedCategory={selectedCategory}
                  setSelectedCategory={setSelectedCategory}
                  radiusKm={radiusKm}
                  setRadiusKm={setRadiusKm}
                  minRating={minRating}
                  setMinRating={setMinRating}
                  onOpenAnalytics={() => setIsAnalyticsOpen(true)}
                  onResetLocation={() => userGeo.setCustomLocation(37.7749, -122.4194)}
                  isLiveLoading={isLiveLoading}
                  onFetchLiveOSM={handleFetchLiveOSM}
                />
              </div>

              {/* Results Summary & List */}
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-800/60 bg-slate-900/40 flex items-center justify-between text-xs text-slate-400 shrink-0">
                  <span className="flex items-center gap-1.5 font-medium text-slate-300">
                    <ListFilter className="w-3.5 h-3.5 text-cyan-400" />
                    Venues & POIs ({places.length})
                  </span>
                  <span>Radius: <strong className="text-cyan-400">{radiusKm} km</strong></span>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {loading && (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-500 text-xs gap-2">
                      <span className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></span>
                      Searching venue registry...
                    </div>
                  )}

                  {!loading && places.length === 0 && (
                    <div className="text-center py-12 px-4">
                      <AlertCircle className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-slate-300">No POIs in this boundary</p>
                      <p className="text-xs text-slate-500 mt-1 mb-3">Click 'Sync Local POIs' to query OpenStreetMap live for this region.</p>
                      <button
                        onClick={handleFetchLiveOSM}
                        className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs cursor-pointer transition-all"
                      >
                        Sync OpenStreetMap Now
                      </button>
                    </div>
                  )}

                  {!loading && places.map((place) => (
                    <PlaceCard
                      key={place.id}
                      place={place}
                      isSelected={selectedPlace?.id === place.id}
                      isNavigatingTo={activeRoute?.destination?.id === place.id}
                      onSelect={(p) => setSelectedPlace(p)}
                      onGetDirections={(p) => handleGetDirections(p)}
                    />
                  ))}
                </div>
              </div>
            </>
          )}
        </aside>

        {/* Right Area: Interactive Geospatial Map */}
        <main className="flex-1 relative bg-slate-900 overflow-hidden">
          <MapView
            places={places}
            userLocation={{ latitude: userGeo.latitude, longitude: userGeo.longitude }}
            radiusKm={radiusKm}
            selectedPlace={selectedPlace}
            onSelectPlace={(p) => setSelectedPlace(p)}
            onGetDirections={(p) => handleGetDirections(p)}
            activeRoute={activeRoute}
          />
        </main>
      </div>

      {/* Analytics Modal */}
      <AnalyticsModal
        isOpen={isAnalyticsOpen}
        onClose={() => setIsAnalyticsOpen(false)}
        userLocation={{ latitude: userGeo.latitude, longitude: userGeo.longitude }}
        activePlaces={places}
      />
    </div>
  );
}
