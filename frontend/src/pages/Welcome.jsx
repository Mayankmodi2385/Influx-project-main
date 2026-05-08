import React from 'react';
import { Link } from 'react-router-dom';

const Welcome = () => {
  return (
    <div className="influx-auth-bg min-h-screen flex flex-col items-center justify-center px-6">
      {/* Background decoration */}
      <div className="influx-bg-orb influx-bg-orb-1" />
      <div className="influx-bg-orb influx-bg-orb-2" />

      <div className="influx-auth-card w-full max-w-sm text-center relative z-10">
        {/* Logo */}
        <div className="influx-logo-ring mx-auto mb-6">
          <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-10 h-10">
            <path d="M28 4L12 26h14l-4 18L42 22H28L28 4z" fill="white" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
          </svg>
        </div>

        <h1 className="influx-brand-title mb-1">InFlux</h1>
        <p className="influx-brand-sub mb-8">Smart EV Charging for India</p>

        {/* Feature pills */}
        <div className="flex justify-center gap-2 mb-8 flex-wrap">
          {['Find Stations', 'Plan Routes', 'Track Usage'].map(f => (
            <span key={f} className="influx-feature-pill">{f}</span>
          ))}
        </div>

        {/* Buttons */}
        <div className="space-y-3">
          <Link to="/login" className="influx-btn-primary block w-full">
            Login
          </Link>
          <Link to="/register" className="influx-btn-outline block w-full">
            Create Account
          </Link>
        </div>

        <div className="influx-divider my-6"><span>or continue with</span></div>

        <button className="influx-btn-google w-full">
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Sign in with Google
        </button>

        <p className="mt-8 text-xs text-gray-400">
          By continuing, you agree to our Terms of Service
        </p>
      </div>
    </div>
  );
};

export default Welcome;