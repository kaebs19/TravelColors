const { WebsiteContent } = require('../models');
const fs = require('fs');
const path = require('path');

// الحصول على محتوى الموقع - عام بدون auth
exports.getPublicContent = async (req, res) => {
  try {
    const content = await WebsiteContent.getContent();
    res.json({
      success: true,
      data: content
    });
  } catch (error) {
    console.error('Error fetching website content:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في جلب محتوى الموقع'
    });
  }
};

// الحصول على محتوى الموقع - للإدارة
exports.getContent = async (req, res) => {
  try {
    const content = await WebsiteContent.getContent();
    res.json({
      success: true,
      data: content
    });
  } catch (error) {
    console.error('Error fetching website content:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في جلب محتوى الموقع'
    });
  }
};

// تحديث محتوى الموقع
exports.updateContent = async (req, res) => {
  try {
    const updates = req.body;

    // إزالة الحقول غير القابلة للتعديل
    delete updates._id;
    delete updates.key;
    delete updates.createdAt;
    delete updates.updatedAt;

    const content = await WebsiteContent.findOneAndUpdate(
      { key: 'main' },
      { $set: updates },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      message: 'تم حفظ محتوى الموقع بنجاح',
      data: content
    });
  } catch (error) {
    console.error('Error updating website content:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في حفظ محتوى الموقع'
    });
  }
};

// رفع صورة (hero background, about image, logo)
exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'لم يتم اختيار صورة'
      });
    }

    const { field } = req.body; // hero.backgroundImage, aboutUs.image, general.logo
    if (!field) {
      return res.status(400).json({
        success: false,
        message: 'يجب تحديد حقل الصورة'
      });
    }

    const imagePath = `/uploads/${req.file.filename}`;

    const content = await WebsiteContent.findOneAndUpdate(
      { key: 'main' },
      { $set: { [field]: imagePath } },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      message: 'تم رفع الصورة بنجاح',
      data: { path: imagePath, field }
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في رفع الصورة'
    });
  }
};

// حذف صورة
exports.deleteImage = async (req, res) => {
  try {
    const { field } = req.body;
    if (!field) {
      return res.status(400).json({
        success: false,
        message: 'يجب تحديد حقل الصورة'
      });
    }

    // الحصول على المسار الحالي للصورة
    const content = await WebsiteContent.findOne({ key: 'main' });
    if (content) {
      const keys = field.split('.');
      let value = content;
      for (const k of keys) {
        value = value?.[k];
      }

      // حذف الملف إذا موجود
      if (value) {
        const filePath = path.join(__dirname, '../../', value);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    }

    await WebsiteContent.findOneAndUpdate(
      { key: 'main' },
      { $set: { [field]: '' } },
      { new: true }
    );

    res.json({
      success: true,
      message: 'تم حذف الصورة بنجاح'
    });
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في حذف الصورة'
    });
  }
};
