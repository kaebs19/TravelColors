/**
 * Mindee Passport OCR Service
 * يقرأ بيانات جواز السفر من صورة أو PDF باستخدام Mindee API
 */
const mindee = require('mindee');

// إنشاء عميل Mindee
const getClient = () => {
  if (!process.env.MINDEE_API_KEY) {
    throw new Error('MINDEE_API_KEY غير معرّف في ملف .env');
  }
  return new mindee.Client({ apiKey: process.env.MINDEE_API_KEY });
};

/**
 * استخراج بيانات الجواز من ملف
 * @param {string} filePath - المسار الكامل للملف
 * @returns {Object} البيانات المستخرجة
 */
async function parsePassport(filePath) {
  const client = getClient();

  // قراءة الملف من المسار المحلي
  const inputSource = client.docFromPath(filePath);

  // إرسال للتحليل
  const apiResponse = await client.parse(
    mindee.product.PassportV1,
    inputSource
  );

  const prediction = apiResponse.document.inference.prediction;

  // تجميع الأسماء
  const givenNames = prediction.givenNames
    ? prediction.givenNames.map(n => n.value).filter(Boolean).join(' ')
    : '';
  const surname = prediction.surname?.value || '';
  const fullName = [givenNames, surname].filter(Boolean).join(' ');

  // تحويل الجنس
  const genderMap = { M: 'male', F: 'female' };
  const gender = genderMap[prediction.gender?.value] || '';

  // تحويل رمز الدولة لاسم عربي (أشهر الجنسيات)
  const countryMap = {
    SAU: 'سعودي', ARE: 'إماراتي', KWT: 'كويتي', BHR: 'بحريني',
    OMN: 'عماني', QAT: 'قطري', EGY: 'مصري', JOR: 'أردني',
    LBN: 'لبناني', IRQ: 'عراقي', SYR: 'سوري', YEM: 'يمني',
    SDN: 'سوداني', LBY: 'ليبي', TUN: 'تونسي', DZA: 'جزائري',
    MAR: 'مغربي', PSE: 'فلسطيني', USA: 'أمريكي', GBR: 'بريطاني',
    FRA: 'فرنسي', DEU: 'ألماني', IND: 'هندي', PAK: 'باكستاني',
    PHL: 'فلبيني', IDN: 'إندونيسي', BGD: 'بنغلاديشي', TUR: 'تركي',
  };
  const countryCode = prediction.country?.value || '';
  const nationality = countryMap[countryCode] || countryCode;

  // أسماء الدول بالعربية (لحقل الدولة ومكان الإصدار)
  const countryNameMap = {
    SAU: 'المملكة العربية السعودية', ARE: 'الإمارات العربية المتحدة', KWT: 'الكويت',
    BHR: 'البحرين', OMN: 'عُمان', QAT: 'قطر', EGY: 'مصر', JOR: 'الأردن',
    LBN: 'لبنان', IRQ: 'العراق', SYR: 'سوريا', YEM: 'اليمن', SDN: 'السودان',
    LBY: 'ليبيا', TUN: 'تونس', DZA: 'الجزائر', MAR: 'المغرب', PSE: 'فلسطين',
    USA: 'الولايات المتحدة', GBR: 'بريطانيا', FRA: 'فرنسا', DEU: 'ألمانيا',
    IND: 'الهند', PAK: 'باكستان', PHL: 'الفلبين', IDN: 'إندونيسيا',
    BGD: 'بنغلاديش', TUR: 'تركيا',
  };
  const countryName = countryNameMap[countryCode] || countryCode;

  // بناء كائن البيانات
  const extractedData = {
    // بيانات شخصية
    personalInfo: {
      fullName: fullName,
      firstName: givenNames,
      lastName: surname,
      dateOfBirth: prediction.birthDate?.value || '',
      gender: gender,
      nationality: nationality,
      country: countryName,
      countryCode: countryCode,
      birthPlace: prediction.birthPlace?.value || '',
    },
    // بيانات الجواز
    passportDetails: {
      passportNumber: prediction.idNumber?.value || '',
      passportIssueDate: prediction.issuanceDate?.value || '',
      passportExpiryDate: prediction.expiryDate?.value || '',
      passportIssuePlace: countryName, // البلد المصدرة
    },
    // MRZ (للتحقق لاحقاً)
    mrz: {
      line1: prediction.mrz1?.value || '',
      line2: prediction.mrz2?.value || '',
    },
    // درجة الثقة
    confidence: {
      fullName: Math.min(
        ...(prediction.givenNames?.map(n => n.confidence) || [0]),
        prediction.surname?.confidence || 0
      ),
      passportNumber: prediction.idNumber?.confidence || 0,
      dateOfBirth: prediction.birthDate?.confidence || 0,
      expiryDate: prediction.expiryDate?.confidence || 0,
      overall: apiResponse.document.inference.prediction.givenNames?.[0]?.confidence || 0
    }
  };

  return extractedData;
}

module.exports = { parsePassport };
