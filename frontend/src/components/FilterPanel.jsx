import React from 'react';
import { 
  Search, 
  Sliders, 
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
  Layers
} from 'lucide-react';

const CATEGORIES = [
  { id: 'All', label: 'All Places', icon: Layers },
  { id: 'Tourist Places', label: 'Tourist Places', icon: Landmark },
  { id: 'Hospital', label: 'Hospitals', icon: Hospital },
  { id: 'Clinic', label: 'Clinics', icon: Stethoscope },
  { id: 'Pharmacy', label: 'Pharmacies', icon: Pill },
  { id: 'Emergency Services', label: 'Emergency', icon: Siren },
  { id: 'Restaurant', label: 'Dining & Cafes', icon: UtensilsCrossed },
  { id: 'Hotel & Stays', label: 'Hotels & Stays', icon: Hotel },
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
    <div className="flex flex-col gap-5 p-5 bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 shadow-xl">
      {/* Header & Spatial Status */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
            Spatial Explorer
          </h2>
          <p className="text-xs text-slate-400">Discover venues & spatial analytics</p>
        </div>

        <button
          onClick={onOpenAnalytics}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Analytics
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by name, attraction, museum, hotel, or street..."
          className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/50 transition-all"
        />
      </div>

      {/* Category Pills */}
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-2">
          Venue Category
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const active = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                  active
                    ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-sm shadow-cyan-500/20'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Radius Distance Slider (1km to 50km) */}
      <div>
        <div className="flex justify-between items-center text-xs mb-1.5">
          <span className="font-medium text-slate-300">Scan Catchment Radius</span>
          <span className="font-bold text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/40">
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
          className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
        />
        <div className="flex justify-between text-[10px] text-slate-500 mt-1">
          <span>1 km</span>
          <span>25 km</span>
          <span>50 km</span>
        </div>
      </div>

      {/* Rating Filter Slider */}
      <div>
        <div className="flex justify-between items-center text-xs mb-1.5">
          <span className="font-medium text-slate-300">Minimum Rating</span>
          <span className="font-bold text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800/40">
            {minRating > 0 ? `★ ${minRating.toFixed(1)}+` : 'Any'}
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="5"
          step="0.1"
          value={minRating}
          onChange={(e) => setMinRating(parseFloat(e.target.value))}
          className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
        />
      </div>

      {/* Actions Bar */}
      <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
        <button
          onClick={onResetLocation}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 px-3 py-2 rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 transition-all cursor-pointer"
        >
          <MapPin className="w-3.5 h-3.5 text-cyan-400" />
          SF Demo Center
        </button>

        <button
          onClick={onFetchLiveOSM}
          disabled={isLiveLoading}
          className="flex items-center gap-1.5 text-xs text-cyan-300 hover:text-cyan-200 px-3 py-2 rounded-lg bg-cyan-950/40 hover:bg-cyan-900/40 border border-cyan-800/50 transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLiveLoading ? 'animate-spin' : ''}`} />
          {isLiveLoading ? 'Scanning...' : 'Sync Local POIs'}
        </button>
      </div>
    </div>
  );
}
