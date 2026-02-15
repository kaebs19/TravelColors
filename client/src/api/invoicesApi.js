import api from './axios';

const invoicesApi = {
  // الحصول على جميع الفواتير
  getInvoices: (params) => api.get('/invoices', { params }),

  // الحصول على فاتورة واحدة
  getInvoice: (id) => api.get(`/invoices/${id}`),

  // إنشاء فاتورة جديدة
  createInvoice: (data) => api.post('/invoices', data),

  // تحديث فاتورة
  updateInvoice: (id, data) => api.put(`/invoices/${id}`, data),

  // تسجيل دفعة
  addPayment: (id, data) => api.post(`/invoices/${id}/payment`, data),

  // إلغاء فاتورة
  cancelInvoice: (id) => api.delete(`/invoices/${id}`),

  // تحويل عرض سعر لفاتورة
  convertToInvoice: (id) => api.post(`/invoices/${id}/convert`),

  // إحصائيات الفواتير
  getStats: (params) => api.get('/invoices/stats', { params }),

  // سجل دفعات الفاتورة
  getPayments: (id) => api.get(`/invoices/${id}/payments`),

  // استرداد دفعة
  refundPayment: (invoiceId, paymentId, data) =>
    api.post(`/invoices/${invoiceId}/payments/${paymentId}/refund`, data)
};

export default invoicesApi;
