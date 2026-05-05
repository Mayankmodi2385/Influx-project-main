import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

// Optional: simple toast replacement if you don't have a toast library
const showToast = (msg) => {
  try {
    // If you use a toast library replace this with toast.success(msg)
    // e.g. toast.success(msg)
    alert(msg);
  } catch {
    // fallback
    console.log('TOAST:', msg);
  }
};

const AddVehicle = () => {
  const { user } = useAuth(); // user might contain token depending on your AuthContext
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    range: '',
    batteryCapacity: '',
    chargeTime: '',
    currentChargePercent: 100,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === 'currentChargePercent'
          ? Math.max(0, Math.min(100, parseInt(value || 0, 10)))
          : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Basic front-end validation
      if (!formData.name || formData.range === '' || formData.batteryCapacity === '') {
        setError('Please fill in all required fields');
        setLoading(false);
        return;
      }

      // Build request body using the exact backend schema keys
      const body = {
        name: String(formData.name).trim(),
        range: Number(formData.range), // backend expects `range`
        batteryCapacity: Number(formData.batteryCapacity), // backend expects `batteryCapacity`
        chargeTime: formData.chargeTime !== '' ? Number(formData.chargeTime) : 480, // default 480
        currentChargePercent:
          formData.currentChargePercent !== '' ? Number(formData.currentChargePercent) : 100,
      };

      // Prepare request config:
      // - If token is available on user object, prefer Authorization header.
      // - Otherwise use withCredentials so cookie-based auth works.
      const config = {};
      const token =
        user?.token ||
        user?.accessToken ||
        (user?.auth && user.auth.accessToken) || // support possible shapes
        null;

      if (token) {
        config.headers = {
          Authorization: `Bearer ${token}`,
        };
      } else {
        config.withCredentials = true;
      }

      // Make API request. `api` should be your axios wrapper with baseURL set.
      const response = await api.post('/vehicles', body, config);

      if (response?.data?.success) {
        // Try to refresh the vehicles list so other pages get the update immediately
        try {
          const vRes = await api.get('/vehicles', config);
          const vehicles = vRes?.data?.data || vRes?.data?.vehicles || [];

          // Save to localStorage as a fallback for components that read it
          try {
            localStorage.setItem('influx_vehicles', JSON.stringify(vehicles));
          } catch (lsErr) {
            console.warn('Could not write influx_vehicles to localStorage', lsErr);
          }

          // Broadcast an event so other components can listen and update instantly
          try {
            window.dispatchEvent(new CustomEvent('vehiclesUpdated', { detail: vehicles }));
          } catch (evtErr) {
            console.warn('Could not dispatch vehiclesUpdated event', evtErr);
          }
        } catch (vErr) {
          console.warn('Could not refresh vehicles after create, continuing anyway', vErr?.response?.data || vErr.message || vErr);
        }

        // show success toast and redirect to Dashboard vehicle tab
        showToast('Vehicle added successfully');
        navigate('/dashboard?tab=vehicle');
      } else {
        // If backend returns an error message in body
        const msg = response?.data?.message || 'Failed to add vehicle';
        setError(msg);
      }
    } catch (err) {
      console.error('Error adding vehicle:', err);
      // Prefer readable backend message if present
      const serverMsg =
        err?.response?.data?.message || err?.response?.data?.error || err.message || 'Unknown error';
      setError(serverMsg || 'Failed to add vehicle. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Add Vehicle</h1>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            {/* Vehicle Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Vehicle Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., Tata Nexon EV"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Range */}
            <div>
              <label htmlFor="range" className="block text-sm font-medium text-gray-700 mb-2">
                Range (km) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="range"
                name="range"
                value={formData.range}
                onChange={handleChange}
                placeholder="e.g., 312"
                min="0"
                step="0.1"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Battery Capacity */}
            <div>
              <label htmlFor="batteryCapacity" className="block text-sm font-medium text-gray-700 mb-2">
                Battery Capacity (kWh) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="batteryCapacity"
                name="batteryCapacity"
                value={formData.batteryCapacity}
                onChange={handleChange}
                placeholder="e.g., 30.2"
                min="0"
                step="0.1"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Charge Time */}
            <div>
              <label htmlFor="chargeTime" className="block text-sm font-medium text-gray-700 mb-2">
                Charge Time (minutes for 0→100%)
              </label>
              <input
                type="number"
                id="chargeTime"
                name="chargeTime"
                value={formData.chargeTime}
                onChange={handleChange}
                placeholder="e.g., 480 (8 hours)"
                min="0"
                step="1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <p className="mt-1 text-sm text-gray-500">Default: 480 minutes (8 hours)</p>
            </div>

            {/* Current Charge Percent */}
            <div>
              <label htmlFor="currentChargePercent" className="block text-sm font-medium text-gray-700 mb-2">
                Current Charge (%)
              </label>
              <input
                type="number"
                id="currentChargePercent"
                name="currentChargePercent"
                value={formData.currentChargePercent}
                onChange={handleChange}
                min="0"
                max="100"
                step="1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {loading ? 'Adding Vehicle...' : 'Add Vehicle'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/dashboard?tab=vehicle')}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddVehicle;
