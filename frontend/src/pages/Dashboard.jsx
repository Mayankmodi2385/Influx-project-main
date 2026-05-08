import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { favoriteService } from '../services/favoriteService';
import api from '../services/api';

/* ── tiny helpers ── */
const S = {
  card: { background: '#fff', borderRadius: 16, border: '1.5px solid #d1fae5', boxShadow: '0 1px 6px rgba(0,0,0,0.05)', overflow: 'hidden' },
  label: { fontSize: '0.72rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 4px' },
  val: { fontSize: '1.6rem', fontWeight: 800, color: '#065f46', fontFamily: "'Plus Jakarta Sans', sans-serif", margin: 0, lineHeight: 1 },
};

const StatCard = ({ label, value, icon, color = '#d1fae5', textColor = '#065f46' }) => (
  <div style={{ ...S.card, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
    <div style={{ width: 48, height: 48, background: color, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{icon}</div>
    <div>
      <p style={S.label}>{label}</p>
      <p style={{ ...S.val, color: textColor }}>{value}</p>
    </div>
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState('overview');
  const [walletBalance, setWalletBalance] = useState(0);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const qp = new URLSearchParams(location.search);
    const tab = qp.get('tab');
    if (tab) setActiveTab(tab);
  }, [location.search]);

  useEffect(() => {
    window.addEventListener('vehiclesUpdated', onVehiclesUpdated);
    return () => window.removeEventListener('vehiclesUpdated', onVehiclesUpdated);
  }, []);

  const onVehiclesUpdated = (e) => {
    const list = e?.detail || JSON.parse(localStorage.getItem('influx_vehicles') || '[]');
    setVehicles(list);
  };

  useEffect(() => { loadDashboardData(); }, [user]);
  useEffect(() => { if (activeTab === 'vehicle') loadVehicles(); }, [activeTab]);

  const loadVehicles = async () => {
    try {
      const vRes = await api.get('/vehicles');
      setVehicles(vRes?.data?.data || []);
    } catch {
      try {
        const vRes2 = await api.get('/users/vehicle');
        const s = vRes2?.data?.vehicle;
        setVehicles(s ? [s] : []);
      } catch { setVehicles([]); }
    }
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      try { const r = await api.get('/users/wallet'); setWalletBalance(r.data.balance || 0); setPaymentHistory(r.data.history || []); } catch { setWalletBalance(0); setPaymentHistory([]); }
      try { const r = await api.get('/users/bookings'); setBookings(r.data.bookings || []); } catch { setBookings([]); }
      try { const d = await favoriteService.getFavorites(); setFavorites(d.favorites || []); } catch { setFavorites([]); }
      await loadVehicles();
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', emoji: '📊' },
    { id: 'wallet', label: 'Wallet', emoji: '💳' },
    { id: 'bookings', label: 'Bookings', emoji: '📅' },
    { id: 'vehicle', label: 'Vehicles', emoji: '🚗' },
    { id: 'favorites', label: 'Favorites', emoji: '⭐' },
  ];

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0fdf8' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 48, height: 48, border: '3px solid #d1fae5', borderTopColor: '#10b981', borderRadius: '50%', animation: 'influx-spin 0.7s linear infinite', margin: '0 auto 16px' }} />
        <p style={{ color: '#64748b', fontWeight: 600, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Loading dashboard...</p>
      </div>
      <style>{`@keyframes influx-spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f0fdf8', paddingBottom: 40 }}>

      {/* ── HEADER ── */}
      <div style={{
        background: 'linear-gradient(135deg, #064e3b 0%, #065f46 55%, #047857 100%)',
        padding: 'clamp(24px,4vw,36px) clamp(16px,4vw,28px) clamp(60px,8vw,80px)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: -30, left: 60, width: 140, height: 140, background: 'rgba(16,185,129,0.1)', borderRadius: '50%' }} />
        <div style={{ maxWidth: 900, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg,#34d399,#10b981)', border: '3px solid rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, color: '#fff', fontFamily: "'Plus Jakarta Sans', sans-serif", flexShrink: 0 }}>
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <h1 style={{ margin: 0, color: '#fff', fontSize: 'clamp(1.2rem,3vw,1.6rem)', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, letterSpacing: '-0.02em' }}>
                {user?.name}
              </h1>
              <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>{user?.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── STAT CARDS (float up) ── */}
      <div style={{ maxWidth: 900, margin: '-32px auto 0', padding: '0 16px', position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12 }}>
          <StatCard label="Wallet Balance" value={`₹${walletBalance.toFixed(0)}`} icon="💳" color="#d1fae5" textColor="#065f46" />
          <StatCard label="Active Bookings" value={bookings.filter(b => b.status === 'active').length} icon="📅" color="#dbeafe" textColor="#1d4ed8" />
          <StatCard label="Favourites" value={favorites.length} icon="⭐" color="#fef9c3" textColor="#a16207" />
          <StatCard label="My Vehicles" value={vehicles.length} icon="🚗" color="#ede9fe" textColor="#6d28d9" />
        </div>
      </div>

      {/* ── TABS + CONTENT ── */}
      <div style={{ maxWidth: 900, margin: '24px auto 0', padding: '0 16px' }}>

        {/* Tab bar */}
        <div style={{ display: 'flex', gap: 4, background: '#ecfdf5', padding: 4, borderRadius: 14, border: '1px solid #d1fae5', overflowX: 'auto', marginBottom: 20 }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              flex: '1 0 auto', padding: '9px 14px', border: 'none', borderRadius: 10, cursor: 'pointer',
              fontSize: '0.8rem', fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif",
              whiteSpace: 'nowrap', transition: 'all 0.2s ease',
              background: activeTab === tab.id ? '#fff' : 'transparent',
              color: activeTab === tab.id ? '#065f46' : '#64748b',
              boxShadow: activeTab === tab.id ? '0 1px 6px rgba(0,0,0,0.08)' : 'none',
            }}>
              <span style={{ marginRight: 5 }}>{tab.emoji}</span>{tab.label}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW ── */}
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Wallet card */}
            <div style={{ background: 'linear-gradient(135deg,#064e3b,#065f46,#047857)', borderRadius: 18, padding: '24px 28px', color: '#fff', position: 'relative', overflow: 'hidden', boxShadow: '0 8px 30px rgba(6,78,59,0.35)' }}>
              <div style={{ position: 'absolute', top: -30, right: -30, width: 130, height: 130, background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, position: 'relative', zIndex: 1 }}>
                <div>
                  <p style={{ margin: '0 0 6px', color: 'rgba(255,255,255,0.65)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>InFlux Wallet</p>
                  <p style={{ margin: 0, fontSize: 'clamp(1.8rem,4vw,2.4rem)', fontWeight: 800, fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: '-0.02em' }}>₹{walletBalance.toFixed(2)}</p>
                </div>
                <button onClick={() => alert('Add Money coming soon!')}
                  style={{ background: 'rgba(255,255,255,0.18)', border: '1.5px solid rgba(255,255,255,0.3)', color: '#fff', padding: '10px 22px', borderRadius: 12, fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', backdropFilter: 'blur(8px)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  + Add Money
                </button>
              </div>
            </div>

            {/* Recent activity */}
            <div style={S.card}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #d1fae5', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 16 }}>🕒</span>
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Recent Activity</span>
              </div>
              <div style={{ padding: '8px 20px' }}>
                {paymentHistory.length > 0 ? paymentHistory.slice(0, 5).map((p, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: i < 4 ? '1px solid #f1f5f9' : 'none' }}>
                    <div>
                      <p style={{ margin: 0, fontWeight: 600, fontSize: '0.875rem', color: '#0f172a' }}>{p.description || 'Payment'}</p>
                      <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#64748b' }}>{new Date(p.date).toLocaleDateString()}</p>
                    </div>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: p.amount > 0 ? '#059669' : '#dc2626' }}>
                      {p.amount > 0 ? '+' : ''}₹{Math.abs(p.amount).toFixed(2)}
                    </span>
                  </div>
                )) : (
                  <p style={{ textAlign: 'center', padding: '24px 0', color: '#94a3b8', fontSize: '0.875rem' }}>No recent activity yet</p>
                )}
              </div>
            </div>

            {/* Quick actions */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { label: 'Plan a Route', emoji: '🗺️', to: '/route-planner', bg: '#ecfdf5', color: '#065f46' },
                { label: 'Find Stations', emoji: '⚡', to: '/', bg: '#dbeafe', color: '#1e40af' },
                { label: 'Add Vehicle', emoji: '🚗', to: '/vehicles/add', bg: '#ede9fe', color: '#6d28d9' },
                { label: 'Add Station', emoji: '🔌', to: '/stations/add', bg: '#fef9c3', color: '#a16207' },
              ].map(a => (
                <Link key={a.label} to={a.to} style={{ textDecoration: 'none', background: a.bg, borderRadius: 14, padding: '16px', display: 'flex', alignItems: 'center', gap: 12, border: '1.5px solid transparent', transition: 'all 0.15s' }}>
                  <span style={{ fontSize: 22 }}>{a.emoji}</span>
                  <span style={{ fontWeight: 700, fontSize: '0.85rem', color: a.color, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{a.label}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── WALLET ── */}
        {activeTab === 'wallet' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: 'linear-gradient(135deg,#064e3b,#065f46,#047857)', borderRadius: 18, padding: '28px', color: '#fff', boxShadow: '0 8px 30px rgba(6,78,59,0.35)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <p style={{ margin: '0 0 8px', color: 'rgba(255,255,255,0.65)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Current Balance</p>
                <p style={{ margin: 0, fontSize: 'clamp(2rem,5vw,2.8rem)', fontWeight: 800, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>₹{walletBalance.toFixed(2)}</p>
              </div>
              <button onClick={() => alert('Add Money coming soon!')}
                style={{ background: 'rgba(255,255,255,0.18)', border: '1.5px solid rgba(255,255,255,0.3)', color: '#fff', padding: '12px 28px', borderRadius: 12, fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                + Add Money
              </button>
            </div>
            <div style={S.card}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #d1fae5' }}>
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Payment History</span>
              </div>
              <div style={{ padding: '8px 20px' }}>
                {paymentHistory.length > 0 ? paymentHistory.map((p, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: i < paymentHistory.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                    <div>
                      <p style={{ margin: 0, fontWeight: 600, fontSize: '0.875rem', color: '#0f172a' }}>{p.description || 'Payment'}</p>
                      <p style={{ margin: '3px 0 0', fontSize: '0.75rem', color: '#64748b' }}>{new Date(p.date).toLocaleString()}</p>
                      {p.stationName && <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: '#94a3b8' }}>{p.stationName}</p>}
                    </div>
                    <span style={{ fontWeight: 700, fontSize: '1rem', color: p.amount > 0 ? '#059669' : '#dc2626' }}>
                      {p.amount > 0 ? '+' : ''}₹{Math.abs(p.amount).toFixed(2)}
                    </span>
                  </div>
                )) : (
                  <p style={{ textAlign: 'center', padding: '32px 0', color: '#94a3b8' }}>No payment history yet</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── BOOKINGS ── */}
        {activeTab === 'bookings' && (
          <div>
            {bookings.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {bookings.map(b => (
                  <div key={b._id} style={{ ...S.card, padding: '16px 20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <Link to={`/stations/${b.stationId}`} style={{ textDecoration: 'none', fontWeight: 700, fontSize: '0.95rem', color: '#059669', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                          {b.stationName || 'Charging Station'}
                        </Link>
                        <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: '#64748b' }}>{new Date(b.startTime).toLocaleString()}</p>
                        <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>
                          Duration: {Math.round((new Date(b.endTime) - new Date(b.startTime)) / 60000)} min
                        </p>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <span style={{
                          display: 'inline-block', padding: '3px 12px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700,
                          background: b.status === 'active' ? '#dcfce7' : b.status === 'completed' ? '#f1f5f9' : '#fee2e2',
                          color: b.status === 'active' ? '#15803d' : b.status === 'completed' ? '#475569' : '#dc2626',
                        }}>{b.status}</span>
                        <p style={{ margin: '8px 0 0', fontWeight: 800, color: '#059669', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>₹{b.amount?.toFixed(2) || '0.00'}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '4rem 1rem', background: '#fff', borderRadius: 16, border: '1.5px dashed #d1fae5' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📅</div>
                <p style={{ fontWeight: 700, color: '#334155', margin: '0 0 6px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>No bookings yet</p>
                <Link to="/" style={{ display: 'inline-block', marginTop: 16, background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', textDecoration: 'none', padding: '10px 24px', borderRadius: 12, fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif", boxShadow: '0 2px 10px rgba(16,185,129,0.35)' }}>Find a Station</Link>
              </div>
            )}
          </div>
        )}

        {/* ── VEHICLES ── */}
        {activeTab === 'vehicle' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontWeight: 700, fontSize: '1rem', color: '#0f172a', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>My Vehicles</h3>
              <button onClick={() => navigate('/vehicles/add')} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', border: 'none', borderRadius: 12, padding: '9px 18px', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif", boxShadow: '0 2px 10px rgba(16,185,129,0.35)' }}>
                + Add Vehicle
              </button>
            </div>
            {vehicles.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {vehicles.map((v, idx) => (
                  <div key={v._id || idx} style={{ background: 'linear-gradient(135deg,#064e3b,#065f46)', borderRadius: 18, padding: '22px 24px', color: '#fff', position: 'relative', overflow: 'hidden', boxShadow: '0 6px 24px rgba(6,78,59,0.35)' }}>
                    <div style={{ position: 'absolute', top: -30, right: -30, width: 130, height: 130, background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16, position: 'relative', zIndex: 1 }}>
                      <div>
                        <p style={{ margin: '0 0 4px', fontSize: '1.05rem', fontWeight: 800, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{v.name || v.model || 'My Vehicle'}</p>
                        {idx === 0 && <span style={{ background: 'rgba(52,211,153,0.3)', border: '1px solid rgba(52,211,153,0.5)', color: '#6ee7b7', fontSize: '0.65rem', fontWeight: 700, padding: '2px 10px', borderRadius: 20 }}>Primary</span>}
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: '6px 12px', fontSize: '0.75rem', fontWeight: 700 }}>{v.connectorType || 'N/A'}</div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 16, position: 'relative', zIndex: 1 }}>
                      {[['Battery', `${v.batteryCapacity || '—'} kWh`], ['Full Range', `${v.range || '—'} km`], ['License', v.licensePlate || '—']].map(([label, val]) => (
                        <div key={label}>
                          <p style={{ margin: '0 0 3px', color: 'rgba(255,255,255,0.55)', fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
                          <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem' }}>{val}</p>
                        </div>
                      ))}
                    </div>
                    <div style={{ position: 'relative', zIndex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>Current Charge</span>
                        <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>{v.currentChargePercent || 0}%</span>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 20, height: 8 }}>
                        <div style={{ background: 'linear-gradient(90deg,#34d399,#6ee7b7)', height: '100%', borderRadius: 20, width: `${v.currentChargePercent || 0}%`, transition: 'width 0.5s ease' }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '4rem 1rem', background: '#fff', borderRadius: 16, border: '1.5px dashed #d1fae5' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🚗</div>
                <p style={{ fontWeight: 700, color: '#334155', margin: '0 0 6px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>No vehicles added yet</p>
                <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0 0 20px' }}>Add your EV to start planning routes</p>
                <button onClick={() => navigate('/vehicles/add')} style={{ background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', border: 'none', padding: '11px 28px', borderRadius: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif", boxShadow: '0 2px 10px rgba(16,185,129,0.35)' }}>+ Add Your First Vehicle</button>
              </div>
            )}
          </div>
        )}

        {/* ── FAVORITES ── */}
        {activeTab === 'favorites' && (
          <div>
            {favorites.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 12 }}>
                {favorites.map(station => (
                  <Link key={station._id || station} to={`/stations/${station._id || station}`}
                    style={{ textDecoration: 'none', ...S.card, padding: '16px 18px', display: 'block', transition: 'all 0.15s' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      <div style={{ width: 36, height: 36, background: '#ecfdf5', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>⚡</div>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem', color: '#0f172a', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        {typeof station === 'string' ? 'Station' : station.name}
                      </p>
                    </div>
                    {typeof station !== 'string' && (
                      <>
                        {station.address && <p style={{ margin: '0 0 8px', fontSize: '0.78rem', color: '#64748b' }}>{station.address}</p>}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 800, color: '#059669', fontSize: '0.9rem' }}>₹{station.pricePerKwh}/kWh</span>
                          <span style={{ fontSize: '0.72rem', fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: '#dcfce7', color: '#15803d' }}>
                            {station.availability?.availableSlots || 0} slots
                          </span>
                        </div>
                      </>
                    )}
                  </Link>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '4rem 1rem', background: '#fff', borderRadius: 16, border: '1.5px dashed #d1fae5' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>⭐</div>
                <p style={{ fontWeight: 700, color: '#334155', margin: '0 0 6px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>No favourite stations yet</p>
                <Link to="/" style={{ display: 'inline-block', marginTop: 16, background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', textDecoration: 'none', padding: '10px 24px', borderRadius: 12, fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif", boxShadow: '0 2px 10px rgba(16,185,129,0.35)' }}>Explore Stations</Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;