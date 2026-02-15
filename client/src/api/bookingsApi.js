import api from './axios';

export const bookingsApi = {
  // الحصول على كل الحجوزات
  getBookings: async (params = {}) => {
    const response = await api.get('/bookings', { params });
    return response.data;
  },

  // الحصول على حجز واحد
  getBooking: async (id) => {
    const response = await api.get(`/bookings/${id}`);
    return response.data;
  },

  // الحصول على إحصائيات الحجوزات
  getStats: async () => {
    const response = await api.get('/bookings/stats');
    return response.data;
  },

  // إنشاء حجز جديد
  createBooking: async (bookingData) => {
    const response = await api.post('/bookings', bookingData);
    return response.data;
  },

  // تحديث حجز
  updateBooking: async (id, data) => {
    const response = await api.put(`/bookings/${id}`, data);
    return response.data;
  },

  // إلغاء حجز
  cancelBooking: async (id, reason) => {
    const response = await api.put(`/bookings/${id}/cancel`, { cancelReason: reason });
    return response.data;
  }
};
