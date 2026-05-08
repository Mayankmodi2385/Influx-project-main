import api from './api';

// Keep backend awake — ping every 10 minutes to prevent Render free tier sleep
const keepAlive = () => {
  setInterval(async () => {
    try { await api.get('/health'); } catch { /* silent */ }
  }, 10 * 60 * 1000); // 10 minutes
};
keepAlive();

export const stationService = {
  getStations: async (params = {}) => {
    const response = await api.get('/stations', { params });
    return response.data;
  },

  getStationById: async (id) => {
    const response = await api.get(`/stations/${id}`);
    return response.data;
  },

  searchStations: async (query) => {
    const response = await api.get('/stations/search', { params: { q: query } });
    return response.data;
  },

  getNearbyStations: async (lat, lng, radius = 50000) => {
    const response = await api.get('/stations', {
      params: { lat, lng, radius },
    });
    return response.data;
  },

  createStation: async (stationData) => {
    const response = await api.post('/stations', stationData);
    return response.data;
  },

  updateStation: async (id, stationData) => {
    const response = await api.put(`/stations/${id}`, stationData);
    return response.data;
  },

  deleteStation: async (id) => {
    const response = await api.delete(`/stations/${id}`);
    return response.data;
  },

  addReview: async (id, reviewData) => {
    const response = await api.post(`/stations/${id}/reviews`, reviewData);
    return response.data;
  },
};