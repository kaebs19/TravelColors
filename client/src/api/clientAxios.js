import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';

const clientAxios = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

// إضافة توكن العميل
clientAxios.interceptors.request.use((config) => {
  const token = localStorage.getItem('clientToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// معالجة 401 — تسجيل خروج تلقائي
clientAxios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('clientToken');
      localStorage.removeItem('clientUser');
      window.location.href = '/portal/login';
    }
    return Promise.reject(error);
  }
);

export { API_URL };
export default clientAxios;
