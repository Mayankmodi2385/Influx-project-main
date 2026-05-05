import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { favoriteService } from '../services/favoriteService';
import api from '../services/api';

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
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);

  // read ?tab= from URL to open correct tab after redirects
  useEffect(() => {
    const qp = new URLSearchParams(location.search);
    const tab = qp.get('tab');
    if (tab) setActiveTab(tab);
  }, [location.search]);

  // listen for vehicles updates broadcasted from AddVehicle or other places
  useEffect(() => {
    const onVehiclesUpdated = (e) => {
      const list = e?.detail || JSON.parse(localStorage.getItem('influx_vehicles') || '[]');
      setVehicles(list);
      setVehicle(list.length > 0 ? list[0] : null);
    };

    window.addEventListener('vehiclesUpdated', onVehiclesUpdated);
    return () => window.removeEventListener('vehiclesUpdated', onVehiclesUpdated);
  }, []);

  // reload main dashboard data when user changes (login/logout)
  useEffect(() => {
    loadDashboardData();
  }, [user]);

  // when user opens the Vehicle tab, ensure we have latest vehicles
  useEffect(() => {
    if (activeTab === 'vehicle') {
      loadVehicles();
    }
  }, [activeTab]);

  const loadVehicles = async () => {
    try {
      const vRes = await api.get('/vehicles');
      const vehicleList = vRes?.data?.data || [];
      setVehicles(vehicleList);
      setVehicle(vehicleList.length > 0 ? vehicleList[0] : null);
    } catch (err) {
      console.warn('Failed to fetch /vehicles, falling back to /users/vehicle', err?.response?.data || err.message || err);
      try {
        const vRes2 = await api.get('/users/vehicle');
        const single = vRes2?.data?.vehicle || null;
        setVehicles(single ? [single] : []);
        setVehicle(single);
      } catch (err2) {
        console.log('No vehicle data available', err2?.response?.data || err2.message || err2);
        setVehicles([]);
        setVehicle(null);
      }
    }
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Wallet
      try {
        const walletRes = await api.get('/users/wallet');
        setWalletBalance(walletRes.data.balance || 0);
        setPaymentHistory(walletRes.data.history || []);
      } catch (err) {
        console.log('Wallet not available yet', err?.response?.data || err.message || err);
        setWalletBalance(0);
        setPaymentHistory([]);
      }

      // Bookings
      try {
        const bookingsRes = await api.get('/users/bookings');
        setBookings(bookingsRes.data.bookings || []);
      } catch (err) {
        console.log('Bookings not available yet', err?.response?.data || err.message || err);
        setBookings([]);
      }

      // Favorites
      try {
        const favData = await favoriteService.getFavorites();
        setFavorites(favData.favorites || []);
      } catch (err) {
        console.error('Failed to load favorites:', err?.response?.data || err.message || err);
        setFavorites([]);
      }

      // Vehicles (preferred)
      await loadVehicles();
    } catch (err) {
      console.error('Failed to load dashboard data:', err?.response?.data || err.message || err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMoney = () => {
    alert('Add Money feature coming soon!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 to-white">
        <div className="text-xl text-green-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome back, {user?.name}!</h1>
          <p className="text-gray-600">Manage your account, bookings, and preferences</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200">
            <div className="tab-row px-4">
              {[ 
                { id: 'overview', label: 'Overview' },
                { id: 'wallet', label: 'My Wallet' },
                { id: 'bookings', label: 'My Bookings' },
                { id: 'vehicle', label: 'My Vehicle' },
                { id: 'favorites', label: 'Favorites' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-4 font-medium text-sm border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6 dashboard-tabs">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6 overview-container">
                {/* Wallet Card */}
                <div className="card bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white shadow-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-green-100 text-sm mb-1">InFlux Wallet</p>
                      <p className="text-3xl font-bold">₹{walletBalance.toFixed(2)}</p>
                    </div>
                    <button
                      onClick={handleAddMoney}
                      className="bg-white text-green-600 px-6 py-2 rounded-lg font-semibold hover:bg-green-50 transition-colors"
                    >
                      Add Money
                    </button>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="card bg-white border border-gray-200 rounded-lg p-4">
                    <div className="card-content">
                      <p className="text-gray-500 text-sm mb-1">Active Bookings</p>
                      <p className="text-2xl font-bold text-green-600">{bookings.filter(b => b.status === 'active').length}</p>
                    </div>
                  </div>
                  <div className="card bg-white border border-gray-200 rounded-lg p-4">
                    <div className="card-content">
                      <p className="text-gray-500 text-sm mb-1">Favorite Stations</p>
                      <p className="text-2xl font-bold text-green-600">{favorites.length}</p>
                    </div>
                  </div>
                  <div className="card bg-white border border-gray-200 rounded-lg p-4">
                    <div className="card-content">
                      <p className="text-gray-500 text-sm mb-1">Total Bookings</p>
                      <p className="text-2xl font-bold text-green-600">{bookings.length}</p>
                    </div>
                  </div>
                </div>

                {/* Map area (if you render a map here, wrap it with the .map-wrapper) */}
                {/* If your map is in another component, apply the .map-container class to that element */}
                <div className="map-wrapper">
                  {/* Example placeholder - if you already render a map component, wrap it in a div with .map-container */}
                  {/* <div className="map-container"><StationMap ... /></div> */}
                </div>

                {/* Recent Activity */}
                <div className="card bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
                  <div className="card-content">
                    {paymentHistory.length > 0 ? (
                      <div className="space-y-3">
                        {paymentHistory.slice(0, 5).map((payment, idx) => (
                          <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                            <div>
                              <p className="font-medium">{payment.description || 'Payment'}</p>
                              <p className="text-sm text-gray-500">{new Date(payment.date).toLocaleDateString()}</p>
                            </div>
                            <p className={`font-semibold ${payment.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {payment.amount > 0 ? '+' : ''}₹{Math.abs(payment.amount).toFixed(2)}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-4">No recent activity</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Wallet Tab */}
            {activeTab === 'wallet' && (
              <div className="space-y-6">
                <div className="card bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-8 text-white shadow-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-green-100 text-sm mb-1">Current Balance</p>
                      <p className="text-4xl font-bold">₹{walletBalance.toFixed(2)}</p>
                    </div>
                    <button
                      onClick={handleAddMoney}
                      className="bg-white text-green-600 px-8 py-3 rounded-lg font-semibold hover:bg-green-50 transition-colors text-lg"
                    >
                      Add Money
                    </button>
                  </div>
                </div>

                <div className="card bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Payment History</h3>
                  <div className="card-content">
                    {paymentHistory.length > 0 ? (
                      <div className="space-y-3">
                        {paymentHistory.map((payment, idx) => (
                          <div key={idx} className="flex justify-between items-center py-3 border-b border-gray-100 last:border-0">
                            <div className="flex-1">
                              <p className="font-medium">{payment.description || 'Payment'}</p>
                              <p className="text-sm text-gray-500">{new Date(payment.date).toLocaleString()}</p>
                              {payment.stationName && <p className="text-sm text-gray-400">{payment.stationName}</p>}
                            </div>
                            <p className={`text-lg font-semibold ${payment.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {payment.amount > 0 ? '+' : ''}₹{Math.abs(payment.amount).toFixed(2)}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-8">No payment history yet</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Bookings Tab */}
            {activeTab === 'bookings' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">My Bookings</h3>
                <div className="card-content">
                  {bookings.length > 0 ? (
                    <div className="space-y-4">
                      {bookings.map((booking) => (
                        <div key={booking._id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <Link to={`/stations/${booking.stationId}`} className="font-semibold text-lg text-green-600 hover:underline">
                                {booking.stationName || 'Charging Station'}
                              </Link>
                              <p className="text-sm text-gray-500 mt-1">
                                {new Date(booking.startTime).toLocaleString()} - {new Date(booking.endTime).toLocaleString()}
                              </p>
                              <p className="text-sm text-gray-600 mt-2">
                                Duration: {Math.round((new Date(booking.endTime) - new Date(booking.startTime)) / 60000)} minutes
                              </p>
                            </div>
                            <div className="text-right">
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                booking.status === 'active' ? 'bg-green-100 text-green-700' :
                                booking.status === 'completed' ? 'bg-gray-100 text-gray-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {booking.status}
                              </span>
                              <p className="text-lg font-semibold text-green-600 mt-2">₹{booking.amount?.toFixed(2) || '0.00'}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
                      <p className="text-gray-500 mb-4">No bookings yet</p>
                      <Link to="/" className="inline-block bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors">
                        Find a Station
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Vehicle Tab */}
            {activeTab === 'vehicle' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">My Vehicle</h3>
                <div className="card-content">
                  {vehicle ? (
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <p className="text-gray-500 text-sm mb-1">Vehicle Model</p>
                          <p className="text-xl font-semibold">{vehicle.model || vehicle.name || 'Not specified'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-sm mb-1">Battery Capacity</p>
                          <p className="text-xl font-semibold">{vehicle.batteryCapacity || 'N/A'} kWh</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-sm mb-1">Connector Type</p>
                          <p className="text-xl font-semibold">{vehicle.connectorType || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-sm mb-1">License Plate</p>
                          <p className="text-xl font-semibold">{vehicle.licensePlate || 'Not registered'}</p>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center gap-3">
                        <button className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors">
                          Edit Vehicle Details
                        </button>
                        {vehicles.length > 1 && (
                          <button
                            onClick={() => navigate('/vehicles')}
                            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                          >
                            View all vehicles ({vehicles.length})
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
                      <p className="text-gray-500 mb-4">No vehicle information added yet</p>
                      <button
                        onClick={() => navigate('/vehicles/add')}
                        className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Add Vehicle
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Favorites Tab */}
            {activeTab === 'favorites' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Favorite Stations</h3>
                <div className="card-content">
                  {favorites.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {favorites.map((station) => (
                        <Link
                          key={station._id || station}
                          to={`/stations/${station._id || station}`}
                          className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow block"
                        >
                          <h4 className="font-semibold text-lg text-green-600 mb-2">
                            {typeof station === 'string' ? 'Station' : station.name}
                          </h4>
                          <p className="text-sm text-gray-600 mb-2">
                            {typeof station === 'string' ? '' : station.address}
                          </p>
                          {typeof station !== 'string' && (
                            <div className="flex items-center justify-between mt-3">
                              <span className="text-green-600 font-semibold">₹{station.pricePerKwh}/kWh</span>
                              <span className="text-gray-500 text-sm">
                                {station.availability?.availableSlots || 0} slots available
                              </span>
                            </div>
                          )}
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
                      <p className="text-gray-500 mb-4">No favorite stations yet</p>
                      <Link to="/" className="inline-block bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors">
                        Explore Stations
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
