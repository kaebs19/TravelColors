import api from './axios';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';

// ============================================================
//  Public endpoints (بدون auth)
// ============================================================

export const getPublicVisas = async () => {
  const response = await axios.get(`${API_URL}/visa-catalog`);
  return response.data;
};

export const getPublicVisa = async (slug) => {
  const response = await axios.get(`${API_URL}/visa-catalog/${slug}`);
  return response.data;
};

export const validateVisaCoupon = async (visaId, code) => {
  const response = await axios.post(`${API_URL}/visa-catalog/validate-coupon`, { visaId, code });
  return response.data;
};

// ============================================================
//  Admin endpoints (مع auth)
// ============================================================

export const getAllVisas = async () => {
  const response = await api.get('/visa-catalog/admin/all');
  return response.data;
};

export const createVisa = async (data) => {
  const response = await api.post('/visa-catalog/admin', data);
  return response.data;
};

export const updateVisa = async (id, data) => {
  const response = await api.put(`/visa-catalog/admin/${id}`, data);
  return response.data;
};

export const deleteVisa = async (id) => {
  const response = await api.delete(`/visa-catalog/admin/${id}`);
  return response.data;
};

export const toggleVisa = async (id) => {
  const response = await api.put(`/visa-catalog/admin/${id}/toggle`);
  return response.data;
};

export const uploadVisaImage = async (formData) => {
  const response = await api.post('/visa-catalog/admin/upload-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

const visaCatalogApi = {
  getPublicVisas,
  getPublicVisa,
  validateVisaCoupon,
  getAllVisas,
  createVisa,
  updateVisa,
  deleteVisa,
  toggleVisa,
  uploadVisaImage
};

export default visaCatalogApi;
