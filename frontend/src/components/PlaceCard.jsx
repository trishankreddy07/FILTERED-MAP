import React from 'react';
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
  Phone, 
  Clock, 
  Navigation,
  Compass,
  ExternalLink
} from 'lucide-react';

const CATEGORY_CONFIG = {
  Hospital: { icon: Hospital, badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
  Clinic: { icon: Stethoscope, badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  Pharmacy: { icon: Pill, badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  'Emergency Services': { icon: Siren, badgeBg: 'bg-red-600/20 text-red-300 border-red-500/40' },
  Restaurant: { icon: UtensilsCrossed, badgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' },
  'Hotel & Stays': { icon: Hotel, badgeBg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' },
  'Tourist Places': { icon: Landmark, badgeBg: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30' },
};

export default function PlaceCard({ place, onSelect, onGetDirections, isSelected, isNavigatingTo }) {
  const config = CATEGORY_CONFIG[place.category] || CATEGORY_CONFIG.Clinic;
  const IconComponent = config.icon;

  const raw = place.raw_data || {};
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}&travelmode=driving`;

  return (
    <div 
      onClick={() => onSelect(place)}
      className={`p-4 rounded-xl border transition-all cursor-pointer ${
        isSelected 
          ? 'bg-slate-800/95 border-cyan-500/80 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500/40' 
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
            <span className={`inline-block text-[11px] px-2 py-0.5 mt-1 rounded-full border ${config.badgeBg}`}>
              {place.category}
            </span>
          </div>
        </div>
        
        {place.rating > 0 && (
          <div className="flex items-center gap-1 bg-amber-500/10 px-2 py-1 rounded-md border border-amber-500/20 shrink-0">
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

      <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs gap-2">
        {place.distance_km !== undefined && place.distance_km !== null ? (
          <span className="text-cyan-400 font-medium flex items-center gap-1 shrink-0">
            <Navigation className="w-3 h-3" />
            {place.distance_km} km
          </span>
        ) : (
          <span className="text-slate-500">Spatial POI</span>
        )}

        <div className="flex items-center gap-2">
          {/* In-App Route Button */}
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onGetDirections(place);
            }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              isNavigatingTo
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/30'
                : 'bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-800/50'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            Directions
          </button>

          {/* Google Maps External Live Launcher */}
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            title="Launch in Google Maps Navigation"
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800/50 transition-all cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Google Maps
          </a>
        </div>
      </div>
    </div>
  );
}
