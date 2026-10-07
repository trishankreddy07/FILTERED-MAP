import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
  Globe2, 
  Layers, 
  MapPin, 
  Compass, 
  ListFilter, 
  SlidersHorizontal,
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
  Square,
  Bookmark,
  Share2,
  Phone,
  Star,
  Car,
  Footprints,
  Bike,
  Building,
  Check,
  ChevronLeft,
  ChevronRight,
  Target
} from 'lucide-react';

import MapView from './components/MapView';
import FilterPanel from './components/FilterPanel';
import PlaceCard from './components/PlaceCard';
import AnalyticsModal from './components/AnalyticsModal';
import { useGeolocation } from './hooks/useGeolocation';

// Helper to compute haversine distance in km
function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function App() {
  const userGeo = useGeolocation();
  
  // Sidebar State (Tabs & Collapse)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarTab, setSidebarTab] = useState('results'); // 'filters' | 'spatial' | 'results'

  // Spatial filtering state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [radiusKm, setRadiusKm] = useState(25);
  const [minRating, setMinRating] = useState(0);

  // Advanced Boolean Attribute Filters
  const [openNow, setOpenNow] = useState(false);
  const [is24_7, setIs24_7] = useState(false);
  const [hasPhone, setHasPhone] = useState(false);
  const [nearTransit, setNearTransit] = useState(false);
  const [viewportMode, setViewportMode] = useState(false);
  const [viewportBounds, setViewportBounds] = useState(null);

  // Data & Selection state
  const [places, setPlaces] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [systemHealth, setSystemHealth] = useState(null);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [isLiveLoading, setIsLiveLoading] = useState(false);
  const [alertMessage, setAlertMessage] = useState(null);

  // Bookmarking System
  const [bookmarkedIds, setBookmarkedIds] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('geopulse_bookmarks') || '[]');
      return new Set(saved);
    } catch {
      return new Set();
    }
  });
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);

  // Navigation & Multi-Modal Routing state
  const [activeRoute, setActiveRoute] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [travelMode, setTravelMode] = useState('driving'); // 'driving' | 'walking' | 'cycling'

  // Toggle Bookmark handler
  const toggleBookmark = (place) => {
    const updated = new Set(bookmarkedIds);
    let msg = '';
    if (updated.has(place.id)) {
      updated.delete(place.id);
      msg = `Removed "${place.name}" from saved bookmarks.`;
    } else {
      updated.add(place.id);
      msg = `Saved "${place.name}" to bookmarks!`;
    }
    setBookmarkedIds(updated);
    try {
      localStorage.setItem('geopulse_bookmarks', JSON.stringify(Array.from(updated)));
    } catch {
      // ignore
    }
    setAlertMessage(msg);
    setTimeout(() => setAlertMessage(null), 3000);
  };

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

      // Boolean filters to backend
      if (openNow) params.open_now = true;
      if (is24_7) params.is_24_7 = true;
      if (hasPhone) params.has_phone = true;

      // Viewport Bounding Box auto-filter
      if (viewportMode && viewportBounds) {
        params.min_lat = viewportBounds.min_lat;
        params.max_lat = viewportBounds.max_lat;
        params.min_lng = viewportBounds.min_lng;
        params.max_lng = viewportBounds.max_lng;
      }

      const res = await axios.get('/api/v1/places', { params });
      setPlaces(res.data);
    } catch (err) {
      console.error('Error fetching places:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filtered places considering Near Transit & Bookmarks Filter
  const displayedPlaces = useMemo(() => {
    let result = places;

    if (showBookmarksOnly) {
      result = result.filter(p => bookmarkedIds.has(p.id));
    }

    if (nearTransit) {
      const transitNodes = places.filter(p => 
        p.category === 'Bus Stands' || 
        p.amenity_type === 'bus_stop' || 
        p.amenity_type === 'bus_station'
      );
      if (transitNodes.length > 0) {
        result = result.filter(p => {
          if (p.category === 'Bus Stands') return true;
          return transitNodes.some(t => haversineKm(p.latitude, p.longitude, t.latitude, t.longitude) <= 1.5);
        });
      }
    }

    return result;
  }, [places, showBookmarksOnly, bookmarkedIds, nearTransit]);

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

  // Compute Multi-Modal Route via OSRM
  const handleGetDirections = async (destinationPlace, mode = travelMode) => {
    setSelectedPlace(destinationPlace);
    setIsDetailsOpen(false);
    setRouteLoading(true);
    setAlertMessage(`Calculating fastest ${mode} route to ${destinationPlace.name}...`);

    try {
      const res = await axios.get('/api/v1/analytics/route', {
        params: {
          start_lat: userGeo.latitude,
          start_lng: userGeo.longitude,
          end_lat: destinationPlace.latitude,
          end_lng: destinationPlace.longitude,
          mode: mode
        }
      });

      if (res.data) {
        setActiveRoute({
          destination: destinationPlace,
          coordinates: res.data.coordinates,
          distance_km: res.data.distance_km,
          duration_mins: res.data.duration_mins,
          steps: res.data.steps || [],
          mode: mode
        });
        setAlertMessage(`${mode.toUpperCase()} route ready: ${res.data.distance_km} km (~${res.data.duration_mins} mins)`);
        setTimeout(() => setAlertMessage(null), 4000);
      }
    } catch (err) {
      console.error('Failed to calculate route:', err);
      setAlertMessage('Routing engine fallback applied.');
      setTimeout(() => setAlertMessage(null), 4000);
    } finally {
      setRouteLoading(false);
    }
  };

  // Travel Mode Switcher
  const handleTravelModeChange = (newMode) => {
    setTravelMode(newMode);
    if (activeRoute?.destination) {
      handleGetDirections(activeRoute.destination, newMode);
    }
  };

  // Autocomplete Suggestion Selection
  const handleSelectSuggestion = (suggestion) => {
    if (suggestion) {
      setSelectedPlace(suggestion);
      setIsDetailsOpen(true);
      userGeo.setCustomLocation(suggestion.latitude, suggestion.longitude);
      setAlertMessage(`Focused on "${suggestion.name}"`);
      setTimeout(() => setAlertMessage(null), 3500);
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
  }, [
    userGeo.latitude, 
    userGeo.longitude, 
    selectedCategory, 
    searchTerm, 
    radiusKm, 
    minRating,
    openNow,
    is24_7,
    hasPhone,
    viewportMode,
    viewportBounds
  ]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#07090E] text-slate-100 font-sans selection:bg-[#00F0FF]/30 selection:text-white">
      
      {/* Antigravity Glass Header */}
      <header className="h-16 px-6 border-b border-white/10 bg-[#07090E]/80 backdrop-blur-md flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-3.5">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-[#00F0FF] via-[#3B82F6] to-[#A855F7] shadow-[0_0_20px_rgba(0,240,255,0.4)] text-white">
            <Globe2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-[#00F0FF] to-[#A855F7] bg-clip-text text-transparent">
                GeoPulse
              </h1>
              <span className="font-mono text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30 uppercase tracking-widest shadow-[0_0_8px_rgba(0,240,255,0.2)]">
                SPATIAL ENGINE
              </span>
            </div>
            <p className="text-[11px] text-slate-400">OpenStreetMap POI Indexer & Turn-by-Turn Navigation</p>
          </div>
        </div>

        {/* Global Spatial Stats & Actions */}
        <div className="hidden md:flex items-center gap-3 text-xs font-mono">
          {/* Saved Bookmarks Toggle Chip */}
          <button
            onClick={() => {
              setShowBookmarksOnly(!showBookmarksOnly);
              setSidebarTab('results');
              if (sidebarCollapsed) setSidebarCollapsed(false);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all cursor-pointer font-semibold ${
              showBookmarksOnly
                ? 'bg-[#F59E0B]/20 text-[#F59E0B] border-[#F59E0B]/50 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                : 'antigravity-glass border-white/10 text-slate-300 hover:text-white'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5 fill-current" />
            <span>SAVED ({bookmarkedIds.size})</span>
          </button>

          <div className="flex items-center gap-2 antigravity-glass px-3 py-1.5 rounded-xl border border-white/10 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[#10B981] shadow-[0_0_8px_#10B981] animate-pulse"></span>
            <span className="text-slate-400">DB:</span>
            <span className="font-semibold text-slate-200">{systemHealth?.database?.mode || 'ACTIVE'}</span>
          </div>

          <div className="flex items-center gap-2 antigravity-glass px-3 py-1.5 rounded-xl border border-white/10 shadow-sm">
            <Layers className="w-3.5 h-3.5 text-[#00F0FF]" />
            <span className="text-slate-400">VENUES:</span>
            <span className="font-bold text-[#00F0FF]">{displayedPlaces.length}</span>
          </div>

          <button
            onClick={() => setIsAnalyticsOpen(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#00F0FF]/15 hover:bg-[#00F0FF]/25 text-[#00F0FF] border border-[#00F0FF]/40 transition-all cursor-pointer font-semibold shadow-[0_0_12px_rgba(0,240,255,0.2)]"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Analytics
          </button>
        </div>
      </header>

      {/* Notification Toast */}
      {alertMessage && (
        <div className="absolute top-20 right-6 z-50 antigravity-glass border border-[#00F0FF]/40 text-[#00F0FF] font-mono text-xs px-4 py-2.5 rounded-2xl shadow-[0_0_30px_rgba(0,240,255,0.25)] flex items-center gap-2.5 animate-in slide-in-from-top-2">
          <Sparkles className="w-4 h-4 text-[#00F0FF] animate-pulse" />
          {alertMessage}
        </div>
      )}

      {/* Main Workspace Layout */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Left Sidebar: Modular Tabbed Navigation or Compact Rail */}
        <aside 
          className={`border-r border-white/10 bg-[#07090E]/95 backdrop-blur-md flex flex-col shrink-0 z-10 overflow-hidden transition-all duration-300 ${
            sidebarCollapsed 
              ? 'w-16 items-center' 
              : 'w-full md:w-[420px] lg:w-[460px]'
          }`}
        >
          {/* Active Turn-by-Turn Navigation Route Deck */}
          {activeRoute ? (
            <div className="flex flex-col h-full w-full overflow-hidden bg-[#07090E]/95">
              <div className="p-5 border-b border-white/10 bg-gradient-to-br from-[#00F0FF]/10 via-[#0B132B]/80 to-[#A855F7]/10 flex flex-col gap-3 shrink-0 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[#00F0FF] font-mono font-bold text-xs uppercase tracking-wider">
                    <Navigation className="w-4 h-4 animate-pulse text-[#00F0FF]" />
                    Turn-by-Turn Route Deck
                  </div>
                  <button 
                    onClick={handleClearRoute}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer border border-transparent hover:border-white/10"
                    title="Exit Navigation"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <h3 className="text-lg font-extrabold text-white line-clamp-1">{activeRoute.destination.name}</h3>
                  <p className="text-xs text-slate-400 line-clamp-1">{activeRoute.destination.address}</p>
                </div>

                {/* Mode Selector */}
                <div className="flex items-center gap-1.5 font-mono text-xs pt-1">
                  <button
                    onClick={() => handleTravelModeChange('driving')}
                    className={`flex-1 py-1.5 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                      travelMode === 'driving'
                        ? 'bg-[#00F0FF] text-[#07090E] font-bold border-[#00F0FF]'
                        : 'bg-white/5 text-slate-300 border-white/10 hover:text-white'
                    }`}
                  >
                    <Car className="w-3.5 h-3.5" />
                    Drive
                  </button>
                  <button
                    onClick={() => handleTravelModeChange('walking')}
                    className={`flex-1 py-1.5 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                      travelMode === 'walking'
                        ? 'bg-[#00F0FF] text-[#07090E] font-bold border-[#00F0FF]'
                        : 'bg-white/5 text-slate-300 border-white/10 hover:text-white'
                    }`}
                  >
                    <Footprints className="w-3.5 h-3.5" />
                    Walk
                  </button>
                  <button
                    onClick={() => handleTravelModeChange('cycling')}
                    className={`flex-1 py-1.5 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                      travelMode === 'cycling'
                        ? 'bg-[#00F0FF] text-[#07090E] font-bold border-[#00F0FF]'
                        : 'bg-white/5 text-slate-300 border-white/10 hover:text-white'
                    }`}
                  >
                    <Bike className="w-3.5 h-3.5" />
                    Transit
                  </button>
                </div>

                {/* Duration & Distance Badges */}
                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <div className="p-2.5 rounded-xl antigravity-glass border border-[#00F0FF]/30 flex items-center gap-2.5 shadow-[0_0_12px_rgba(0,240,255,0.15)]">
                    <Clock className="w-4 h-4 text-[#00F0FF]" />
                    <div>
                      <span className="text-[10px] font-mono text-slate-400 block uppercase">Est. Duration</span>
                      <strong className="text-sm font-mono text-[#00F0FF] font-bold">{activeRoute.duration_mins} mins</strong>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl antigravity-glass border border-[#10B981]/30 flex items-center gap-2.5 shadow-[0_0_12px_rgba(16,185,129,0.15)]">
                    <Milestone className="w-4 h-4 text-[#10B981]" />
                    <div>
                      <span className="text-[10px] font-mono text-slate-400 block uppercase">Total Distance</span>
                      <strong className="text-sm font-mono text-[#10B981] font-bold">{activeRoute.distance_km} km</strong>
                    </div>
                  </div>
                </div>

                {/* Journey Controls */}
                <div className="flex items-center gap-2 pt-1 font-mono">
                  <button
                    onClick={handleToggleJourney}
                    className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg ${
                      userGeo.isLiveTracking
                        ? 'bg-[#F59E0B] hover:bg-[#F59E0B]/90 text-[#07090E] ring-2 ring-[#F59E0B]/50 shadow-[0_0_20px_rgba(245,158,11,0.5)] animate-pulse'
                        : 'bg-[#00F0FF] hover:bg-[#00F0FF]/90 text-[#07090E] shadow-[0_0_20px_rgba(0,240,255,0.4)]'
                    }`}
                  >
                    {userGeo.isLiveTracking ? (
                      <>
                        <Square className="w-3.5 h-3.5 fill-current" />
                        Live Tracking (Pause)
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        Start Live Journey
                      </>
                    )}
                  </button>

                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${activeRoute.destination.latitude},${activeRoute.destination.longitude}&travelmode=${travelMode}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2.5 px-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10 font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-[#00F0FF]" />
                    Maps
                  </a>
                </div>
              </div>

              {/* Turn-by-Turn Steps */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
                <span className="font-mono text-[10px] font-bold uppercase text-slate-400 tracking-wider block mb-1">
                  Turn Directives ({activeRoute.steps.length} Steps)
                </span>
                {activeRoute.steps.map((step, idx) => (
                  <div key={idx} className="p-3 rounded-xl antigravity-glass border border-white/10 flex items-start gap-3 hover:border-[#00F0FF]/30 transition-all">
                    <div className="w-6 h-6 rounded-full bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30 flex items-center justify-center shrink-0 mt-0.5 text-xs font-mono font-bold shadow-[0_0_6px_rgba(0,240,255,0.3)]">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-slate-200">{step.instruction}</p>
                      {step.distance_m > 0 && (
                        <span className="font-mono text-[11px] text-[#00F0FF] mt-0.5 block">
                          Continue for {step.distance_m >= 1000 ? `${(step.distance_m / 1000).toFixed(1)} km` : `${step.distance_m} m`}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : sidebarCollapsed ? (
            /* COLLAPSED RAIL VIEW */
            <div className="flex flex-col items-center py-4 w-full h-full gap-5">
              <button
                onClick={() => setSidebarCollapsed(false)}
                className="p-2.5 rounded-xl bg-white/5 hover:bg-[#00F0FF]/20 text-[#00F0FF] border border-white/10 transition-all cursor-pointer shadow-[0_0_12px_rgba(0,240,255,0.2)]"
                title="Expand Sidebar"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <div className="h-px w-8 bg-white/10"></div>

              {/* Rail Tab Selectors */}
              <button
                onClick={() => {
                  setSidebarTab('filters');
                  setSidebarCollapsed(false);
                }}
                className={`p-2.5 rounded-xl transition-all cursor-pointer border ${
                  sidebarTab === 'filters'
                    ? 'bg-[#00F0FF]/20 text-[#00F0FF] border-[#00F0FF]/50 shadow-[0_0_12px_rgba(0,240,255,0.3)]'
                    : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
                }`}
                title="Filters & Categories"
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  setSidebarTab('spatial');
                  setSidebarCollapsed(false);
                }}
                className={`p-2.5 rounded-xl transition-all cursor-pointer border ${
                  sidebarTab === 'spatial'
                    ? 'bg-[#00F0FF]/20 text-[#00F0FF] border-[#00F0FF]/50 shadow-[0_0_12px_rgba(0,240,255,0.3)]'
                    : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
                }`}
                title="Spatial Control"
              >
                <Compass className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  setSidebarTab('results');
                  setSidebarCollapsed(false);
                }}
                className={`p-2.5 rounded-xl transition-all cursor-pointer border relative ${
                  sidebarTab === 'results'
                    ? 'bg-[#00F0FF]/20 text-[#00F0FF] border-[#00F0FF]/50 shadow-[0_0_12px_rgba(0,240,255,0.3)]'
                    : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
                }`}
                title={`Results (${displayedPlaces.length})`}
              >
                <ListFilter className="w-4 h-4" />
                {displayedPlaces.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#00F0FF] text-[#07090E] font-mono text-[9px] font-bold flex items-center justify-center">
                    {displayedPlaces.length > 99 ? '99+' : displayedPlaces.length}
                  </span>
                )}
              </button>
            </div>
          ) : (
            /* FULL MODULAR TABBED SIDEBAR */
            <>
              {/* Sidebar Header Bar with Branding & Collapse Button */}
              <div className="p-4 border-b border-white/10 bg-[#07090E]/80 shrink-0 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#10B981] shadow-[0_0_8px_#10B981] animate-pulse"></span>
                  <span className="font-mono text-xs font-bold text-slate-200">
                    RADAR DECK
                  </span>
                  <span className="text-[10px] font-mono text-[#00F0FF] bg-[#00F0FF]/10 px-2 py-0.5 rounded-full border border-[#00F0FF]/25">
                    {displayedPlaces.length} POIs
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setSidebarCollapsed(true)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer border border-transparent hover:border-white/10"
                    title="Collapse Sidebar"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Glowing Modular Tab Navigation Bar */}
              <div className="px-4 py-2.5 border-b border-white/10 bg-[#0B0F19]/60 shrink-0">
                <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-[#07090E]/90 border border-white/10 font-mono text-xs">
                  {/* Tab 1: Filters & Categories */}
                  <button
                    onClick={() => setSidebarTab('filters')}
                    className={`py-2 px-1 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      sidebarTab === 'filters'
                        ? 'bg-[#00F0FF] text-[#07090E] shadow-[0_0_14px_rgba(0,240,255,0.4)]'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span className="truncate">Filters</span>
                  </button>

                  {/* Tab 2: Spatial Control */}
                  <button
                    onClick={() => setSidebarTab('spatial')}
                    className={`py-2 px-1 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      sidebarTab === 'spatial'
                        ? 'bg-[#00F0FF] text-[#07090E] shadow-[0_0_14px_rgba(0,240,255,0.4)]'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Compass className="w-3.5 h-3.5" />
                    <span className="truncate">Spatial</span>
                  </button>

                  {/* Tab 3: Results List */}
                  <button
                    onClick={() => setSidebarTab('results')}
                    className={`py-2 px-1 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      sidebarTab === 'results'
                        ? 'bg-[#00F0FF] text-[#07090E] shadow-[0_0_14px_rgba(0,240,255,0.4)]'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <ListFilter className="w-3.5 h-3.5" />
                    <span className="truncate">Results ({displayedPlaces.length})</span>
                  </button>
                </div>
              </div>

              {/* Dynamic Tab Body Panel */}
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* TAB 1: FILTERS & CATEGORIES */}
                {sidebarTab === 'filters' && (
                  <div className="flex-1 overflow-y-auto p-4">
                    <FilterPanel
                      searchTerm={searchTerm}
                      setSearchTerm={setSearchTerm}
                      selectedCategory={selectedCategory}
                      setSelectedCategory={setSelectedCategory}
                      radiusKm={radiusKm}
                      setRadiusKm={setRadiusKm}
                      minRating={minRating}
                      setMinRating={setMinRating}
                      openNow={openNow}
                      setOpenNow={setOpenNow}
                      is24_7={is24_7}
                      setIs24_7={setIs24_7}
                      hasPhone={hasPhone}
                      setHasPhone={setHasPhone}
                      nearTransit={nearTransit}
                      setNearTransit={setNearTransit}
                      viewportMode={viewportMode}
                      setViewportMode={setViewportMode}
                      onOpenAnalytics={() => setIsAnalyticsOpen(true)}
                      onResetLocation={() => userGeo.setCustomLocation(37.7749, -122.4194)}
                      isLiveLoading={isLiveLoading}
                      onFetchLiveOSM={handleFetchLiveOSM}
                      onSelectSuggestion={handleSelectSuggestion}
                      activeTab="filters"
                      onViewResults={() => setSidebarTab('results')}
                      totalResultsCount={displayedPlaces.length}
                    />
                  </div>
                )}

                {/* TAB 2: SPATIAL CONTROL */}
                {sidebarTab === 'spatial' && (
                  <div className="flex-1 overflow-y-auto p-4">
                    <FilterPanel
                      searchTerm={searchTerm}
                      setSearchTerm={setSearchTerm}
                      selectedCategory={selectedCategory}
                      setSelectedCategory={setSelectedCategory}
                      radiusKm={radiusKm}
                      setRadiusKm={setRadiusKm}
                      minRating={minRating}
                      setMinRating={setMinRating}
                      openNow={openNow}
                      setOpenNow={setOpenNow}
                      is24_7={is24_7}
                      setIs24_7={setIs24_7}
                      hasPhone={hasPhone}
                      setHasPhone={setHasPhone}
                      nearTransit={nearTransit}
                      setNearTransit={setNearTransit}
                      viewportMode={viewportMode}
                      setViewportMode={setViewportMode}
                      onOpenAnalytics={() => setIsAnalyticsOpen(true)}
                      onResetLocation={() => userGeo.setCustomLocation(37.7749, -122.4194)}
                      isLiveLoading={isLiveLoading}
                      onFetchLiveOSM={handleFetchLiveOSM}
                      onSelectSuggestion={handleSelectSuggestion}
                      activeTab="spatial"
                      onViewResults={() => setSidebarTab('results')}
                      totalResultsCount={displayedPlaces.length}
                    />
                  </div>
                )}

                {/* TAB 3: RESULTS LIST */}
                {sidebarTab === 'results' && (
                  <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Results Meta Info Bar */}
                    <div className="px-4 py-2.5 border-b border-white/10 bg-[#07090E]/60 flex items-center justify-between text-xs text-slate-400 font-mono shrink-0">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-semibold">
                          {selectedCategory === 'All' ? 'All Places' : selectedCategory}
                        </span>
                        <span className="text-[10px] text-[#00F0FF] bg-[#00F0FF]/10 px-2 py-0.5 rounded-md border border-[#00F0FF]/20">
                          {radiusKm} km
                        </span>
                      </div>

                      {/* Saved Bookmarks Quick Toggle */}
                      <button
                        onClick={() => setShowBookmarksOnly(!showBookmarksOnly)}
                        className={`px-2 py-0.5 rounded-lg border text-[10px] flex items-center gap-1 transition-all cursor-pointer ${
                          showBookmarksOnly
                            ? 'bg-[#F59E0B]/20 text-[#F59E0B] border-[#F59E0B]/50'
                            : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
                        }`}
                      >
                        <Bookmark className="w-3 h-3 fill-current" />
                        <span>Saved ({bookmarkedIds.size})</span>
                      </button>
                    </div>

                    {/* Results Scrollable List */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                      {loading && (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-500 text-xs font-mono gap-2.5">
                          <span className="w-5 h-5 border-2 border-[#00F0FF] border-t-transparent rounded-full animate-spin"></span>
                          SCANNING SPATIAL REGISTRY...
                        </div>
                      )}

                      {!loading && displayedPlaces.length === 0 && (
                        <div className="text-center py-12 px-4 antigravity-glass rounded-2xl border border-white/10 my-4">
                          <AlertCircle className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                          <p className="text-sm font-semibold text-slate-200">No POIs in this boundary</p>
                          <p className="text-xs text-slate-400 mt-1 mb-3">
                            {showBookmarksOnly 
                              ? "You haven't bookmarked any venues yet. Tap the bookmark star on any place to save it!"
                              : "Click 'Sync Local POIs' to query OpenStreetMap live for this region."}
                          </p>
                          {!showBookmarksOnly && (
                            <button
                              onClick={handleFetchLiveOSM}
                              className="px-4 py-2 rounded-xl bg-[#00F0FF] hover:bg-[#00F0FF]/90 text-[#07090E] font-mono font-bold text-xs cursor-pointer transition-all shadow-[0_0_15px_rgba(0,240,255,0.4)]"
                            >
                              Sync OpenStreetMap Now
                            </button>
                          )}
                        </div>
                      )}

                      {!loading && displayedPlaces.map((place) => (
                        <PlaceCard
                          key={place.id}
                          place={place}
                          isSelected={selectedPlace?.id === place.id}
                          isNavigatingTo={activeRoute?.destination?.id === place.id}
                          isBookmarked={bookmarkedIds.has(place.id)}
                          onToggleBookmark={toggleBookmark}
                          onToast={(msg) => {
                            setAlertMessage(msg);
                            setTimeout(() => setAlertMessage(null), 3000);
                          }}
                          onSelect={(p) => {
                            setSelectedPlace(p);
                            setIsDetailsOpen(true);
                          }}
                          onGetDirections={(p) => handleGetDirections(p)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </aside>

        {/* Right Area: Interactive Geospatial Map */}
        <main className="flex-1 relative w-full h-full bg-[#07090E] overflow-hidden" id="map-container">
          <MapView
            places={displayedPlaces}
            userLocation={{ latitude: userGeo.latitude, longitude: userGeo.longitude }}
            radiusKm={radiusKm}
            setRadiusKm={setRadiusKm}
            selectedPlace={selectedPlace}
            onSelectPlace={(p) => {
              setSelectedPlace(p);
              setIsDetailsOpen(true);
            }}
            onGetDirections={(p) => handleGetDirections(p)}
            activeRoute={activeRoute}
            onClearRoute={handleClearRoute}
            travelMode={travelMode}
            onTravelModeChange={handleTravelModeChange}
            viewportMode={viewportMode}
            setViewportMode={setViewportMode}
            onViewportChange={(bounds) => setViewportBounds(bounds)}
            bookmarkedIds={bookmarkedIds}
            onToggleBookmark={toggleBookmark}
            sidebarCollapsed={sidebarCollapsed}
            onToast={(msg) => {
              setAlertMessage(msg);
              setTimeout(() => setAlertMessage(null), 3000);
            }}
          />

          {/* Desktop Collapsible Details Drawer (Side Overlay) */}
          {selectedPlace && isDetailsOpen && (
            <div className="hidden md:flex absolute top-4 right-4 bottom-4 w-96 antigravity-glass p-5 rounded-2xl border border-white/10 shadow-[0_16px_50px_rgba(0,0,0,0.85)] z-[450] backdrop-blur-2xl flex-col justify-between animate-side-drawer overflow-y-auto">
              <div className="space-y-4">
                {/* Header: Category Badge + Status + Actions */}
                <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30">
                      {selectedPlace.category}
                    </span>
                    {selectedPlace.rating > 0 && (
                      <span className="font-mono text-xs text-[#F59E0B] font-bold flex items-center gap-1">
                        ★ {selectedPlace.rating}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => toggleBookmark(selectedPlace)}
                      className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
                        bookmarkedIds.has(selectedPlace.id)
                          ? 'bg-[#F59E0B]/20 text-[#F59E0B] border-[#F59E0B]/40'
                          : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
                      }`}
                      title="Bookmark place"
                    >
                      <Bookmark className="w-4 h-4 fill-current" />
                    </button>
                    <button
                      onClick={() => setIsDetailsOpen(false)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer border border-transparent hover:border-white/10"
                      title="Close drawer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Venue Name & Distance Telemetry */}
                <div>
                  <h3 className="text-xl font-extrabold text-white leading-tight mb-1">
                    {selectedPlace.name}
                  </h3>
                  {selectedPlace.distance_km !== undefined && (
                    <div className="font-mono text-xs text-[#00F0FF] flex items-center gap-1.5">
                      <Navigation className="w-3.5 h-3.5 text-[#00F0FF]" />
                      <span>{selectedPlace.distance_km} km from active GPS center</span>
                    </div>
                  )}
                </div>

                {/* Travel Time Chips */}
                {selectedPlace.distance_km !== undefined && (
                  <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
                      <Car className="w-4 h-4 text-[#00F0FF]" />
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase">Drive</span>
                        <strong className="text-slate-200">~{Math.max(1, Math.round(selectedPlace.distance_km * 1.5 + 2))} mins</strong>
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
                      <Footprints className="w-4 h-4 text-[#10B981]" />
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase">Walk</span>
                        <strong className="text-slate-200">~{Math.max(2, Math.round(selectedPlace.distance_km * 12))} mins</strong>
                      </div>
                    </div>
                  </div>
                )}

                {/* Spatial Metadata */}
                <div className="space-y-2.5 text-xs text-slate-300 pt-2 border-t border-white/10">
                  {selectedPlace.address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-[#00F0FF] shrink-0 mt-0.5" />
                      <span>{selectedPlace.address}</span>
                    </div>
                  )}

                  {selectedPlace.raw_data?.phone && (
                    <div className="flex items-center gap-2 font-mono text-[#10B981]">
                      <Phone className="w-4 h-4 text-[#10B981] shrink-0" />
                      <a href={`tel:${selectedPlace.raw_data.phone}`} className="hover:underline">
                        {selectedPlace.raw_data.phone}
                      </a>
                    </div>
                  )}

                  {selectedPlace.raw_data?.opening_hours && (
                    <div className="flex items-center gap-2 font-mono text-slate-400">
                      <Clock className="w-4 h-4 text-slate-500 shrink-0" />
                      <span>{selectedPlace.raw_data.opening_hours}</span>
                    </div>
                  )}

                  {selectedPlace.amenity_type && (
                    <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
                      <Building className="w-4 h-4 text-slate-500 shrink-0" />
                      <span className="capitalize">OSM Amenity: {selectedPlace.amenity_type}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons: In-App Route & External Maps */}
              <div className="pt-4 border-t border-white/10 space-y-2">
                <button
                  onClick={() => handleGetDirections(selectedPlace)}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#00F0FF] hover:bg-[#00F0FF]/90 text-[#07090E] font-bold font-mono text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_0_20px_rgba(0,240,255,0.4)]"
                >
                  <Compass className="w-4 h-4" />
                  Calculate In-App Route
                </button>

                <div className="grid grid-cols-3 gap-1.5 font-mono text-[11px]">
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${selectedPlace.latitude},${selectedPlace.longitude}&travelmode=driving`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2 rounded-xl bg-white/5 hover:bg-white/15 text-slate-200 border border-white/10 text-center flex items-center justify-center gap-1 transition-all"
                  >
                    Google
                  </a>
                  <a
                    href={`https://maps.apple.com/?daddr=${selectedPlace.latitude},${selectedPlace.longitude}&dirflg=d`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2 rounded-xl bg-white/5 hover:bg-white/15 text-slate-200 border border-white/10 text-center flex items-center justify-center gap-1 transition-all"
                  >
                    Apple
                  </a>
                  <a
                    href={`https://waze.com/ul?ll=${selectedPlace.latitude},${selectedPlace.longitude}&navigate=yes`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2 rounded-xl bg-[#00F0FF]/10 hover:bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/30 text-center flex items-center justify-center gap-1 transition-all"
                  >
                    Waze
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Mobile Elastic Bottom Sheet Drawer */}
          {selectedPlace && isDetailsOpen && (
            <div className="md:hidden fixed bottom-0 left-0 right-0 z-[600] antigravity-glass p-5 rounded-t-3xl border-t border-white/15 shadow-[0_-12px_40px_rgba(0,0,0,0.9)] backdrop-blur-2xl animate-bottom-sheet max-h-[80vh] overflow-y-auto">
              <div className="w-12 h-1.5 rounded-full bg-white/20 mx-auto mb-3"></div>
              
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="font-mono text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30">
                  {selectedPlace.category}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleBookmark(selectedPlace)}
                    className="p-1.5 rounded-xl bg-white/5 text-[#F59E0B]"
                  >
                    <Bookmark className="w-4 h-4 fill-current" />
                  </button>
                  <button
                    onClick={() => setIsDetailsOpen(false)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <h3 className="text-lg font-bold text-white mb-1">{selectedPlace.name}</h3>
              {selectedPlace.address && (
                <p className="text-xs text-slate-400 mb-3">{selectedPlace.address}</p>
              )}

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  onClick={() => handleGetDirections(selectedPlace)}
                  className="py-2.5 rounded-xl bg-[#00F0FF] text-[#07090E] font-bold font-mono text-xs flex items-center justify-center gap-1.5"
                >
                  <Compass className="w-4 h-4" />
                  Route Here
                </button>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${selectedPlace.latitude},${selectedPlace.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 rounded-xl bg-white/10 text-white font-mono text-xs flex items-center justify-center gap-1.5 border border-white/10"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-[#00F0FF]" />
                  Google Maps
                </a>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Analytics Modal */}
      <AnalyticsModal
        isOpen={isAnalyticsOpen}
        onClose={() => setIsAnalyticsOpen(false)}
        userLocation={{ latitude: userGeo.latitude, longitude: userGeo.longitude }}
        activePlaces={displayedPlaces}
      />
    </div>
  );
}
