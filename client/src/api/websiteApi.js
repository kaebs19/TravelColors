import api from './axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';

export const websiteApi = {
  // جلب المحتوى العام (بدون auth)
  getPublicContent: async () => {
    const response = await fetch(`${API_URL}/website/public`);
    if (!response.ok) {
      const error = new Error(`HTTP ${response.status}`);
      error.status = response.status;
      throw error;
    }
    const data = await response.json();
    return data;
  },

  // جلب المحتوى للإدارة
  getContent: async () => {
    const response = await api.get('/website');
    return response.data;
  },

  // تحديث المحتوى
  updateContent: async (data) => {
    const response = await api.put('/website', data);
    return response.data;
  },

  // رفع صورة
  uploadImage: async (formData) => {
    const response = await api.post('/website/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  // حذف صورة
  deleteImage: async (field) => {
    const response = await api.delete('/website/image', { data: { field } });
    return response.data;
  }
};

export default websiteApi;
