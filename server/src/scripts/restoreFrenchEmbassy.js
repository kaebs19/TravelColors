/**
 * سكربت لاستعادة السفارة الفرنسية المحذوفة
 * يبحث عن ID القسم من المواعيد القديمة ويعيد إنشاءه بنفس ID
 * يُشغّل مرة واحدة: node server/src/scripts/restoreFrenchEmbassy.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const { Appointment, Department } = require('../models');

async function restoreFrenchEmbassy() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/trcolors');
    console.log('✅ Connected to MongoDB');

    // البحث عن المواعيد التي تشير لقسم غير موجود
    const allAppointments = await Appointment.find({}).populate('department');

    const orphanedAppointments = allAppointments.filter(a => a.department === null && a._doc.department);

    if (orphanedAppointments.length === 0) {
      console.log('✅ لا توجد مواعيد بأقسام محذوفة');
      await mongoose.disconnect();
      process.exit(0);
      return;
    }

    // تجميع IDs الأقسام المحذوفة
    const deletedDeptIds = [...new Set(orphanedAppointments.map(a => a._doc.department.toString()))];
    console.log(`⚠️ وُجدت ${orphanedAppointments.length} موعد تشير لـ ${deletedDeptIds.length} قسم محذوف`);

    for (const deptId of deletedDeptIds) {
      const deptAppointments = orphanedAppointments.filter(a => a._doc.department.toString() === deptId);
      console.log(`\n📋 القسم ID: ${deptId}`);
      console.log(`   المواعيد المرتبطة: ${deptAppointments.length}`);
      deptAppointments.slice(0, 3).forEach(a => {
        console.log(`   - ${a.customerName} (${a.type})`);
      });

      // التحقق هل القسم موجود فعلاً
      const existing = await Department.findById(deptId);
      if (existing) {
        console.log(`   ✅ القسم موجود بالفعل: ${existing.title}`);
        continue;
      }

      // إعادة إنشاء القسم بنفس الـ ID
      console.log(`   🔄 جاري استعادة القسم...`);

      const restoredDept = await Department.create({
        _id: new mongoose.Types.ObjectId(deptId),
        title: 'السفارة الفرنسية',
        cities: [
          { name: 'الرياض' }
        ],
        submissionType: 'حضوري',
        isActive: true
      });

      console.log(`   ✅ تم استعادة: ${restoredDept.title} (ID: ${restoredDept._id})`);
    }

    // التحقق النهائي
    const verifyOrphans = await Appointment.find({}).populate('department');
    const stillOrphaned = verifyOrphans.filter(a => a.department === null && a._doc.department);
    console.log(`\n📊 النتيجة:`);
    console.log(`   - مواعيد بدون قسم قبل: ${orphanedAppointments.length}`);
    console.log(`   - مواعيد بدون قسم بعد: ${stillOrphaned.length}`);

    await mongoose.disconnect();
    console.log('\n✅ Done!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

restoreFrenchEmbassy();
