/**
 * سكربت لإصلاح المواعيد القديمة التي لم يتم إنشاء إيصالات لها
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const { Appointment, Department, Customer, CashRegister, Receipt, Transaction, AuditLog, User } = require('../models');

async function fixOldAppointments() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/trcolors');
    console.log('✅ Connected to MongoDB');

    // Find all appointments with paidAmount > 0 but no receipt
    const appointments = await Appointment.find({ paidAmount: { $gt: 0 } });
    console.log(`📋 Found ${appointments.length} appointments with payments`);

    const admin = await User.findOne({ role: 'admin' });

    let fixed = 0;
    let skipped = 0;

    for (const appointment of appointments) {
      // Check if receipt already exists
      const existingReceipt = await Receipt.findOne({ appointment: appointment._id });
      if (existingReceipt) {
        console.log(`⏭️ Skipping ${appointment.customerName} - receipt exists: ${existingReceipt.receiptNumber}`);
        skipped++;
        continue;
      }

      console.log(`\n🔄 Fixing appointment for: ${appointment.customerName}`);
      console.log(`   Amount: ${appointment.paidAmount}`);

      const dept = await Department.findById(appointment.department);

      // Create receipt
      const receiptNumber = await Receipt.generateReceiptNumber();
      const receipt = await Receipt.create({
        receiptNumber,
        appointment: appointment._id,
        customer: appointment.customer,
        customerName: appointment.customerName,
        customerPhone: appointment.phone || '',
        amount: appointment.paidAmount,
        paymentMethod: appointment.paymentType || 'cash',
        description: 'دفعة موعد - ' + (dept ? dept.title : ''),
        createdBy: admin._id,
        status: 'active',
        createdAt: appointment.createdAt // Use original date
      });
      console.log(`   ✅ Receipt created: ${receiptNumber}`);

      // Get balance
      const cashRegister = await CashRegister.getOrCreate();
      const paymentMethod = appointment.paymentType || 'cash';
      const balanceBefore = paymentMethod === 'cash' ? cashRegister.cashBalance :
                           paymentMethod === 'card' ? cashRegister.cardBalance :
                           cashRegister.transferBalance;

      // Create transaction
      const transactionNumber = await Transaction.generateTransactionNumber();
      const transaction = await Transaction.create({
        transactionNumber,
        type: 'income',
        amount: appointment.paidAmount,
        description: `إيصال ${receiptNumber} - دفعة موعد - ${appointment.customerName}`,
        category: 'appointment_payment',
        paymentMethod,
        source: 'automatic',
        sourceType: 'receipt',
        receipt: receipt._id,
        appointment: appointment._id,
        customer: appointment.customer,
        balanceBefore,
        balanceAfter: balanceBefore + appointment.paidAmount,
        createdBy: admin._id,
        createdAt: appointment.createdAt // Use original date
      });
      console.log(`   ✅ Transaction created: ${transactionNumber}`);

      // Update receipt with transaction
      receipt.transaction = transaction._id;
      await receipt.save();

      // Update cash register balance
      if (paymentMethod === 'cash') {
        cashRegister.cashBalance += appointment.paidAmount;
      } else if (paymentMethod === 'card') {
        cashRegister.cardBalance += appointment.paidAmount;
      } else {
        cashRegister.transferBalance += appointment.paidAmount;
      }
      cashRegister.totalBalance += appointment.paidAmount;
      await cashRegister.save();

      // Audit log
      await AuditLog.log({
        action: 'create',
        entityType: 'receipt',
        entityId: receipt._id,
        entityNumber: receiptNumber,
        user: admin,
        changes: { after: receipt.toObject() },
        description: `إصلاح موعد قديم - إنشاء إيصال ${receiptNumber}`
      });

      fixed++;
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Summary:');
    console.log(`   Fixed: ${fixed}`);
    console.log(`   Skipped (already had receipt): ${skipped}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

fixOldAppointments();
