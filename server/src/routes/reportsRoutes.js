const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reportsController');
const { protect, authorize } = require('../middlewares/auth');

// جميع التقارير للمدراء فقط
router.use(protect);
router.use(authorize('admin'));

// التقرير العام
router.get('/overview', reportsController.getOverviewReport);

// تقرير المواعيد
router.get('/appointments', reportsController.getAppointmentsReport);

// تقرير الموظفين
router.get('/employees', reportsController.getEmployeesReport);

// تقرير الأقسام
router.get('/departments', reportsController.getDepartmentsReport);

// التقرير المالي
router.get('/financial', reportsController.getFinancialReport);

// تقرير أداء الموظفين التفصيلي
router.get('/employee-performance', reportsController.getEmployeePerformance);

// تقرير العملاء الأكثر إنفاقاً
router.get('/top-customers', reportsController.getTopCustomers);

// تقرير الأرباح والخسائر
router.get('/profit-loss', reportsController.getProfitLossReport);

// بيانات الرسوم البيانية
router.get('/charts', reportsController.getChartsData);

// تقرير المهام
router.get('/tasks', reportsController.getTasksReport);

module.exports = router;
