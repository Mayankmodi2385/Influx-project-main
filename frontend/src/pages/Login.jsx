import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useGoogleLogin } from '@react-oauth/google';

/* ── Google OAuth Button ── */
const GoogleBtn = ({ onSuccess, onError, label = 'Sign in with Google' }) => {
  const [gLoading, setGLoading] = useState(false);
  const handleGoogle = useGoogleLogin({
    onSuccess: async (res) => {
      setGLoading(true);
      try { await onSuccess(res.access_token); }
      catch (e) { onError(e?.response?.data?.message || 'Google sign-in failed'); }
      finally { setGLoading(false); }
    },
    onError: () => { onError('Google sign-in failed. Please try again.'); setGLoading(false); },
  });

  return (
    <button
      type="button"
      disabled={gLoading}
      onClick={() => { setGLoading(true); handleGoogle(); }}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
        background: 'rgba(255,255,255,0.95)', border: '1.5px solid rgba(255,255,255,0.5)',
        borderRadius: 12, padding: '13px 20px', cursor: gLoading ? 'not-allowed' : 'pointer',
        fontWeight: 700, fontSize: '0.9rem', color: '#374151',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
        transition: 'all 0.2s ease',
        opacity: gLoading ? 0.7 : 1,
      }}
      onMouseEnter={e => !gLoading && (e.currentTarget.style.background = '#fff')}
      onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.95)')}
    >
      {gLoading ? (
        <span style={{ width: 20, height: 20, border: '2px solid #d1d5db', borderTopColor: '#4285F4', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
      ) : (
        <svg width="20" height="20" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
      )}
      {gLoading ? 'Signing in...' : label}
    </button>
  );
};

