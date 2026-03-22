const { Settings, Appointment } = require('../models');
const googleSheetsService = require('../services/googleSheetsService');
const { isGoogleSheetsEnabled, getSheetsApi } = require('../config/google');

// إعدادات التأشيرة الأمريكية - عام بدون auth
exports.getUsVisaPublicSettings = async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    res.json({
      success: true,
      data: settings.usVisa || {}
    });
  } catch (error) {
    console.error('Error fetching US visa settings:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ' });
  }
};

// الحصول على الإعدادات
exports.getSettings = async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في جلب الإعدادات'
    });
  }
};

// تحديث الإعدادات
exports.updateSettings = async (req, res) => {
  try {
    const updates = req.body;

    // إزالة الحقول غير القابلة للتعديل
    delete updates._id;
    delete updates.key;
    delete updates.createdAt;
    delete updates.updatedAt;

    const settings = await Settings.findOneAndUpdate(
      { key: 'main' },
      { $set: updates },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      message: 'تم حفظ الإعدادات بنجاح',
      data: settings
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في حفظ الإعدادات'
    });
  }
};

// رفع شعار الشركة
exports.uploadLogo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'لم يتم اختيار صورة'
      });
    }

    const logoPath = `/uploads/${req.file.filename}`;

    const settings = await Settings.findOneAndUpdate(
      { key: 'main' },
      { $set: { logo: logoPath } },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      message: 'تم رفع الشعار بنجاح',
      data: { logo: logoPath }
    });
  } catch (error) {
    console.error('Error uploading logo:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في رفع الشعار'
    });
  }
};

// حذف شعار الشركة
exports.deleteLogo = async (req, res) => {
  try {
    const settings = await Settings.findOneAndUpdate(
      { key: 'main' },
      { $set: { logo: '' } },
      { new: true }
    );

    res.json({
      success: true,
      message: 'تم حذف الشعار',
      data: { logo: '' }
    });
  } catch (error) {
    console.error('Error deleting logo:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في حذف الشعار'
    });
  }
};

// إضافة طريقة دفع جديدة
exports.addPaymentType = async (req, res) => {
  try {
    const { id, label, icon } = req.body;

    if (!id || !label) {
      return res.status(400).json({
        success: false,
        message: 'المعرف والاسم مطلوبان'
      });
    }

    const settings = await Settings.findOneAndUpdate(
      { key: 'main' },
      {
        $push: {
          paymentTypes: { id, label, icon: icon || '💰', enabled: true }
        }
      },
      { new: true }
    );

    res.json({
      success: true,
      message: 'تم إضافة طريقة الدفع',
      data: settings.paymentTypes
    });
  } catch (error) {
    console.error('Error adding payment type:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في إضافة طريقة الدفع'
    });
  }
};

// حذف طريقة دفع
exports.deletePaymentType = async (req, res) => {
  try {
    const { id } = req.params;

    const settings = await Settings.findOneAndUpdate(
      { key: 'main' },
      {
        $pull: { paymentTypes: { id } }
      },
      { new: true }
    );

    res.json({
      success: true,
      message: 'تم حذف طريقة الدفع',
      data: settings.paymentTypes
    });
  } catch (error) {
    console.error('Error deleting payment type:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في حذف طريقة الدفع'
    });
  }
};

// إضافة حالة موعد جديدة
exports.addAppointmentStatus = async (req, res) => {
  try {
    const { id, label, icon, color } = req.body;

    if (!id || !label) {
      return res.status(400).json({
        success: false,
        message: 'المعرف والاسم مطلوبان'
      });
    }

    const settings = await Settings.findOneAndUpdate(
      { key: 'main' },
      {
        $push: {
          appointmentStatuses: { id, label, icon: icon || '📌', color: color || '#6b7280', enabled: true }
        }
      },
      { new: true }
    );

    res.json({
      success: true,
      message: 'تم إضافة الحالة',
      data: settings.appointmentStatuses
    });
  } catch (error) {
    console.error('Error adding appointment status:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في إضافة الحالة'
    });
  }
};

// حذف حالة موعد
exports.deleteAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;

    // لا تحذف الحالات الأساسية
    if (['new', 'completed', 'cancelled'].includes(id)) {
      return res.status(400).json({
        success: false,
        message: 'لا يمكن حذف الحالات الأساسية'
      });
    }

    const settings = await Settings.findOneAndUpdate(
      { key: 'main' },
      {
        $pull: { appointmentStatuses: { id } }
      },
      { new: true }
    );

    res.json({
      success: true,
      message: 'تم حذف الحالة',
      data: settings.appointmentStatuses
    });
  } catch (error) {
    console.error('Error deleting appointment status:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في حذف الحالة'
    });
  }
};

// إضافة مدينة جديدة
exports.addCity = async (req, res) => {
  try {
    const { id, name } = req.body;

    if (!id || !name) {
      return res.status(400).json({
        success: false,
        message: 'المعرف والاسم مطلوبان'
      });
    }

    const settings = await Settings.findOneAndUpdate(
      { key: 'main' },
      {
        $push: {
          cities: { id, name, enabled: true }
        }
      },
      { new: true }
    );

    res.json({
      success: true,
      message: 'تم إضافة المدينة',
      data: settings.cities
    });
  } catch (error) {
    console.error('Error adding city:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في إضافة المدينة'
    });
  }
};

