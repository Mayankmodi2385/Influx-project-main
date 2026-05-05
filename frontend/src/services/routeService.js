import api from './api';

export const routeService = {
  /**
   * Search for route and charging stations
   * @param {Object} params - { start, end, vehicleId, filters }
   * @returns {Promise} Route plan data
   */
  searchRoute: async (params) => {
    const response = await api.post('/routes/search', params);
    return response.data;
  },

  /**
   * Get mock route data for development
   * @param {Object} params - { start, end } as query params
   * @returns {Promise} Mock route data
   */
  getMockRoute: async (start, end) => {
    const params = new URLSearchParams();
    if (start) params.append('start', `${start[0]},${start[1]}`);
    if (end) params.append('end', `${end[0]},${end[1]}`);
    const response = await api.get(`/routes/mock?${params.toString()}`);
    return response.data;
  },

  /**
   * Format duration in minutes to human-readable string
   * @param {number} minutes
   * @returns {string}
   */
  formatDuration: (minutes) => {
    if (minutes < 60) {
      return `${Math.round(minutes)} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  },

  /**
   * Format distance in km to human-readable string
   * @param {number} km
   * @returns {string}
   */
  formatDistance: (km) => {
    if (km < 1) {
      return `${Math.round(km * 1000)} m`;
    }
    return `${km.toFixed(1)} km`;
  },
};






