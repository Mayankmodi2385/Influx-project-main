import api from './api';

export const stationService = {
  getStations: async (params = {}) => {
    const response = await api.get('/stations', { params });
    return response.data;
  },

  getStation: async (id) => {
    const response = await api.get(`/stations/${id}`);
    return response.data;
  },

  createStation: async (data, images = []) => {
    const formData = new FormData();
    Object.keys(data).forEach((key) => {
      if (key === 'location') {
        formData.append(key, JSON.stringify(data[key]));
      } else if (key === 'connectors' || key === 'tags') {
        formData.append(key, JSON.stringify(data[key]));
      } else {
        formData.append(key, data[key]);
      }
    });
    images.forEach((image) => {
      formData.append('images', image);
    });
    const response = await api.post('/stations', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  updateStation: async (id, data, images = []) => {
    const formData = new FormData();
    Object.keys(data).forEach((key) => {
      if (key === 'location' || key === 'connectors' || key === 'tags') {
        formData.append(key, JSON.stringify(data[key]));
      } else {
        formData.append(key, data[key]);
      }
    });
    images.forEach((image) => {
      formData.append('images', image);
    });
    const response = await api.put(`/stations/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  deleteStation: async (id) => {
    const response = await api.delete(`/stations/${id}`);
    return response.data;
  },
};











