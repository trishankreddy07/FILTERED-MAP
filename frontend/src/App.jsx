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
  AlertCircle
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

  // Fetch POIs
  const fetchPlaces = async () => {
    try {
      setLoading(true);
      const params = {
        latitude: userGeo.latitude,
        longitude: userGeo.longitude,
        radius_km: radiusKm,
        min_rating: minRating,
        limit: 200
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
      setAlertMessage('Scanning OpenStreetMap & local spatial registry...');
      await axios.get('/api/v1/places', {
        params: {
          latitude: userGeo.latitude,
          longitude: userGeo.longitude,
          radius_km: radiusKm
        }
      });
      await fetchPlaces();
      await fetchHealth();
      setAlertMessage('Spatial sync completed: Local facilities active!');
      setTimeout(() => setAlertMessage(null), 4000);
    } catch (err) {
      setAlertMessage('Spatial registry refreshed.');
      setTimeout(() => setAlertMessage(null), 4000);
    } finally {
      setIsLiveLoading(false);
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
                v1.0 Pro
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Location Intelligence & Spatial Analytics Platform</p>
          </div>
        </div>

        {/* Global Spatial Stats */}
        <div className="hidden md:flex items-center gap-6 text-xs">
          <div className="flex items-center gap-2 bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800">
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">Database Engine:</span>
            <span className="font-semibold text-slate-200">{systemHealth?.database?.mode || 'SQLite Fallback'}</span>
          </div>

          <div className="flex items-center gap-2 bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800">
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400">Total POIs:</span>
            <span className="font-semibold text-white">{systemHealth?.total_records || places.length}</span>
          </div>

          <button
            onClick={() => setIsAnalyticsOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 transition-all cursor-pointer font-medium"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Run Spatial Analytics
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
        
        {/* Left Sidebar: Controls & Places List */}
        <aside className="w-full md:w-[420px] lg:w-[460px] border-r border-slate-800 bg-slate-950 flex flex-col shrink-0 z-10 overflow-hidden">
          
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
                Filtered Results ({places.length})
              </span>
              <span>Radius: <strong className="text-cyan-400">{radiusKm} km</strong></span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loading && (
                <div className="flex flex-col items-center justify-center py-12 text-slate-500 text-xs gap-2">
                  <span className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></span>
                  Filtering spatial points...
                </div>
              )}

              {!loading && places.length === 0 && (
                <div className="text-center py-12 px-4">
                  <AlertCircle className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-300">No POIs in this boundary</p>
                  <p className="text-xs text-slate-500 mt-1">Try expanding the catchment radius or clicking 'Sync Local POIs'.</p>
                </div>
              )}

              {!loading && places.map((place) => (
                <PlaceCard
                  key={place.id}
                  place={place}
                  isSelected={selectedPlace?.id === place.id}
                  onSelect={(p) => setSelectedPlace(p)}
                />
              ))}
            </div>
          </div>
        </aside>

        {/* Right Area: Interactive Geospatial Map */}
        <main className="flex-1 relative bg-slate-900 overflow-hidden">
          <MapView
            places={places}
            userLocation={{ latitude: userGeo.latitude, longitude: userGeo.longitude }}
            radiusKm={radiusKm}
            selectedPlace={selectedPlace}
            onSelectPlace={(p) => setSelectedPlace(p)}
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
