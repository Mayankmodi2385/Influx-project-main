import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Link, useNavigate } from 'react-router-dom';
import { stationService } from '../services/stationService';
import { useAuth } from '../context/AuthContext';
import { FaSearch, FaMapMarkerAlt, FaWallet, FaRoute, FaHome } from 'react-icons/fa';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom charging station icon
const createChargingIcon = () =>
  L.divIcon({
    className: 'custom-charging-icon',
    html: '<div style="background-color: #10b981; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center;"><span style="color: white; font-size: 12px;">⚡</span></div>',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });

const Home = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState([18.5204, 73.8567]); // Pune default
  const [selectedStation, setSelectedStation] = useState(null);

  const renderStationList = ({
    wrapperClass = 'space-y-3',
    cardClass = 'bg-white border border-gray-200 rounded-lg p-4 transition hover:shadow-md',
    highlightSelected = false,
  } = {}) => {
    if (loading) {
      return <div className="text-center py-6 text-gray-500">Loading stations...</div>;
    }

    if (error) {
      return <div className="text-center py-6 text-red-500">{error}</div>;
    }

    if (stations.length === 0) {
      return <div className="text-center py-6 text-gray-500">No stations found</div>;
    }

    return (
      <div className={wrapperClass}>
        {stations.map((station) => {
          const isSelected = selectedStation?._id === station._id;
          const hasPrice = station.pricePerKwh !== undefined && station.pricePerKwh !== null;
          const priceDisplay = hasPrice ? Number(station.pricePerKwh).toFixed(2) : '—';

          return (
            <Link
              key={station._id}
              to={`/stations/${station._id}`}
              className={`${cardClass} ${
                highlightSelected && isSelected ? 'border-green-500 bg-green-50 shadow-lg' : ''
              }`}
              onClick={() => setSelectedStation(station)}
              onMouseEnter={() => setSelectedStation(station)}
            >
              <h3 className="font-semibold text-lg text-green-600 mb-1">{station.name}</h3>
              {station.address && <p className="text-sm text-gray-600 mb-2">{station.address}</p>}
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span className="text-green-600 font-semibold">₹{priceDisplay}/kWh</span>
                {station.distance && <span>{Math.round(station.distance / 1000)} km</span>}
                <span>{station.availability?.availableSlots || 0} slots</span>
              </div>
            </Link>
          );
        })}
      </div>
    );
  };

  useEffect(() => {
    loadStations();
    getUserLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          setMapCenter([latitude, longitude]);
          loadStations(latitude, longitude);
        },
        (err) => {
          console.error('Geolocation error:', err);
          loadStations();
        }
      );
    } else {
      loadStations();
    }
  };

  const loadStations = async (lat = null, lng = null) => {
    try {
      setLoading(true);
      const params = {};
      if (lat && lng) {
        params.lat = lat;
        params.lng = lng;
        params.radius = 50000; // 50km
      }
      if (searchQuery) {
        params.q = searchQuery;
      }
      const data = await stationService.getStations(params);
      setStations(data.stations || []);
      setError(null);
    } catch (err) {
      setError('Failed to load stations');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadStations(userLocation?.lat, userLocation?.lng);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white pb-24 md:pb-0">
      <div className="max-w-7xl mx-auto w-full px-4 py-6 space-y-6">
        {/* Mobile search */}
        <div className="md:hidden">
          <form
            onSubmit={handleSearch}
            className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white/95 px-4 py-3 shadow-md"
          >
            <FaSearch className="text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search nearest station..."
              className="flex-1 bg-transparent text-sm outline-none"
            />
            <button
              type="submit"
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-700"
            >
              Search
            </button>
          </form>
        </div>

        <div className="grid gap-6 md:grid-cols-[2fr_1fr] md:items-start">
          <div className="space-y-4">
            <div className="map-wrapper">
              <div className="map-container">
                <MapContainer center={mapCenter} zoom={13} className="site-map" scrollWheelZoom={false}>
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />

                  {userLocation && (
                    <Marker position={[userLocation.lat, userLocation.lng]}>
                      <Popup>Your Location</Popup>
                    </Marker>
                  )}

                  {stations.map((station) => (
                    <Marker
                      key={station._id}
                      position={[station.location.coordinates[1], station.location.coordinates[0]]}
                      icon={createChargingIcon()}
                      eventHandlers={{
                        click: () => {
                          setSelectedStation(station);
                        },
                      }}
                    >
                      <Popup>
                        <div className="p-2">
                          <h3 className="font-bold text-green-600 mb-1">{station.name}</h3>
                          {station.address && <p className="text-sm text-gray-600 mb-2">{station.address}</p>}
                          <p className="text-sm font-semibold text-green-600 mb-2">
                            ₹
                            {station.pricePerKwh !== undefined && station.pricePerKwh !== null
                              ? Number(station.pricePerKwh).toFixed(2)
                              : '—'}
                            /kWh
                          </p>
                          <Link to={`/stations/${station._id}`} className="text-blue-500 hover:underline text-sm">
                            View Details →
                          </Link>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>
            </div>

            <div className="md:hidden">
              {renderStationList({
                wrapperClass: 'space-y-3',
                cardClass: 'bg-white border border-gray-200 rounded-lg p-4 shadow-sm',
                highlightSelected: true,
              })}
            </div>

            {isAuthenticated && user && (
              <div className="md:hidden rounded-xl border border-green-100 bg-white/95 p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-xl">
                    🚗
                  </div>
                  <div>
                    <p className="text-xs uppercase text-gray-500">Welcome back</p>
                    <p className="text-base font-semibold text-gray-800">{user.name}</p>
                    <p className="text-sm text-gray-600">Vehicle: {user.vehicleName || 'Tata Nexon EV'}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <aside className="hidden md:flex flex-col rounded-xl bg-white shadow-lg">
            <div className="border-b p-4">
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search nearest station..."
                    className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </form>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {renderStationList({
                wrapperClass: 'space-y-3',
                cardClass: 'block border border-gray-200 rounded-lg p-4 transition hover:shadow-md bg-white',
                highlightSelected: true,
              })}
            </div>
          </aside>
        </div>
      </div>

      <nav className="influx-bottom-nav safe-bottom md:hidden">
        <button type="button" onClick={() => navigate('/')} aria-label="Home">
          <FaHome />
          <span>Home</span>
        </button>
        <button type="button" onClick={() => navigate('/route-planner')} aria-label="Plan route">
          <FaRoute />
          <span>Route</span>
        </button>
        <button type="button" onClick={() => navigate('/dashboard?tab=wallet')} aria-label="Wallet">
          <FaWallet />
          <span>Wallet</span>
        </button>
        <button type="button" onClick={getUserLocation} aria-label="Locate me">
          <FaMapMarkerAlt />
          <span>Locate</span>
        </button>
      </nav>
    </div>
  );
};

export default Home;
