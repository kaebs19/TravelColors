const express = require('express');
const router = express.Router();
const { tripController } = require('../controllers');
const { protect, authorize, validate } = require('../middlewares');
const { createTripValidator, updateTripValidator } = require('../validators');

// Public routes
router.get('/', tripController.getTrips);
router.get('/featured', tripController.getFeaturedTrips);
router.get('/categories', tripController.getCategories);
router.get('/:id', tripController.getTrip);

// Protected routes
router.post('/',
  protect,
  authorize('employee', 'admin'),
  createTripValidator,
  validate,
  tripController.createTrip
);

router.put('/:id',
  protect,
  authorize('employee', 'admin'),
  updateTripValidator,
  validate,
  tripController.updateTrip
);

router.delete('/:id',
  protect,
  authorize('admin'),
  tripController.deleteTrip
);

module.exports = router;
