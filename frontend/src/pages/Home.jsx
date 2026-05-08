import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Link, useNavigate } from 'react-router-dom';
import { stationService } from '../services/stationService';
import { useAuth } from '../context/AuthContext';
import { FaSearch, FaMapMarkerAlt, FaWallet, FaRoute, FaHome, FaBolt, FaChargingStation, FaPlus } from 'react-icons/fa';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const createChargingIcon = () => L.divIcon({
  className: '',
  html: `<div style="width:32px;height:32px;background:linear-gradient(135deg,#10b981,#059669);border-radius:50%;border:3px solid white;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 12px rgba(16,185,129,0.5);font-size:14px;">⚡</div>`,
  iconSize: [32, 32], iconAnchor: [16, 16],
});

const Home = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState([18.5204, 73.8567]);
  const [selectedStation, setSelectedStation] = useState(null);

  useEffect(() => { loadStations(); getUserLocation(); }, []);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        ({ coords: { latitude: lat, longitude: lng } }) => {
          setUserLocation({ lat, lng });
          setMapCenter([lat, lng]);
          loadStations(lat, lng);
        },
        () => loadStations()
      );
    } else loadStations();
  };

  const loadStations = async (lat = null, lng = null) => {
    try {
      setLoading(true);
      const params = {};
      if (lat && lng) { params.lat = lat; params.lng = lng; params.radius = 50000; }
      if (searchQuery) params.q = searchQuery;
      const data = await stationService.getStations(params);
      setStations(data.stations || []);
      setError(null);
    } catch { setError('Failed to load stations'); }
    finally { setLoading(false); }
  };

  const handleSearch = (e) => { e.preventDefault(); loadStations(userLocation?.lat, userLocation?.lng); };

  return (
    <div style={{ minHeight: '100vh', background: '#f0fdf8', paddingBottom: 80 }}>

      {/* ── HERO BANNER ── */}
      <div style={{
        background: 'linear-gradient(135deg, #064e3b 0%, #065f46 55%, #047857 100%)',
        padding: 'clamp(20px,4vw,36px) clamp(16px,4vw,32px) clamp(28px,5vw,48px)',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Orbs */}
        <div style={{ position: 'absolute', top: -60, right: -60, width: 220, height: 220, background: 'rgba(255,255,255,0.05)', borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -40, left: 80, width: 160, height: 160, background: 'rgba(16,185,129,0.1)', borderRadius: '50%', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          {/* Title row */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, marginBottom: 20 }}>
            <div>
              <h1 style={{ margin: 0, color: '#fff', fontSize: 'clamp(1.3rem,3.5vw,2rem)', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, letterSpacing: '-0.02em' }}>
                {isAuthenticated ? `Hey, ${user?.name?.split(' ')[0]} 👋` : 'Find EV Charging Stations'}
              </h1>
              <p style={{ margin: '5px 0 0', color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem' }}>
                {loading ? 'Searching nearby...' : `${stations.length} station${stations.length !== 1 ? 's' : ''} near you`}
              </p>
            </div>
            <Link to="/route-planner" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.3)',
              backdropFilter: 'blur(8px)', color: '#fff', textDecoration: 'none',
              padding: '9px 18px', borderRadius: 12,
              fontWeight: 700, fontSize: '0.85rem', fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}>
              <FaRoute /> Plan Route
            </Link>
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(12px)',
            border: '1.5px solid rgba(255,255,255,0.22)', borderRadius: 14, padding: '10px 16px',
          }}>
            <FaSearch style={{ color: 'rgba(255,255,255,0.55)', flexShrink: 0, fontSize: 14 }} />
            <input
              type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search city or station name..."
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: 15, fontFamily: 'inherit' }}
            />
            <button type="submit" style={{
              background: 'linear-gradient(135deg,#34d399,#10b981)', color: '#fff',
              border: 'none', borderRadius: 10, padding: '8px 18px',
              fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
              fontFamily: "'Plus Jakarta Sans', sans-serif", boxShadow: '0 2px 10px rgba(16,185,129,0.4)',
              whiteSpace: 'nowrap',
            }}>Search</button>
          </form>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px 16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20 }} className="home-layout-grid">

          {/* MAP */}
          <div style={{ borderRadius: 18, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.1)', border: '2px solid #d1fae5' }}>
            <MapContainer center={mapCenter} zoom={13} style={{ height: 420, width: '100%' }} scrollWheelZoom={false}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' />
              {userLocation && (
                <Marker position={[userLocation.lat, userLocation.lng]}>
                  <Popup><strong>📍 You are here</strong></Popup>
                </Marker>
              )}
              {stations.map(station => station?.location?.coordinates && (
                <Marker key={station._id}
                  position={[station.location.coordinates[1], station.location.coordinates[0]]}
                  icon={createChargingIcon()}
                  eventHandlers={{ click: () => setSelectedStation(station) }}>
                  <Popup>
                    <div style={{ padding: 6, minWidth: 160 }}>
                      <p style={{ fontWeight: 700, color: '#059669', margin: '0 0 4px', fontSize: 13 }}>{station.name}</p>
                      {station.address && <p style={{ fontSize: 11, color: '#6b7280', margin: '0 0 8px' }}>{station.address}</p>}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 700, color: '#065f46', fontSize: 13 }}>₹{Number(station.pricePerKwh || 0).toFixed(2)}/kWh</span>
                        <Link to={`/stations/${station._id}`} style={{ color: '#3b82f6', fontSize: 11, fontWeight: 600 }}>View →</Link>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          {/* STATION LIST */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#064e3b', fontFamily: "'Plus Jakarta Sans', sans-serif", display: 'flex', alignItems: 'center', gap: 8 }}>
                <FaChargingStation style={{ color: '#10b981' }} />
                Nearby Stations
                <span style={{ background: '#d1fae5', color: '#065f46', fontSize: '0.68rem', fontWeight: 700, padding: '2px 10px', borderRadius: 20 }}>{stations.length}</span>
              </h2>
              {isAuthenticated && (
                <Link to="/stations/add" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#059669', fontWeight: 700, fontSize: '0.78rem', textDecoration: 'none', background: '#d1fae5', padding: '6px 12px', borderRadius: 10, border: '1px solid #a7f3d0' }}>
                  <FaPlus size={9} /> Add Station
                </Link>
              )}
            </div>

            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[1, 2, 3, 4].map(i => (
                  <div key={i} style={{ height: 80, borderRadius: 14, background: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)', backgroundSize: '800px 100%', animation: 'influx-shimmer 1.4s ease infinite' }} />
                ))}
              </div>
            ) : error ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#ef4444', background: '#fee2e2', borderRadius: 14, border: '1px solid #fecaca', fontWeight: 600 }}>{error}</div>
            ) : stations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', background: '#fff', borderRadius: 16, border: '1.5px dashed #d1fae5' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>⚡</div>
                <p style={{ fontWeight: 700, color: '#334155', margin: '0 0 6px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>No stations found</p>
                <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>Try a different location or add a station</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {stations.map(station => {
                  const isSelected = selectedStation?._id === station._id;
                  const slots = station.availability?.availableSlots || 0;
                  return (
                    <Link key={station._id} to={`/stations/${station._id}`}
                      onClick={() => setSelectedStation(station)}
                      style={{
                        display: 'block', textDecoration: 'none',
                        background: isSelected ? 'linear-gradient(135deg,#ecfdf5,#d1fae5)' : '#fff',
                        border: `1.5px solid ${isSelected ? '#10b981' : '#e2e8f0'}`,
                        borderRadius: 14, padding: '13px 15px',
                        boxShadow: isSelected ? '0 0 0 3px rgba(16,185,129,0.15), 0 2px 8px rgba(0,0,0,0.06)' : '0 1px 4px rgba(0,0,0,0.05)',
                        transition: 'all 0.15s ease',
                      }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 42, height: 42, background: isSelected ? 'linear-gradient(135deg,#10b981,#059669)' : '#ecfdf5', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
                          <FaBolt style={{ color: isSelected ? '#fff' : '#059669', fontSize: 16 }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem', color: '#0f172a', fontFamily: "'Plus Jakarta Sans', sans-serif", whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {station.name}
                          </p>
                          {station.address && (
                            <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', gap: 4 }}>
                              <FaMapMarkerAlt style={{ fontSize: 9, flexShrink: 0 }} />{station.address}
                            </p>
                          )}
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <p style={{ margin: 0, fontWeight: 800, color: '#059669', fontSize: '0.95rem', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                            ₹{Number(station.pricePerKwh || 0).toFixed(2)}
                          </p>
                          <p style={{ margin: '1px 0 0', fontSize: '0.62rem', color: '#94a3b8' }}>per kWh</p>
                          <span style={{
                            display: 'inline-block', marginTop: 5, fontSize: '0.62rem', fontWeight: 700,
                            padding: '2px 8px', borderRadius: 20,
                            background: slots > 0 ? '#dcfce7' : '#fee2e2',
                            color: slots > 0 ? '#15803d' : '#dc2626',
                          }}>{slots > 0 ? `${slots} slots` : 'Full'}</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── MOBILE BOTTOM NAV ── */}
      <nav className="md:hidden" style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(20px)',
        borderTop: '1px solid #e2e8f0', display: 'flex', zIndex: 40,
        paddingBottom: 'env(safe-area-inset-bottom,8px)',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.07)',
      }}>
        {[
          { icon: FaHome, label: 'Home', to: '/' },
          { icon: FaRoute, label: 'Route', to: '/route-planner' },
          { icon: FaWallet, label: 'Wallet', to: '/dashboard?tab=wallet' },
          { icon: FaMapMarkerAlt, label: 'Locate', action: getUserLocation },
        ].map(({ icon: Icon, label, to, action }) => {
          const active = to && window.location.pathname === to?.split('?')[0];
          return (
            <button key={label} type="button"
              onClick={() => action ? action() : navigate(to)}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '10px 4px 8px', background: 'none', border: 'none', cursor: 'pointer', color: active ? '#059669' : '#94a3b8', fontSize: '0.62rem', fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif", minHeight: 56, transition: 'color 0.15s' }}>
              <Icon style={{ fontSize: 19 }} />
              {label}
            </button>
          );
        })}
      </nav>

      <style>{`
        @keyframes influx-shimmer { 0% { background-position:-400px 0 } 100% { background-position:400px 0 } }
        @media (min-width:900px) { .home-layout-grid { grid-template-columns: 1fr 390px !important; } }
      `}</style>
    </div>
  );
};

export default Home;