const Login = () => {
  const navigate = useNavigate();
  const { login, loginWithGoogle } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

  const handleChange = (e) => { setFormData({ ...formData, [e.target.name]: e.target.value }); setError(''); };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    const loadId = toast.loading('Signing you in...');
    try {
      await login(formData.email, formData.password);
      toast.dismiss(loadId);
      toast.success('Welcome back! 👋');
      navigate('/');
    } catch (err) {
      toast.dismiss(loadId);
      const msg = err.response?.data?.message || 'Login failed. Check your credentials.';
      setError(msg);
      toast.error(msg);
    } finally { setLoading(false); }
  };

  const handleGoogleSuccess = async (token) => {
    const loadId = toast.loading('Signing in with Google...');
    try {
      await loginWithGoogle(token);
      toast.dismiss(loadId);
      toast.success('Signed in with Google! 🎉');
      navigate('/');
    } catch (e) {
      toast.dismiss(loadId);
      const msg = e?.response?.data?.message || 'Google sign-in failed';
      setError(msg);
      toast.error(msg);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 'clamp(16px,4vw,32px)',
      background: 'linear-gradient(135deg, #064e3b 0%, #065f46 40%, #047857 70%, #059669 100%)',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Orbs */}
      <div style={{ position: 'fixed', top: -120, left: -80, width: 400, height: 400, background: 'radial-gradient(circle,rgba(16,185,129,0.22) 0%,transparent 70%)', borderRadius: '50%', pointerEvents: 'none', animation: 'orbFloat 8s ease-in-out infinite' }} />
      <div style={{ position: 'fixed', bottom: -80, right: -60, width: 320, height: 320, background: 'radial-gradient(circle,rgba(5,150,105,0.18) 0%,transparent 70%)', borderRadius: '50%', pointerEvents: 'none', animation: 'orbFloat 8s ease-in-out infinite', animationDelay: '-4s' }} />

      <div style={{
        width: '100%', maxWidth: 420, position: 'relative', zIndex: 1,
        background: 'rgba(255,255,255,0.09)',
        backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(255,255,255,0.18)',
        borderRadius: 28, padding: 'clamp(28px,5vw,40px)',
        boxShadow: '0 24px 60px rgba(0,0,0,0.3), inset 0 0 0 1px rgba(255,255,255,0.06)',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link to="/welcome" style={{ textDecoration: 'none', display: 'inline-block' }}>
            <div style={{ width: 56, height: 56, background: 'linear-gradient(135deg,rgba(255,255,255,0.25),rgba(255,255,255,0.1))', border: '1.5px solid rgba(255,255,255,0.3)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
              <svg viewBox="0 0 48 48" fill="none" style={{ width: 30, height: 30 }}>
                <path d="M28 4L12 26h14l-4 18L42 22H28L28 4z" fill="white" strokeWidth="1.5" strokeLinejoin="round"/>
              </svg>
            </div>
          </Link>
          <h1 style={{ margin: 0, color: '#fff', fontSize: 'clamp(1.5rem,4vw,1.85rem)', fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800, letterSpacing: '-0.025em' }}>Welcome back</h1>
          <p style={{ margin: '6px 0 0', color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>Sign in to your InFlux account</p>
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', color: '#fca5a5', padding: '11px 14px', borderRadius: 12, fontSize: '0.875rem', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ flexShrink: 0 }}>⚠️</span>{error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label style={{ display: 'block', color: 'rgba(255,255,255,0.8)', fontSize: '0.8rem', fontWeight: 600, marginBottom: 7, letterSpacing: '0.02em' }}>Email address</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="you@example.com" required
              style={{ width: '100%', background: 'rgba(255,255,255,0.1)', border: '1.5px solid rgba(255,255,255,0.2)', borderRadius: 12, color: '#fff', fontSize: '0.9375rem', padding: '13px 15px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', transition: 'border-color 0.2s,box-shadow 0.2s' }}
              onFocus={e => { e.target.style.borderColor = 'rgba(255,255,255,0.5)'; e.target.style.boxShadow = '0 0 0 4px rgba(255,255,255,0.07)'; }}
              onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.2)'; e.target.style.boxShadow = 'none'; }} />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
              <label style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.02em' }}>Password</label>
              <Link to="/forgot-password" style={{ color: '#6ee7b7', fontSize: '0.78rem', fontWeight: 600, textDecoration: 'none' }}>Forgot password?</Link>
            </div>
            <div style={{ position: 'relative' }}>
              <input type={showPass ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange} placeholder="Enter your password" required
                style={{ width: '100%', background: 'rgba(255,255,255,0.1)', border: '1.5px solid rgba(255,255,255,0.2)', borderRadius: 12, color: '#fff', fontSize: '0.9375rem', padding: '13px 48px 13px 15px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', transition: 'border-color 0.2s,box-shadow 0.2s' }}
                onFocus={e => { e.target.style.borderColor = 'rgba(255,255,255,0.5)'; e.target.style.boxShadow = '0 0 0 4px rgba(255,255,255,0.07)'; }}
                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.2)'; e.target.style.boxShadow = 'none'; }} />
              <button type="button" onClick={() => setShowPass(s => !s)}
                style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 17, lineHeight: 1, padding: 0 }}>
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} style={{
            width: '100%', background: 'linear-gradient(135deg,#34d399,#10b981)',
            color: '#fff', border: 'none', borderRadius: 12, padding: '14px',
            fontWeight: 700, fontSize: '0.9375rem', cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: "'Plus Jakarta Sans',sans-serif", opacity: loading ? 0.75 : 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: '0 4px 20px rgba(16,185,129,0.4)', transition: 'all 0.2s ease', marginTop: 4,
          }}
            onMouseEnter={e => !loading && (e.currentTarget.style.transform = 'translateY(-1px)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}>
            {loading && <span style={{ width: 18, height: 18, border: '2.5px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />}
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '22px 0' }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.18)' }} />
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', fontWeight: 500 }}>or continue with</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.18)' }} />
        </div>

        {/* Google Button */}
        {GOOGLE_CLIENT_ID ? (
          <GoogleBtn onSuccess={handleGoogleSuccess} onError={(msg) => { setError(msg); toast.error(msg); }} label="Sign in with Google" />
        ) : (
          <div style={{ width: '100%', background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.15)', borderRadius: 12, padding: '13px 20px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.875rem', fontWeight: 600 }}>
            🔑 Google sign-in not configured
          </div>
        )}

        <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'rgba(255,255,255,0.55)', marginTop: 22 }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: '#6ee7b7', fontWeight: 700, textDecoration: 'none' }}>Create one</Link>
        </p>
      </div>

      <style>{`
        @keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }
        @keyframes orbFloat { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(20px,-15px) scale(1.04)} 66%{transform:translate(-15px,10px) scale(0.97)} }
        input::placeholder { color: rgba(255,255,255,0.4) !important; }
      `}</style>
    </div>
  );
};

export default Login;