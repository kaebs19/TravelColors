/**
 * سكربت لإعادة تفعيل السفارة الفرنسية
 * يُشغّل مرة واحدة: node server/src/scripts/reactivateFrenchEmbassy.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const { Department } = require('../models');

async function reactivate() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/trcolors');
    console.log('Connected to MongoDB');

    const dept = await Department.findOne({ title: 'السفارة الفرنسية' });

    if (!dept) {
      console.log('السفارة الفرنسية غير موجودة في قاعدة البيانات');
      await mongoose.disconnect();
      process.exit(1);
      return;
    }

    console.log('وُجد القسم:', dept.title, '| isActive:', dept.isActive);

    if (dept.isActive) {
      console.log('القسم مفعّل بالفعل، لا حاجة لتغيير');
    } else {
      dept.isActive = true;
      await dept.save();
      console.log('تم تفعيل السفارة الفرنسية بنجاح');
    }

    await mongoose.disconnect();
    console.log('Done!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

reactivate();
