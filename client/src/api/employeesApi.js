import axios from './axios';

export const getEmployees = (params) => axios.get('/employees', { params });

export const getEmployee = (id) => axios.get(`/employees/${id}`);

export const createEmployee = (data) => axios.post('/employees', data);

export const updateEmployee = (id, data) => axios.put(`/employees/${id}`, data);

export const deleteEmployee = (id) => axios.delete(`/employees/${id}`);

export const toggleEmployee = (id) => axios.put(`/employees/${id}/toggle`);

export const uploadAvatar = (id, formData) => axios.post(`/employees/${id}/avatar`, formData, {
  headers: {
    'Content-Type': 'multipart/form-data'
  }
});

export default {
  getEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  toggleEmployee,
  uploadAvatar
};
