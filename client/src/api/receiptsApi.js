import api from './axios';

const receiptsApi = {
  // الحصول على الإيصالات مع الفلاتر
  getReceipts: (params) => api.get('/receipts', { params }),

  // الحصول على إيصال واحد
  getReceipt: (id) => api.get(`/receipts/${id}`),

  // إنشاء إيصال جديد
  createReceipt: (data) => api.post('/receipts', data),

  // إنشاء إيصال من موعد
  createFromAppointment: (appointmentId, data) =>
    api.post(`/receipts/from-appointment/${appointmentId}`, data),

  // تحويل إيصال إلى فاتورة
  convertToInvoice: (id, data) => api.post(`/receipts/${id}/convert-to-invoice`, data),

  // إلغاء إيصال
  cancelReceipt: (id, data) => api.put(`/receipts/${id}/cancel`, data),

  // الحصول على إيصال للطباعة
  getForPrint: (id) => api.get(`/receipts/${id}/print`),

  // إحصائيات الإيصالات
  getStats: (params) => api.get('/receipts/stats', { params })
};

export default receiptsApi;
