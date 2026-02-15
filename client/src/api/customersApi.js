import api from './axios';

export const customersApi = {
  // الحصول على كل العملاء
  getCustomers: async (params = {}) => {
    const response = await api.get('/customers', { params });
    return response.data;
  },

  // الحصول على عميل واحد
  getCustomer: async (id) => {
    const response = await api.get(`/customers/${id}`);
    return response.data;
  },

  // البحث السريع
  searchCustomers: async (query) => {
    const response = await api.get('/customers/search', { params: { q: query } });
    return response.data;
  },

  // إنشاء عميل جديد
  createCustomer: async (customerData) => {
    const response = await api.post('/customers', customerData);
    return response.data;
  },

  // تحديث عميل
  updateCustomer: async (id, data) => {
    const response = await api.put(`/customers/${id}`, data);
    return response.data;
  },

  // حذف عميل
  deleteCustomer: async (id) => {
    const response = await api.delete(`/customers/${id}`);
    return response.data;
  }
};
