const express = require('express');
const router = express.Router();
const { customerController } = require('../controllers');
const { protect, requirePermission } = require('../middlewares');

// جميع المسارات تحتاج صلاحيات
router.use(protect);
router.use(requirePermission('customers.view'));

router.get('/search', customerController.searchCustomers);
router.get('/', customerController.getCustomers);
router.get('/:id', customerController.getCustomer);
router.get('/:id/applications', customerController.getCustomerApplications);
router.post('/', requirePermission('customers.add'), customerController.createCustomer);
router.put('/:id', requirePermission('customers.edit'), customerController.updateCustomer);
router.delete('/:id', requirePermission('customers.delete'), customerController.deleteCustomer);

module.exports = router;
