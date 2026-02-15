const express = require('express');
const router = express.Router();
const { customerController } = require('../controllers');
const { protect, authorize } = require('../middlewares');

// جميع المسارات تحتاج صلاحيات موظف أو مدير
router.use(protect);
router.use(authorize('employee', 'admin'));

router.get('/search', customerController.searchCustomers);
router.get('/', customerController.getCustomers);
router.get('/:id', customerController.getCustomer);
router.post('/', customerController.createCustomer);
router.put('/:id', customerController.updateCustomer);
router.delete('/:id', authorize('admin'), customerController.deleteCustomer);

module.exports = router;
