import React from 'react';
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
  Compass
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

export default function FilterPanel({
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  radiusKm,
  setRadiusKm,
  minRating,
  setMinRating,
  onOpenAnalytics,
  onResetLocation,
  isLiveLoading,
  onFetchLiveOSM
}) {
  return (
    <div className="flex flex-col gap-4 p-5 rounded-2xl bg-[#0B0F19]/80 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
      
      {/* Header & Spatial Telemetry */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#00F0FF]/10 border border-[#00F0FF]/30 flex items-center justify-center text-[#00F0FF] shadow-[0_0_12px_rgba(0,240,255,0.25)]">
            <Compass className="w-4 h-4 animate-spin-slow" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#F3F4F6] tracking-tight flex items-center gap-2">
              SPATIAL RADAR
              <span className="w-1.5 h-1.5 rounded-full bg-[#00F0FF] shadow-[0_0_8px_#00F0FF] animate-pulse"></span>
            </h2>
            <p className="text-[11px] font-mono text-[#9CA3AF]">v2.5 ANTIGRAVITY ENGINE</p>
          </div>
        </div>

        <button
          onClick={onOpenAnalytics}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-gradient-to-r from-[#00F0FF]/20 via-[#A855F7]/20 to-[#3B82F6]/20 hover:from-[#00F0FF]/30 hover:to-[#A855F7]/30 text-[#00F0FF] border border-[#00F0FF]/40 shadow-[0_0_15px_rgba(0,240,255,0.2)] hover:shadow-[0_0_20px_rgba(0,240,255,0.35)] transition-all cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#00F0FF]" />
          Analytics
        </button>
      </div>

      {/* Futuristic Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-[#00F0FF]" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search venues, hospitals, hotels, bus stops..."
          className="w-full pl-10 pr-4 py-2.5 bg-[#07090E]/90 border border-white/10 rounded-xl text-xs text-[#F3F4F6] placeholder-[#4B5563] font-sans focus:outline-none focus:border-[#00F0FF] focus:ring-1 focus:ring-[#00F0FF] focus:shadow-[0_0_15px_rgba(0,240,255,0.25)] transition-all"
        />
      </div>

      {/* Category Pills with Antigravity Glow States */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-[11px] font-mono uppercase tracking-wider text-[#9CA3AF]">
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

      {/* Radius Distance Slider with Neon Glowing Track */}
      <div className="p-3 rounded-xl bg-[#07090E]/50 border border-white/5 space-y-2">
        <div className="flex justify-between items-center text-xs">
          <span className="font-mono text-[11px] text-[#9CA3AF] flex items-center gap-1.5">
            <SlidersHorizontal className="w-3 h-3 text-[#00F0FF]" />
            CATCHMENT RADIUS
          </span>
          <span className="font-mono font-bold text-xs text-[#00F0FF] bg-[#00F0FF]/10 px-2 py-0.5 rounded-md border border-[#00F0FF]/30 shadow-[0_0_8px_rgba(0,240,255,0.2)]">
            {radiusKm} km
          </span>
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
        <div className="flex justify-between text-[10px] font-mono text-[#4B5563]">
          <span>1 km</span>
          <span>25 km</span>
          <span>50 km</span>
        </div>
      </div>

      {/* Rating Filter Slider */}
      <div className="p-3 rounded-xl bg-[#07090E]/50 border border-white/5 space-y-2">
        <div className="flex justify-between items-center text-xs">
          <span className="font-mono text-[11px] text-[#9CA3AF]">
            MINIMUM RATING
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
      </div>

      {/* Bottom Command Bar */}
      <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2">
        <button
          onClick={onResetLocation}
          className="flex-1 flex items-center justify-center gap-1.5 text-xs text-[#9CA3AF] hover:text-[#F3F4F6] px-3 py-2 rounded-xl bg-[#111827]/70 hover:bg-[#1F2937] border border-white/10 transition-all cursor-pointer font-mono"
        >
          <MapPin className="w-3.5 h-3.5 text-[#00F0FF]" />
          Demo Focus
        </button>

        <button
          onClick={onFetchLiveOSM}
          disabled={isLiveLoading}
          className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-[#00F0FF] hover:text-white px-3 py-2 rounded-xl bg-[#00F0FF]/10 hover:bg-[#00F0FF]/25 border border-[#00F0FF]/40 shadow-[0_0_12px_rgba(0,240,255,0.15)] hover:shadow-[0_0_20px_rgba(0,240,255,0.3)] transition-all cursor-pointer disabled:opacity-50 font-mono"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLiveLoading ? 'animate-spin text-[#00F0FF]' : ''}`} />
          {isLiveLoading ? 'Syncing...' : 'Sync OSM'}
        </button>
      </div>
    </div>
  );
}
