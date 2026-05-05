import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { routeService } from '../services/routeService';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FaRoute, FaBolt, FaClock, FaRupeeSign, FaFilter } from 'react-icons/fa';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon (Leaflet CDN)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom icons
const createChargingIcon = () =>
  L.divIcon({
    className: 'custom-charging-icon',
    html: `
      <div style="background-color:#10b981;width:28px;height:28px;border-radius:50%;border:2px solid white;display:flex;align-items:center;justify-content:center;">
        <span style="color:white;font-size:14px;">⚡</span>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });

const createStopIcon = () =>
  L.divIcon({
    className: 'custom-stop-icon',
    html: `
      <div style="background-color:#f59e0b;width:24px;height:24px;border-radius:50%;border:2px solid white;display:flex;align-items:center;justify-content:center;">
        <span style="color:white;font-size:12px;font-weight:bold;">S</span>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });

const RoutePlanner = () => {
  const { user } = useAuth();
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [startCoords, setStartCoords] = useState(null);
  const [endCoords, setEndCoords] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [routeData, setRouteData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    minPowerKw: '',
    amenities: [],
    providers: [],
  });

  // Touch interaction toggle
  const [mapInteractive, setMapInteractive] = useState(false);
  const isTouchDevice = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);

  // Auto-disable map interaction after 10s (for mobile UX)
  useEffect(() => {
    if (!mapInteractive || !isTouchDevice) return;
    const timer = setTimeout(() => setMapInteractive(false), 10000);
    return () => clearTimeout(timer);
  }, [mapInteractive, isTouchDevice]);

  // Vehicle update listener
  useEffect(() => {
    const onVehiclesUpdated = (e) => {
      const updatedVehicles = e?.detail || JSON.parse(localStorage.getItem('influx_vehicles') || '[]');
      setVehicles(updatedVehicles);
      setSelectedVehicleId((prev) => prev || (updatedVehicles[0]?._id || ''));
    };

    window.addEventListener('vehiclesUpdated', onVehiclesUpdated);
    return () => window.removeEventListener('vehiclesUpdated', onVehiclesUpdated);
  }, []);

  // Load vehicles for current user
  useEffect(() => {
    loadVehicles();
  }, [user]);

  const loadVehicles = async () => {
    try {
      const res = await api.get('/vehicles');
      const data = res?.data?.data || [];
      if (data.length) {
        setVehicles(data);
        setSelectedVehicleId((prev) => prev || data[0]._id);
      }
    } catch (err) {
      console.warn('Vehicle fetch error:', err.message);
    }
  };

  // Simple mock geocoder
  const geocodeAddress = async (address) => {
    const cityCoords = {
      pune: [73.8567, 18.5204],
      mumbai: [72.8777, 19.076],
      delhi: [77.1025, 28.7041],
      bangalore: [77.5946, 12.9716],
      bengaluru: [77.5946, 12.9716],
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
    if (!start || !end || !selectedVehicleId) return setError('Please fill in all required fields');
    if (!startCoords || !endCoords) return setError('Could not geocode addresses. Try using city names.');

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
      setError(err?.response?.data?.message || 'Route planning failed.');
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

        {/* Inputs + Filters */}
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
              <select
                value={selectedVehicleId}
                onChange={(e) => setSelectedVehicleId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="">-- Select vehicle --</option>
                {vehicles.map((v) => (
                  <option key={v._id} value={v._id}>
                    {v.name} ({v.currentChargePercent}%)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={() => setShowFilters((s) => !s)}
            className="flex items-center gap-2 text-sm text-green-600 hover:text-green-700 mb-4"
          >
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
                      <button
                        key={a}
                        onClick={() => toggleFilter('amenities', a)}
                        className={`px-3 py-1 text-xs rounded-full ${
                          filters.amenities.includes(a) ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Providers</label>
                  <div className="flex flex-wrap gap-2">
                    {['Tata Power', 'ChargePoint', 'Ather Grid', 'Zeon Charging'].map((p) => (
                      <button
                        key={p}
                        onClick={() => toggleFilter('providers', p)}
                        className={`px-3 py-1 text-xs rounded-full ${
                          filters.providers.includes(p) ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={handleSearch}
            disabled={loading}
            className="w-full md:w-auto px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin h-4 w-4 border-b-2 border-white rounded-full" /> Planning Route...
              </>
            ) : (
              <>
                <FaRoute /> Plan Route
              </>
            )}
          </button>

          {error && <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">{error}</div>}
        </div>

        {/* Map + Summary */}
        {routeData && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Map */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-lg overflow-hidden map-wrapper relative">
                {isTouchDevice && (
                  <div className="map-interaction-toggle safe-bottom">
                    <button
                      onClick={() => setMapInteractive((s) => !s)}
                      className={`px-3 py-2 rounded-md text-sm font-medium ${
                        mapInteractive ? 'bg-red-600 text-white' : 'bg-white text-gray-800'
                      }`}
                    >
                      {mapInteractive ? 'Disable Map' : 'Enable Map'}
                    </button>
                  </div>
                )}

                <MapContainer
                  center={mapBounds.center}
                  zoom={mapBounds.zoom}
                  className="site-map"
                  dragging={interactionEnabled}
                  touchZoom={interactionEnabled}
                  doubleClickZoom={interactionEnabled}
                  scrollWheelZoom={false}
                  zoomControl={true}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  />

                  {/* Route */}
                  {routeData.route.coordinates && (
                    <Polyline positions={routeData.route.coordinates.map((c) => [c[1], c[0]])} color="#10b981" weight={4} opacity={0.7} />
                  )}

                  {/* Markers */}
                  {routeData.route.start && (
                    <Marker position={[routeData.route.start[1], routeData.route.start[0]]}>
                      <Popup>Start: {start}</Popup>
                    </Marker>
                  )}
                  {routeData.route.end && (
                    <Marker position={[routeData.route.end[1], routeData.route.end[0]]}>
                      <Popup>Destination: {end}</Popup>
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

            {/* Summary Panel */}
            <div className="space-y-4">
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
                    <span className="flex items-center gap-1"><FaBolt /> Stops:</span>
                    <span>{routeData.summary.totalStops}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="flex items-center gap-1"><FaRupeeSign /> Total Cost:</span>
                    <span className="font-bold text-green-600">₹{routeData.summary.totalCostRupees}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoutePlanner;
