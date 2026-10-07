import React, { useState } from 'react';
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
  ExternalLink,
  Bookmark,
  Share2,
  Check
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

export default function PlaceCard({ 
  place, 
  onSelect, 
  onGetDirections, 
  isSelected, 
  isNavigatingTo,
  isBookmarked = false,
  onToggleBookmark,
  onToast
}) {
  const [copied, setCopied] = useState(false);
  const config = CATEGORY_CONFIG[place.category] || { 
    icon: MapPin, 
    badgeBg: 'bg-[#00F0FF]/15 text-[#00F0FF] border-[#00F0FF]/30', 
    dot: 'bg-[#00F0FF]' 
  };
  const IconComponent = config.icon;

  const raw = place.raw_data || {};
  const is24_7 = place.category === 'Hospital' || place.category === 'Hospitals' || place.category === 'Emergency Services';

  // Navigation bridges
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}&travelmode=driving`;
  const appleMapsUrl = `https://maps.apple.com/?daddr=${place.latitude},${place.longitude}&dirflg=d`;
  const wazeUrl = `https://waze.com/ul?ll=${place.latitude},${place.longitude}&navigate=yes`;

  // Estimated Travel Time calculation
  const dist = place.distance_km || 0;
  const driveMinutes = Math.max(1, Math.round(dist * 1.5 + 2));
  const walkMinutes = Math.max(2, Math.round(dist * 12));

  const handleShare = (e) => {
    e.stopPropagation();
    const shareText = `${place.name} (${place.category}) - ${place.address || 'Location'}\nCoords: ${place.latitude}, ${place.longitude}\nGoogle Maps: ${googleMapsUrl}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText);
      setCopied(true);
      if (onToast) onToast(`Copied ${place.name} details to clipboard!`);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div 
      onClick={() => onSelect(place)}
      className={`antigravity-glass-interactive rounded-2xl p-4 border transition-all duration-300 cursor-pointer group ${
        isSelected 
          ? 'border-[#00F0FF] shadow-[0_0_24px_rgba(0,240,255,0.28)] ring-1 ring-[#00F0FF]/50 bg-[#0B132B]/90' 
          : 'hover:border-white/20'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl border ${config.badgeBg} shadow-sm shrink-0 transition-transform group-hover:scale-105`}>
            <IconComponent className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-semibold text-slate-100 text-sm tracking-tight line-clamp-1 group-hover:text-[#00F0FF] transition-colors">
              {place.name}
            </h4>
            <div className="flex items-center gap-2 mt-1">
              <span className={`inline-block w-1.5 h-1.5 rounded-full ${config.dot} shadow-[0_0_6px_currentColor]`}></span>
              <span className={`inline-block font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${config.badgeBg}`}>
                {place.category}
              </span>

              {is24_7 ? (
                <span className="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded-md bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30 font-bold">
                  24/7
                </span>
              ) : raw.opening_hours ? (
                <span className="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded-md bg-[#00F0FF]/10 text-slate-300 border border-white/10">
                  Open
                </span>
              ) : null}
            </div>
          </div>
        </div>
        
        {/* Top-Right Badges & Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {place.rating > 0 && (
            <div className="flex items-center gap-1 bg-[#F59E0B]/10 px-2 py-1 rounded-lg border border-[#F59E0B]/25 shadow-[0_0_8px_rgba(245,158,11,0.15)]">
              <Star className="w-3.5 h-3.5 fill-[#F59E0B] text-[#F59E0B]" />
              <span className="text-xs font-mono font-bold text-[#F59E0B]">{place.rating}</span>
            </div>
          )}

          {/* Bookmark Button */}
          {onToggleBookmark && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleBookmark(place.id);
              }}
              className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                isBookmarked 
                  ? 'bg-[#F59E0B]/20 text-[#F59E0B] border-[#F59E0B]/40 shadow-[0_0_8px_rgba(245,158,11,0.3)]'
                  : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
              }`}
              title={isBookmarked ? 'Remove Bookmark' : 'Bookmark Venue'}
            >
              <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-current' : ''}`} />
            </button>
          )}

          {/* Share Action */}
          <button
            onClick={handleShare}
            className="p-1.5 rounded-lg border border-white/10 bg-white/5 text-slate-400 hover:text-[#00F0FF] hover:border-[#00F0FF]/30 transition-all cursor-pointer"
            title="Share Venue"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#10B981]" /> : <Share2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Address & Meta */}
      <div className="mt-3 space-y-1.5 text-xs text-slate-400">
        {place.address && (
          <div className="flex items-start gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
            <span className="line-clamp-1">{place.address}</span>
          </div>
        )}

        {raw.phone && (
          <div className="flex items-center gap-1.5 font-mono text-[11px] text-[#10B981]">
            <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <a href={`tel:${raw.phone}`} onClick={(e) => e.stopPropagation()} className="hover:underline">{raw.phone}</a>
          </div>
        )}

        {raw.opening_hours && (
          <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-400">
            <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="line-clamp-1">{raw.opening_hours}</span>
          </div>
        )}
      </div>

      {/* Travel Time & Distance Chips */}
      {place.distance_km !== undefined && place.distance_km !== null && (
        <div className="mt-2.5 flex items-center gap-2 text-[10px] font-mono">
          <span className="px-2 py-0.5 rounded-md bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/25 font-semibold flex items-center gap-1">
            <Navigation className="w-2.5 h-2.5" />
            {place.distance_km} km
          </span>
          <span className="px-2 py-0.5 rounded-md bg-white/5 text-slate-300 border border-white/10">
            🚗 ~{driveMinutes} min
          </span>
          <span className="px-2 py-0.5 rounded-md bg-white/5 text-slate-400 border border-white/10">
            🚶 ~{walkMinutes} min
          </span>
        </div>
      )}

      {/* Action Footer */}
      <div className="mt-3.5 pt-3 border-t border-white/10 flex items-center justify-between text-xs gap-2">
        <div className="flex items-center gap-1.5">
          {/* Quick Route Button */}
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onGetDirections(place, 'driving');
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

          {/* Quick Walk Route */}
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onGetDirections(place, 'walking');
            }}
            className="px-2.5 py-1.5 rounded-xl text-xs font-mono font-semibold bg-white/5 hover:bg-white/15 text-slate-300 border border-white/10 transition-all cursor-pointer"
            title="Walk Route"
          >
            🚶 Walk
          </button>
        </div>

        {/* Deep Navigation Bridges */}
        <div className="flex items-center gap-1.5">
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            title="Launch in Google Maps"
            className="flex items-center gap-1 px-2 py-1.5 rounded-xl text-xs font-mono bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 transition-all cursor-pointer shadow-[0_0_8px_rgba(16,185,129,0.15)]"
          >
            <ExternalLink className="w-3 h-3" />
            Google
          </a>

          <a
            href={wazeUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            title="Launch in Waze"
            className="hidden sm:flex items-center gap-1 px-2 py-1.5 rounded-xl text-xs font-mono bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 transition-all cursor-pointer"
          >
            Waze
          </a>
        </div>
      </div>
    </div>
  );
}
