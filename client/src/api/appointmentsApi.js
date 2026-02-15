import axios from './axios';

export const getAppointments = (params) => axios.get('/appointments', { params });

export const getAppointment = (id) => axios.get(`/appointments/${id}`);

export const createAppointment = (data) => axios.post('/appointments', data);

export const updateAppointment = (id, data) => axios.put(`/appointments/${id}`, data);

export const deleteAppointment = (id) => axios.delete(`/appointments/${id}`);

export const changeStatus = (id, status) => axios.put(`/appointments/${id}/status`, { status });

export const getTodayAppointments = () => axios.get('/appointments/today');

export const getStats = () => axios.get('/appointments/stats');

export const getDashboardStats = () => axios.get('/appointments/dashboard-stats');

export default {
  getAppointments,
  getAppointment,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  changeStatus,
  getTodayAppointments,
  getStats,
  getDashboardStats
};
