import api from './api';

export const favoriteService = {
  getFavorites: async () => {
    const response = await api.get('/favorites');
    return response.data;
  },

  toggleFavorite: async (stationId) => {
    const response = await api.post(`/favorites/${stationId}`);
    return response.data;
  },
};











