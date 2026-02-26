const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { protect, requirePermission } = require('../middlewares/auth');

// جميع الـ routes تتطلب تسجيل دخول
router.use(protect);
router.use(requirePermission('tasks.view'));

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

// سجل النشاط للمهمة
router.get('/:id/activity-log', taskController.getTaskActivityLog);

// عمليات المهمة
router.put('/:id/start', requirePermission('tasks.edit'), taskController.startTask);
router.put('/:id/complete', requirePermission('tasks.edit'), taskController.completeTask);
router.put('/:id/cancel', requirePermission('tasks.edit'), taskController.cancelTask);
router.put('/:id/transfer', requirePermission('tasks.edit'), taskController.transferTask);

// الملاحظات والمرفقات
router.post('/:id/notes', requirePermission('tasks.add'), taskController.addTaskNote);
router.post('/:id/attachments', requirePermission('tasks.add'), taskController.addTaskAttachment);

module.exports = router;
