import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { favoriteService } from '../services/favoriteService';
import { stationService } from '../services/stationService';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [myStations, setMyStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('favorites');

  useEffect(() => { loadFavorites(); loadMyStations(); }, []);

  const loadFavorites = async () => {
    try { const data = await favoriteService.getFavorites(); setFavorites(data.favorites || []); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const loadMyStations = async () => {
    try {
      const data = await stationService.getStations();
      setMyStations(data.stations.filter(s => s.ownerId && (s.ownerId._id === user?.id || s.ownerId === user?.id)));
    } catch (err) { console.error(err); }
  };

  const handleRemoveFavorite = async (stationId) => {
    try { await favoriteService.toggleFavorite(stationId); await loadFavorites(); }
    catch (err) { console.error(err); }
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0fdf8' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 44, height: 44, border: '3px solid #d1fae5', borderTopColor: '#10b981', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 14px' }} />
        <p style={{ color: '#64748b', fontWeight: 600 }}>Loading profile...</p>
        <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f0fdf8', paddingBottom: 40 }}>

      {/* ── HEADER BANNER ── */}
      <div style={{
        background: 'linear-gradient(135deg, #064e3b 0%, #065f46 55%, #047857 100%)',
        padding: 'clamp(24px,4vw,40px) clamp(16px,4vw,28px) clamp(60px,8vw,90px)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -60, right: -60, width: 220, height: 220, background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: -40, left: 80, width: 160, height: 160, background: 'rgba(16,185,129,0.1)', borderRadius: '50%' }} />

        <div style={{ maxWidth: 760, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            {/* Avatar */}
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg,#34d399,#10b981)', border: '3px solid rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 800, color: '#fff', fontFamily: "'Plus Jakarta Sans', sans-serif", flexShrink: 0, boxShadow: '0 4px 20px rgba(16,185,129,0.4)' }}>
              {initials}
            </div>
            <div>
              <h1 style={{ margin: 0, color: '#fff', fontSize: 'clamp(1.25rem,3vw,1.7rem)', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, letterSpacing: '-0.02em' }}>
                {user?.name}
              </h1>
              <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem' }}>{user?.email}</p>
              <span style={{ display: 'inline-block', marginTop: 8, background: 'rgba(52,211,153,0.25)', border: '1px solid rgba(52,211,153,0.4)', color: '#6ee7b7', fontSize: '0.72rem', fontWeight: 700, padding: '3px 12px', borderRadius: 20, textTransform: 'capitalize' }}>
                {user?.role || 'user'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 16px' }}>

        {/* ── USER INFO CARD (floats up) ── */}
        <div style={{ background: '#fff', borderRadius: 18, border: '1.5px solid #d1fae5', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', padding: '24px 28px', marginTop: '-36px', position: 'relative', zIndex: 2, marginBottom: 20 }}>
          <h2 style={{ margin: '0 0 16px', fontWeight: 700, fontSize: '0.9rem', color: '#064e3b', fontFamily: "'Plus Jakarta Sans', sans-serif", textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid #f1f5f9', paddingBottom: 12 }}>
            Account Information
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 16 }}>
            {[
              { label: 'Full Name', value: user?.name },
              { label: 'Email', value: user?.email },
              { label: 'Role', value: user?.role || 'User' },
              { label: 'Member Since', value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : 'N/A' },
            ].map(({ label, value }) => (
              <div key={label} style={{ background: '#f8fafc', borderRadius: 12, padding: '12px 16px' }}>
                <p style={{ margin: '0 0 4px', fontSize: '0.7rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
                <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>{value || '—'}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── TABS ── */}
        <div style={{ display: 'flex', gap: 4, background: '#ecfdf5', padding: 4, borderRadius: 14, border: '1px solid #d1fae5', marginBottom: 20 }}>
          {[
            { id: 'favorites', label: `⭐ Favourites (${favorites.length})` },
            { id: 'stations', label: `🔌 My Stations (${myStations.length})` },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              flex: 1, padding: '10px 16px', border: 'none', borderRadius: 10, cursor: 'pointer',
              fontSize: '0.83rem', fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif",
              transition: 'all 0.2s ease',
              background: activeTab === tab.id ? '#fff' : 'transparent',
              color: activeTab === tab.id ? '#065f46' : '#64748b',
              boxShadow: activeTab === tab.id ? '0 1px 6px rgba(0,0,0,0.08)' : 'none',
            }}>{tab.label}</button>
          ))}
        </div>

        {/* ── FAVORITES ── */}
        {activeTab === 'favorites' && (
          <div>
            {favorites.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem 1rem', background: '#fff', borderRadius: 16, border: '1.5px dashed #d1fae5' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>⭐</div>
                <p style={{ fontWeight: 700, color: '#334155', margin: '0 0 6px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>No favourites yet</p>
                <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>Tap the heart icon on any station to save it here</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {favorites.map(station => (
                  <div key={station._id || station} style={{ background: '#fff', borderRadius: 14, border: '1.5px solid #e2e8f0', padding: '15px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.05)', transition: 'all 0.15s' }}>
                    <div style={{ flex: 1 }}>
                      <Link to={`/stations/${station._id || station}`} style={{ textDecoration: 'none', fontWeight: 700, fontSize: '0.95rem', color: '#059669', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        {typeof station === 'string' ? 'Station' : station.name}
                      </Link>
                      {typeof station !== 'string' && (
                        <>
                          {station.address && <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: '#64748b' }}>{station.address}</p>}
                          <span style={{ display: 'inline-block', marginTop: 8, fontWeight: 700, color: '#059669', fontSize: '0.875rem' }}>₹{station.pricePerKwh}/kWh</span>
                        </>
                      )}
                    </div>
                    <button onClick={() => handleRemoveFavorite(station._id || station)}
                      style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 10, padding: '6px 12px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', flexShrink: 0, fontFamily: "'Plus Jakarta Sans', sans-serif", transition: 'all 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#fecaca'}
                      onMouseLeave={e => e.currentTarget.style.background = '#fee2e2'}>
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── MY STATIONS ── */}
        {activeTab === 'stations' && (
          <div>
            {myStations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem 1rem', background: '#fff', borderRadius: 16, border: '1.5px dashed #d1fae5' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🔌</div>
                <p style={{ fontWeight: 700, color: '#334155', margin: '0 0 6px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>No stations added yet</p>
                <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0 0 20px' }}>Add a charging station to see it here</p>
                <Link to="/stations/add" style={{ display: 'inline-block', background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', textDecoration: 'none', padding: '10px 24px', borderRadius: 12, fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif", boxShadow: '0 2px 10px rgba(16,185,129,0.35)' }}>+ Add Station</Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {myStations.map(station => (
                  <div key={station._id} style={{ background: '#fff', borderRadius: 14, border: '1.5px solid #e2e8f0', padding: '15px 18px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <div style={{ width: 36, height: 36, background: '#ecfdf5', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>⚡</div>
                      <Link to={`/stations/${station._id}`} style={{ textDecoration: 'none', fontWeight: 700, fontSize: '0.95rem', color: '#059669', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{station.name}</Link>
                    </div>
                    {station.address && <p style={{ margin: '0 0 10px', fontSize: '0.78rem', color: '#64748b', paddingLeft: 46 }}>{station.address}</p>}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, paddingLeft: 46 }}>
                      <span style={{ fontWeight: 800, color: '#059669', fontSize: '0.9rem' }}>₹{station.pricePerKwh}/kWh</span>
                      <span style={{ fontSize: '0.72rem', fontWeight: 600, padding: '2px 10px', borderRadius: 20, background: '#dcfce7', color: '#15803d' }}>
                        {station.availability?.availableSlots || 0} slots
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;