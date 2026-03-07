const express = require('express');
const router = express.Router();
const applicationSearchController = require('../controllers/applicationSearchController');
const { protect } = require('../middlewares/auth');

router.get('/search', protect, applicationSearchController.searchApplications);

module.exports = router;
