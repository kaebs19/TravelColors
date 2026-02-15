/**
 * Script لحذف بيانات الاختبار
 * يحذف: العملاء، المواعيد، الإيصالات، المعاملات، سجل التدقيق
 *
 * الاستخدام:
 * node server/src/scripts/clearTestData.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// تحميل متغيرات البيئة
dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/trcolors';

async function clearData() {
  try {
    console.log('🔌 جاري الاتصال بقاعدة البيانات...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ تم الاتصال بنجاح\n');

    const db = mongoose.connection.db;

    // حذف العملاء
    const customersResult = await db.collection('customers').deleteMany({});
    console.log(`🗑️ تم حذف ${customersResult.deletedCount} عميل`);

    // حذف المواعيد
    const appointmentsResult = await db.collection('appointments').deleteMany({});
    console.log(`🗑️ تم حذف ${appointmentsResult.deletedCount} موعد`);

    // حذف الإيصالات
    const receiptsResult = await db.collection('receipts').deleteMany({});
    console.log(`🗑️ تم حذف ${receiptsResult.deletedCount} إيصال`);

    // حذف المعاملات الجديدة
    const transactionsResult = await db.collection('transactions').deleteMany({});
    console.log(`🗑️ تم حذف ${transactionsResult.deletedCount} معاملة`);

    // حذف دفعات الفواتير
    const invoicePaymentsResult = await db.collection('invoicepayments').deleteMany({});
    console.log(`🗑️ تم حذف ${invoicePaymentsResult.deletedCount} دفعة فاتورة`);

    // حذف سجل التدقيق
    const auditLogsResult = await db.collection('auditlogs').deleteMany({});
    console.log(`🗑️ تم حذف ${auditLogsResult.deletedCount} سجل تدقيق`);

    // إعادة تعيين الصندوق
    const cashRegisterResult = await db.collection('cashregisters').updateMany(
      {},
      {
        $set: {
          currentBalance: 0,
          cashBalance: 0,
          cardBalance: 0,
          transferBalance: 0,
          totalBalance: 0,
          transactions: []
        }
      }
    );
    console.log(`🔄 تم إعادة تعيين ${cashRegisterResult.modifiedCount} صندوق`);

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ تم حذف جميع بيانات الاختبار بنجاح!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ خطأ:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 تم قطع الاتصال بقاعدة البيانات');
    process.exit(0);
  }
}

// تشغيل الحذف
clearData();
