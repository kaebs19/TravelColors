const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

let auth = null;
let sheetsApi = null;

const initGoogleAuth = async () => {
  try {
    // مسار ملف بيانات الاعتماد - يدعم أسماء متعددة
    let credentialsPath = path.join(__dirname, 'google-credentials.json');

    // التحقق من الأسماء البديلة
    if (!fs.existsSync(credentialsPath)) {
      credentialsPath = path.join(__dirname, 'trevel-colors-ffcb3409c315.json');
    }
    if (!fs.existsSync(credentialsPath)) {
      credentialsPath = path.join(__dirname, '../../google-credentials.json');
    }

    // التحقق من وجود الملف
    if (!fs.existsSync(credentialsPath)) {
      console.log('Google credentials file not found. Google Sheets sync disabled.');
      return null;
    }

    // قراءة بيانات الاعتماد
    console.log('Loading credentials from:', credentialsPath);
    const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
    console.log('Credentials loaded for:', credentials.client_email);

    // إنشاء JWT auth
    auth = new google.auth.JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    // اختبار الاتصال
    await auth.authorize();
    console.log('Google Sheets API authenticated successfully');

    // إنشاء Sheets API instance
    sheetsApi = google.sheets({ version: 'v4', auth });

    return sheetsApi;
  } catch (error) {
    console.error('Error initializing Google Auth:', error.message);
    return null;
  }
};

const getSheetsApi = () => sheetsApi;

const isGoogleSheetsEnabled = () => {
  return process.env.GOOGLE_SHEETS_ENABLED === 'true' && sheetsApi !== null;
};

module.exports = {
  initGoogleAuth,
  getSheetsApi,
  isGoogleSheetsEnabled
};
