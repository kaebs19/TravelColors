import api from './axios';

const cashRegisterApi = {
  // الحصول على بيانات الصندوق
  getCashRegister: () => api.get('/cash-register'),

  // ملخص اليوم
  getTodaySummary: () => api.get('/cash-register/today'),

  // الحصول على الحركات المالية
  getTransactions: (params) => api.get('/cash-register/transactions', { params }),

  // إضافة حركة مالية
  addTransaction: (data) => api.post('/cash-register/transaction', data),

  // تقرير الصندوق
  getReport: (params) => api.get('/cash-register/report', { params })
};

export default cashRegisterApi;
