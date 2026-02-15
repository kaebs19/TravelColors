const express = require('express');
const router = express.Router();
const { departmentController } = require('../controllers');
const { protect, authorize } = require('../middlewares');

// جميع المسارات تحتاج صلاحيات موظف أو مدير
router.use(protect);
router.use(authorize('employee', 'admin'));

router.get('/', departmentController.getDepartments);
router.get('/:id', departmentController.getDepartment);
router.post('/', departmentController.createDepartment);
router.put('/:id', departmentController.updateDepartment);
router.put('/:id/toggle', authorize('admin'), departmentController.toggleDepartment);
router.delete('/:id', authorize('admin'), departmentController.deleteDepartment);

module.exports = router;
