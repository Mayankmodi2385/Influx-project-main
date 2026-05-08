import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import api from '../services/api';
import { routeService } from '../services/routeService';
import { useAuth } from '../context/AuthContext';
import { FaRoute, FaBolt, FaClock, FaRupeeSign, FaFilter, FaCar, FaChargingStation, FaSearch } from 'react-icons/fa';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const createChargingIcon = () =>
  L.divIcon({
    className: '',
    html: `<div style="background:#10b981;width:28px;height:28px;border-radius:50%;border:2px solid white;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,0.3)"><span style="color:white;font-size:14px;">⚡</span></div>`,
    iconSize: [28, 28], iconAnchor: [14, 14],
  });

const createStopIcon = (num) =>
  L.divIcon({
    className: '',
    html: `<div style="background:#f59e0b;width:30px;height:30px;border-radius:50%;border:2px solid white;display:flex;align-items:center;justify-content:center;font-weight:bold;color:#1f2937;font-size:13px;box-shadow:0 2px 6px rgba(0,0,0,0.3)">${num}</div>`,
    iconSize: [30, 30], iconAnchor: [15, 15],
  });

// ── Map auto-fit component ───────────────────────────────────────────────────
const FitBounds = ({ coords }) => {
  const map = useMap();
  useEffect(() => {
    if (coords && coords.length > 1) {
      const bounds = L.latLngBounds(coords.map(c => [c[1], c[0]]));
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [coords]);
  return null;
};

// ── Geocode using Nominatim (free, no API key) ──────────────────────────────
const geocodeWithNominatim = async (address) => {
  try {
    const query = encodeURIComponent(address + ', India');
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`,
      { headers: { 'Accept-Language': 'en', 'User-Agent': 'InFlux-EV-App' } }
    );
    const data = await res.json();
    if (data && data.length > 0) {
      return [parseFloat(data[0].lon), parseFloat(data[0].lat)];
    }
    return null;
  } catch (e) {
    console.warn('Nominatim error:', e.message);
    return null;
  }
};

// ── Get real road route using OSRM (free, no API key) ──────────────────────
const getRoadRoute = async (startCoords, endCoords) => {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${startCoords[0]},${startCoords[1]};${endCoords[0]},${endCoords[1]}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      return {
        coordinates: route.geometry.coordinates, // [[lng,lat],...]
        distanceKm: route.distance / 1000,
        durationSecs: route.duration,
      };
    }
    return null;
  } catch (e) {
    console.warn('OSRM error:', e.message);
    return null;
  }
};

// ── Haversine distance ───────────────────────────────────────────────────────
const haversineKm = (a, b) => {
  const R = 6371;
  const dLat = ((b[1] - a[1]) * Math.PI) / 180;
  const dLon = ((b[0] - a[0]) * Math.PI) / 180;
  const x = Math.sin(dLat/2)**2 + Math.cos(a[1]*Math.PI/180)*Math.cos(b[1]*Math.PI/180)*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1-x));
};

// ── Estimate charging stops from vehicle + distance ─────────────────────────
const estimateStopsLocal = (distanceKm, vehicle) => {
  const stops = [];
  const effectiveRange = vehicle.range * (vehicle.currentChargePercent / 100);
  if (distanceKm <= effectiveRange) return stops;

  let remaining = distanceKm - effectiveRange;
  let fromStart = effectiveRange;
  const perStop = vehicle.range * 0.8;
  let num = 1;
  while (remaining > 0) {
    stops.push({ num, distanceFromStart: Math.round(fromStart), kmNeeded: Math.min(remaining, perStop) });
    fromStart += perStop;
    remaining -= perStop;
    num++;
  }
  return stops;
};

// ── Range Bar ───────────────────────────────────────────────────────────────
const RangeBar = ({ vehicle, distanceKm }) => {
  if (!vehicle || !distanceKm) return null;
  const effectiveRange = vehicle.range * (vehicle.currentChargePercent / 100);
  const stops = estimateStopsLocal(distanceKm, vehicle);
  return (
    <div className="bg-white rounded-lg shadow p-4 mb-4 border border-gray-100">
      <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
        <FaCar className="text-green-600" /> Range Analysis
      </h3>
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>0 km</span><span>{distanceKm.toFixed(0)} km</span>
      </div>
      <div className="relative h-7 bg-gray-200 rounded-full overflow-visible mb-3">
        <div className="absolute h-full bg-green-500 rounded-l-full transition-all"
          style={{ width: `${Math.min(100, (effectiveRange / distanceKm) * 100)}%` }} />
        {stops.map((s, i) => {
          const left = (s.distanceFromStart / distanceKm) * 100;
          const segEnd = Math.min(s.distanceFromStart + vehicle.range * 0.8, distanceKm);
          const w = ((segEnd - s.distanceFromStart) / distanceKm) * 100;
          return (
            <React.Fragment key={i}>
              <div className="absolute h-full bg-blue-400 opacity-60"
                style={{ left: `${Math.min(left, 99)}%`, width: `${Math.min(w, 100 - left)}%` }} />
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10"
                style={{ left: `${Math.min(99, left)}%` }}>
                <div className="w-6 h-6 bg-yellow-400 border-2 border-white rounded-full flex items-center justify-center text-xs font-bold text-gray-800 shadow">
                  {s.num}
                </div>
              </div>
            </React.Fragment>
          );
        })}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-red-500 border-2 border-white rounded-full shadow" />
      </div>
      <div className="flex flex-wrap gap-3 text-xs">
        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-500 rounded inline-block" /> Current charge: {effectiveRange.toFixed(0)} km</span>
        {stops.length > 0 && <span className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-400 rounded inline-block" /> After charging (80%): {(vehicle.range * 0.8).toFixed(0)} km</span>}
        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-yellow-400 rounded-full inline-block border border-gray-300" /> Charging stop</span>
      </div>
      {stops.length === 0
        ? <p className="text-green-600 text-xs font-medium mt-2">✅ Your current charge is enough for this trip!</p>
        : <p className="text-orange-600 text-xs font-medium mt-2">⚡ {stops.length} charging stop{stops.length > 1 ? 's' : ''} needed</p>}
    </div>
  );
};

// ── Stop Card ───────────────────────────────────────────────────────────────
const StopCard = ({ stop, index }) => (
  <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
    <div className="flex items-center gap-2 mb-2">
      <div className="w-7 h-7 bg-yellow-400 rounded-full flex items-center justify-center font-bold text-gray-800 text-sm shrink-0">
        {index + 1}
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-800">{stop.station ? stop.station.name : 'Charging Stop Required'}</p>
        <p className="text-xs text-gray-500">At {stop.distanceFromStart} km from start</p>
      </div>
    </div>
    {stop.station ? (
      <div className="grid grid-cols-2 gap-1 text-xs text-gray-600 mt-2">
        <span>📍 {stop.station.address || 'Along route'}</span>
        <span>⚡ {stop.station.powerRating || 50} kW</span>
        <span>🕐 ~{stop.chargeTimeMinutes} min</span>
        <span>💰 ₹{stop.costRupees || 0}</span>
      </div>
    ) : (
      <p className="text-xs text-orange-600 mt-1">No station in database near this point yet.</p>
    )}
    <div className="mt-2 bg-yellow-100 rounded p-2 text-xs text-gray-700">
      Charge to <strong>80%</strong> → gives <strong>{stop.kmNeeded?.toFixed(0)} km</strong> range for next leg
    </div>
  </div>
);

// ── Address Input with live suggestions ─────────────────────────────────────
const AddressInput = ({ label, value, onChange, onCoordsFound, placeholder }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const debounce = useRef(null);

  const handleChange = (e) => {
    const val = e.target.value;
    onChange(val);
    clearTimeout(debounce.current);
    if (val.length < 3) { setSuggestions([]); return; }
    debounce.current = setTimeout(async () => {
      setSearching(true);
      try {
        const q = encodeURIComponent(val + ', India');
        const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=5&addressdetails=1`,
          { headers: { 'Accept-Language': 'en', 'User-Agent': 'InFlux-EV-App' } });
        const data = await res.json();
        setSuggestions(data);
      } catch { setSuggestions([]); }
      finally { setSearching(false); }
    }, 500);
  };

  const select = (item) => {
    onChange(item.display_name.split(',')[0]);
    onCoordsFound([parseFloat(item.lon), parseFloat(item.lat)]);
    setSuggestions([]);
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="relative">
        <input value={value} onChange={handleChange} placeholder={placeholder}
          className="w-full px-4 py-2 pr-9 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" />
        {searching && <div className="absolute right-3 top-2.5 w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />}
      </div>
      {suggestions.length > 0 && (
        <ul className="absolute z-50 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
          {suggestions.map((s, i) => (
            <li key={i} onClick={() => select(s)}
              className="px-4 py-2 text-sm text-gray-700 hover:bg-green-50 cursor-pointer border-b border-gray-100 last:border-0">
              <span className="font-medium">{s.display_name.split(',')[0]}</span>
              <span className="text-xs text-gray-400 ml-1">{s.display_name.split(',').slice(1, 3).join(',')}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// ── Main Component ───────────────────────────────────────────────────────────
const RoutePlanner = () => {
  const { user } = useAuth();
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [startCoords, setStartCoords] = useState(null);
  const [endCoords, setEndCoords] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [routeData, setRouteData] = useState(null);
  const [localStops, setLocalStops] = useState([]);
  const [routeCoords, setRouteCoords] = useState(null);
  const [distanceKm, setDistanceKm] = useState(null);
  const [durationSecs, setDurationSecs] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ minPowerKw: '', amenities: [], providers: [] });
  const [mapInteractive, setMapInteractive] = useState(false);
  const isTouchDevice = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);

  useEffect(() => { loadVehicles(); }, [user]);

  const loadVehicles = async () => {
    try {
      const res = await api.get('/vehicles');
      const data = res?.data?.data || [];
      if (data.length) {
        setVehicles(data);
        setSelectedVehicleId(data[0]._id);
        setSelectedVehicle(data[0]);
      }
    } catch (err) { console.warn('Vehicle fetch error:', err.message); }
  };

  const [currentChargeOverride, setCurrentChargeOverride] = React.useState(null);

  const handleVehicleChange = (id) => {
    setSelectedVehicleId(id);
    const v = vehicles.find((veh) => veh._id === id) || null;
    setSelectedVehicle(v);
    setCurrentChargeOverride(v ? (v.currentChargePercent ?? 80) : null);
    setRouteData(null); setRouteCoords(null); setDistanceKm(null);
  };

  // Use overridden charge for calculations
  const activeVehicle = selectedVehicle
    ? { ...selectedVehicle, currentChargePercent: currentChargeOverride ?? selectedVehicle.currentChargePercent ?? 80 }
    : null;

  const handleSearch = async () => {
    if (vehicles.length === 0) return setError('Please add a vehicle first.');
    if (!start || !end) return setError('Please enter Start and Destination.');
    if (!selectedVehicleId) return setError('Please select a vehicle.');

    setLoading(true);
    setError(null);
    setRouteData(null);
    setRouteCoords(null);

    try {
      // Step 1: Geocode if not already done
      let sCoords = startCoords;
      let eCoords = endCoords;
      if (!sCoords) { sCoords = await geocodeWithNominatim(start); setStartCoords(sCoords); }
      if (!eCoords) { eCoords = await geocodeWithNominatim(end); setEndCoords(eCoords); }

      if (!sCoords || !eCoords) {
        setLoading(false);
        return setError(`Could not find "${!sCoords ? start : end}". Try a more specific name like "Goa, India" or "Dispur, Assam".`);
      }

      // Step 2: Get real road route from OSRM
      const roadRoute = await getRoadRoute(sCoords, eCoords);
      const coords = roadRoute ? roadRoute.coordinates : [sCoords, eCoords];
      const km = roadRoute ? roadRoute.distanceKm : haversineKm(sCoords, eCoords);
      const dur = roadRoute ? roadRoute.durationSecs : (km / 60) * 3600;

      setRouteCoords(coords);
      setDistanceKm(km);
      setDurationSecs(dur);

      // Step 3: Calculate local stops
      const stops = estimateStopsLocal(km, activeVehicle || selectedVehicle);
      setLocalStops(stops);

      // Step 4: Try backend for station recommendations
      try {
        const response = await api.post('/routes/search', {
          start: sCoords, end: eCoords,
          vehicleId: selectedVehicleId, filters,
        });
        if (response.data.success) {
          // Merge backend stop data with our road route
          const bd = response.data.data;
          setRouteData({
            ...bd,
            route: { ...bd.route, coordinates: coords, distanceKm: km, durationSecs: dur },
            summary: { ...bd.summary, totalDistanceKm: km, driveTimeMinutes: Math.round(dur / 60) },
          });
        } else {
          // Use local calculation only
          setRouteData(buildLocalRouteData(sCoords, eCoords, coords, km, dur, stops, activeVehicle || selectedVehicle));
        }
      } catch {
        setRouteData(buildLocalRouteData(sCoords, eCoords, coords, km, dur, stops, activeVehicle || selectedVehicle));
      }
    } catch (err) {
      setError('Route planning failed: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const buildLocalRouteData = (s, e, coords, km, dur, stops, vehicle) => ({
    route: { start: s, end: e, coordinates: coords, distanceKm: km, durationSecs: dur },
    vehicle,
    stops: stops.map(st => ({ ...st, station: null, chargeTimeMinutes: 30, costRupees: 0 })),
    summary: {
      totalStops: stops.length, totalDistanceKm: km,
      driveTimeMinutes: Math.round(dur / 60),
      totalChargeTimeMinutes: stops.length * 30,
      totalCostRupees: 0,
    },
    allStations: [],
    useMock: true,
  });

  const toggleFilter = (type, value) => {
    setFilters(prev => ({
      ...prev,
      [type]: prev[type].includes(value) ? prev[type].filter(x => x !== value) : [...prev[type], value],
    }));
  };

  const displayVehicle = routeData?.vehicle || selectedVehicle;
  const displayDistance = routeData?.summary?.totalDistanceKm || distanceKm;

  return (
    <div
  style={{
    minHeight: '100vh',
    background: '#f0fdf8',
    paddingBottom: '40px',
  }}
>
      <div
  style={{
    maxWidth: '1200px',
    margin: '-40px auto 0',
    padding: '0 16px',
    position: 'relative',
    zIndex: 10,
  }}
>
        {/* HEADER */}
<div
  style={{
    background:
      'linear-gradient(135deg, #064e3b 0%, #065f46 55%, #047857 100%)',
    padding: '32px 24px 70px',
    position: 'relative',
    overflow: 'hidden',
    borderRadius: '0 0 24px 24px',
  }}
>
  <div
    style={{
      position: 'absolute',
      top: -50,
      right: -50,
      width: 200,
      height: 200,
      background: 'rgba(255,255,255,0.05)',
      borderRadius: '50%',
    }}
  />

  <div
    style={{
      position: 'absolute',
      bottom: -30,
      left: 60,
      width: 140,
      height: 140,
      background: 'rgba(16,185,129,0.1)',
      borderRadius: '50%',
    }}
  />

  <div style={{ position: 'relative', zIndex: 1 }}>
    <h1
      style={{
        color: '#fff',
        fontSize: '2rem',
        fontWeight: 800,
        marginBottom: '8px',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      ⚡ Route Planner
    </h1>

    <p
      style={{
        color: 'rgba(255,255,255,0.7)',
        fontSize: '0.95rem',
      }}
    >
      Smart EV trip planning with charging stops
    </p>
  </div>
</div>

        {/* Input Panel */}

<div
  style={{
    background: '#fff',
    borderRadius: '22px',
    padding: '28px',
    border: '1.5px solid #d1fae5',
    boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
    marginBottom: '24px',
  }}
>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <AddressInput label="Start" value={start} onChange={setStart}
              onCoordsFound={setStartCoords} placeholder="e.g., Pune, Goa, Chennai" />
            <AddressInput label="Destination" value={end} onChange={setEnd}
              onCoordsFound={setEndCoords} placeholder="e.g., Mumbai, Assam, Delhi" />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle</label>
              {vehicles.length === 0 ? (
                <div className="w-full px-4 py-2 border-2 border-dashed border-yellow-400 rounded-lg bg-yellow-50 text-center">
                  <p className="text-sm text-yellow-700 font-medium mb-1">No vehicles added yet</p>
                  <a href="/vehicles/add" className="text-sm text-green-600 font-semibold underline hover:text-green-800">+ Add a Vehicle first</a>
                </div>
              ) : (
                <select value={selectedVehicleId} onChange={(e) => handleVehicleChange(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                  <option value="">-- Select vehicle --</option>
                  {vehicles.map((v) => (
                    <option key={v._id} value={v._id}>{v.name} — {v.range} km range ({v.currentChargePercent}% charged)</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Vehicle info strip with live charge override */}
          {selectedVehicle && activeVehicle && (
            <div style={{
              padding: '16px',
              marginBottom: '20px',
              borderRadius: '16px',
              background: 'rgba(16,185,129,0.08)',
              border: '1px solid rgba(16,185,129,0.2)',
              fontSize: '0.82rem',
            }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '14px', alignItems: 'center' }}>
                <span className="flex items-center gap-1 text-green-700"><FaCar /> <strong>{selectedVehicle.name}</strong></span>
                <span className="text-gray-600">Full range: <strong>{selectedVehicle.range} km</strong></span>
                <span className="text-gray-600">Battery: <strong>{selectedVehicle.batteryCapacity} kWh</strong></span>
                <span style={{ background: '#d1fae5', color: '#065f46', padding: '2px 10px', borderRadius: 20, fontWeight: 700 }}>
                  ⚡ Effective now: {(activeVehicle.range * activeVehicle.currentChargePercent / 100).toFixed(0)} km
                </span>
              </div>

              {/* Live charge slider */}
              <div style={{ background: 'rgba(255,255,255,0.7)', borderRadius: 12, padding: '12px 14px', border: '1px solid rgba(16,185,129,0.15)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label style={{ fontWeight: 700, fontSize: '0.8rem', color: '#065f46' }}>
                    🔋 Current Battery Charge
                  </label>
                  <span style={{
                    fontWeight: 800, fontSize: '1.1rem',
                    color: activeVehicle.currentChargePercent >= 70 ? '#10b981' : activeVehicle.currentChargePercent >= 30 ? '#f59e0b' : '#ef4444'
                  }}>
                    {activeVehicle.currentChargePercent}%
                  </span>
                </div>
                <input
                  type="range" min="1" max="100" step="1"
                  value={activeVehicle.currentChargePercent}
                  onChange={(e) => setCurrentChargeOverride(parseInt(e.target.value))}
                  style={{
                    width: '100%',
                    accentColor: activeVehicle.currentChargePercent >= 70 ? '#10b981' : activeVehicle.currentChargePercent >= 30 ? '#f59e0b' : '#ef4444',
                    height: 6, cursor: 'pointer',
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#94a3b8', marginTop: 4 }}>
                  <span>⚠️ Low</span><span>↔ Mid</span><span>✅ Good</span>
                </div>
                {activeVehicle.currentChargePercent < 20 && (
                  <p style={{ margin: '8px 0 0', fontSize: '0.75rem', color: '#ef4444', fontWeight: 600 }}>⚠️ Very low charge! Route may require more charging stops.</p>
                )}
              </div>
            </div>
          )}

          <button onClick={() => setShowFilters(s => !s)} className="flex items-center gap-2 text-sm text-green-600 hover:text-green-700 mb-4">
            <FaFilter /> {showFilters ? 'Hide' : 'Show'} Filters
          </button>

          {showFilters && (
            <div className="border-t pt-4 mb-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Min Power (kW)</label>
                  <input type="number" value={filters.minPowerKw}
                    onChange={(e) => setFilters({ ...filters, minPowerKw: e.target.value })}
                    placeholder="e.g., 50"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Amenities</label>
                  <div className="flex flex-wrap gap-2">
                    {['Restroom','Cafe','Parking','WiFi','ATM','Restaurant'].map(a => (
                      <button key={a} onClick={() => toggleFilter('amenities', a)}
                        className={`px-3 py-1 text-xs rounded-full ${filters.amenities.includes(a) ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'}`}>{a}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Providers</label>
                  <div className="flex flex-wrap gap-2">
                    {['Tata Power','ChargePoint','Ather Grid','Zeon Charging'].map(p => (
                      <button key={p} onClick={() => toggleFilter('providers', p)}
                        className={`px-3 py-1 text-xs rounded-full ${filters.providers.includes(p) ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'}`}>{p}</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

         <button
  onClick={handleSearch}
  disabled={loading}
  style={{
    background: 'linear-gradient(135deg,#10b981,#059669)',
    color: '#fff',
    border: 'none',
    padding: '14px 28px',
    borderRadius: '14px',
    fontWeight: 700,
    fontSize: '0.95rem',
    cursor: loading ? 'not-allowed' : 'pointer',
    boxShadow: '0 6px 18px rgba(16,185,129,0.35)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    opacity: loading ? 0.7 : 1,
    transition: 'all 0.2s ease',
  }}
>
  {loading ? (
    <>
      <div
        className="animate-spin"
        style={{
          width: '16px',
          height: '16px',
          border: '2px solid rgba(255,255,255,0.4)',
          borderTopColor: '#fff',
          borderRadius: '50%',
        }}
      />
      Planning Route...
    </>
  ) : (
    <>
      <FaRoute />
      Plan Route
    </>
  )}
</button>

          {error && <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">{error}</div>}
        </div>

        {/* Range bar preview */}
        {selectedVehicle && startCoords && endCoords && !routeData && (
          <RangeBar vehicle={selectedVehicle} distanceKm={haversineKm(startCoords, endCoords)} />
        )}

        {/* Results */}
{routeData && (
  <>
    <RangeBar vehicle={displayVehicle} distanceKm={displayDistance} />

    <div
      style={{
        display: 'grid',
        gridTemplateColumns: window.innerWidth < 1024 ? '1fr' : '2fr 1fr',
        gap: '20px',
        alignItems: 'start',
      }}
    >
      {/* MAP SECTION */}
      <div
        style={{
          width: '100%',
          minWidth: 0,
        }}
      >
        <div
          style={{
            background: '#fff',
            borderRadius: '22px',
            overflow: 'hidden',
            border: '1.5px solid #d1fae5',
            boxShadow: '0 6px 20px rgba(0,0,0,0.06)',
            position: 'relative',
          }}
        >
          {isTouchDevice && (
            <div
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                zIndex: 1000,
              }}
            >
              <button
                onClick={() => setMapInteractive(s => !s)}
                style={{
                  padding: '10px 14px',
                  borderRadius: '12px',
                  border: 'none',
                  background: mapInteractive ? '#dc2626' : '#fff',
                  color: mapInteractive ? '#fff' : '#111827',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.12)',
                }}
              >
                {mapInteractive ? 'Disable Map' : 'Enable Map'}
              </button>
            </div>
          )}

          <MapContainer
            center={[20.5937, 78.9629]}
            zoom={5}
            style={{
              height: window.innerWidth < 768 ? '300px' : '500px',
              width: '100%',
            }}
            dragging={isTouchDevice ? mapInteractive : true}
            touchZoom={isTouchDevice ? mapInteractive : true}
            scrollWheelZoom={false}
            zoomControl={true}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap contributors'
            />

            {routeData.route.coordinates &&
              routeData.route.coordinates.length > 1 && (
                <>
                  <FitBounds coords={routeData.route.coordinates} />

                  <Polyline
                    positions={routeData.route.coordinates.map(c => [
                      c[1],
                      c[0],
                    ])}
                    color="#10b981"
                    weight={5}
                    opacity={0.85}
                  />
                </>
              )}

            {routeData.route.start && (
              <Marker
                position={[
                  routeData.route.start[1],
                  routeData.route.start[0],
                ]}
              >
                <Popup>
                  <strong>🚗 Start:</strong> {start}
                </Popup>
              </Marker>
            )}

            {routeData.route.end && (
              <Marker
                position={[
                  routeData.route.end[1],
                  routeData.route.end[0],
                ]}
              >
                <Popup>
                  <strong>🏁 Destination:</strong> {end}
                </Popup>
              </Marker>
            )}

            {routeData.stops
              ?.filter(s => s.station?.location)
              .map((stop, i) => (
                <Marker
                  key={i}
                  position={[
                    stop.station.location.coordinates[1],
                    stop.station.location.coordinates[0],
                  ]}
                  icon={createStopIcon(i + 1)}
                >
                  <Popup>
                    <strong>Stop {i + 1}:</strong> {stop.station.name}
                  </Popup>
                </Marker>
              ))}

            {routeData.allStations?.map(st => (
              <Marker
                key={st._id}
                position={[
                  st.location.coordinates[1],
                  st.location.coordinates[0],
                ]}
                icon={createChargingIcon()}
              >
                <Popup>
                  <strong>{st.name}</strong>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        <p
          style={{
            fontSize: '12px',
            color: '#94a3b8',
            marginTop: '10px',
            textAlign: 'center',
          }}
        >
          🗺️ Route powered by OpenStreetMap + OSRM
        </p>
      </div>

      {/* RIGHT PANEL */}
      <div
        style={{
          width: '100%',
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        {/* SUMMARY CARD */}
        <div
          style={{
            background: '#fff',
            borderRadius: '20px',
            padding: '24px',
            border: '1.5px solid #d1fae5',
            boxShadow: '0 4px 18px rgba(0,0,0,0.05)',
          }}
        >
          <h2
            style={{
              fontSize: '1.2rem',
              fontWeight: 800,
              marginBottom: '18px',
              color: '#111827',
            }}
          >
            ⚡ Route Summary
          </h2>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            <div className="flex justify-between">
              <span>Distance</span>
              <strong>
                {routeService.formatDistance(
                  routeData.summary.totalDistanceKm
                )}
              </strong>
            </div>

            <div className="flex justify-between">
              <span>Drive Time</span>
              <strong>
                {routeService.formatDuration(
                  routeData.summary.driveTimeMinutes
                )}
              </strong>
            </div>

            <div className="flex justify-between">
              <span>Charging Stops</span>

              <strong
                style={{
                  color:
                    routeData.summary.totalStops > 0
                      ? '#ea580c'
                      : '#16a34a',
                }}
              >
                {routeData.summary.totalStops === 0
                  ? 'None'
                  : routeData.summary.totalStops}
              </strong>
            </div>

            <div
              style={{
                borderTop: '1px solid #e5e7eb',
                paddingTop: '14px',
              }}
              className="flex justify-between"
            >
              <span>Estimated Cost</span>

              <strong style={{ color: '#059669' }}>
                ₹{routeData.summary.totalCostRupees}
              </strong>
            </div>
          </div>
        </div>

        {/* STOPS */}
        {routeData.stops?.length > 0 && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            {routeData.stops.map((stop, i) => (
              <StopCard key={i} stop={stop} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  </>
)}
      </div>
    </div>
  );
};

export default RoutePlanner;