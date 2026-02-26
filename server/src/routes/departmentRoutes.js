const express = require('express');
const router = express.Router();
const { departmentController } = require('../controllers');
const { protect, requirePermission } = require('../middlewares');

// جميع المسارات تحتاج صلاحيات
router.use(protect);
router.use(requirePermission('departments.view'));

router.get('/', departmentController.getDepartments);
router.get('/:id', departmentController.getDepartment);
router.post('/', requirePermission('departments.add'), departmentController.createDepartment);
router.put('/:id', requirePermission('departments.edit'), departmentController.updateDepartment);
router.put('/:id/toggle', requirePermission('departments.delete'), departmentController.toggleDepartment);
router.delete('/:id', requirePermission('departments.delete'), departmentController.deleteDepartment);

module.exports = router;
