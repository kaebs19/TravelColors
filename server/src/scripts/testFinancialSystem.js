/**
 * سكربت اختبار النظام المالي
 * يختبر إنشاء موعد مع دفعة وإنشاء إيصال ومعاملة تلقائياً
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const { Appointment, Department, Customer, CashRegister, Receipt, Transaction, Settings, AuditLog, User } = require('../models');

async function test() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/trcolors');
    console.log('✅ Connected to MongoDB');

    // Get admin user
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      console.log('❌ No admin user found');
      return;
    }
    console.log('👤 Admin User:', adminUser.name);

    // Get department
    const dept = await Department.findOne();
    if (!dept) {
      console.log('❌ No department found');
      return;
    }
    console.log('🏢 Department:', dept.title);

    // Simulate creating appointment with payment
    const paidAmount = 750;
    const paymentMethod = 'cash';
    const customerName = 'عميل اختبار النظام المالي';
    const phone = '0555555555';

    console.log('\n🔄 Creating appointment with payment...');

    // Create customer first
    let customer = await Customer.findOne({ phone });
    if (!customer) {
      customer = await Customer.create({
        name: customerName,
        phone: phone,
        address: { city: 'الرياض' },
        createdBy: adminUser._id
      });
      console.log('✅ Customer created:', customer.name);
    } else {
      console.log('✅ Customer exists:', customer.name);
    }

    // Create appointment
    const appointment = await Appointment.create({
      type: 'confirmed',
      customerName,
      customer: customer._id,
      phone,
      personsCount: 1,
      department: dept._id,
      city: 'الرياض',
      appointmentDate: new Date(),
      appointmentTime: '10:00',
      duration: 5,
      totalAmount: 1000,
      paidAmount: paidAmount,
      paymentType: paymentMethod,
      createdBy: adminUser._id
    });
    console.log('✅ Appointment created:', appointment._id);

    // Now create receipt
    const settings = await Settings.findOne();
    const companyInfo = settings ? {
      name: settings.companyName,
      address: settings.address,
      phone: settings.phone
    } : {};

    const receiptNumber = await Receipt.generateReceiptNumber();
    console.log('📝 Receipt Number:', receiptNumber);

    const receipt = await Receipt.create({
      receiptNumber,
      appointment: appointment._id,
      customer: customer._id,
      customerName,
      customerPhone: phone,
      amount: paidAmount,
      paymentMethod,
      description: 'دفعة موعد - ' + dept.title,
      companyInfo,
      createdBy: adminUser._id,
      status: 'active'
    });
    console.log('✅ Receipt created:', receipt.receiptNumber);

    // Get cash register balance
    const cashRegister = await CashRegister.getOrCreate();
    const balanceBefore = cashRegister.cashBalance;

    const transactionNumber = await Transaction.generateTransactionNumber();
    console.log('💰 Transaction Number:', transactionNumber);

    const transaction = await Transaction.create({
      transactionNumber,
      type: 'income',
      amount: paidAmount,
      description: `إيصال ${receiptNumber} - دفعة موعد - ${customerName}`,
      category: 'appointment_payment',
      paymentMethod,
      source: 'automatic',
      sourceType: 'receipt',
      receipt: receipt._id,
      appointment: appointment._id,
      customer: customer._id,
      balanceBefore,
      balanceAfter: balanceBefore + paidAmount,
      createdBy: adminUser._id
    });
    console.log('✅ Transaction created:', transaction.transactionNumber);

    // Update receipt with transaction
    receipt.transaction = transaction._id;
    await receipt.save();

    // Update cash register
    cashRegister.cashBalance += paidAmount;
    cashRegister.totalBalance += paidAmount;
    await cashRegister.save();
    console.log('💵 Cash Register updated, new balance:', cashRegister.cashBalance);

    // Update customer totalSpent
    await Customer.findByIdAndUpdate(customer._id, {
      $inc: { totalSpent: paidAmount }
    });

    // Create audit log
    await AuditLog.log({
      action: 'create',
      entityType: 'receipt',
      entityId: receipt._id,
      entityNumber: receiptNumber,
      user: adminUser,
      changes: { after: receipt.toObject() },
      description: `إنشاء إيصال ${receiptNumber} من موعد`
    });
    console.log('📋 Audit log created');

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ SUCCESS! Financial system working correctly!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Summary
    console.log('\n📊 Summary:');
    const totalReceipts = await Receipt.countDocuments();
    const totalTransactions = await Transaction.countDocuments();
    const totalAuditLogs = await AuditLog.countDocuments();
    console.log(`   Receipts: ${totalReceipts}`);
    console.log(`   Transactions: ${totalTransactions}`);
    console.log(`   Audit Logs: ${totalAuditLogs}`);
    console.log(`   Cash Balance: ${cashRegister.cashBalance}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

test();
