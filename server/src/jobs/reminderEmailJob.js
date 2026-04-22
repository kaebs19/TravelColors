const Appointment = require('../models/Appointment');
const Note = require('../models/Note');
const sendEmail = require('../utils/sendEmail');

const REMINDER_TYPE_LABELS = {
  call: 'مكالمة',
  meeting: 'اجتماع',
  follow_up: 'متابعة',
  task: 'مهمة',
  other: 'أخرى'
};

// يدمج تاريخ التذكير (Date) مع وقت التذكير ("HH:mm") في Date واحد
const combineReminderDateTime = (dateVal, timeStr) => {
  if (!dateVal) return null;
  const d = new Date(dateVal);
  if (timeStr && /^\d{1,2}:\d{2}$/.test(timeStr)) {
    const [h, m] = timeStr.split(':').map(Number);
    d.setHours(h, m, 0, 0);
  } else {
    d.setHours(9, 0, 0, 0);
  }
  return d;
};

const buildEmailHtml = (appointment, recipientName) => {
  const typeLabel = REMINDER_TYPE_LABELS[appointment.reminderType] || 'تذكير';
  const dateStr = new Date(appointment.reminderDate).toLocaleDateString('ar-SA');
  const timeStr = appointment.reminderTime || '';
  const subTasksHtml = (appointment.subTasks || []).length
    ? `<h3 style="color:#1e40af;margin-top:20px">المهام الفرعية:</h3>
       <ul style="padding-right:20px">
         ${appointment.subTasks.map(t => `<li style="margin:6px 0">${t.completed ? '✅' : '⬜'} ${t.title}</li>`).join('')}
       </ul>`
    : '';
  const notesHtml = appointment.notes
    ? `<p><strong>ملاحظات:</strong> ${appointment.notes}</p>`
    : '';

  return `
    <div dir="rtl" style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f9fafb;border-radius:8px">
      <div style="background:#3b82f6;color:white;padding:16px;border-radius:8px 8px 0 0;text-align:center">
        <h2 style="margin:0">🔔 تذكير: ${typeLabel}</h2>
      </div>
      <div style="background:white;padding:20px;border-radius:0 0 8px 8px;border:1px solid #e5e7eb">
        <p>مرحباً ${recipientName}،</p>
        <p>هذا تذكير بخصوص:</p>
        <div style="background:#f3f4f6;padding:12px;border-radius:6px;border-right:4px solid #3b82f6">
          <p style="margin:4px 0"><strong>العميل:</strong> ${appointment.customerName}</p>
          ${appointment.phone ? `<p style="margin:4px 0"><strong>الجوال:</strong> ${appointment.phone}</p>` : ''}
          <p style="margin:4px 0"><strong>التاريخ:</strong> ${dateStr} ${timeStr}</p>
          <p style="margin:4px 0"><strong>النوع:</strong> ${typeLabel}</p>
        </div>
        ${notesHtml}
        ${subTasksHtml}
        <p style="margin-top:20px;color:#6b7280;font-size:13px">— ألوان المسافر</p>
      </div>
    </div>
  `;
};

const sendOne = async (doc, now) => {
  const fireAt = combineReminderDateTime(doc.reminderDate, doc.reminderTime);
  if (!fireAt || fireAt > now) return false;

  const recipient = doc.createdBy;
  if (!recipient || !recipient.email) {
    console.warn(`[ReminderJob] Skip ${doc._id}: no recipient email`);
    doc.emailNotifiedAt = new Date();
    await doc.save();
    return false;
  }

  try {
    await sendEmail({
      email: recipient.email,
      subject: `🔔 تذكير: ${doc.customerName}`,
      html: buildEmailHtml(doc, recipient.name || '')
    });
    doc.emailNotifiedAt = new Date();
    await doc.save();
    return true;
  } catch (err) {
    console.error(`[ReminderJob] Failed for ${doc._id}:`, err.message);
    return false;
  }
};

const processReminders = async () => {
  const now = new Date();
  try {
    // مسودات المواعيد (Appointment.type='draft')
    const appointments = await Appointment.find({
      type: 'draft',
      reminderEnabled: true,
      emailNotification: true,
      emailNotifiedAt: null,
      isActive: true,
      status: { $nin: ['completed', 'cancelled'] },
      reminderDate: { $ne: null, $lte: now }
    }).populate('createdBy', 'name email');

    // المسودات والتذاكير (Note)
    const notes = await Note.find({
      reminderEnabled: true,
      emailNotification: true,
      emailNotifiedAt: null,
      isActive: true,
      status: { $nin: ['completed', 'cancelled'] },
      reminderDate: { $ne: null, $lte: now }
    }).populate('createdBy', 'name email');

    const candidates = [...appointments, ...notes];
    if (!candidates.length) return { checked: 0, sent: 0 };

    let sent = 0;
    for (const doc of candidates) {
      if (await sendOne(doc, now)) sent++;
    }

    if (sent > 0) {
      console.log(`[ReminderJob] Sent ${sent}/${candidates.length} reminder email(s)`);
    }
    return { checked: candidates.length, sent };
  } catch (err) {
    console.error('[ReminderJob] Fatal error:', err);
    return { checked: 0, sent: 0, error: err.message };
  }
};

let intervalHandle = null;

// يشغّل الفحص الدوري. الفاصل الافتراضي: 5 دقائق
const startReminderJob = (intervalMs = 5 * 60 * 1000) => {
  if (intervalHandle) return intervalHandle;
  console.log(`[ReminderJob] Starting — checks every ${Math.round(intervalMs / 1000)}s`);
  // فحص أول مرة بعد 30 ثانية من بدء السيرفر
  setTimeout(() => processReminders(), 30 * 1000);
  intervalHandle = setInterval(processReminders, intervalMs);
  return intervalHandle;
};

const stopReminderJob = () => {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
};

module.exports = { startReminderJob, stopReminderJob, processReminders };
