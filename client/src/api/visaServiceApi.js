import clientAxios from './clientAxios';

export const createApplication = async (visaId) => {
  const response = await clientAxios.post('/visa-service/applications', { visaId });
  return response.data;
};

export const getMyApplications = async () => {
  const response = await clientAxios.get('/visa-service/my-applications');
  return response.data;
};

export const getApplication = async (id) => {
  const response = await clientAxios.get(`/visa-service/applications/${id}`);
  return response.data;
};

export const updateApplication = async (id, data) => {
  const response = await clientAxios.put(`/visa-service/applications/${id}`, data);
  return response.data;
};

export const submitApplication = async (id) => {
  const response = await clientAxios.post(`/visa-service/applications/${id}/submit`);
  return response.data;
};

export const uploadFile = async (formData) => {
  const response = await clientAxios.post('/visa-service/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

const visaServiceApi = {
  createApplication,
  getMyApplications,
  getApplication,
  updateApplication,
  submitApplication,
  uploadFile
};

export default visaServiceApi;
