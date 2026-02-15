import axios from './axios';

const settingsApi = {
  // جلب الإعدادات
  getSettings: () => axios.get('/settings'),

  // تحديث الإعدادات
  updateSettings: (data) => axios.put('/settings', data),

  // إضافة طريقة دفع
  addPaymentType: (data) => axios.post('/settings/payment-types', data),

  // حذف طريقة دفع
  deletePaymentType: (id) => axios.delete(`/settings/payment-types/${id}`),

  // إضافة حالة موعد
  addAppointmentStatus: (data) => axios.post('/settings/appointment-statuses', data),

  // حذف حالة موعد
  deleteAppointmentStatus: (id) => axios.delete(`/settings/appointment-statuses/${id}`),

  // إضافة مدينة
  addCity: (data) => axios.post('/settings/cities', data),

  // حذف مدينة
  deleteCity: (id) => axios.delete(`/settings/cities/${id}`),

  // رفع شعار الشركة
  uploadLogo: (formData) => axios.post('/settings/upload-logo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),

  // حذف الشعار
  deleteLogo: () => axios.delete('/settings/logo'),

  // Google Sheets
  testGoogleSheetsConnection: () => axios.post('/settings/google-sheets/test'),
  syncGoogleSheets: () => axios.post('/settings/google-sheets/sync'),
  getGoogleSheetsStatus: () => axios.get('/settings/google-sheets/status')
};

export default settingsApi;
