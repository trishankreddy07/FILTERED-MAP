import React, { useState, useEffect } from 'react';
import { 
  X, 
  Activity, 
  Layers, 
  Compass, 
  Award, 
  SlidersHorizontal, 
  CheckCircle2, 
  Clock,
  Sparkles
} from 'lucide-react';
import axios from 'axios';

export default function AnalyticsModal({ isOpen, onClose, userLocation, activePlaces }) {
  const [activeTab, setActiveTab] = useState('score'); // 'score' | 'isochrone' | 'density'
  const [loading, setLoading] = useState(false);

  // Score weights
  const [weightHealthcare, setWeightHealthcare] = useState(0.4);
  const [weightEmergency, setWeightEmergency] = useState(0.3);
  const [weightPharmacy, setWeightPharmacy] = useState(0.2);
  const [weightDining, setWeightDining] = useState(0.1);

  const [scoreResult, setScoreResult] = useState(null);
  const [isochroneResult, setIsochroneResult] = useState(null);
  const [densityResult, setDensityResult] = useState(null);

  // Fetch Accessibility Score
  const fetchScore = async () => {
    try {
      setLoading(true);
      const res = await axios.post('/api/v1/analytics/score', {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        weight_healthcare: weightHealthcare,
        weight_emergency: weightEmergency,
        weight_pharmacy: weightPharmacy,
        weight_dining: weightDining
      });
      setScoreResult(res.data);
    } catch (err) {
      console.error('Failed to compute accessibility score', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Travel-Time Isochrone Buffers
  const fetchIsochrone = async () => {
    try {
      setLoading(true);
      const res = await axios.post('/api/v1/analytics/isochrone', {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        buffer_radii_km: [1.0, 2.5, 5.0]
      });
      setIsochroneResult(res.data);
    } catch (err) {
      console.error('Failed to compute isochrone buffers', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Grid Density
  const fetchDensity = async () => {
    try {
      setLoading(true);
      const res = await axios.post('/api/v1/analytics/density', {
        min_lat: userLocation.latitude - 0.05,
        max_lat: userLocation.latitude + 0.05,
        min_lng: userLocation.longitude - 0.06,
        max_lng: userLocation.longitude + 0.06,
        grid_size: 6
      });
      setDensityResult(res.data);
    } catch (err) {
      console.error('Failed to compute spatial density', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (activeTab === 'score') fetchScore();
      if (activeTab === 'isochrone') fetchIsochrone();
      if (activeTab === 'density') fetchDensity();
    }
  }, [isOpen, activeTab, weightHealthcare, weightEmergency, weightPharmacy, weightDining]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="antigravity-glass border border-[#00F0FF]/30 w-full max-w-2xl rounded-2xl shadow-[0_0_50px_rgba(0,240,255,0.18)] overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-[#07090E]/60 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30 shadow-[0_0_12px_rgba(0,240,255,0.3)]">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-tight">Spatial Analytics Engine</h3>
                <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30">
                  REAL-TIME
                </span>
              </div>
              <p className="text-xs text-slate-400">Algorithmic spatial modeling and accessibility intelligence</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer border border-transparent hover:border-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-white/10 bg-[#07090E]/40 px-5 gap-2 pt-2">
          <button
            onClick={() => setActiveTab('score')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-mono font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'score'
                ? 'border-[#00F0FF] text-[#00F0FF] bg-[#00F0FF]/10 rounded-t-xl shadow-[0_0_12px_rgba(0,240,255,0.2)]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Award className="w-4 h-4" />
            Accessibility Score
          </button>

          <button
            onClick={() => setActiveTab('isochrone')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-mono font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'isochrone'
                ? 'border-[#00F0FF] text-[#00F0FF] bg-[#00F0FF]/10 rounded-t-xl shadow-[0_0_12px_rgba(0,240,255,0.2)]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Compass className="w-4 h-4" />
            Travel-Time Isochrones
          </button>

          <button
            onClick={() => setActiveTab('density')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-mono font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'density'
                ? 'border-[#00F0FF] text-[#00F0FF] bg-[#00F0FF]/10 rounded-t-xl shadow-[0_0_12px_rgba(0,240,255,0.2)]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            Service Density Matrix
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {loading && (
            <div className="flex items-center justify-center py-12 gap-3 text-[#00F0FF] text-xs font-mono">
              <span className="w-4 h-4 border-2 border-[#00F0FF] border-t-transparent rounded-full animate-spin"></span>
              COMPUTING SPATIAL INDICES...
            </div>
          )}

          {/* TAB 1: Accessibility Score */}
          {!loading && activeTab === 'score' && (
            <div className="space-y-6">
              {scoreResult && (
                <div className="p-5 rounded-2xl bg-gradient-to-br from-[#00F0FF]/10 via-[#0B132B]/80 to-[#A855F7]/10 border border-[#00F0FF]/30 flex items-center justify-between shadow-[0_0_20px_rgba(0,240,255,0.15)]">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#00F0FF] font-bold block mb-1">
                      Weighted Index Score
                    </span>
                    <div className="text-4xl font-extrabold text-white font-mono">
                      {scoreResult.overall_score} <span className="text-lg text-slate-400 font-normal">/ 100</span>
                    </div>
                    <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30 shadow-[0_0_8px_rgba(0,240,255,0.2)]">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {scoreResult.assessment_tier}
                    </div>
                  </div>
                  <div className="text-right text-xs text-slate-400 space-y-1 font-mono">
                    <div>LAT: <span className="text-slate-200">{userLocation.latitude.toFixed(4)}</span></div>
                    <div>LNG: <span className="text-slate-200">{userLocation.longitude.toFixed(4)}</span></div>
                    <div className="text-[11px] text-[#00F0FF] pt-1">MODEL: MULTI-CRITERIA v2</div>
                  </div>
                </div>
              )}

              {/* Subscores breakdown */}
              {scoreResult?.score_breakdown && (
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(scoreResult.score_breakdown).map(([key, val]) => (
                    <div key={key} className="p-3.5 rounded-xl antigravity-glass border border-white/10">
                      <div className="text-xs text-slate-300 flex items-center justify-between font-mono">
                        <span className="capitalize">{key}</span>
                        <span className="font-bold text-[#00F0FF]">{val}%</span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-1.5 mt-2.5 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-[#00F0FF] to-[#3B82F6] h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(0,240,255,0.5)]" 
                          style={{ width: `${Math.min(100, Math.max(0, val))}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Weight Customization Sliders */}
              <div className="p-4 rounded-xl antigravity-glass border border-white/10 space-y-4">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-[#00F0FF]" />
                  Scoring Criteria Weights
                </h4>
                
                <div className="space-y-3.5 text-xs font-mono">
                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>Healthcare & Clinics</span>
                      <span className="text-[#00F0FF] font-bold">{Math.round(weightHealthcare * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={weightHealthcare}
                      onChange={(e) => setWeightHealthcare(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-white/10 rounded-lg accent-[#00F0FF] cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>Emergency Services</span>
                      <span className="text-[#EF4444] font-bold">{Math.round(weightEmergency * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={weightEmergency}
                      onChange={(e) => setWeightEmergency(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-white/10 rounded-lg accent-[#EF4444] cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>Pharmacies</span>
                      <span className="text-[#10B981] font-bold">{Math.round(weightPharmacy * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={weightPharmacy}
                      onChange={(e) => setWeightPharmacy(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-white/10 rounded-lg accent-[#10B981] cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>Dining & Cafes</span>
                      <span className="text-[#A855F7] font-bold">{Math.round(weightDining * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={weightDining}
                      onChange={(e) => setWeightDining(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-white/10 rounded-lg accent-[#A855F7] cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Travel-Time Isochrones */}
          {!loading && activeTab === 'isochrone' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400">
                Concentric spatial catchment rings computed via road velocity simulations (urban velocity: 30 km/h).
              </p>

              {isochroneResult?.rings?.map((ring, idx) => (
                <div key={idx} className="p-4 rounded-xl antigravity-glass-interactive border border-white/10 hover:border-[#00F0FF]/40 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#00F0FF]/15 text-[#00F0FF] flex items-center justify-center font-mono font-bold text-xs border border-[#00F0FF]/30 shadow-[0_0_8px_rgba(0,240,255,0.2)]">
                        {ring.radius_km}k
                      </div>
                      <div>
                        <h5 className="font-semibold text-white text-sm">
                          {ring.radius_km} km Radius Ring
                        </h5>
                        <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <Clock className="w-3.5 h-3.5 text-[#00F0FF]" />
                          Drive time: ~{ring.est_travel_time_mins} minutes
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-lg font-mono font-bold text-[#00F0FF]">{ring.poi_count}</span>
                      <span className="text-[10px] font-mono text-slate-500 block uppercase">POIs Enclosed</span>
                    </div>
                  </div>

                  <div className="mt-3.5 pt-3 border-t border-white/10 flex flex-wrap gap-2 text-xs">
                    {Object.entries(ring.categories).map(([cat, count]) => (
                      <span key={cat} className="px-2.5 py-1 rounded-lg bg-white/5 text-slate-300 border border-white/10 font-mono text-[11px]">
                        {cat}: <strong className="text-[#00F0FF]">{count}</strong>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: Service Density Matrix */}
          {!loading && activeTab === 'density' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>TOTAL EXTENT POIS: <strong className="text-white">{densityResult?.total_places || 0}</strong></span>
                <span>GRID RESOLUTION: <strong className="text-[#00F0FF]">{densityResult?.grid_rows} x {densityResult?.grid_cols}</strong></span>
              </div>

              <div className="grid grid-cols-6 gap-2 p-3.5 rounded-xl antigravity-glass border border-white/10">
                {densityResult?.cells?.map((cell) => {
                  let bg = 'bg-white/5 border-white/10 text-slate-500';
                  if (cell.density_level === 'low') bg = 'bg-[#00F0FF]/15 border-[#00F0FF]/30 text-[#00F0FF] shadow-[0_0_8px_rgba(0,240,255,0.15)]';
                  if (cell.density_level === 'medium') bg = 'bg-[#3B82F6]/30 border-[#3B82F6]/50 text-blue-200 shadow-[0_0_10px_rgba(59,130,246,0.2)]';
                  if (cell.density_level === 'high') bg = 'bg-[#A855F7]/40 border-[#A855F7]/60 text-purple-100 font-bold shadow-[0_0_12px_rgba(168,85,247,0.3)]';
                  if (cell.density_level === 'very_high') bg = 'bg-[#F43F5E]/50 border-[#F43F5E]/70 text-white font-bold shadow-[0_0_15px_rgba(244,63,94,0.4)]';

                  return (
                    <div
                      key={cell.cell_id}
                      title={`Cell POIs: ${cell.count}`}
                      className={`h-12 rounded-lg border flex flex-col items-center justify-center text-xs font-mono transition-transform hover:scale-105 cursor-pointer ${bg}`}
                    >
                      <span>{cell.count}</span>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 px-1 pt-1">
                <span>Density scale:</span>
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-500">0</span>
                  <span className="px-2 py-0.5 rounded bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30">Low</span>
                  <span className="px-2 py-0.5 rounded bg-[#3B82F6]/25 text-blue-300 border border-[#3B82F6]/40">Med</span>
                  <span className="px-2 py-0.5 rounded bg-[#A855F7]/30 text-purple-200 border border-[#A855F7]/50">High</span>
                  <span className="px-2 py-0.5 rounded bg-[#F43F5E]/30 text-rose-300 border border-[#F43F5E]/50">Ultra</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-white/10 bg-[#07090E]/60 backdrop-blur-md flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-mono font-semibold rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/10 transition-all cursor-pointer shadow-sm"
          >
            Close Engine
          </button>
        </div>
      </div>
    </div>
  );
}
