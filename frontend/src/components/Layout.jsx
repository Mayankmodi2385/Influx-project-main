import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NavigationDrawer from './NavigationDrawer';
import { FaBars, FaBolt } from 'react-icons/fa';

const Layout = ({ children }) => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  if (!navigate || !location) return <main className="min-h-screen">{children}</main>;

  const handleLogout = async () => { await logout(); navigate('/welcome'); };
  const hideHeader = ['/welcome', '/login', '/register'].includes(location.pathname);
  if (hideHeader) return <main className="min-h-screen">{children}</main>;

  const isActive = (path) => path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/route-planner', label: 'Route Planner' },
    ...(isAuthenticated ? [
      { to: '/dashboard', label: 'Dashboard' },
      { to: '/profile', label: 'Profile' },
    ] : []),
  ];

  return (
    <div className="min-h-screen" style={{ background: '#f0fdf8' }}>

      {/* MOBILE HEADER */}
      <header
        className="md:hidden sticky top-0"
        style={{
          background: 'linear-gradient(135deg, #065f46, #047857)',
          boxShadow: '0 2px 16px rgba(0,0,0,0.18)',
          zIndex: 30,
          position: 'sticky',
          top: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px' }}>
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Open navigation"
            style={{
              background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: 10,
              padding: '8px 10px', cursor: 'pointer', color: '#fff', display: 'flex',
              position: 'relative', zIndex: 31,
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <FaBars style={{ width: 18, height: 18 }} />
          </button>

          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 10, padding: '5px 10px', display: 'flex', alignItems: 'center', gap: 7, border: '1px solid rgba(255,255,255,0.25)' }}>
              <FaBolt style={{ color: '#fff', width: 14, height: 14 }} />
              <span style={{ color: '#fff', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: '1.15rem', letterSpacing: '-0.02em' }}>InFlux</span>
            </div>
          </Link>

          <Link to={isAuthenticated ? '/dashboard' : '/login'} style={{ textDecoration: 'none' }}>
            {isAuthenticated && user ? (
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'linear-gradient(135deg, #34d399, #10b981)',
                border: '2px solid rgba(255,255,255,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, color: '#fff', fontSize: '0.9rem',
              }}>
                {user.name?.charAt(0).toUpperCase()}
              </div>
            ) : (
              <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: '7px 14px', color: '#fff', fontSize: '0.8rem', fontWeight: 700, border: '1px solid rgba(255,255,255,0.25)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Login
              </div>
            )}
          </Link>
        </div>
      </header>

      {/* DESKTOP HEADER */}
      <nav
        className="hidden md:block sticky top-0 z-30"
        style={{
          background: 'rgba(255,255,255,0.97)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid #d1fae5',
          boxShadow: '0 1px 12px rgba(0,0,0,0.06)',
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
              <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg, #10b981, #059669)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 10px rgba(16,185,129,0.35)' }}>
                  <FaBolt style={{ color: '#fff', fontSize: 15 }} />
                </div>
                <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: '1.25rem', color: '#065f46', letterSpacing: '-0.025em' }}>InFlux</span>
              </Link>
              <div style={{ display: 'flex', gap: 4 }}>
                {navLinks.map(link => (
                  <Link key={link.to} to={link.to} style={{
                    textDecoration: 'none', padding: '7px 16px', borderRadius: 10,
                    fontSize: '0.875rem',
                    fontWeight: isActive(link.to) ? 700 : 500,
                    color: isActive(link.to) ? '#065f46' : '#475569',
                    background: isActive(link.to) ? '#d1fae5' : 'transparent',
                    transition: 'all 0.15s ease',
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}>
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {isAuthenticated ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#fff', fontSize: '0.85rem', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      {user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#334155' }}>{user?.name}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    style={{ background: '#fee2e2', color: '#dc2626', border: '1.5px solid #fecaca', borderRadius: 10, padding: '7px 16px', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif", transition: 'all 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#fecaca'}
                    onMouseLeave={e => e.currentTarget.style.background = '#fee2e2'}
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" style={{ textDecoration: 'none', color: '#475569', fontWeight: 600, fontSize: '0.875rem', padding: '7px 14px', borderRadius: 10, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Login</Link>
                  <Link to="/register" style={{
                    textDecoration: 'none',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: '#fff', fontWeight: 700, fontSize: '0.875rem',
                    padding: '9px 20px', borderRadius: 10,
                    boxShadow: '0 2px 10px rgba(16,185,129,0.35)',
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}>Get Started</Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <NavigationDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
      {/* FIXED: removed aria-hidden={drawerOpen} — it was blocking touch events on mobile */}
      <main className="flex-1">{children}</main>
    </div>
  );
};

export default Layout;