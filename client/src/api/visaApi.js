import api from './axios';

const visaApi = {
  // === Public ===

  // إنشاء طلب جديد
  createApplication: async (data = {}) => {
    const response = await api.post('/visa/applications', data);
    return response.data;
  },

  // عرض طلب واحد
  getApplication: async (id) => {
    const response = await api.get(`/visa/applications/${id}`);
    return response.data;
  },

  // تحديث طلب (حفظ تلقائي)
  updateApplication: async (id, data) => {
    const response = await api.put(`/visa/applications/${id}`, data);
    return response.data;
  },

  // تقديم الطلب نهائياً
  submitApplication: async (id) => {
    const response = await api.post(`/visa/applications/${id}/submit`);
    return response.data;
  },

  // رفع صورة الجواز
  uploadPassport: async (formData) => {
    const response = await api.post('/visa/upload-passport', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  // رفع الصورة الشخصية
  uploadPersonalPhoto: async (formData) => {
    const response = await api.post('/visa/upload-photo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  // قراءة بيانات الجواز تلقائياً (OCR)
  ocrPassport: async (formData) => {
    const response = await api.post('/visa/ocr-passport', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 30000 // 30 ثانية — OCR يأخذ وقت
    });
    return response.data;
  },

  // === Admin ===

  // قائمة كل الطلبات
  getApplications: async (params = {}) => {
    const response = await api.get('/visa/applications', { params });
    return response.data;
  },

  // تحديث حالة الطلب
  updateStatus: async (id, data) => {
    const response = await api.put(`/visa/applications/${id}/status`, data);
    return response.data;
  },

  // حذف طلب
  deleteApplication: async (id) => {
    const response = await api.delete(`/visa/applications/${id}`);
    return response.data;
  },

  // === العملاء المسجلين ===
  getRegisteredClients: async () => {
    const response = await api.get('/client/admin/list');
    return response.data;
  },

  // تفاصيل عميل واحد مع طلباته
  getClientDetail: async (id) => {
    const response = await api.get(`/client/admin/${id}`);
    return response.data;
  },

  // حظر/إلغاء حظر عميل
  toggleClientActive: async (id) => {
    const response = await api.put(`/client/admin/${id}/toggle-active`);
    return response.data;
  },

  // حذف عميل
  deleteClient: async (id) => {
    const response = await api.delete(`/client/admin/${id}`);
    return response.data;
  },

  // === الرخصة الدولية (Admin) ===
  getLicenseApplications: async (params = {}) => {
    const response = await api.get('/license/admin/applications', { params });
    return response.data;
  },

  getLicenseApplication: async (id) => {
    const response = await api.get(`/license/admin/applications/${id}`);
    return response.data;
  },

  updateLicenseStatus: async (id, data) => {
    const response = await api.put(`/license/admin/applications/${id}/status`, data);
    return response.data;
  },

  // === ربط العملاء بالطلبات ===

  // ربط عميل بطلب تأشيرة أمريكية
  linkCustomerToVisa: async (applicationId, customerId) => {
    const response = await api.put(`/visa/applications/${applicationId}/link-customer`, { customerId });
    return response.data;
  },

  // ربط عميل بطلب رخصة دولية
  linkCustomerToLicense: async (applicationId, customerId) => {
    const response = await api.put(`/license/admin/applications/${applicationId}/link-customer`, { customerId });
    return response.data;
  },

  // === التأشيرة الإلكترونية (Admin) ===
  getVisaServiceApplications: async (params = {}) => {
    const response = await api.get('/visa-service/admin/applications', { params });
    return response.data;
  },

  getVisaServiceApplication: async (id) => {
    const response = await api.get(`/visa-service/admin/applications/${id}`);
    return response.data;
  },

  // ربط عميل بطلب تأشيرة إلكترونية
  linkCustomerToVisaService: async (applicationId, customerId) => {
    const response = await api.put(`/visa-service/admin/applications/${applicationId}/link-customer`, { customerId });
    return response.data;
  },

  // حذف طلب تأشيرة إلكترونية
  deleteVisaServiceApplication: async (id) => {
    const response = await api.delete(`/visa-service/admin/applications/${id}`);
    return response.data;
  },

  // === بحث موحّد في الطلبات ===
  searchApplications: async (query, type) => {
    const params = { q: query };
    if (type) params.type = type;
    const response = await api.get('/applications/search', { params });
    return response.data;
  }
};

export default visaApi;
