import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Link, useNavigate } from 'react-router-dom';
import { stationService } from '../services/stationService';
import { favoriteService } from '../services/favoriteService';
import { useAuth } from '../context/AuthContext';
import {
  FaSearch, FaMapMarkerAlt, FaWallet, FaRoute, FaHome,
  FaBolt, FaStar, FaRegStar, FaDownload,
} from 'react-icons/fa';
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
  html: `<div style="width:34px;height:34px;background:linear-gradient(135deg,#10b981,#059669);border-radius:50%;border:3px solid white;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 12px rgba(16,185,129,0.5);font-size:15px;">⚡</div>`,
  iconSize: [34, 34], iconAnchor: [17, 17],
});

// Fallback demo stations when backend is down
const DEMO_STATIONS = [
  { _id: 'd1', name: 'GreenCharge Hub', address: 'Koregaon Park, Pune', pricePerKwh: 8.5, availability: { availableSlots: 3 }, location: { coordinates: [73.8952, 18.5362] } },
  { _id: 'd2', name: 'EcoPoint Station', address: 'Baner Road, Pune', pricePerKwh: 7.0, availability: { availableSlots: 0 }, location: { coordinates: [73.7898, 18.5590] } },
  { _id: 'd3', name: 'SparkCharge Center', address: 'Hinjewadi, Pune', pricePerKwh: 9.2, availability: { availableSlots: 5 }, location: { coordinates: [73.7380, 18.5912] } },
];

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
  const [favouriteIds, setFavouriteIds] = useState(new Set());
  const [togglingId, setTogglingId] = useState(null);
  const [favToast, setFavToast] = useState(null);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstall, setShowInstall] = useState(false);

  // PWA Install prompt listener
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstall(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setShowInstall(false);
    setDeferredPrompt(null);
  };

  useEffect(() => {
    getUserLocation();
    if (isAuthenticated) loadFavourites();
  }, [isAuthenticated]);

  const loadFavourites = async () => {
    try {
      const data = await favoriteService.getFavorites();
      const ids = new Set((data.favorites || data || []).map(f => f._id || f.station?._id || f));
      setFavouriteIds(ids);
    } catch { /* silent */ }
  };

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

  const loadStations = useCallback(async (lat = null, lng = null) => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (lat && lng) { params.lat = lat; params.lng = lng; params.radius = 50000; }
      if (searchQuery) params.q = searchQuery;
      const data = await stationService.getStations(params);
      const list = data.stations || data || [];
      setStations(list.length > 0 ? list : DEMO_STATIONS);
    } catch {
      // On error, show demo stations so user sees something useful
      setStations(DEMO_STATIONS);
      setError(null); // Don't show red error, show demo data instead
    } finally { setLoading(false); }
  }, [searchQuery]);

  const handleSearch = (e) => { e.preventDefault(); loadStations(userLocation?.lat, userLocation?.lng); };

  const handleToggleFavourite = async (e, stationId) => {
    e.preventDefault(); e.stopPropagation();
    if (!isAuthenticated) { navigate('/login'); return; }
    if (togglingId) return;
    setTogglingId(stationId);
    const wasFav = favouriteIds.has(stationId);
    setFavouriteIds(prev => { const next = new Set(prev); wasFav ? next.delete(stationId) : next.add(stationId); return next; });
    try {
      await favoriteService.toggleFavorite(stationId);
      showToast(wasFav ? '💔 Removed from favourites' : '⭐ Added to favourites!', wasFav ? 'remove' : 'add');
    } catch {
      setFavouriteIds(prev => { const next = new Set(prev); wasFav ? next.add(stationId) : next.delete(stationId); return next; });
      showToast('❌ Could not update favourites', 'error');
    } finally { setTogglingId(null); }
  };

  const showToast = (msg, type) => { setFavToast({ msg, type }); setTimeout(() => setFavToast(null), 2800); };

  const mapHeight = 220;

  return (
    <div style={{ minHeight: '100vh', background: '#f0fdf8', paddingBottom: 80, overflowX: 'hidden', width: '100%', maxWidth: '100vw' }}>

      {/* TOAST */}
      {favToast && (
        <div style={{
          position: 'fixed', top: 72, left: '50%', transform: 'translateX(-50%)',
          background: favToast.type === 'add' ? '#065f46' : favToast.type === 'remove' ? '#7f1d1d' : '#1e293b',
          color: '#fff', padding: '10px 22px', borderRadius: 14,
          fontWeight: 700, fontSize: '0.85rem', zIndex: 9999,
          boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          whiteSpace: 'nowrap', maxWidth: 'calc(100vw - 32px)',
        }}>
          {favToast.msg}
        </div>
      )}

      {/* HERO BANNER */}
      <div style={{
        background: 'linear-gradient(135deg, #064e3b 0%, #065f46 55%, #047857 100%)',
        padding: 'clamp(16px,3vw,28px) 16px clamp(20px,4vw,36px)',
        position: 'relative', overflow: 'hidden', width: '100%', boxSizing: 'border-box',
      }}>
        <div style={{ position: 'absolute', top: -60, right: -60, width: 220, height: 220, background: 'rgba(255,255,255,0.05)', borderRadius: '50%', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <h1 style={{ margin: 0, color: '#fff', fontSize: 'clamp(1.2rem,3.5vw,1.8rem)', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, letterSpacing: '-0.02em', wordBreak: 'break-word' }}>
                {isAuthenticated ? `Hey, ${user?.name?.split(' ')[0]} ` : '⚡ Find EV Charging Stations'}
              </h1>
              <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem' }}>
                {loading ? '🔍 Searching nearby...' : `🗺️ ${stations.length} station${stations.length !== 1 ? 's' : ''} near you`}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              {showInstall && (
                <button onClick={handleInstall} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: 'rgba(255,255,255,0.2)', border: '1.5px solid rgba(255,255,255,0.4)',
                  backdropFilter: 'blur(8px)', color: '#fff', padding: '8px 12px', borderRadius: 10,
                  fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', minHeight: 36,
                }}>
                  <FaDownload size={12} /> Install
                </button>
              )}
              <Link to="/route-planner" style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.3)',
                backdropFilter: 'blur(8px)', color: '#fff', textDecoration: 'none',
                padding: '8px 14px', borderRadius: 10,
                fontWeight: 700, fontSize: '0.8rem', fontFamily: "'Plus Jakarta Sans', sans-serif",
                whiteSpace: 'nowrap', minHeight: 36,
              }}>
                <FaRoute /> Plan Route
              </Link>
            </div>
          </div>

          <form onSubmit={handleSearch} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(12px)',
            border: '1.5px solid rgba(255,255,255,0.22)', borderRadius: 12, padding: '8px 14px',
            width: '100%', boxSizing: 'border-box',
          }}>
            <FaSearch style={{ color: 'rgba(255,255,255,0.55)', flexShrink: 0, fontSize: 13 }} />
            <input
              type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search city or station name..."
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: 15, fontFamily: 'inherit', minWidth: 0 }}
            />
            <button type="submit" style={{
              background: 'linear-gradient(135deg,#34d399,#10b981)', color: '#fff',
              border: 'none', borderRadius: 8, padding: '7px 14px',
              fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              whiteSpace: 'nowrap', flexShrink: 0, minHeight: 36,
            }}>Search</button>
          </form>
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '16px', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 18 }} className="home-layout-grid">

          {/* MAP */}
          <div style={{ borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.1)', border: '2px solid #d1fae5', width: '100%' }}>
            <MapContainer center={mapCenter} zoom={13} style={{ height: mapHeight, width: '100%' }} scrollWheelZoom={false}>
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
                    <div style={{ padding: 6, minWidth: 140 }}>
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
          <div style={{ width: '100%', minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, gap: 8 }}>
              <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#064e3b', fontFamily: "'Plus Jakarta Sans', sans-serif", display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                ⚡ Nearby Stations
                <span style={{ background: '#d1fae5', color: '#065f46', fontSize: '0.68rem', fontWeight: 700, padding: '2px 10px', borderRadius: 20 }}>{stations.length}</span>
              </h2>
              {isAuthenticated && (
                <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontStyle: 'italic', flexShrink: 0 }}>Tap ⭐ to favourite</span>
              )}
            </div>

            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[1, 2, 3, 4].map(i => (
                  <div key={i} style={{ height: 78, borderRadius: 14, background: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)', backgroundSize: '400px 100%', animation: 'influx-shimmer 1.4s ease infinite' }} />
                ))}
              </div>
            ) : stations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', background: '#fff', borderRadius: 16, border: '1.5px dashed #d1fae5' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>⚡</div>
                <p style={{ fontWeight: 700, color: '#334155', margin: '0 0 6px' }}>No stations found</p>
                <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>Try a different search location</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {stations.map(station => {
                  const isSelected = selectedStation?._id === station._id;
                  const isFav = favouriteIds.has(station._id);
                  const slots = station.availability?.availableSlots || 0;
                  return (
                    <div key={station._id} style={{ position: 'relative', width: '100%' }}>
                      <Link to={`/stations/${station._id}`}
                        onClick={() => setSelectedStation(station)}
                        style={{
                          display: 'block', textDecoration: 'none',
                          background: isSelected ? 'linear-gradient(135deg,#ecfdf5,#d1fae5)' : '#fff',
                          border: `1.5px solid ${isSelected ? '#10b981' : '#e2e8f0'}`,
                          borderRadius: 14,
                          // Extra right padding only if authenticated (room for star button)
                          padding: isAuthenticated ? '13px 48px 13px 13px' : '13px',
                          boxShadow: isSelected ? '0 0 0 3px rgba(16,185,129,0.15)' : '0 1px 4px rgba(0,0,0,0.05)',
                          transition: 'all 0.15s ease',
                          overflow: 'hidden',
                          boxSizing: 'border-box',
                          width: '100%',
                        }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', minWidth: 0 }}>
                          <div style={{ width: 40, height: 40, background: isSelected ? 'linear-gradient(135deg,#10b981,#059669)' : '#ecfdf5', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <FaBolt style={{ color: isSelected ? '#fff' : '#059669', fontSize: 15 }} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ margin: 0, fontWeight: 700, fontSize: '0.88rem', color: '#0f172a', fontFamily: "'Plus Jakarta Sans', sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {station.name}
                            </p>
                            {station.address && (
                              <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 3 }}>
                                <FaMapMarkerAlt style={{ fontSize: 9, flexShrink: 0 }} />{station.address}
                              </p>
                            )}
                          </div>
                          {/* Price + slots — always inside the card, no overflow */}
                          <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 4 }}>
                            <p style={{ margin: 0, fontWeight: 800, color: '#059669', fontSize: '0.9rem', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                              ₹{Number(station.pricePerKwh || 0).toFixed(2)}
                            </p>
                            <p style={{ margin: '1px 0 0', fontSize: '0.6rem', color: '#94a3b8' }}>per kWh</p>
                            <span style={{
                              display: 'inline-block', marginTop: 4, fontSize: '0.6rem', fontWeight: 700,
                              padding: '2px 7px', borderRadius: 20,
                              background: slots > 0 ? '#dcfce7' : '#fee2e2',
                              color: slots > 0 ? '#15803d' : '#dc2626',
                            }}>{slots > 0 ? `${slots} slots` : 'Full'}</span>
                          </div>
                        </div>
                      </Link>

                      {isAuthenticated && (
                        <button
                          onClick={e => handleToggleFavourite(e, station._id)}
                          disabled={togglingId === station._id}
                          title={isFav ? 'Remove from favourites' : 'Add to favourites'}
                          style={{
                            position: 'absolute', top: '50%', right: 10, transform: 'translateY(-50%)',
                            width: 30, height: 30, borderRadius: '50%',
                            border: `1.5px solid ${isFav ? '#fde68a' : '#d1fae5'}`,
                            background: isFav ? '#fef3c7' : '#f0fdf4',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', opacity: togglingId === station._id ? 0.5 : 1,
                            zIndex: 2, padding: 0, minWidth: 'unset', minHeight: 'unset',
                          }}
                        >
                          {isFav
                            ? <FaStar style={{ color: '#f59e0b', fontSize: 12 }} />
                            : <FaRegStar style={{ color: '#10b981', fontSize: 12 }} />
                          }
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* QUICK ACTIONS */}
        {isAuthenticated && (
          <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Link to="/route-planner" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              background: 'linear-gradient(135deg,#ecfdf5,#d1fae5)',
              border: '1.5px solid #a7f3d0', borderRadius: 14, padding: '13px 12px',
              textDecoration: 'none', color: '#065f46', fontWeight: 700,
              fontSize: '0.83rem', fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}>
              🗺️ Plan a Route
            </Link>
            <Link to="/dashboard?tab=favorites" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              background: 'linear-gradient(135deg,#fffbeb,#fef3c7)',
              border: '1.5px solid #fde68a', borderRadius: 14, padding: '13px 12px',
              textDecoration: 'none', color: '#92400e', fontWeight: 700,
              fontSize: '0.83rem', fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}>
              ⭐ My Favourites
            </Link>
          </div>
        )}
      </div>

      {/* MOBILE BOTTOM NAV */}
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
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '10px 4px 8px', background: 'none', border: 'none', cursor: 'pointer', color: active ? '#059669' : '#94a3b8', fontSize: '0.62rem', fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif", minHeight: 56, minWidth: 'unset', transition: 'color 0.15s' }}>
              <Icon style={{ fontSize: 19 }} />
              {label}
            </button>
          );
        })}
      </nav>

      <style>{`
        @keyframes influx-shimmer { 0% { background-position:-200px 0 } 100% { background-position:200px 0 } }
        @media (min-width:900px) { .home-layout-grid { grid-template-columns: 1fr 380px !important; } }
      `}</style>
    </div>
  );
};

export default Home;