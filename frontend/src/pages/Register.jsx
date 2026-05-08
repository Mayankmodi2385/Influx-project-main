import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGoogleLogin } from '@react-oauth/google';

const GoogleLoginButton = ({ onError, onSuccess }) => {
  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try { await onSuccess(tokenResponse.access_token); }
      catch (err) { onError(err.response?.data?.message || 'Google registration failed'); }
    },
    onError: () => onError('Google login failed. Please try again.'),
  });
  return (
    <button onClick={handleGoogleLogin} className="influx-btn-google w-full">
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
      Sign up with Google
    </button>
  );
};

const Register = () => {
  const navigate = useNavigate();
  const { register, loginWithGoogle } = useAuth();
  const [formData, setFormData] = useState({ name: '', email: '', password: '', phone: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

  const handleChange = (e) => { setFormData({ ...formData, [e.target.name]: e.target.value }); setError(''); };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    if (formData.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try { await register(formData.name, formData.email, formData.password); navigate('/'); }
    catch (err) {
      setError(err.response?.data?.message || err.response?.data?.errors?.map(e => e.message).join(', ') || 'Registration failed');
    } finally { setLoading(false); }
  };

  const strength = !formData.password ? 0 : formData.password.length < 6 ? 1 : formData.password.length < 10 ? 2 : 3;
  const strengthLabel = ['', 'Weak', 'Good', 'Strong'];
  const strengthColor = ['', 'bg-red-400', 'bg-yellow-400', 'bg-emerald-500'];

  return (
    <div className="influx-auth-bg min-h-screen flex items-center justify-center px-6 py-8">
      <div className="influx-bg-orb influx-bg-orb-1" />
      <div className="influx-bg-orb influx-bg-orb-2" />

      <div className="influx-auth-card w-full max-w-sm relative z-10">
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

        {error && (
          <div className="influx-alert-error mb-5">
            <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
            {error}
          </div>
        )}

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
              <input type={showPass ? 'text' : 'password'} name="password" value={formData.password}
                onChange={handleChange} placeholder="Min. 6 characters" required minLength={6} className="influx-input pr-10" />
              <button type="button" onClick={() => setShowPass(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 !min-h-0 !min-w-0 p-0">
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
            {formData.password && (
              <div className="mt-2">
                <div className="flex gap-1 mb-1">
                  {[1,2,3].map(i => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= strength ? strengthColor[strength] : 'bg-gray-200'}`} />
                  ))}
                </div>
                <p className={`text-xs font-medium ${strength === 1 ? 'text-red-500' : strength === 2 ? 'text-yellow-600' : 'text-emerald-600'}`}>
                  {strengthLabel[strength]}
                </p>
              </div>
            )}
          </div>
          <div className="influx-field">
            <label className="influx-label">Phone Number <span className="text-gray-400 font-normal">(optional)</span></label>
            <input type="tel" name="phone" value={formData.phone} onChange={handleChange}
              placeholder="08839600663" className="influx-input" />
          </div>
          <button type="submit" disabled={loading} className="influx-btn-primary w-full mt-2">
            {loading ? <span className="influx-spinner" /> : null}
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="influx-divider my-5"><span>or</span></div>

        {GOOGLE_CLIENT_ID
          ? <GoogleLoginButton onSuccess={async (t) => { await loginWithGoogle(t); navigate('/'); }} onError={setError} />
          : <div className="influx-btn-google w-full opacity-50 cursor-not-allowed justify-center">Google login not configured</div>
        }

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-emerald-600 font-semibold hover:text-emerald-700">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;