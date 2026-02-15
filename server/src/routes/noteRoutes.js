const express = require('express');
const router = express.Router();
const {
  getNotes,
  getNote,
  createNote,
  updateNote,
  deleteNote,
  convertToAppointment,
  changeStatus,
  getTodayReminders,
  getStats
} = require('../controllers/noteController');
const { protect } = require('../middlewares/auth');

// جميع المسارات تتطلب تسجيل الدخول
router.use(protect);

// إحصائيات وتذكيرات اليوم - يجب أن تكون قبل /:id
router.get('/stats', getStats);
router.get('/today', getTodayReminders);

// المسارات الأساسية
router.route('/')
  .get(getNotes)
  .post(createNote);

router.route('/:id')
  .get(getNote)
  .put(updateNote)
  .delete(deleteNote);

// تحويل لموعد
router.post('/:id/convert', convertToAppointment);

// تغيير الحالة
router.put('/:id/status', changeStatus);

module.exports = router;
