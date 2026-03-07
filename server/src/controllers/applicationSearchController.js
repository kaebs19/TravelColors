const { VisaApplication, LicenseApplication, VisaServiceApplication } = require('../models');
const { escapeRegex } = require('../utils/sanitize');

// @desc    بحث موحد في جميع الطلبات
// @route   GET /api/applications/search
// @access  Private (Admin/Employee)
exports.searchApplications = async (req, res, next) => {
  try {
    const { q, type } = req.query;
    if (!q || q.length < 2) {
      return res.json({ success: true, data: { applications: [] } });
    }

    const safeQuery = escapeRegex(q);
    const searchRegex = new RegExp(safeQuery, 'i');
    let results = [];

    if (!type || type === 'visa') {
      const visaApps = await VisaApplication.find({
        $or: [
          { applicationNumber: searchRegex },
          { 'personalInfo.fullName': searchRegex }
        ]
      }).select('applicationNumber status personalInfo.fullName visaType createdAt').limit(5).lean();
      results.push(...visaApps.map(a => ({ ...a, _type: 'visa' })));
    }

    if (!type || type === 'license') {
      const licenseApps = await LicenseApplication.find({
        $or: [
          { applicationNumber: searchRegex },
          { 'personalInfo.givenName': searchRegex },
          { 'personalInfo.familyName': searchRegex }
        ]
      }).select('applicationNumber status personalInfo.givenName personalInfo.familyName createdAt').limit(5).lean();
      results.push(...licenseApps.map(a => ({ ...a, _type: 'license' })));
    }

    if (!type || type === 'visa_service') {
      const vsApps = await VisaServiceApplication.find({
        $or: [
          { applicationNumber: searchRegex },
          { 'personalInfo.fullName': searchRegex }
        ]
      }).select('applicationNumber status personalInfo.fullName createdAt').limit(5).lean();
      results.push(...vsApps.map(a => ({ ...a, _type: 'visa_service' })));
    }

    res.json({ success: true, data: { applications: results } });
  } catch (error) {
    next(error);
  }
};
