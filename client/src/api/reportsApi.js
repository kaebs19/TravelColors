import axios from './axios';

const reportsApi = {
  // التقرير العام
  getOverviewReport: (params) => axios.get('/reports/overview', { params }),

  // تقرير المواعيد
  getAppointmentsReport: (params) => axios.get('/reports/appointments', { params }),

  // تقرير الموظفين
  getEmployeesReport: (params) => axios.get('/reports/employees', { params }),

  // تقرير الأقسام
  getDepartmentsReport: (params) => axios.get('/reports/departments', { params }),

  // التقرير المالي
  getFinancialReport: (params) => axios.get('/reports/financial', { params }),

  // تقرير أداء الموظفين التفصيلي
  getEmployeePerformance: (params) => axios.get('/reports/employee-performance', { params }),

  // تقرير العملاء الأكثر إنفاقاً
  getTopCustomers: (params) => axios.get('/reports/top-customers', { params }),

  // تقرير الأرباح والخسائر
  getProfitLoss: (params) => axios.get('/reports/profit-loss', { params }),

  // بيانات الرسوم البيانية
  getChartsData: (params) => axios.get('/reports/charts', { params }),

  // تقرير المهام
  getTasksReport: (params) => axios.get('/reports/tasks', { params })
};

export default reportsApi;
