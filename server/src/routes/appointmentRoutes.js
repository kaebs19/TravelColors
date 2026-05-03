const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const { protect, requirePermission } = require('../middlewares');
const upload = require('../middlewares/upload');

// جميع المسارات تحتاج تسجيل دخول
router.use(protect);
router.use(requirePermission('appointments.view'));

// إحصائيات ومواعيد اليوم
router.get('/stats', appointmentController.getStats);
router.get('/dashboard-stats', appointmentController.getDashboardStats);
router.get('/today', appointmentController.getTodayAppointments);
router.get('/overdue-electronic', appointmentController.getOverdueElectronic);

// CRUD
router.get('/', appointmentController.getAppointments);
router.get('/:id', appointmentController.getAppointment);
router.post('/', requirePermission('appointments.add'), upload.array('attachments', 20), appointmentController.createAppointment);
router.put('/:id', requirePermission('appointments.edit'), appointmentController.updateAppointment);
router.put('/:id/status', requirePermission('appointments.edit'), appointmentController.changeStatus);
router.post('/:id/payment', requirePermission('appointments.edit'), appointmentController.addPayment);
router.post('/:id/log-quick-update', appointmentController.logQuickUpdate);

// مرفقات الموعد
router.post('/:id/attachments', upload.array('attachments', 20), appointmentController.addAttachments);
router.delete('/:id/attachments/:attachmentId', appointmentController.deleteAttachment);

// حذف الموعد
router.delete('/:id', requirePermission('appointments.delete'), appointmentController.deleteAppointment);

module.exports = router;
