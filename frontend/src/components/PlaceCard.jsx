import React from 'react';
import { 
  Hospital, 
  Stethoscope, 
  Pill, 
  Siren, 
  UtensilsCrossed, 
  MapPin, 
  Star, 
  Phone, 
  Clock, 
  Navigation 
} from 'lucide-react';

const CATEGORY_CONFIG = {
  Hospital: { icon: Hospital, badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
  Clinic: { icon: Stethoscope, badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  Pharmacy: { icon: Pill, badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  'Emergency Services': { icon: Siren, badgeBg: 'bg-red-600/20 text-red-300 border-red-500/40' },
  Restaurant: { icon: UtensilsCrossed, badgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' },
};

export default function PlaceCard({ place, onSelect, isSelected }) {
  const config = CATEGORY_CONFIG[place.category] || CATEGORY_CONFIG.Clinic;
  const IconComponent = config.icon;

  const raw = place.raw_data || {};

  return (
    <div 
      onClick={() => onSelect(place)}
      className={`p-4 rounded-xl border transition-all cursor-pointer ${
        isSelected 
          ? 'bg-slate-800/90 border-cyan-500/80 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500/40' 
          : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/60 hover:border-slate-700'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-lg border ${config.badgeBg}`}>
            <IconComponent className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-semibold text-slate-100 line-clamp-1">{place.name}</h4>
            <span className={`inline-block text-xs px-2 py-0.5 mt-1 rounded-full border ${config.badgeBg}`}>
              {place.category}
            </span>
          </div>
        </div>
        
        {place.rating > 0 && (
          <div className="flex items-center gap-1 bg-amber-500/10 px-2 py-1 rounded-md border border-amber-500/20">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span className="text-xs font-medium text-amber-300">{place.rating}</span>
          </div>
        )}
      </div>

      <div className="mt-3 space-y-1.5 text-xs text-slate-400">
        {place.address && (
          <div className="flex items-start gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
            <span className="line-clamp-1">{place.address}</span>
          </div>
        )}

        {raw.phone && (
          <div className="flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span>{raw.phone}</span>
          </div>
        )}

        {raw.opening_hours && (
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="line-clamp-1">{raw.opening_hours}</span>
          </div>
        )}
      </div>

      <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
        {place.distance_km !== undefined && place.distance_km !== null ? (
          <span className="text-cyan-400 font-medium flex items-center gap-1">
            <Navigation className="w-3 h-3" />
            {place.distance_km} km away
          </span>
        ) : (
          <span className="text-slate-500">Spatial POI</span>
        )}

        <button 
          onClick={(e) => {
            e.stopPropagation();
            onSelect(place);
          }}
          className="text-xs font-medium text-cyan-400 hover:text-cyan-300 hover:underline"
        >
          Locate on Map &rarr;
        </button>
      </div>
    </div>
  );
}
