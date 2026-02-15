import api from './axios';

export const authApi = {
  // تسجيل الدخول
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  // تسجيل مستخدم جديد
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  // الحصول على بيانات المستخدم الحالي
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  // تحديث الملف الشخصي
  updateProfile: async (data) => {
    const response = await api.put('/auth/update-profile', data);
    return response.data;
  },

  // تغيير كلمة المرور
  changePassword: async (data) => {
    const response = await api.put('/auth/change-password', data);
    return response.data;
  }
};
