import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGoogleLogin } from '@react-oauth/google';

/* ─── Toast System (same as Login) ─── */
const useToast = () => {
  const [toasts, setToasts] = useState([]);
  const show = (msg, type = 'success') => {
    const id = Date.now();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500);
  };
  return { toasts, success: m => show(m, 'success'), error: m => show(m, 'error'), info: m => show(m, 'info') };
};

const ToastBox = ({ toasts }) => (
  <div style={{
    position: 'fixed', top: 16, right: 16, zIndex: 99999,
    display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 320,
    pointerEvents: 'none',
  }}>
    {toasts.map(t => (
      <div key={t.id} style={{
        padding: '13px 18px', borderRadius: 12, fontWeight: 600, fontSize: '0.85rem',
        color: '#fff', fontFamily: "'Plus Jakarta Sans', sans-serif",
        background: t.type === 'error' ? '#dc2626' : t.type === 'info' ? '#2563eb' : '#059669',
        boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
        display: 'flex', alignItems: 'center', gap: 10,
        animation: 'toastSlide 0.3s ease',
      }}>
        <span>{t.type === 'error' ? '❌' : t.type === 'info' ? '⏳' : '✅'}</span>
        {t.msg}
      </div>
    ))}
  </div>
);

/* ─── Google Button ─── */
const GoogleSignUpButton = ({ onSuccess, onError }) => {
  const [gLoading, setGLoading] = useState(false);

  const handleGoogle = useGoogleLogin({
    flow: 'implicit',
    onSuccess: async (tokenResponse) => {
      setGLoading(true);
      try {
        await onSuccess(tokenResponse.access_token);
      } catch (err) {
        onError(err?.response?.data?.message || 'Google sign-up failed. Try again.');
      } finally {
        setGLoading(false);
      }
    },
    onError: () => {
      setGLoading(false);
      onError('Google sign-up was cancelled or failed.');
    },
  });

  return (
    <button
      type="button"
      onClick={() => { setGLoading(true); handleGoogle(); }}
      disabled={gLoading}
      style={{
        width: '100%',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
        padding: '11px 20px', borderRadius: 10,
        border: '1.5px solid #e2e8f0', background: gLoading ? '#f8fafc' : '#fff',
        cursor: gLoading ? 'not-allowed' : 'pointer',
        fontWeight: 600, fontSize: '0.9rem', color: '#374151',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
        transition: 'all 0.15s',
      }}
    >
      {gLoading ? (
        <>
          <span style={{
            width: 18, height: 18, border: '2px solid #d1fae5',
            borderTopColor: '#10b981', borderRadius: '50%',
            display: 'inline-block', animation: 'influxSpin 0.7s linear infinite',
          }} />
          Connecting to Google...
        </>
      ) : (
        <>
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Sign up with Google
        </>
      )}
    </button>
  );
};

const GoogleNotConfiguredButton = ({ onToast }) => (
  <button
    type="button"
    onClick={onToast}
    style={{
      width: '100%',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
      padding: '11px 20px', borderRadius: 10,
      border: '1.5px solid #e2e8f0', background: '#f8fafc',
      cursor: 'pointer',
      fontWeight: 600, fontSize: '0.9rem', color: '#9ca3af',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
    }}
  >
    <svg width="20" height="20" viewBox="0 0 24 24" style={{ opacity: 0.45 }}>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
    Sign up with Google
  </button>
);

