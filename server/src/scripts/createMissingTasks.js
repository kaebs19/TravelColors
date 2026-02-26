/**
 * سكربت لإنشاء المهام المفقودة للمواعيد المؤكدة
 * يُشغّل مرة واحدة: node server/src/scripts/createMissingTasks.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const { Appointment, Task, Department, User } = require('../models');

async function createMissingTasks() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/trcolors');
    console.log('✅ Connected to MongoDB');

    // البحث عن كل المواعيد المؤكدة
    const confirmedAppointments = await Appointment.find({ type: 'confirmed' })
      .populate('department', 'title submissionType');
    console.log(`📋 إجمالي المواعيد المؤكدة: ${confirmedAppointments.length}`);

    // البحث عن المواعيد التي لها مهام بالفعل
    const existingTasks = await Task.find({});
    const appointmentsWithTasks = new Set(existingTasks.map(t => t.appointment.toString()));
    console.log(`✅ المواعيد التي لها مهام: ${appointmentsWithTasks.size}`);

    // الحصول على مستخدم admin كـ fallback لـ createdBy
    const admin = await User.findOne({ role: 'admin' });

    let created = 0;
    let skipped = 0;

    for (const appointment of confirmedAppointments) {
      if (appointmentsWithTasks.has(appointment._id.toString())) {
        skipped++;
        continue;
      }

      try {
        // التحقق إذا كان تقديم إلكتروني
        const isElectronicSubmission = appointment.isSubmission &&
          appointment.department?.submissionType === 'إلكتروني';

        const taskData = {
          appointment: appointment._id,
          createdBy: appointment.createdBy || admin?._id,
          status: 'new'
        };

        // لا نبدأ العمل تلقائياً للمهام القديمة المفقودة
        const task = await Task.create(taskData);
        created++;
        console.log(`  ✅ مهمة ${task.taskNumber} ← موعد ${appointment.customerName || appointment._id}`);
      } catch (err) {
        console.error(`  ❌ خطأ في إنشاء مهمة للموعد ${appointment._id}:`, err.message);
      }
    }

    console.log('\n📊 النتائج:');
    console.log(`  - مواعيد مؤكدة: ${confirmedAppointments.length}`);
    console.log(`  - لها مهام مسبقاً: ${skipped}`);
    console.log(`  - مهام جديدة أُنشئت: ${created}`);
    console.log(`  - إجمالي المهام الآن: ${await Task.countDocuments()}`);

    await mongoose.disconnect();
    console.log('\n✅ Done!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createMissingTasks();
