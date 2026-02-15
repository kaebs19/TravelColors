const express = require('express');
const router = express.Router();

router.use('/auth', require('./authRoutes'));
router.use('/trips', require('./tripRoutes'));
router.use('/bookings', require('./bookingRoutes'));
router.use('/customers', require('./customerRoutes'));
router.use('/departments', require('./departmentRoutes'));
router.use('/employees', require('./employeeRoutes'));
router.use('/appointments', require('./appointmentRoutes'));
router.use('/notes', require('./noteRoutes'));
router.use('/settings', require('./settingsRoutes'));
router.use('/reports', require('./reportsRoutes'));
router.use('/invoices', require('./invoiceRoutes'));
router.use('/cash-register', require('./cashRegisterRoutes'));

// النظام المالي الموحد
router.use('/transactions', require('./transactionRoutes'));
router.use('/receipts', require('./receiptRoutes'));
router.use('/audit', require('./auditRoutes'));

// نظام المهام
router.use('/tasks', require('./taskRoutes'));

module.exports = router;
