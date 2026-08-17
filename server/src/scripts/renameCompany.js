/**
 * سكربت لتغيير اسم الوكالة في البيانات المخزَّنة بقاعدة البيانات
 * (القيم الافتراضية في الكود تُطبَّق فقط عند الإنشاء الأول،
 *  أما الوثائق الموجودة فتحتفظ بالاسم القديم حتى يُشغَّل هذا السكربت)
 *
 * يُشغّل مرة واحدة: node server/src/scripts/renameCompany.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const { Settings, WebsiteContent, Visa } = require('../models');

const OLD = ['ألوان المسافر', 'الوان المسافر'];
const NEW = ['ألوان السفر', 'الوان السفر'];

// استبدال الاسم داخل أي نص، مع تجاهل ما ليس نصاً
const rename = (value) => {
  if (typeof value !== 'string') return value;
  let out = value;
  OLD.forEach((old, i) => { out = out.split(old).join(NEW[i]); });
  return out;
};

// المرور على كل حقول الوثيقة (نصوص، مصفوفات، كائنات متداخلة)
const renameDeep = (value) => {
  if (typeof value === 'string') return rename(value);
  if (Array.isArray(value)) return value.map(renameDeep);
  if (value && typeof value === 'object' && value.constructor === Object) {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = renameDeep(v);
    return out;
  }
  return value;
};

async function renameCompany() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/trcolors');
    console.log('✅ Connected to MongoDB');

    let changed = 0;

    for (const Model of [Settings, WebsiteContent, Visa]) {
      const docs = await Model.find({});
      for (const doc of docs) {
        const before = doc.toObject();
        delete before._id;
        delete before.__v;
        const after = renameDeep(before);

        if (JSON.stringify(before) === JSON.stringify(after)) continue;

        await Model.updateOne({ _id: doc._id }, { $set: after });
        changed++;
        console.log(`✏️  ${Model.modelName} — ${doc._id}`);
      }
    }

    console.log(changed === 0
      ? '✅ لا توجد وثائق تحتاج تعديل'
      : `✅ تم تحديث ${changed} وثيقة`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ خطأ:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

renameCompany();
