const express = require('express');
const router = express.Router();
const { authController } = require('../controllers');
const { protect, validate } = require('../middlewares');
const { registerValidator, loginValidator, changePasswordValidator } = require('../validators');

router.post('/register', [...registerValidator, validate], authController.register);
router.post('/login', [...loginValidator, validate], authController.login);
router.get('/me', protect, authController.getMe);
router.put('/update-profile', protect, authController.updateProfile);
router.put('/change-password', protect, [...changePasswordValidator, validate], authController.changePassword);

module.exports = router;
