import React, { useState, useEffect } from 'react';
import { 
  X, 
  Activity, 
  Layers, 
  Compass, 
  Award, 
  SlidersHorizontal, 
  CheckCircle2, 
  AlertTriangle,
  Clock,
  ShieldCheck,
  Building2,
  Utensils
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
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Spatial Analytics Engine</h3>
              <p className="text-xs text-slate-400">Real-time geospatial modeling and accessibility intelligence</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/30 px-5 gap-2 pt-2">
          <button
            onClick={() => setActiveTab('score')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'score'
                ? 'border-cyan-400 text-cyan-400 bg-cyan-950/20 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Award className="w-4 h-4" />
            Accessibility Score
          </button>

          <button
            onClick={() => setActiveTab('isochrone')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'isochrone'
                ? 'border-cyan-400 text-cyan-400 bg-cyan-950/20 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Compass className="w-4 h-4" />
            Travel-Time Isochrones
          </button>

          <button
            onClick={() => setActiveTab('density')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'density'
                ? 'border-cyan-400 text-cyan-400 bg-cyan-950/20 rounded-t-lg'
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
            <div className="flex items-center justify-center py-10 gap-3 text-cyan-400 text-sm">
              <span className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></span>
              Computing spatial indices...
            </div>
          )}

          {/* TAB 1: Accessibility Score */}
          {!loading && activeTab === 'score' && (
            <div className="space-y-6">
              {scoreResult && (
                <div className="p-5 rounded-2xl bg-gradient-to-br from-cyan-950/40 to-slate-900 border border-cyan-500/30 flex items-center justify-between">
                  <div>
                    <span className="text-xs uppercase tracking-wider text-cyan-400 font-bold">Overall Score</span>
                    <div className="text-4xl font-extrabold text-white mt-1">
                      {scoreResult.overall_score} <span className="text-lg text-slate-400 font-normal">/ 100</span>
                    </div>
                    <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {scoreResult.assessment_tier}
                    </div>
                  </div>
                  <div className="text-right text-xs text-slate-400">
                    <div>Origin Latitude: <span className="text-slate-200 font-mono">{userLocation.latitude.toFixed(4)}</span></div>
                    <div>Origin Longitude: <span className="text-slate-200 font-mono">{userLocation.longitude.toFixed(4)}</span></div>
                  </div>
                </div>
              )}

              {/* Subscores breakdown */}
              {scoreResult?.score_breakdown && (
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(scoreResult.score_breakdown).map(([key, val]) => (
                    <div key={key} className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                      <div className="text-xs text-slate-400 flex items-center justify-between">
                        <span>{key}</span>
                        <span className="font-bold text-white">{val}%</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
                        <div 
                          className="bg-cyan-400 h-full rounded-full transition-all duration-500" 
                          style={{ width: `${Math.min(100, Math.max(0, val))}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Weight Customization Sliders */}
              <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 space-y-4">
                <h4 className="text-xs font-bold uppercase text-slate-300 flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
                  Customize Multi-Criteria Scoring Weights
                </h4>
                
                <div className="space-y-3 text-xs">
                  <div>
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span>Healthcare & Clinics ({Math.round(weightHealthcare * 100)}%)</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={weightHealthcare}
                      onChange={(e) => setWeightHealthcare(parseFloat(e.target.value))}
                      className="w-full h-1 bg-slate-800 rounded accent-cyan-400"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span>Emergency Services ({Math.round(weightEmergency * 100)}%)</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={weightEmergency}
                      onChange={(e) => setWeightEmergency(parseFloat(e.target.value))}
                      className="w-full h-1 bg-slate-800 rounded accent-red-400"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span>Pharmacies ({Math.round(weightPharmacy * 100)}%)</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={weightPharmacy}
                      onChange={(e) => setWeightPharmacy(parseFloat(e.target.value))}
                      className="w-full h-1 bg-slate-800 rounded accent-amber-400"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span>Dining & Cafes ({Math.round(weightDining * 100)}%)</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={weightDining}
                      onChange={(e) => setWeightDining(parseFloat(e.target.value))}
                      className="w-full h-1 bg-slate-800 rounded accent-emerald-400"
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
                Concentric spatial buffer rings calculated using road transit velocity models (average 30 km/h urban velocity).
              </p>

              {isochroneResult?.rings?.map((ring, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-cyan-500/40 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs border border-cyan-500/30">
                        {ring.radius_km}k
                      </div>
                      <div>
                        <h5 className="font-semibold text-white text-sm">
                          {ring.radius_km} km Radius Catchment
                        </h5>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-cyan-400" />
                          Est. travel time: ~{ring.est_travel_time_mins} minutes
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-lg font-bold text-cyan-300">{ring.poi_count}</span>
                      <span className="text-xs text-slate-500 block">POIs inside</span>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-wrap gap-2 text-xs">
                    {Object.entries(ring.categories).map(([cat, count]) => (
                      <span key={cat} className="px-2 py-0.5 rounded bg-slate-800/80 text-slate-300 border border-slate-700">
                        {cat}: <strong className="text-cyan-400">{count}</strong>
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
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Total POIs analyzed in current extent: <strong className="text-white">{densityResult?.total_places || 0}</strong></span>
                <span>Matrix grid: <strong className="text-cyan-400">{densityResult?.grid_rows} x {densityResult?.grid_cols}</strong></span>
              </div>

              <div className="grid grid-cols-6 gap-1.5 p-3 rounded-xl bg-slate-950 border border-slate-800">
                {densityResult?.cells?.map((cell) => {
                  let bg = 'bg-slate-900 border-slate-800';
                  if (cell.density_level === 'low') bg = 'bg-cyan-950/40 border-cyan-800/40 text-cyan-300';
                  if (cell.density_level === 'medium') bg = 'bg-cyan-800/60 border-cyan-600/60 text-cyan-100';
                  if (cell.density_level === 'high') bg = 'bg-cyan-600 border-cyan-400 text-white font-bold';
                  if (cell.density_level === 'very_high') bg = 'bg-rose-600 border-rose-400 text-white font-bold';

                  return (
                    <div
                      key={cell.cell_id}
                      title={`Cell POIs: ${cell.count}`}
                      className={`h-12 rounded-lg border flex flex-col items-center justify-center text-xs transition-transform hover:scale-105 ${bg}`}
                    >
                      <span>{cell.count}</span>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 px-2">
                <span>Density scale:</span>
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">0 POIs</span>
                  <span className="px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-300">Low</span>
                  <span className="px-2 py-0.5 rounded bg-cyan-800/60 text-cyan-100">Medium</span>
                  <span className="px-2 py-0.5 rounded bg-cyan-600 text-white">High</span>
                  <span className="px-2 py-0.5 rounded bg-rose-600 text-white">Very High</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-all cursor-pointer"
          >
            Close Analytics
          </button>
        </div>
      </div>
    </div>
  );
}