/* ══════════════════════════════════════
   REGISTER PAGE
══════════════════════════════════════ */
const Register = () => {
  const navigate = useNavigate();
  const { register, loginWithGoogle } = useAuth();
  const { toasts, success, error: toastError, info } = useToast();

  const [formData, setFormData] = useState({ name: '', email: '', password: '', phone: '' });
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

  const strength = !formData.password ? 0 : formData.password.length < 6 ? 1 : formData.password.length < 10 ? 2 : 3;
  const strengthLabel = ['', 'Weak', 'Good', 'Strong'];
  const strengthColor = ['', '#ef4444', '#f59e0b', '#10b981'];
  const strengthBg = ['', 'bg-red-400', 'bg-yellow-400', 'bg-emerald-500'];

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (formData.password.length < 6) {
      const msg = 'Password must be at least 6 characters';
      setFormError(msg); toastError(msg); return;
    }
    setLoading(true);
    info('Creating your account...');
    try {
      await register(formData.name, formData.email, formData.password);
      success('Account created! Welcome to InFlux 🎉');
      setTimeout(() => navigate('/'), 800);
    } catch (err) {
      const msg = err?.response?.data?.message
        || err?.response?.data?.errors?.map(e => e.message).join(', ')
        || 'Registration failed. Please try again.';
      setFormError(msg); toastError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (accessToken) => {
    info('Creating account with Google...');
    await loginWithGoogle(accessToken);
    success('Account created with Google! 🎉');
    setTimeout(() => navigate('/'), 700);
  };

  return (
    <div className="influx-auth-bg min-h-screen flex items-center justify-center px-6 py-8">
      <ToastBox toasts={toasts} />
      <div className="influx-bg-orb influx-bg-orb-1" />
      <div className="influx-bg-orb influx-bg-orb-2" />

      <div className="influx-auth-card w-full max-w-sm relative z-10">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/welcome">
            <div className="influx-logo-ring mx-auto mb-4">
              <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10">
                <path d="M28 4L12 26h14l-4 18L42 22H28L28 4z" fill="white" strokeWidth="1.5" strokeLinejoin="round"/>
              </svg>
            </div>
          </Link>
          <h1 className="influx-brand-title">Create account</h1>
          <p className="influx-brand-sub mt-1">Join InFlux to start charging smarter</p>
        </div>

        {/* Error Banner */}
        {formError && (
          <div className="influx-alert-error mb-5">
            <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
            </svg>
            {formError}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="influx-field">
            <label className="influx-label">Full Name</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange}
              placeholder="Mayank Modi" required className="influx-input" />
          </div>

          <div className="influx-field">
            <label className="influx-label">Email address</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange}
              placeholder="you@example.com" required className="influx-input" />
          </div>

          <div className="influx-field">
            <label className="influx-label">Password</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'} name="password"
                value={formData.password} onChange={handleChange}
                placeholder="Min. 6 characters" required minLength={6} className="influx-input pr-10"
              />
              <button type="button" onClick={() => setShowPass(s => !s)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, minHeight: 'unset', minWidth: 'unset' }}>
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
            {/* Strength bar */}
            {formData.password && (
              <div style={{ marginTop: 8 }}>
                <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                  {[1,2,3].map(i => (
                    <div key={i} style={{
                      height: 4, flex: 1, borderRadius: 4,
                      background: i <= strength ? strengthColor[strength] : '#e2e8f0',
                      transition: 'background 0.2s',
                    }} />
                  ))}
                </div>
                <p style={{ fontSize: '0.72rem', fontWeight: 600, color: strengthColor[strength], margin: 0 }}>
                  {strengthLabel[strength]}
                </p>
              </div>
            )}
          </div>

          <div className="influx-field">
            <label className="influx-label">
              Phone Number <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional)</span>
            </label>
            <input type="tel" name="phone" value={formData.phone} onChange={handleChange}
              placeholder="08839600663" className="influx-input" />
          </div>

          <button type="submit" disabled={loading} className="influx-btn-primary w-full mt-2">
            {loading && <span className="influx-spinner" />}
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        {/* Divider */}
        <div className="influx-divider my-5"><span>or</span></div>

        {/* Google Button */}
        {GOOGLE_CLIENT_ID ? (
          <GoogleSignUpButton
            onSuccess={handleGoogleSuccess}
            onError={toastError}
          />
        ) : (
          <GoogleNotConfiguredButton
            onToast={() => toastError('⚙️ Add VITE_GOOGLE_CLIENT_ID to your .env file to enable Google Sign-Up')}
          />
        )}

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-emerald-600 font-semibold hover:text-emerald-700">Sign in</Link>
        </p>
      </div>

      <style>{`
        @keyframes toastSlide { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } }
        @keyframes influxSpin { to { transform:rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default Register;