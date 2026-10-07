import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  Search, 
  MapPin, 
  Sparkles, 
  RefreshCw,
  Hospital,
  Stethoscope,
  Pill,
  Siren,
  UtensilsCrossed,
  Hotel,
  Landmark,
  Bus,
  Layers,
  SlidersHorizontal,
  Compass,
  Clock,
  ShieldAlert,
  Phone,
  Star,
  History,
  X,
  Scan,
  Check,
  ArrowRight
} from 'lucide-react';

const CATEGORIES = [
  { id: 'All', label: 'All Places', icon: Layers, accent: 'cyan' },
  { id: 'Hospital', label: 'Hospitals', icon: Hospital, accent: 'cyan' },
  { id: 'Clinic', label: 'Clinics', icon: Stethoscope, accent: 'cyan' },
  { id: 'Pharmacy', label: 'Medicals', icon: Pill, accent: 'emerald' },
  { id: 'Emergency Services', label: 'Emergency', icon: Siren, accent: 'rose' },
  { id: 'Restaurant', label: 'Dining & Food', icon: UtensilsCrossed, accent: 'purple' },
  { id: 'Hotel & Stays', label: 'Hotels & Stays', icon: Hotel, accent: 'blue' },
  { id: 'Bus Stands', label: 'Bus Stands', icon: Bus, accent: 'teal' },
  { id: 'Tourist Places', label: 'Tourist Places', icon: Landmark, accent: 'fuchsia' },
];

const RADIUS_PRESETS = [2, 5, 10, 25, 50];

