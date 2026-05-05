import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { favoriteService } from '../services/favoriteService';
import { stationService } from '../services/stationService';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [myStations, setMyStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('favorites');

  useEffect(() => {
    loadFavorites();
    loadMyStations();
  }, []);

  const loadFavorites = async () => {
    try {
      const data = await favoriteService.getFavorites();
      setFavorites(data.favorites || []);
    } catch (err) {
      console.error('Failed to load favorites:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMyStations = async () => {
    try {
      // Get all stations and filter by owner
      const data = await stationService.getStations();
      const filtered = data.stations.filter(
        (s) => s.ownerId && (s.ownerId._id === user?.id || s.ownerId === user?.id)
      );
      setMyStations(filtered);
    } catch (err) {
      console.error('Failed to load stations:', err);
    }
  };

  const handleRemoveFavorite = async (stationId) => {
    try {
      await favoriteService.toggleFavorite(stationId);
      await loadFavorites();
    } catch (err) {
      console.error('Failed to remove favorite:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Profile</h1>

      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4">User Information</h2>
        <div className="space-y-2">
          <div>
            <span className="font-medium">Name:</span> {user?.name}
          </div>
          <div>
            <span className="font-medium">Email:</span> {user?.email}
          </div>
          <div>
            <span className="font-medium">Role:</span> {user?.role}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b">
          <div className="flex">
            <button
              onClick={() => setActiveTab('favorites')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'favorites'
                  ? 'border-b-2 border-green-500 text-green-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Favorites ({favorites.length})
            </button>
            <button
              onClick={() => setActiveTab('stations')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'stations'
                  ? 'border-b-2 border-green-500 text-green-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              My Stations ({myStations.length})
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'favorites' && (
            <div>
              {favorites.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No favorites yet</p>
              ) : (
                <div className="space-y-4">
                  {favorites.map((station) => (
                    <div
                      key={station._id || station}
                      className="border rounded-lg p-4 flex justify-between items-start"
                    >
                      <div className="flex-1">
                        <Link
                          to={`/stations/${station._id || station}`}
                          className="font-bold text-lg hover:text-green-600"
                        >
                          {typeof station === 'string' ? 'Station' : station.name}
                        </Link>
                        <p className="text-gray-600 text-sm mt-1">
                          {typeof station === 'string' ? '' : station.address}
                        </p>
                        {typeof station !== 'string' && (
                          <div className="mt-2">
                            <span className="text-green-600 font-semibold">
                              ₹{station.pricePerKwh}/kWh
                            </span>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemoveFavorite(station._id || station)}
                        className="ml-4 text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'stations' && (
            <div>
              {myStations.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No stations yet</p>
                  <Link
                    to="/add-station"
                    className="inline-block bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700"
                  >
                    Add Station
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {myStations.map((station) => (
                    <div key={station._id} className="border rounded-lg p-4">
                      <Link
                        to={`/stations/${station._id}`}
                        className="font-bold text-lg hover:text-green-600"
                      >
                        {station.name}
                      </Link>
                      <p className="text-gray-600 text-sm mt-1">{station.address}</p>
                      <div className="mt-2 flex items-center gap-4">
                        <span className="text-green-600 font-semibold">
                          ₹{station.pricePerKwh}/kWh
                        </span>
                        <span className="text-gray-500 text-sm">
                          {station.availability?.availableSlots || 0} slots available
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;











