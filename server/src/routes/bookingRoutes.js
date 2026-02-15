const express = require('express');
const router = express.Router();
const { bookingController } = require('../controllers');
const { protect, authorize } = require('../middlewares');

router.get('/', protect, bookingController.getBookings);
router.get('/stats', protect, authorize('employee', 'admin'), bookingController.getBookingStats);
router.get('/:id', protect, bookingController.getBooking);
router.post('/', protect, bookingController.createBooking);
router.put('/:id', protect, authorize('employee', 'admin'), bookingController.updateBooking);
router.put('/:id/cancel', protect, bookingController.cancelBooking);

module.exports = router;
