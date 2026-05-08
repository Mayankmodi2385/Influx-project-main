import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FaHome, FaCalendarCheck, FaStar, FaChartLine,
  FaQuestionCircle, FaCog, FaUserPlus, FaSignOutAlt, FaTimes,
} from 'react-icons/fa';

const NavigationDrawer = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const body = document.body;
    if (!body) return undefined;
    if (isOpen) {
      body.style.overflow = 'hidden';
    } else {
      body.style.overflow = '';
    }
    return () => { body.style.overflow = ''; };
  }, [isOpen]);

  const handleLogout = async () => {
    await logout();
    navigate('/welcome');
    onClose();
  };

  const menuItems = [
    { to: '/', label: 'Dashboard', emoji: '🏠' },
    { to: '/dashboard?tab=bookings', label: 'Reservations', emoji: '📅' },
    { to: '/dashboard?tab=favorites', label: 'Activity', emoji: '⭐' },
    { to: '/route-planner', label: 'Route Planner', emoji: '🗺️' },
  ];

  const secondaryItems = [
    { to: '/help', label: 'Get Help', emoji: '❓' },
    { to: '/settings', label: 'Settings', emoji: '⚙️' },
    { to: '/refer', label: 'Refer A Friend', emoji: '🤝' },
  ];

  return (
    <>
      {/* Backdrop — always in DOM, fades in/out */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(2px)',
          zIndex: 40,
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          transition: 'opacity 0.28s ease',
        }}
      />

      {/* Drawer — slides in from left */}
      <div
        style={{
          position: 'fixed', left: 0, top: 0, bottom: 0,
          width: '72%', maxWidth: 300,
          background: 'linear-gradient(160deg, #ecfdf5 0%, #d1fae5 100%)',
          zIndex: 50,
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1)',
          display: 'flex', flexDirection: 'column',
          boxShadow: isOpen ? '4px 0 32px rgba(0,0,0,0.18)' : 'none',
          isolation: 'isolate',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1.5px solid #a7f3d0',
          background: 'linear-gradient(135deg, #065f46, #047857)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 22 }}>⚡</span>
            <span style={{ color: '#fff', fontWeight: 800, fontSize: '1.15rem', fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: '-0.02em' }}>InFlux</span>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, padding: '6px 8px', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', WebkitTapHighlightColor: 'transparent' }}
            aria-label="Close menu"
          >
            <FaTimes style={{ fontSize: 16 }} />
          </button>
        </div>

        {/* Menu Items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 10px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {menuItems.map(({ to, label, emoji }) => (
              <Link
                key={to}
                to={to}
                onClick={onClose}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '12px 14px', borderRadius: 12,
                  textDecoration: 'none', color: '#064e3b',
                  fontWeight: 600, fontSize: '0.95rem',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <span style={{ fontSize: 18, width: 24, textAlign: 'center' }}>{emoji}</span>
                <span>{label}</span>
              </Link>
            ))}
          </div>

          <div style={{ borderTop: '1.5px solid #a7f3d0', margin: '12px 4px' }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {secondaryItems.map(({ to, label, emoji }) => (
              <Link
                key={to}
                to={to}
                onClick={onClose}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '12px 14px', borderRadius: 12,
                  textDecoration: 'none', color: '#064e3b',
                  fontWeight: 600, fontSize: '0.95rem',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <span style={{ fontSize: 18, width: 24, textAlign: 'center' }}>{emoji}</span>
                <span>{label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* User Section */}
        <div style={{ borderTop: '1.5px solid #a7f3d0', padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: '50%',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              border: '2px solid #a7f3d0',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ color: '#fff', fontWeight: 800, fontSize: '1.1rem', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {user?.name?.charAt(0).toUpperCase() || '?'}
              </span>
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: 700, color: '#064e3b', fontSize: '0.9rem', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {user?.name || 'Guest'}
              </p>
              <p style={{ margin: 0, fontSize: '0.72rem', color: '#6b7280' }}>
                🗓️ {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              width: '100%', padding: '10px 14px', borderRadius: 12,
              background: '#fee2e2', border: '1.5px solid #fecaca',
              color: '#dc2626', fontWeight: 700, fontSize: '0.85rem',
              cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif",
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <FaSignOutAlt style={{ fontSize: 14 }} />
            🚪 Logout
          </button>
        </div>
      </div>
    </>
  );
};

export default NavigationDrawer;