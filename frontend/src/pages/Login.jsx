import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGoogleLogin } from '@react-oauth/google';
import { FaPlug } from 'react-icons/fa';

// Separate component for Google login button to properly handle hook usage
const GoogleLoginButton = ({ onError, onSuccess }) => {
  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        await onSuccess(tokenResponse.access_token);
      } catch (err) {
        console.error('Google login error:', err);
        onError(err.response?.data?.message || 'Google login failed');
      }
    },
    onError: (error) => {
      console.error('Google OAuth error:', error);
      onError('Google login failed. Please try again.');
    },
  });

  return (
    <button
      onClick={handleGoogleLogin}
      className="w-full bg-white border-2 border-black rounded-lg py-3 flex items-center justify-center gap-3 font-semibold text-black hover:bg-gray-50 transition-colors"
    >
      <svg className="w-6 h-6" viewBox="0 0 24 24">
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="#FBBC05"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        />
        <path
          fill="#EA4335"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
      </svg>
      Sign in with Google
    </button>
  );
};

const Login = () => {
  const navigate = useNavigate();
  const { login, loginWithGoogle } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(formData.email, formData.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (accessToken) => {
    await loginWithGoogle(accessToken);
    navigate('/');
  };

  const handleGoogleError = (errorMessage) => {
    setError(errorMessage);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-400 via-green-300 to-green-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/welcome" className="inline-block mb-4">
            <FaPlug className="text-6xl text-black mx-auto" />
          </Link>
          <h1 className="text-4xl font-bold text-black mb-2">Welcome!</h1>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Login Form */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                required
                className="w-full px-4 py-3 border-2 border-blue-200 rounded-lg focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
                className="w-full px-4 py-3 border-2 border-blue-200 rounded-lg focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200"
              />
            </div>
            <div className="text-right">
              <Link to="/forgot-password" className="text-sm text-green-600 hover:underline">
                Forgot Password?
              </Link>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-200 border-2 border-black rounded-lg py-3 font-bold text-black hover:bg-blue-300 transition-colors disabled:opacity-50"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>

        {/* Sign Up Link */}
        <div className="text-center">
          <p className="text-sm text-black">
            Don't have an account?{' '}
            <Link to="/register" className="text-green-600 font-semibold hover:underline">
              Sign Up
            </Link>
          </p>
        </div>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-black"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="bg-gradient-to-b from-green-400 via-green-300 to-green-50 px-4 text-black text-sm">
              or
            </span>
          </div>
        </div>

        {/* Google Sign In */}
        {GOOGLE_CLIENT_ID ? (
          <GoogleLoginButton onSuccess={handleGoogleSuccess} onError={handleGoogleError} />
        ) : (
          <div className="w-full bg-gray-100 border-2 border-gray-300 rounded-lg py-3 text-center text-sm text-gray-500">
            Google login not configured
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
