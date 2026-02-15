import api from './axios';

const transactionsApi = {
  // الحصول على المعاملات مع الفلاتر
  getTransactions: (params) => api.get('/transactions', { params }),

  // الحصول على معاملة واحدة
  getTransaction: (id) => api.get(`/transactions/${id}`),

  // إنشاء معاملة يدوية
  createTransaction: (data) => api.post('/transactions', data),

  // إلغاء معاملة
  cancelTransaction: (id, data) => api.put(`/transactions/${id}/cancel`, data),

  // إحصائيات المعاملات
  getStats: (params) => api.get('/transactions/stats/summary', { params }),

  // ملخص الرصيد
  getBalanceSummary: () => api.get('/transactions/balance/summary'),

  // تقرير يومي
  getDailyReport: (params) => api.get('/transactions/reports/daily', { params })
};

export default transactionsApi;
