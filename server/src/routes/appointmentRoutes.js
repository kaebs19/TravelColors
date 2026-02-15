const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const { protect, authorize } = require('../middlewares');

// جميع المسارات تحتاج تسجيل دخول
router.use(protect);
router.use(authorize('employee', 'admin'));

// إحصائيات ومواعيد اليوم
router.get('/stats', appointmentController.getStats);
router.get('/dashboard-stats', appointmentController.getDashboardStats);
router.get('/today', appointmentController.getTodayAppointments);

// CRUD
router.get('/', appointmentController.getAppointments);
router.get('/:id', appointmentController.getAppointment);
router.post('/', appointmentController.createAppointment);
router.put('/:id', appointmentController.updateAppointment);
router.put('/:id/status', appointmentController.changeStatus);
router.delete('/:id', appointmentController.deleteAppointment);

module.exports = router;
