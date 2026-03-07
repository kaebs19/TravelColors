const nodemailer = require('nodemailer');

let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 465,
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }
  return transporter;
};

const sendEmail = async (options) => {
  try {
    const transport = getTransporter();

    const mailOptions = {
      from: `${process.env.FROM_NAME || 'ألوان المسافر'} <${process.env.FROM_EMAIL || 'info@trcolors.com'}>`,
      to: options.email,
      subject: options.subject,
      html: options.html
    };

    const info = await transport.sendMail(mailOptions);
    console.log(`[Email] Sent to ${options.email} — ${options.subject} (${info.messageId})`);
    return info;
  } catch (error) {
    console.error(`[Email] Failed to send to ${options.email}:`, error.message);
    throw error;
  }
};

// Helper: fire-and-forget (لا ينتظر الإرسال ولا يوقف الطلب)
const sendEmailSilent = (options) => {
  sendEmail(options).catch(err => {
    console.error(`[Email Silent] Error:`, err.message);
  });
};

module.exports = sendEmail;
module.exports.sendEmailSilent = sendEmailSilent;
