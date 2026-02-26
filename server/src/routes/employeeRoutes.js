const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const { protect, requirePermission } = require('../middlewares');

// جميع المسارات تحتاج صلاحيات إدارة الموظفين
router.use(protect);
router.use(requirePermission('employees.manage'));

router.get('/', employeeController.getEmployees);
router.get('/:id', employeeController.getEmployee);
router.post('/', employeeController.createEmployee);
router.put('/:id', employeeController.updateEmployee);
router.put('/:id/toggle', employeeController.toggleEmployee);
router.delete('/:id', employeeController.deleteEmployee);

module.exports = router;
