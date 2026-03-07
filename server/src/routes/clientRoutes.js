const express = require('express');
const router = express.Router();
const { clientProtect } = require('../middlewares/clientAuth');
const { protect } = require('../middlewares/auth');
const clientAuthController = require('../controllers/clientAuthController');
const clientAppController = require('../controllers/clientAppController');
const ClientProfile = require('../models/ClientProfile');

// === Admin Route — قائمة العملاء المسجلين ===
router.get('/admin/list', protect, async (req, res) => {
  try {
    const clients = await ClientProfile.find({})
      .select('name email phone isActive createdAt lastLogin')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: clients, count: clients.length });
  } catch (err) {
    res.status(500).json({ success: false, message: 'خطأ في جلب العملاء' });
  }
});

// === Admin Route — تفاصيل عميل واحد مع طلباته ===
router.get('/admin/:id', protect, async (req, res) => {
  try {
    const client = await ClientProfile.findById(req.params.id)
      .select('name email phone isActive createdAt lastLogin');
    if (!client) return res.status(404).json({ success: false, message: 'العميل غير موجود' });
    
    const { VisaApplication } = require('../models');
    const LicenseApplication = require('../models/LicenseApplication');
    
    const visaApps = await VisaApplication.find({ clientId: req.params.id })
      .select('applicationNumber status personalInfo.fullNameEn passportDetails.passportNumber currentStep createdAt updatedAt')
      .sort({ createdAt: -1 });
    
    const licenseApps = await LicenseApplication.find({ clientId: req.params.id })
      .select('applicationNumber status personalInfo.familyName personalInfo.givenName createdAt updatedAt')
      .sort({ createdAt: -1 });
    
    res.json({ success: true, data: { client, visaApplications: visaApps, licenseApplications: licenseApps } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'خطأ في جلب بيانات العميل' });
  }
});

// === Admin Route — حظر/إلغاء حظر عميل ===
router.put('/admin/:id/toggle-active', protect, async (req, res) => {
  try {
    const client = await ClientProfile.findById(req.params.id);
    if (!client) return res.status(404).json({ success: false, message: 'العميل غير موجود' });
    client.isActive = !client.isActive;
    await client.save({ validateBeforeSave: false });
    res.json({ success: true, data: { isActive: client.isActive }, message: client.isActive ? 'تم إلغاء حظر العميل' : 'تم حظر العميل' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'خطأ في تحديث حالة العميل' });
  }
});

// === Admin Route — حذف عميل ===
router.delete('/admin/:id', protect, async (req, res) => {
  try {
    const client = await ClientProfile.findById(req.params.id);
    if (!client) return res.status(404).json({ success: false, message: 'العميل غير موجود' });
    await ClientProfile.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'تم حذف العميل بنجاح' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'خطأ في حذف العميل' });
  }
});

const { authLimiter } = require('../middlewares/rateLimiter');

// === Auth Routes (Public) ===
router.post('/auth/register', authLimiter, clientAuthController.register);
router.post('/auth/login', authLimiter, clientAuthController.login);
router.post('/auth/forgot-password', authLimiter, clientAuthController.forgotPassword);
router.post('/auth/reset-password/:token', authLimiter, clientAuthController.resetPassword);

// === Auth Routes (Protected) ===
router.get('/auth/me', clientProtect, clientAuthController.getMe);
router.put('/auth/update-profile', clientProtect, clientAuthController.updateProfile);
router.put('/auth/change-password', clientProtect, clientAuthController.changePassword);

// === Application Routes (Protected) ===
router.get('/applications', clientProtect, clientAppController.getMyApplications);
router.post('/applications', clientProtect, clientAppController.createApplication);
router.get('/applications/:id', clientProtect, clientAppController.getMyApplication);
router.put('/applications/:id', clientProtect, clientAppController.updateApplication);
router.post('/applications/:id/submit', clientProtect, clientAppController.submitApplication);
router.delete('/applications/:id', clientProtect, clientAppController.deleteApplication);

module.exports = router;
