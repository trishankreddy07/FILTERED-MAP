import React from 'react';
import { 
  Hospital, 
  Stethoscope, 
  Pill, 
  Siren, 
  UtensilsCrossed, 
  Hotel,
  Landmark,
  Bus,
  MapPin, 
  Star, 
  Phone, 
  Clock, 
  Navigation,
  Compass,
  ExternalLink
} from 'lucide-react';

const CATEGORY_CONFIG = {
  Hospital: { icon: Hospital, badgeBg: 'bg-[#F43F5E]/15 text-[#F43F5E] border-[#F43F5E]/30', dot: 'bg-[#F43F5E]' },
  Hospitals: { icon: Hospital, badgeBg: 'bg-[#F43F5E]/15 text-[#F43F5E] border-[#F43F5E]/30', dot: 'bg-[#F43F5E]' },
  Clinic: { icon: Stethoscope, badgeBg: 'bg-[#06B6D4]/15 text-[#06B6D4] border-[#06B6D4]/30', dot: 'bg-[#06B6D4]' },
  Clinics: { icon: Stethoscope, badgeBg: 'bg-[#06B6D4]/15 text-[#06B6D4] border-[#06B6D4]/30', dot: 'bg-[#06B6D4]' },
  Pharmacy: { icon: Pill, badgeBg: 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30', dot: 'bg-[#10B981]' },
  Pharmacies: { icon: Pill, badgeBg: 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30', dot: 'bg-[#10B981]' },
  'Emergency Services': { icon: Siren, badgeBg: 'bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/30', dot: 'bg-[#EF4444]' },
  Restaurant: { icon: UtensilsCrossed, badgeBg: 'bg-[#A855F7]/15 text-[#A855F7] border-[#A855F7]/30', dot: 'bg-[#A855F7]' },
  'Dining & Cafe': { icon: UtensilsCrossed, badgeBg: 'bg-[#A855F7]/15 text-[#A855F7] border-[#A855F7]/30', dot: 'bg-[#A855F7]' },
  'Hotel & Stays': { icon: Hotel, badgeBg: 'bg-[#3B82F6]/15 text-[#3B82F6] border-[#3B82F6]/30', dot: 'bg-[#3B82F6]' },
  'Hotels & Stays': { icon: Hotel, badgeBg: 'bg-[#3B82F6]/15 text-[#3B82F6] border-[#3B82F6]/30', dot: 'bg-[#3B82F6]' },
  'Bus Stands': { icon: Bus, badgeBg: 'bg-[#14B8A6]/15 text-[#14B8A6] border-[#14B8A6]/30', dot: 'bg-[#14B8A6]' },
  'Tourist Places': { icon: Landmark, badgeBg: 'bg-[#D946EF]/15 text-[#D946EF] border-[#D946EF]/30', dot: 'bg-[#D946EF]' },
};

export default function PlaceCard({ place, onSelect, onGetDirections, isSelected, isNavigatingTo }) {
  const config = CATEGORY_CONFIG[place.category] || { 
    icon: MapPin, 
    badgeBg: 'bg-[#00F0FF]/15 text-[#00F0FF] border-[#00F0FF]/30', 
    dot: 'bg-[#00F0FF]' 
  };
  const IconComponent = config.icon;

  const raw = place.raw_data || {};
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}&travelmode=driving`;

  return (
    <div 
      onClick={() => onSelect(place)}
      className={`antigravity-glass-interactive rounded-2xl p-4 border transition-all duration-300 cursor-pointer ${
        isSelected 
          ? 'border-[#00F0FF] shadow-[0_0_20px_rgba(0,240,255,0.25)] ring-1 ring-[#00F0FF]/50 bg-[#0B132B]/85' 
          : 'hover:border-white/20'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl border ${config.badgeBg} shadow-sm shrink-0`}>
            <IconComponent className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-semibold text-slate-100 text-sm tracking-tight line-clamp-1">{place.name}</h4>
            <div className="flex items-center gap-1.5 mt-1">
              <span className={`inline-block w-1.5 h-1.5 rounded-full ${config.dot} shadow-[0_0_6px_currentColor]`}></span>
              <span className={`inline-block font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${config.badgeBg}`}>
                {place.category}
              </span>
            </div>
          </div>
        </div>
        
        {place.rating > 0 && (
          <div className="flex items-center gap-1 bg-[#F59E0B]/10 px-2 py-1 rounded-lg border border-[#F59E0B]/25 shrink-0 shadow-[0_0_10px_rgba(245,158,11,0.1)]">
            <Star className="w-3.5 h-3.5 fill-[#F59E0B] text-[#F59E0B]" />
            <span className="text-xs font-mono font-semibold text-[#F59E0B]">{place.rating}</span>
          </div>
        )}
      </div>

      <div className="mt-3.5 space-y-1.5 text-xs text-slate-400">
        {place.address && (
          <div className="flex items-start gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
            <span className="line-clamp-1">{place.address}</span>
          </div>
        )}

        {raw.phone && (
          <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-400">
            <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span>{raw.phone}</span>
          </div>
        )}

        {raw.opening_hours && (
          <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-400">
            <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="line-clamp-1">{raw.opening_hours}</span>
          </div>
        )}
      </div>

      <div className="mt-3.5 pt-3 border-t border-white/10 flex items-center justify-between text-xs gap-2">
        {place.distance_km !== undefined && place.distance_km !== null ? (
          <span className="text-[#00F0FF] font-mono font-semibold flex items-center gap-1 shrink-0">
            <Navigation className="w-3 h-3 text-[#00F0FF]" />
            {place.distance_km} km
          </span>
        ) : (
          <span className="text-slate-500 font-mono text-[11px]">SPATIAL POI</span>
        )}

        <div className="flex items-center gap-2">
          {/* In-App Route Button */}
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onGetDirections(place);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer ${
              isNavigatingTo
                ? 'bg-[#00F0FF] text-[#07090E] font-bold shadow-[0_0_16px_rgba(0,240,255,0.6)]'
                : 'bg-[#00F0FF]/15 hover:bg-[#00F0FF]/25 text-[#00F0FF] border border-[#00F0FF]/40 shadow-[0_0_10px_rgba(0,240,255,0.15)]'
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-semibold bg-[#10B981]/15 hover:bg-[#10B981]/25 text-[#10B981] border border-[#10B981]/30 transition-all cursor-pointer shadow-[0_0_10px_rgba(16,185,129,0.15)]"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Maps
          </a>
        </div>
      </div>
    </div>
  );
}
