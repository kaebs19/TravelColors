import api from './axios';

export const departmentsApi = {
  // الحصول على كل الأقسام
  getDepartments: async (params = {}) => {
    const response = await api.get('/departments', { params });
    return response.data;
  },

  // الحصول على قسم واحد
  getDepartment: async (id) => {
    const response = await api.get(`/departments/${id}`);
    return response.data;
  },

  // إنشاء قسم جديد
  createDepartment: async (data) => {
    const response = await api.post('/departments', data);
    return response.data;
  },

  // تحديث قسم
  updateDepartment: async (id, data) => {
    const response = await api.put(`/departments/${id}`, data);
    return response.data;
  },

  // حذف قسم
  deleteDepartment: async (id) => {
    const response = await api.delete(`/departments/${id}`);
    return response.data;
  },

  // تبديل حالة القسم
  toggleDepartment: async (id) => {
    const response = await api.put(`/departments/${id}/toggle`);
    return response.data;
  }
};
