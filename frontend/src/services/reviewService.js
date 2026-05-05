import api from './api';

export const reviewService = {
  getReviews: async (stationId, params = {}) => {
    const response = await api.get(`/stations/${stationId}/reviews`, { params });
    return response.data;
  },

  createReview: async (stationId, rating, comment) => {
    const response = await api.post(`/stations/${stationId}/reviews`, {
      rating,
      comment,
    });
    return response.data;
  },
};











