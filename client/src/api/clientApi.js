import axios from 'axios';
import clientAxios, { API_URL } from './clientAxios';

const clientApi = {
  // === Auth ===
  register: async (data) => {
    const response = await clientAxios.post('/client/auth/register', data);
    return response.data;
  },

  login: async (credentials) => {
    const response = await clientAxios.post('/client/auth/login', credentials);
    return response.data;
  },

  getMe: async () => {
    const response = await clientAxios.get('/client/auth/me');
    return response.data;
  },

  updateProfile: async (data) => {
    const response = await clientAxios.put('/client/auth/update-profile', data);
    return response.data;
  },

  changePassword: async (data) => {
    const response = await clientAxios.put('/client/auth/change-password', data);
    return response.data;
  },

  forgotPassword: async (email) => {
    const response = await axios.post(`${API_URL}/client/auth/forgot-password`, { email });
    return response.data;
  },

  resetPassword: async (token, password) => {
    const response = await axios.post(`${API_URL}/client/auth/reset-password/${token}`, { password });
    return response.data;
  },

  // === Applications ===
  getApplications: async () => {
    const response = await clientAxios.get('/client/applications');
    return response.data;
  },

  getApplication: async (id) => {
    const response = await clientAxios.get(`/client/applications/${id}`);
    return response.data;
  },

  createApplication: async (data = {}) => {
    const response = await clientAxios.post('/client/applications', data);
    return response.data;
  },

  updateApplication: async (id, data) => {
    const response = await clientAxios.put(`/client/applications/${id}`, data);
    return response.data;
  },

  submitApplication: async (id) => {
    const response = await clientAxios.post(`/client/applications/${id}/submit`);
    return response.data;
  },

  deleteApplication: async (id) => {
    const response = await clientAxios.delete(`/client/applications/${id}`);
    return response.data;
  },

  // === File Uploads ===
  uploadPassport: async (formData) => {
    const response = await clientAxios.post('/visa/upload-passport', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  uploadPersonalPhoto: async (formData) => {
    const response = await clientAxios.post('/visa/upload-photo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  ocrPassport: async (formData) => {
    const response = await clientAxios.post('/visa/ocr-passport', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 30000
    });
    return response.data;
  }
};

export default clientApi;
