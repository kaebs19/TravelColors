import api from './axios';

export const tripsApi = {
  // الحصول على كل الرحلات
  getTrips: async (params = {}) => {
    const response = await api.get('/trips', { params });
    return response.data;
  },

  // الحصول على رحلة واحدة
  getTrip: async (id) => {
    const response = await api.get(`/trips/${id}`);
    return response.data;
  },

  // الحصول على الرحلات المميزة
  getFeaturedTrips: async () => {
    const response = await api.get('/trips/featured');
    return response.data;
  },

  // الحصول على التصنيفات
  getCategories: async () => {
    const response = await api.get('/trips/categories');
    return response.data;
  },

  // إنشاء رحلة جديدة
  createTrip: async (tripData) => {
    const response = await api.post('/trips', tripData);
    return response.data;
  },

  // تحديث رحلة
  updateTrip: async (id, tripData) => {
    const response = await api.put(`/trips/${id}`, tripData);
    return response.data;
  },

  // حذف رحلة
  deleteTrip: async (id) => {
    const response = await api.delete(`/trips/${id}`);
    return response.data;
  }
};