// حذف مدينة
exports.deleteCity = async (req, res) => {
  try {
    const { id } = req.params;

    const settings = await Settings.findOneAndUpdate(
      { key: 'main' },
      {
        $pull: { cities: { id } }
      },
      { new: true }
    );

    res.json({
      success: true,
      message: 'تم حذف المدينة',
      data: settings.cities
    });
  } catch (error) {
    console.error('Error deleting city:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في حذف المدينة'
    });
  }
};

// ==================== Google Sheets ====================

// اختبار الاتصال بـ Google Sheets
exports.testGoogleSheetsConnection = async (req, res) => {
  try {
    const sheetsApi = getSheetsApi();

    if (!sheetsApi) {
      return res.status(400).json({
        success: false,
        message: 'لم يتم تكوين Google Sheets. تأكد من وجود ملف google-credentials.json'
      });
    }

    const settings = await Settings.getSettings();
    const spreadsheetId = settings.googleSheets?.spreadsheetId || process.env.GOOGLE_SPREADSHEET_ID;

    if (!spreadsheetId) {
      return res.status(400).json({
        success: false,
        message: 'لم يتم تحديد Spreadsheet ID'
      });
    }

    // محاولة قراءة الورقة للتأكد من الاتصال
    const response = await sheetsApi.spreadsheets.get({
      spreadsheetId: spreadsheetId
    });

    const sheetName = settings.googleSheets?.sheetName || process.env.GOOGLE_SHEET_NAME || 'Appointments';
    const sheet = response.data.sheets.find(s => s.properties.title === sheetName);

    res.json({
      success: true,
      message: 'تم الاتصال بنجاح',
      data: {
        spreadsheetTitle: response.data.properties.title,
        sheetFound: !!sheet,
        sheetName: sheetName,
        sheetsCount: response.data.sheets.length
      }
    });
  } catch (error) {
    console.error('Error testing Google Sheets connection:', error);

    let errorMessage = 'فشل الاتصال بـ Google Sheets';
    if (error.code === 404) {
      errorMessage = 'لم يتم العثور على الورقة. تأكد من Spreadsheet ID';
    } else if (error.code === 403) {
      errorMessage = 'لا توجد صلاحية للوصول. تأكد من مشاركة الورقة مع Service Account';
    }

    res.status(500).json({
      success: false,
      message: errorMessage,
      error: error.message
    });
  }
};

// مزامنة كاملة مع Google Sheets
exports.syncGoogleSheets = async (req, res) => {
  try {
    if (!isGoogleSheetsEnabled()) {
      return res.status(400).json({
        success: false,
        message: 'Google Sheets غير مفعل'
      });
    }

    // تحديث حالة المزامنة
    await Settings.findOneAndUpdate(
      { key: 'main' },
      {
        $set: {
          'googleSheets.syncStatus': 'syncing',
          'googleSheets.lastError': ''
        }
      }
    );

    // جلب جميع المواعيد مع populate
    const appointments = await Appointment.find()
      .populate('department', 'title')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    // تنفيذ المزامنة الكاملة
    const result = await googleSheetsService.fullSync(appointments);

    if (result) {
      await Settings.findOneAndUpdate(
        { key: 'main' },
        {
          $set: {
            'googleSheets.syncStatus': 'success',
            'googleSheets.lastSyncAt': new Date(),
            'googleSheets.totalSynced': appointments.length,
            'googleSheets.lastError': ''
          }
        }
      );

      res.json({
        success: true,
        message: `تم مزامنة ${appointments.length} موعد بنجاح`,
        data: {
          totalSynced: appointments.length,
          lastSyncAt: new Date()
        }
      });
    } else {
      throw new Error('فشلت عملية المزامنة');
    }
  } catch (error) {
    console.error('Error syncing Google Sheets:', error);

    await Settings.findOneAndUpdate(
      { key: 'main' },
      {
        $set: {
          'googleSheets.syncStatus': 'error',
          'googleSheets.lastError': error.message
        }
      }
    );

    res.status(500).json({
      success: false,
      message: 'حدث خطأ في المزامنة',
      error: error.message
    });
  }
};

// الحصول على حالة Google Sheets
exports.getGoogleSheetsStatus = async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    const sheetsApi = getSheetsApi();

    res.json({
      success: true,
      data: {
        isConfigured: !!sheetsApi,
        enabled: settings.googleSheets?.enabled || false,
        spreadsheetId: settings.googleSheets?.spreadsheetId || '',
        sheetName: settings.googleSheets?.sheetName || 'Appointments',
        syncStatus: settings.googleSheets?.syncStatus || 'idle',
        lastSyncAt: settings.googleSheets?.lastSyncAt,
        totalSynced: settings.googleSheets?.totalSynced || 0,
        lastError: settings.googleSheets?.lastError || ''
      }
    });
  } catch (error) {
    console.error('Error getting Google Sheets status:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في جلب حالة Google Sheets'
    });
  }
};
