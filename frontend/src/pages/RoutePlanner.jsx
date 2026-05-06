import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { routeService } from '../services/routeService';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FaRoute, FaBolt, FaClock, FaRupeeSign, FaFilter, FaCar, FaChargingStation } from 'react-icons/fa';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon (Leaflet CDN)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const createChargingIcon = () =>
  L.divIcon({
    className: 'custom-charging-icon',
    html: `<div style="background-color:#10b981;width:28px;height:28px;border-radius:50%;border:2px solid white;display:flex;align-items:center;justify-content:center;"><span style="color:white;font-size:14px;">⚡</span></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });

// ── Range Bar Component ──────────────────────────────────────────────────────
const RangeBar = ({ vehicle, distanceKm }) => {
  if (!vehicle || !distanceKm) return null;

  const effectiveRangeKm = vehicle.range * (vehicle.currentChargePercent / 100);
  const totalDistance = distanceKm;
  const numSegments = Math.ceil(totalDistance / (vehicle.range * 0.8));
  const stops = [];

  let covered = effectiveRangeKm;
  let stopNum = 1;
  while (covered < totalDistance) {
    stops.push({ at: covered, num: stopNum++ });
    covered += vehicle.range * 0.8;
  }

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
        <FaCar className="text-green-600" /> Range Analysis
      </h3>
      <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
        <span>0 km</span>
        <span>{totalDistance.toFixed(0)} km</span>
      </div>
      <div className="relative h-6 bg-gray-200 rounded-full overflow-visible mb-2">
        {/* First segment — current charge */}
        <div
          className="absolute h-full bg-green-500 rounded-l-full"
          style={{ width: `${Math.min(100, (effectiveRangeKm / totalDistance) * 100)}%` }}
        />
        {/* Subsequent segments */}
        {stops.map((stop, i) => {
          const segEnd = Math.min(stop.at + vehicle.range * 0.8, totalDistance);
          const left = (stop.at / totalDistance) * 100;
          const width = ((segEnd - stop.at) / totalDistance) * 100;
          return (
            <div
              key={i}
              className="absolute h-full bg-blue-400 opacity-70"
              style={{ left: `${left}%`, width: `${Math.min(width, 100 - left)}%` }}
            />
          );
        })}
        {/* Stop markers */}
        {stops.map((stop, i) => (
          <div
            key={i}
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10"
            style={{ left: `${Math.min(99, (stop.at / totalDistance) * 100)}%` }}
          >
            <div className="w-5 h-5 bg-yellow-400 border-2 border-white rounded-full flex items-center justify-center shadow">
              <span className="text-xs font-bold text-gray-800">{stop.num}</span>
            </div>
          </div>
        ))}
        {/* Destination marker */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-red-500 border-2 border-white rounded-full shadow" />
      </div>
      <div className="flex flex-wrap gap-3 text-xs mt-2">
        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-500 rounded inline-block" /> Current charge: {effectiveRangeKm.toFixed(0)} km</span>
        {stops.length > 0 && <span className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-400 rounded inline-block" /> After charging (80%): {(vehicle.range * 0.8).toFixed(0)} km</span>}
        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-yellow-400 rounded-full inline-block border border-gray-300" /> Charging stop needed</span>
      </div>
      {stops.length === 0 ? (
        <p className="text-green-600 text-xs font-medium mt-2">✅ Your current charge is enough to reach the destination!</p>
      ) : (
        <p className="text-orange-600 text-xs font-medium mt-2">⚡ {stops.length} charging stop{stops.length > 1 ? 's' : ''} needed along the way</p>
      )}
    </div>
  );
};

// ── Stop Card Component ──────────────────────────────────────────────────────
const StopCard = ({ stop, index }) => (
  <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
    <div className="flex items-center gap-2 mb-2">
      <div className="w-7 h-7 bg-yellow-400 rounded-full flex items-center justify-center font-bold text-gray-800 text-sm">
        {index + 1}
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-800">
          {stop.station ? stop.station.name : 'Charging Stop Required'}
        </p>
        <p className="text-xs text-gray-500">
          At {stop.distanceFromStart?.toFixed(1)} km from start
        </p>
      </div>
    </div>
    {stop.station ? (
      <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mt-2">
        <span>📍 {stop.station.address || 'Along route'}</span>
        <span>⚡ {stop.station.powerRating || 50} kW charger</span>
        <span>🕐 ~{stop.chargeTimeMinutes} min charge</span>
        <span>💰 ₹{stop.costRupees || 0}</span>
      </div>
    ) : (
      <p className="text-xs text-orange-600 mt-1">
        No station found nearby. Add charging stations in this area for better route planning.
      </p>
    )}
    <div className="mt-2 bg-yellow-100 rounded p-2 text-xs text-gray-700">
      Charge to <strong>80%</strong> here → gives you <strong>{stop.kmNeeded?.toFixed(0)} km</strong> range for the next leg
    </div>
  </div>
);

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ minPowerKw: '', amenities: [], providers: [] });
  const [mapInteractive, setMapInteractive] = useState(false);
  const isTouchDevice = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);

  useEffect(() => {
    if (!mapInteractive || !isTouchDevice) return;
    const timer = setTimeout(() => setMapInteractive(false), 10000);
    return () => clearTimeout(timer);
  }, [mapInteractive, isTouchDevice]);

  useEffect(() => {
    const onVehiclesUpdated = (e) => {
      const updated = e?.detail || JSON.parse(localStorage.getItem('influx_vehicles') || '[]');
      setVehicles(updated);
      if (!selectedVehicleId && updated[0]) {
        setSelectedVehicleId(updated[0]._id);
        setSelectedVehicle(updated[0]);
      }
    };
    window.addEventListener('vehiclesUpdated', onVehiclesUpdated);
    return () => window.removeEventListener('vehiclesUpdated', onVehiclesUpdated);
  }, []);

  useEffect(() => { loadVehicles(); }, [user]);

  const loadVehicles = async () => {
    try {
      const res = await api.get('/vehicles');
      const data = res?.data?.data || [];
      if (data.length) {
        setVehicles(data);
        setSelectedVehicleId((prev) => prev || data[0]._id);
        setSelectedVehicle(data[0]);
      }
    } catch (err) {
      console.warn('Vehicle fetch error:', err.message);
    }
  };

  const handleVehicleChange = (id) => {
    setSelectedVehicleId(id);
    setSelectedVehicle(vehicles.find((v) => v._id === id) || null);
    setRouteData(null);
  };

  const geocodeAddress = async (address) => {
    const cityCoords = {
      pune: [73.8567, 18.5204],
      mumbai: [72.8777, 19.076],
      delhi: [77.1025, 28.7041],
      bangalore: [77.5946, 12.9716],
      bengaluru: [77.5946, 12.9716],
      nashik: [73.7898, 19.9975],
      aurangabad: [75.3433, 19.8762],
      nagpur: [79.0882, 21.1458],
      surat: [72.8311, 21.1702],
      ahmedabad: [72.5714, 23.0225],
      hyderabad: [78.4867, 17.385],
      chennai: [80.2707, 13.0827],
    };
    const found = Object.entries(cityCoords).find(([city]) => address.toLowerCase().includes(city));
    return found ? found[1] : [73.8567, 18.5204];
  };

  const handleStartChange = async (v) => {
    setStart(v);
    if (v.length > 3) setStartCoords(await geocodeAddress(v));
  };

  const handleEndChange = async (v) => {
    setEnd(v);
    if (v.length > 3) setEndCoords(await geocodeAddress(v));
  };

  const handleSearch = async () => {
    if (vehicles.length === 0) return setError('Please add a vehicle first before planning a route.');
    if (!start || !end || !selectedVehicleId) {
      return setError('Please fill in Start, Destination and select a Vehicle.');
    }
    if (!startCoords || !endCoords) return setError('Could not find those cities. Try using city names like Pune, Mumbai, Delhi.');

    setLoading(true);
    setError(null);

    try {
      const response = await routeService.searchRoute({
        start: startCoords,
        end: endCoords,
        vehicleId: selectedVehicleId,
        filters,
      });
      response.success ? setRouteData(response.data) : setError(response.message || 'Route planning failed');
    } catch (err) {
      setError(err?.response?.data?.message || 'Route planning failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleFilter = (type, value) => {
    setFilters((prev) => ({
      ...prev,
      [type]: prev[type].includes(value) ? prev[type].filter((x) => x !== value) : [...prev[type], value],
    }));
  };

  const mapBounds = (() => {
    const coords = routeData?.route?.coordinates;
    if (!coords?.length) return { center: [18.5204, 73.8567], zoom: 6 };
    const lats = coords.map((c) => c[1]);
    const lngs = coords.map((c) => c[0]);
    return {
      center: [(Math.min(...lats) + Math.max(...lats)) / 2, (Math.min(...lngs) + Math.max(...lngs)) / 2],
      zoom: 8,
    };
  })();

  const interactionEnabled = isTouchDevice ? mapInteractive : true;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white">
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <FaRoute className="text-green-600" /> Route Planner
        </h1>

        {/* Input Panel */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start</label>
              <input
                value={start}
                onChange={(e) => handleStartChange(e.target.value)}
                placeholder="e.g., Pune"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Destination</label>
              <input
                value={end}
                onChange={(e) => handleEndChange(e.target.value)}
                placeholder="e.g., Mumbai"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle</label>
              {vehicles.length === 0 ? (
                <div className="w-full px-4 py-2 border-2 border-dashed border-yellow-400 rounded-lg bg-yellow-50 text-center">
                  <p className="text-sm text-yellow-700 font-medium mb-1">No vehicles added yet</p>
                  <a href="/vehicles/add" className="text-sm text-green-600 font-semibold underline hover:text-green-800">
                    + Add a Vehicle first
                  </a>
                </div>
              ) : (
                <select
                  value={selectedVehicleId}
                  onChange={(e) => handleVehicleChange(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="">-- Select vehicle --</option>
                  {vehicles.map((v) => (
                    <option key={v._id} value={v._id}>
                      {v.name} — {v.range} km range ({v.currentChargePercent}% charged)
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Vehicle info strip */}
          {selectedVehicle && (
            <div className="flex flex-wrap gap-4 text-xs bg-green-50 rounded-lg p-3 mb-4 border border-green-200">
              <span className="flex items-center gap-1 text-green-700"><FaCar /> <strong>{selectedVehicle.name}</strong></span>
              <span className="text-gray-600">Full range: <strong>{selectedVehicle.range} km</strong></span>
              <span className="text-gray-600">Battery: <strong>{selectedVehicle.batteryCapacity} kWh</strong></span>
              <span className="text-gray-600">Current charge: <strong>{selectedVehicle.currentChargePercent}%</strong></span>
              <span className="text-green-600 font-semibold">Effective range now: {(selectedVehicle.range * selectedVehicle.currentChargePercent / 100).toFixed(0)} km</span>
            </div>
          )}

          <button onClick={() => setShowFilters((s) => !s)} className="flex items-center gap-2 text-sm text-green-600 hover:text-green-700 mb-4">
            <FaFilter /> {showFilters ? 'Hide' : 'Show'} Filters
          </button>

          {showFilters && (
            <div className="border-t pt-4 mb-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Min Power (kW)</label>
                  <input
                    type="number"
                    value={filters.minPowerKw}
                    onChange={(e) => setFilters({ ...filters, minPowerKw: e.target.value })}
                    placeholder="e.g., 50"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Amenities</label>
                  <div className="flex flex-wrap gap-2">
                    {['Restroom', 'Cafe', 'Parking', 'WiFi', 'ATM', 'Restaurant'].map((a) => (
                      <button key={a} onClick={() => toggleFilter('amenities', a)}
                        className={`px-3 py-1 text-xs rounded-full ${filters.amenities.includes(a) ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'}`}>
                        {a}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Providers</label>
                  <div className="flex flex-wrap gap-2">
                    {['Tata Power', 'ChargePoint', 'Ather Grid', 'Zeon Charging'].map((p) => (
                      <button key={p} onClick={() => toggleFilter('providers', p)}
                        className={`px-3 py-1 text-xs rounded-full ${filters.providers.includes(p) ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'}`}>
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          <button onClick={handleSearch} disabled={loading}
            className="w-full md:w-auto px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 flex items-center justify-center gap-2">
            {loading ? (
              <><div className="animate-spin h-4 w-4 border-b-2 border-white rounded-full" /> Planning Route...</>
            ) : (
              <><FaRoute /> Plan Route</>
            )}
          </button>

          {error && <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">{error}</div>}
        </div>

        {/* Range bar — shown as soon as vehicle + destination are selected */}
        {selectedVehicle && endCoords && startCoords && !routeData && (
          <RangeBar
            vehicle={selectedVehicle}
            distanceKm={(() => {
              const R = 6371;
              const dLat = ((endCoords[1] - startCoords[1]) * Math.PI) / 180;
              const dLon = ((endCoords[0] - startCoords[0]) * Math.PI) / 180;
              const a = Math.sin(dLat/2)**2 + Math.cos(startCoords[1]*Math.PI/180)*Math.cos(endCoords[1]*Math.PI/180)*Math.sin(dLon/2)**2;
              return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            })()}
          />
        )}

        {/* Results */}
        {routeData && (
          <>
            {/* Range analysis bar with real distance */}
            <RangeBar vehicle={routeData.vehicle} distanceKm={routeData.summary.totalDistanceKm} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Map */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-lg shadow-lg overflow-hidden relative">
                  {isTouchDevice && (
                    <div className="absolute top-2 right-2 z-[1000]">
                      <button onClick={() => setMapInteractive((s) => !s)}
                        className={`px-3 py-2 rounded-md text-sm font-medium shadow ${mapInteractive ? 'bg-red-600 text-white' : 'bg-white text-gray-800'}`}>
                        {mapInteractive ? 'Disable Map' : 'Enable Map'}
                      </button>
                    </div>
                  )}
                  <MapContainer center={mapBounds.center} zoom={mapBounds.zoom} style={{ height: '400px', width: '100%' }}
                    dragging={interactionEnabled} touchZoom={interactionEnabled} doubleClickZoom={interactionEnabled}
                    scrollWheelZoom={false} zoomControl={true}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' />
                    {routeData.route.coordinates && (
                      <Polyline positions={routeData.route.coordinates.map((c) => [c[1], c[0]])} color="#10b981" weight={4} opacity={0.7} />
                    )}
                    {routeData.route.start && (
                      <Marker position={[routeData.route.start[1], routeData.route.start[0]]}>
                        <Popup>🚗 Start: {start}</Popup>
                      </Marker>
                    )}
                    {routeData.route.end && (
                      <Marker position={[routeData.route.end[1], routeData.route.end[0]]}>
                        <Popup>🏁 Destination: {end}</Popup>
                      </Marker>
                    )}
                    {routeData.allStations?.map((st) => (
                      <Marker key={st._id} position={[st.location.coordinates[1], st.location.coordinates[0]]} icon={createChargingIcon()}>
                        <Popup>
                          <div className="p-2">
                            <h3 className="font-bold text-green-600">{st.name}</h3>
                            <p className="text-sm text-gray-600">{st.address}</p>
                            <p className="text-sm"><strong>Provider:</strong> {st.provider}</p>
                            <p className="text-sm"><strong>Power:</strong> {st.powerRating || 'N/A'} kW</p>
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                  </MapContainer>
                </div>
              </div>

              {/* Summary + Stops */}
              <div className="space-y-4">
                {/* Route Summary */}
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <FaRoute className="text-green-600" /> Route Summary
                  </h2>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Distance:</span>
                      <span className="font-semibold">{routeService.formatDistance(routeData.summary.totalDistanceKm)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="flex items-center gap-1"><FaClock /> Drive Time:</span>
                      <span>{routeService.formatDuration(routeData.summary.driveTimeMinutes)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="flex items-center gap-1"><FaBolt /> Charging Stops:</span>
                      <span className={routeData.summary.totalStops > 0 ? 'text-orange-600 font-bold' : 'text-green-600 font-bold'}>
                        {routeData.summary.totalStops === 0 ? '✅ None needed' : routeData.summary.totalStops}
                      </span>
                    </div>
                    {routeData.summary.totalChargeTimeMinutes > 0 && (
                      <div className="flex justify-between">
                        <span className="flex items-center gap-1"><FaChargingStation /> Charge Time:</span>
                        <span>{routeService.formatDuration(routeData.summary.totalChargeTimeMinutes)}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t pt-2">
                      <span className="flex items-center gap-1"><FaRupeeSign /> Total Cost:</span>
                      <span className="font-bold text-green-600">₹{routeData.summary.totalCostRupees}</span>
                    </div>
                  </div>
                </div>

                {/* Charging Stops Detail */}
                {routeData.stops && routeData.stops.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                      <FaChargingStation className="text-yellow-500" /> Charging Stops
                    </h3>
                    {routeData.stops.map((stop, i) => (
                      <StopCard key={i} stop={stop} index={i} />
                    ))}
                  </div>
                )}

                {routeData.summary.totalStops === 0 && (
                  <div className="bg-green-50 border border-green-300 rounded-lg p-4 text-center">
                    <p className="text-green-700 font-semibold text-lg">✅ No charging needed!</p>
                    <p className="text-green-600 text-sm mt-1">
                      Your {routeData.vehicle.name} can reach {end} on its current charge of {routeData.vehicle.currentChargePercent}%.
                    </p>
                    <p className="text-gray-500 text-xs mt-1">
                      Remaining range after trip: ~{Math.max(0, (routeData.vehicle.range * routeData.vehicle.currentChargePercent / 100) - routeData.summary.totalDistanceKm).toFixed(0)} km
                    </p>
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