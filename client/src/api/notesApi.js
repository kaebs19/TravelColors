import axios from './axios';

export const getNotes = (params) => axios.get('/notes', { params });

export const getNote = (id) => axios.get(`/notes/${id}`);

export const createNote = (data) => axios.post('/notes', data);

export const updateNote = (id, data) => axios.put(`/notes/${id}`, data);

export const deleteNote = (id) => axios.delete(`/notes/${id}`);

export const convertToAppointment = (id, data) => axios.post(`/notes/${id}/convert`, data);

export const changeStatus = (id, data) => axios.put(`/notes/${id}/status`, data);

export const getTodayReminders = () => axios.get('/notes/today');

export const getStats = () => axios.get('/notes/stats');

export default {
  getNotes,
  getNote,
  createNote,
  updateNote,
  deleteNote,
  convertToAppointment,
  changeStatus,
  getTodayReminders,
  getStats
};
