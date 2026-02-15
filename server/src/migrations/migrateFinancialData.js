/**
 * Migration Script: نقل البيانات من CashRegister القديم إلى Transaction و Receipt الجديد
 *
 * هذا السكربت ينقل:
 * 1. جميع معاملات CashRegister.transactions إلى Transaction model
 * 2. معاملات من نوع appointment_payment إلى Receipt model
 *
 * الاستخدام:
 * node server/src/migrations/migrateFinancialData.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// تحميل متغيرات البيئة
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Models
const CashRegister = require('../models/CashRegister');
const Transaction = require('../models/Transaction');
const Receipt = require('../models/Receipt');
const Settings = require('../models/Settings');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/trcolors';

async function migrate() {
  try {
    console.log('🔌 جاري الاتصال بقاعدة البيانات...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ تم الاتصال بنجاح\n');

    // جلب الصندوق
    const cashRegister = await CashRegister.findOne({ name: 'الصندوق الرئيسي' });

    if (!cashRegister) {
      console.log('⚠️ لا يوجد صندوق للترحيل');
      return;
    }

    const oldTransactions = cashRegister.transactions || [];
    console.log(`📊 عدد المعاملات في النظام القديم: ${oldTransactions.length}\n`);

    if (oldTransactions.length === 0) {
      console.log('✅ لا توجد معاملات للترحيل');
      return;
    }

    // جلب بيانات الشركة
    const settings = await Settings.findOne();
    const companyInfo = settings ? {
      name: settings.companyName,
      nameEn: settings.companyNameEn,
      address: settings.address,
      phone: settings.phone,
      email: settings.email,
      logo: settings.logo,
      taxNumber: settings.taxNumber
    } : {};

    let migratedTransactions = 0;
    let migratedReceipts = 0;
    let skippedTransactions = 0;
    let errors = 0;

    // ترتيب المعاملات حسب التاريخ (الأقدم أولاً)
    const sortedTransactions = [...oldTransactions].sort((a, b) =>
      new Date(a.transactionDate || a.createdAt) - new Date(b.transactionDate || b.createdAt)
    );

    console.log('🔄 جاري ترحيل المعاملات...\n');

    for (const oldTx of sortedTransactions) {
      try {
        // التحقق من عدم وجود المعاملة مسبقاً
        const existingTx = await Transaction.findOne({
          'metadata.oldTransactionId': oldTx._id.toString()
        });

        if (existingTx) {
          skippedTransactions++;
          continue;
        }

        // توليد رقم المعاملة
        const transactionNumber = await Transaction.generateTransactionNumber();

        // حساب الرصيد
        const balanceBefore = oldTx.balanceAfter - (oldTx.type === 'income' ? oldTx.amount : -oldTx.amount);

        // تحديد مصدر المعاملة
        let source = 'manual';
        let sourceType = 'manual';
        let receiptRef = null;

        // إذا كانت دفعة موعد، ننشئ إيصال
        if (oldTx.category === 'appointment_payment' && oldTx.type === 'income') {
          try {
            // التحقق من عدم وجود إيصال مسبق لهذه المعاملة
            const existingReceipt = await Receipt.findOne({
              'metadata.oldTransactionId': oldTx._id.toString()
            });

            if (!existingReceipt) {
              const receiptNumber = await Receipt.generateReceiptNumber();

              const receipt = await Receipt.create({
                receiptNumber,
                appointment: oldTx.appointment,
                customer: oldTx.customer,
                customerName: oldTx.description?.replace('دفعة موعد - ', '') || 'عميل',
                customerPhone: '',
                amount: oldTx.amount,
                paymentMethod: oldTx.paymentMethod || 'cash',
                description: oldTx.description || '',
                companyInfo,
                createdBy: oldTx.createdBy,
                status: 'active',
                createdAt: oldTx.transactionDate || oldTx.createdAt,
                metadata: {
                  oldTransactionId: oldTx._id.toString(),
                  migratedAt: new Date()
                }
              });

              receiptRef = receipt._id;
              source = 'automatic';
              sourceType = 'receipt';
              migratedReceipts++;
            }
          } catch (receiptError) {
            console.error(`  ⚠️ خطأ في إنشاء إيصال: ${receiptError.message}`);
          }
        }

        // إنشاء المعاملة الجديدة
        const newTransaction = await Transaction.create({
          transactionNumber,
          type: oldTx.type,
          amount: oldTx.amount,
          description: oldTx.description,
          category: oldTx.category || 'other',
          paymentMethod: oldTx.paymentMethod || 'cash',
          source,
          sourceType,
          receipt: receiptRef,
          invoice: oldTx.invoice,
          appointment: oldTx.appointment,
          customer: oldTx.customer,
          balanceBefore,
          balanceAfter: oldTx.balanceAfter,
          createdBy: oldTx.createdBy,
          isActive: true,
          createdAt: oldTx.transactionDate || oldTx.createdAt,
          metadata: {
            oldTransactionId: oldTx._id.toString(),
            migratedAt: new Date()
          }
        });

        // تحديث الإيصال بالمعاملة
        if (receiptRef) {
          await Receipt.findByIdAndUpdate(receiptRef, {
            transaction: newTransaction._id
          });
        }

        migratedTransactions++;

        // إظهار التقدم كل 10 معاملات
        if (migratedTransactions % 10 === 0) {
          console.log(`  ✓ تم ترحيل ${migratedTransactions} معاملة...`);
        }
      } catch (txError) {
        errors++;
        console.error(`  ❌ خطأ في ترحيل معاملة: ${txError.message}`);
      }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 ملخص الترحيل:');
    console.log(`  ✅ المعاملات المرحّلة: ${migratedTransactions}`);
    console.log(`  🧾 الإيصالات المنشأة: ${migratedReceipts}`);
    console.log(`  ⏭️ المعاملات المتخطاة (موجودة مسبقاً): ${skippedTransactions}`);
    console.log(`  ❌ الأخطاء: ${errors}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // تحديث totalBalance في CashRegister إذا لزم الأمر
    const calculatedTotal = cashRegister.cashBalance + cashRegister.cardBalance + cashRegister.transferBalance;
    if (cashRegister.currentBalance !== calculatedTotal) {
      console.log(`⚠️ تصحيح الرصيد الإجمالي: ${cashRegister.currentBalance} → ${calculatedTotal}`);
      cashRegister.currentBalance = calculatedTotal;
      cashRegister.totalBalance = calculatedTotal;
      await cashRegister.save();
    }

    console.log('✅ اكتمل الترحيل بنجاح!');

  } catch (error) {
    console.error('❌ خطأ في الترحيل:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 تم قطع الاتصال بقاعدة البيانات');
  }
}

// تشغيل الترحيل
migrate();
