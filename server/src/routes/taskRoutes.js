const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { protect, authorize } = require('../middlewares/auth');

// جميع الـ routes تتطلب تسجيل دخول
router.use(protect);
router.use(authorize('employee', 'admin'));

// الإحصائيات
router.get('/stats', taskController.getTaskStats);

// إحصائيات لوحة التحكم
router.get('/dashboard-stats', taskController.getDashboardStats);

// مهام الموظف الحالي
router.get('/my-tasks', taskController.getMyTasks);

// جلب مهمة بواسطة الموعد
router.get('/by-appointment/:appointmentId', taskController.getTaskByAppointment);

// النشاطات الأخيرة
router.get('/recent-activities', taskController.getRecentActivities);

// CRUD المهام
router.get('/', taskController.getTasks);
router.get('/:id', taskController.getTask);

// عمليات المهمة
router.put('/:id/start', taskController.startTask);
router.put('/:id/complete', taskController.completeTask);
router.put('/:id/cancel', taskController.cancelTask);
router.put('/:id/transfer', taskController.transferTask);

// الملاحظات والمرفقات
router.post('/:id/notes', taskController.addTaskNote);
router.post('/:id/attachments', taskController.addTaskAttachment);

module.exports = router;