export default function FilterPanel({
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  radiusKm,
  setRadiusKm,
  minRating,
  setMinRating,
  openNow = false,
  setOpenNow,
  is24_7 = false,
  setIs24_7,
  hasPhone = false,
  setHasPhone,
  nearTransit = false,
  setNearTransit,
  viewportMode = false,
  setViewportMode,
  onOpenAnalytics,
  onResetLocation,
  isLiveLoading,
  onFetchLiveOSM,
  onSelectSuggestion,
  activeTab = 'filters', // 'filters' | 'spatial' | 'all'
  onViewResults,
  totalResultsCount = 0
}) {
  // Autocomplete State
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const searchContainerRef = useRef(null);

  // Load Recent Searches from localStorage
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('geopulse_recent_searches') || '[]');
      setRecentSearches(saved);
    } catch {
      setRecentSearches([]);
    }
  }, []);

  // Save recent search
  const saveRecentSearch = (text) => {
    if (!text || !text.trim()) return;
    const clean = text.trim();
    const updated = [clean, ...recentSearches.filter(s => s !== clean)].slice(0, 5);
    setRecentSearches(updated);
    try {
      localStorage.setItem('geopulse_recent_searches', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Search-as-you-type Autocomplete Fetch
  useEffect(() => {
    if (!searchTerm || searchTerm.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await axios.get('/api/v1/places/autocomplete', {
          params: { q: searchTerm.trim(), limit: 6 }
        });
        setSuggestions(res.data || []);
      } catch (err) {
        // Fallback silently if offline
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleSelectAutocomplete = (item) => {
    saveRecentSearch(item.name);
    setSearchTerm(item.name);
    setShowDropdown(false);
    if (onSelectSuggestion) {
      onSelectSuggestion(item);
    }
  };

  // TAB 1: FILTERS & CATEGORIES
  const renderFiltersTab = () => (
    <div className="space-y-4">
      {/* Search-as-you-type Geo-Autocomplete Input */}
      <div ref={searchContainerRef} className="relative z-30">
        <label className="text-[11px] font-mono uppercase tracking-wider text-[#9CA3AF] block mb-1.5 font-bold">
          POI SEARCH & DISCOVERY
        </label>
        <div className="relative">
          <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-[#00F0FF]" />
          <input
            type="text"
            value={searchTerm}
            onFocus={() => setShowDropdown(true)}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowDropdown(true);
            }}
            placeholder="Search venues, clinics, hotels, bus stops..."
            className="w-full pl-10 pr-9 py-2.5 bg-[#07090E]/90 border border-white/10 rounded-xl text-xs text-[#F3F4F6] placeholder-[#4B5563] font-sans focus:outline-none focus:border-[#00F0FF] focus:ring-1 focus:ring-[#00F0FF] focus:shadow-[0_0_15px_rgba(0,240,255,0.25)] transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSuggestions([]);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Floating Autocomplete Dropdown */}
        {showDropdown && (suggestions.length > 0 || recentSearches.length > 0) && (
          <div className="absolute top-full left-0 right-0 mt-2 autocomplete-dropdown rounded-xl overflow-hidden z-50 text-xs font-mono shadow-2xl">
            {/* Live Matches */}
            {suggestions.length > 0 && (
              <div className="p-2 border-b border-white/10">
                <span className="text-[10px] text-[#00F0FF] uppercase tracking-wider block px-2 py-1 font-bold">
                  Instant Suggestions
                </span>
                <div className="space-y-0.5">
                  {suggestions.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleSelectAutocomplete(item)}
                      className="p-2 rounded-lg hover:bg-[#00F0FF]/15 cursor-pointer flex items-center justify-between transition-colors text-slate-200"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <MapPin className="w-3 h-3 text-[#00F0FF] shrink-0" />
                        <span className="font-semibold text-white truncate">{item.name}</span>
                        <span className="text-[10px] text-slate-400 uppercase">({item.category})</span>
                      </div>
                      {item.rating > 0 && (
                        <span className="text-[#F59E0B] font-bold text-[10px] shrink-0 ml-2">★{item.rating}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Searches History */}
            {recentSearches.length > 0 && (
              <div className="p-2">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block px-2 py-1 flex items-center gap-1.5 font-bold">
                  <History className="w-3 h-3 text-slate-400" />
                  Recent Searches
                </span>
                <div className="flex flex-wrap gap-1.5 px-2 pt-1 pb-1">
                  {recentSearches.map((rec, i) => (
                    <span
                      key={i}
                      onClick={() => {
                        setSearchTerm(rec);
                        setShowDropdown(false);
                      }}
                      className="px-2 py-1 rounded-md bg-white/5 hover:bg-[#00F0FF]/20 text-slate-300 hover:text-[#00F0FF] border border-white/10 cursor-pointer text-[10px] transition-colors"
                    >
                      {rec}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Category Grid with Antigravity Glow States */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-[11px] font-mono uppercase tracking-wider text-[#9CA3AF] font-bold">
            VENUE CATEGORIES
          </label>
          <span className="text-[10px] font-mono text-[#00F0FF] bg-[#00F0FF]/10 px-2 py-0.5 rounded-full border border-[#00F0FF]/20">
            {selectedCategory}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const active = selectedCategory === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-medium transition-all duration-300 cursor-pointer ${
                  active
                    ? 'bg-gradient-to-r from-[#00F0FF]/15 to-[#A855F7]/15 border border-[#00F0FF] text-[#00F0FF] shadow-[0_0_15px_rgba(0,240,255,0.3)] ring-1 ring-[#00F0FF]/40'
                    : 'bg-[#07090E]/60 border border-white/5 text-[#9CA3AF] hover:text-[#F3F4F6] hover:border-white/20 hover:bg-[#111827]/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 shrink-0 transition-transform ${active ? 'scale-110 text-[#00F0FF]' : 'text-[#9CA3AF]'}`} />
                <span className="truncate text-[11px]">{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Smart Multi-Attribute Boolean Filters */}
      <div className="space-y-1.5 pt-1">
        <label className="text-[11px] font-mono uppercase tracking-wider text-[#9CA3AF] block font-bold">
          SMART ATTRIBUTE FILTERS
        </label>
        <div className="grid grid-cols-2 gap-1.5 font-mono text-[11px]">
          {/* Open Now */}
          {setOpenNow && (
            <button
              onClick={() => setOpenNow(!openNow)}
              className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl border transition-all cursor-pointer ${
                openNow
                  ? 'bg-[#10B981]/20 text-[#10B981] border-[#10B981]/40 shadow-[0_0_10px_rgba(16,185,129,0.25)]'
                  : 'bg-[#07090E]/60 text-slate-400 border-white/10 hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-[#10B981]" />
              <span>Open Now</span>
            </button>
          )}

          {/* 24/7 Access */}
          {setIs24_7 && (
            <button
              onClick={() => setIs24_7(!is24_7)}
              className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl border transition-all cursor-pointer ${
                is24_7
                  ? 'bg-[#EF4444]/20 text-[#EF4444] border-[#EF4444]/40 shadow-[0_0_10px_rgba(239,68,68,0.25)]'
                  : 'bg-[#07090E]/60 text-slate-400 border-white/10 hover:text-white'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-[#EF4444]" />
              <span>24/7 Service</span>
            </button>
          )}

          {/* Has Phone */}
          {setHasPhone && (
            <button
              onClick={() => setHasPhone(!hasPhone)}
              className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl border transition-all cursor-pointer ${
                hasPhone
                  ? 'bg-[#00F0FF]/20 text-[#00F0FF] border-[#00F0FF]/40 shadow-[0_0_10px_rgba(0,240,255,0.25)]'
                  : 'bg-[#07090E]/60 text-slate-400 border-white/10 hover:text-white'
              }`}
            >
              <Phone className="w-3.5 h-3.5 text-[#00F0FF]" />
              <span>Has Contact</span>
            </button>
          )}

          {/* Near Transit */}
          {setNearTransit && (
            <button
              onClick={() => setNearTransit(!nearTransit)}
              className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl border transition-all cursor-pointer ${
                nearTransit
                  ? 'bg-[#14B8A6]/20 text-[#14B8A6] border-[#14B8A6]/40 shadow-[0_0_10px_rgba(20,184,166,0.25)]'
                  : 'bg-[#07090E]/60 text-slate-400 border-white/10 hover:text-white'
              }`}
            >
              <Bus className="w-3.5 h-3.5 text-[#14B8A6]" />
              <span>Near Bus</span>
            </button>
          )}
        </div>
      </div>

      {/* Switch to Results Button */}
      {onViewResults && (
        <button
          onClick={onViewResults}
          className="w-full mt-3 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#00F0FF]/15 to-[#A855F7]/15 hover:from-[#00F0FF]/25 hover:to-[#A855F7]/25 text-[#00F0FF] border border-[#00F0FF]/30 font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_0_15px_rgba(0,240,255,0.15)]"
        >
          <span>View {totalResultsCount} Matching Venues</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );

  // TAB 2: SPATIAL CONTROL
  const renderSpatialTab = () => (
    <div className="space-y-4">
      {/* Catchment Radius with Slider & Quick Preset Pills */}
      <div className="p-3.5 rounded-xl bg-[#07090E]/70 border border-white/10 space-y-2.5">
        <div className="flex justify-between items-center text-xs">
          <span className="font-mono text-[11px] text-[#9CA3AF] flex items-center gap-1.5 font-bold">
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#00F0FF]" />
            RADIAL SEARCH RADIUS
          </span>
          <span className="font-mono font-bold text-xs text-[#00F0FF] bg-[#00F0FF]/10 px-2 py-0.5 rounded-md border border-[#00F0FF]/30 shadow-[0_0_8px_rgba(0,240,255,0.2)]">
            {radiusKm} km
          </span>
        </div>

        {/* Quick Radius Presets */}
        <div className="grid grid-cols-5 gap-1 font-mono text-[10px]">
          {RADIUS_PRESETS.map((km) => (
            <button
              key={km}
              onClick={() => setRadiusKm(km)}
              className={`py-1.5 rounded-lg border text-center transition-all cursor-pointer ${
                radiusKm === km
                  ? 'bg-[#00F0FF]/20 text-[#00F0FF] border-[#00F0FF]/50 font-bold shadow-[0_0_8px_rgba(0,240,255,0.25)]'
                  : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
              }`}
            >
              {km} km
            </button>
          ))}
        </div>

        <input
          type="range"
          min="1"
          max="50"
          step="1"
          value={radiusKm}
          onChange={(e) => setRadiusKm(parseFloat(e.target.value))}
          className="w-full h-1.5 bg-[#1F2937] rounded-lg appearance-none cursor-pointer accent-[#00F0FF]"
        />
        <div className="flex justify-between text-[10px] font-mono text-slate-500">
          <span>1 km (Local)</span>
          <span>25 km (Regional)</span>
          <span>50 km (Metro)</span>
        </div>
      </div>

      {/* Viewport Bounding Box Mode Toggle */}
      {setViewportMode && (
        <div className="p-3.5 rounded-xl bg-[#07090E]/70 border border-white/10 flex items-center justify-between font-mono text-xs">
          <div className="flex items-center gap-2.5">
            <Scan className="w-4 h-4 text-[#00F0FF]" />
            <div>
              <span className="text-slate-200 block text-[11px] font-semibold">VIEWPORT AUTO-FILTER</span>
              <span className="text-[10px] text-slate-400">Sync venues to current screen bounds</span>
            </div>
          </div>
          <button
            onClick={() => setViewportMode(!viewportMode)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              viewportMode 
                ? 'bg-[#00F0FF]/20 text-[#00F0FF] border-[#00F0FF]/40 shadow-[0_0_10px_rgba(0,240,255,0.25)]'
                : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
            }`}
          >
            {viewportMode ? 'ON' : 'OFF'}
          </button>
        </div>
      )}

      {/* Minimum Rating Filter */}
      <div className="p-3.5 rounded-xl bg-[#07090E]/70 border border-white/10 space-y-2">
        <div className="flex justify-between items-center text-xs">
          <span className="font-mono text-[11px] text-[#9CA3AF] flex items-center gap-1.5 font-bold">
            <Star className="w-3.5 h-3.5 text-[#F59E0B]" />
            MINIMUM RATING THRESHOLD
          </span>
          <span className="font-mono font-bold text-xs text-[#F59E0B] bg-[#F59E0B]/10 px-2 py-0.5 rounded-md border border-[#F59E0B]/30 shadow-[0_0_8px_rgba(245,158,11,0.2)]">
            {minRating > 0 ? `★ ${minRating.toFixed(1)}+` : 'ANY'}
          </span>
        </div>

        <input
          type="range"
          min="0"
          max="5"
          step="0.1"
          value={minRating}
          onChange={(e) => setMinRating(parseFloat(e.target.value))}
          className="w-full h-1.5 bg-[#1F2937] rounded-lg appearance-none cursor-pointer accent-[#F59E0B]"
        />
        <div className="flex justify-between text-[10px] font-mono text-slate-500">
          <span>0 (All ratings)</span>
          <span>★ 3.0</span>
          <span>★ 4.5+</span>
        </div>
      </div>

      {/* Bottom Command Bar: Demo Focus & Sync OSM */}
      <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2.5">
        <button
          onClick={onResetLocation}
          className="flex-1 flex items-center justify-center gap-1.5 text-xs text-[#9CA3AF] hover:text-[#F3F4F6] px-3.5 py-2.5 rounded-xl bg-[#111827]/80 hover:bg-[#1F2937] border border-white/10 transition-all cursor-pointer font-mono font-semibold"
        >
          <MapPin className="w-3.5 h-3.5 text-[#00F0FF]" />
          Demo Focus
        </button>

        <button
          onClick={onFetchLiveOSM}
          disabled={isLiveLoading}
          className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold text-[#00F0FF] hover:text-white px-3.5 py-2.5 rounded-xl bg-[#00F0FF]/15 hover:bg-[#00F0FF]/25 border border-[#00F0FF]/40 shadow-[0_0_12px_rgba(0,240,255,0.2)] hover:shadow-[0_0_20px_rgba(0,240,255,0.35)] transition-all cursor-pointer disabled:opacity-50 font-mono"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLiveLoading ? 'animate-spin text-[#00F0FF]' : ''}`} />
          {isLiveLoading ? 'Syncing...' : 'Sync OSM'}
        </button>
      </div>

      {/* Switch to Results Button */}
      {onViewResults && (
        <button
          onClick={onViewResults}
          className="w-full mt-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#00F0FF]/15 to-[#A855F7]/15 hover:from-[#00F0FF]/25 hover:to-[#A855F7]/25 text-[#00F0FF] border border-[#00F0FF]/30 font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_0_15px_rgba(0,240,255,0.15)]"
        >
          <span>Explore {totalResultsCount} Filtered Venues</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );

  return (
    <div className="flex flex-col gap-3 p-4 rounded-2xl bg-[#0B0F19]/80 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
      {activeTab === 'filters' && renderFiltersTab()}
      {activeTab === 'spatial' && renderSpatialTab()}
      {activeTab === 'all' && (
        <div className="space-y-6">
          {renderFiltersTab()}
          <div className="border-t border-white/10 pt-4">
            {renderSpatialTab()}
          </div>
        </div>
      )}
    </div>
  );
}
