import clientAxios from './clientAxios';

const licenseApi = {
  createApplication: async () => {
    const res = await clientAxios.post('/license/applications');
    return res.data;
  },
  getMyApplications: async () => {
    const res = await clientAxios.get('/license/my-applications');
    return res.data;
  },
  getApplication: async (id) => {
    const res = await clientAxios.get(`/license/applications/${id}`);
    return res.data;
  },
  updateApplication: async (id, data) => {
    const res = await clientAxios.put(`/license/applications/${id}`, data);
    return res.data;
  },
  submitApplication: async (id) => {
    const res = await clientAxios.post(`/license/applications/${id}/submit`);
    return res.data;
  },
  uploadFile: async (formData) => {
    const res = await clientAxios.post('/license/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },
  validateCoupon: async (code) => {
    const res = await clientAxios.post('/license/validate-coupon', { code });
    return res.data;
  },
  ocrPassport: async (formData) => {
    const res = await clientAxios.post('/license/ocr-passport', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 30000
    });
    return res.data;
  }
};

export default licenseApi;
