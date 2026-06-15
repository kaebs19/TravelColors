/**
 * Mindee Passport OCR Service (Mindee V2 API)
 * يقرأ بيانات جواز السفر من صورة أو PDF باستخدام Mindee V2 (نموذج عبر modelId)
 *
 * متطلبات البيئة:
 *   MINDEE_API_KEY   مفتاح Mindee (يبدأ بـ md_)
 *   MINDEE_MODEL_ID  معرّف النموذج في منصة Mindee
 */
const mindee = require('mindee');

// إنشاء عميل Mindee
const getClient = () => {
  if (!process.env.MINDEE_API_KEY) {
    throw new Error('MINDEE_API_KEY غير معرّف في ملف .env');
  }
  if (!process.env.MINDEE_MODEL_ID) {
    throw new Error('MINDEE_MODEL_ID غير معرّف في ملف .env');
  }
  return new mindee.Client({ apiKey: process.env.MINDEE_API_KEY });
};

// تحويل حاوية الحقول (Map أو كائن) إلى مصفوفة [اسم, حقل]
const fieldEntries = (container) => {
  if (!container) return [];
  if (typeof container.entries === 'function') return [...container.entries()];
  return Object.entries(container);
};

// تجميع كل الحقول البسيطة (مع الحقول المتداخلة) في كائن مسطّح: اسم مُطبّع → قيمة
const collectSimpleFields = (container, out) => {
  for (const [name, field] of fieldEntries(container)) {
    if (!field || typeof name !== 'string') continue;
    const v = field.value;
    if (v !== undefined && v !== null && (typeof v !== 'object' || v instanceof Date)) {
      out[name.toLowerCase().replace(/[_\s-]/g, '')] = v;
    }
    // حقول كائن متداخلة
    if (field.fields) collectSimpleFields(field.fields, out);
    // عناصر قوائم
    if (Array.isArray(field.items)) {
      field.items.forEach(item => { if (item && item.fields) collectSimpleFields(item.fields, out); });
    }
  }
};

// تطبيع التاريخ إلى YYYY-MM-DD
const normalizeDate = (v) => {
  if (!v) return '';
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  const s = String(v).trim();
  return s.length >= 10 ? s.slice(0, 10) : s;
};

const countryMap = {
  SAU: 'سعودي', ARE: 'إماراتي', KWT: 'كويتي', BHR: 'بحريني',
  OMN: 'عماني', QAT: 'قطري', EGY: 'مصري', JOR: 'أردني',
  LBN: 'لبناني', IRQ: 'عراقي', SYR: 'سوري', YEM: 'يمني',
  SDN: 'سوداني', LBY: 'ليبي', TUN: 'تونسي', DZA: 'جزائري',
  MAR: 'مغربي', PSE: 'فلسطيني', USA: 'أمريكي', GBR: 'بريطاني',
  FRA: 'فرنسي', DEU: 'ألماني', IND: 'هندي', PAK: 'باكستاني',
  PHL: 'فلبيني', IDN: 'إندونيسي', BGD: 'بنغلاديشي', TUR: 'تركي',
};

const countryNameMap = {
  SAU: 'المملكة العربية السعودية', ARE: 'الإمارات العربية المتحدة', KWT: 'الكويت',
  BHR: 'البحرين', OMN: 'عُمان', QAT: 'قطر', EGY: 'مصر', JOR: 'الأردن',
  LBN: 'لبنان', IRQ: 'العراق', SYR: 'سوريا', YEM: 'اليمن', SDN: 'السودان',
  LBY: 'ليبيا', TUN: 'تونس', DZA: 'الجزائر', MAR: 'المغرب', PSE: 'فلسطين',
  USA: 'الولايات المتحدة', GBR: 'بريطانيا', FRA: 'فرنسا', DEU: 'ألمانيا',
  IND: 'الهند', PAK: 'باكستان', PHL: 'الفلبين', IDN: 'إندونيسيا',
  BGD: 'بنغلاديش', TUR: 'تركيا',
};

// هل القيمة رمز دولة من 3 أحرف؟
const isCode = (s) => typeof s === 'string' && /^[A-Z]{3}$/.test(s.trim());
const toNationality = (v) => (isCode(v) ? (countryMap[v] || v) : (v || ''));
const toCountryName = (v) => (isCode(v) ? (countryNameMap[v] || v) : (v || ''));

/**
 * استخراج بيانات الجواز من ملف عبر Mindee V2
 * @param {string} filePath - المسار الكامل للملف
 * @returns {Object} البيانات المستخرجة
 */
async function parsePassport(filePath) {
  const client = getClient();
  const inputSource = new mindee.PathInput({ inputPath: filePath });

  // منتج الاستخراج العام لـ V2
  const Product = mindee.product.Extraction;
  if (!Product) {
    throw new Error('mindee.product.Extraction غير متاح — المنتجات المتاحة: ' + Object.keys(mindee.product || {}).join(', '));
  }

  const response = await client.enqueueAndGetResult(
    Product,
    inputSource,
    { modelId: process.env.MINDEE_MODEL_ID }
  );

  // بنية V2: response.inference.result.fields
  const result = response?.inference?.result || response?.document?.inference?.result;
  const fields = result?.fields;

  const flat = {};
  collectSimpleFields(fields, flat);
  // مفيد لتشخيص أسماء الحقول في سجل السيرفر إن لم تُطابَق
  console.log('Mindee V2 detected fields:', Object.keys(flat));

  // اختيار أول حقل يحتوي اسمه (بعد التطبيع) على إحدى الكلمات المفتاحية
  const pick = (...keywords) => {
    for (const key of Object.keys(flat)) {
      if (keywords.some(k => key.includes(k))) return flat[key];
    }
    return '';
  };

  const surname = pick('surname', 'lastname', 'familyname');
  const given = pick('givennames', 'givenname', 'firstname', 'forename');
  const explicitFull = pick('fullname', 'holdername');
  const fullName = explicitFull || [given, surname].filter(Boolean).join(' ');

  const nationalityRaw = pick('nationality');
  const countryRaw = pick('countryofissue', 'issuingcountry', 'issuingstate', 'country');

  const extractedData = {
    personalInfo: {
      fullName: fullName,
      firstName: given,
      lastName: surname,
      dateOfBirth: normalizeDate(pick('dateofbirth', 'birthdate', 'dob')),
      gender: ({ M: 'male', F: 'female' })[pick('gender', 'sex')] || '',
      nationality: toNationality(nationalityRaw) || toNationality(countryRaw),
      country: toCountryName(countryRaw),
      birthPlace: pick('placeofbirth', 'birthplace'),
    },
    passportDetails: {
      passportNumber: pick('passportnumber', 'documentnumber', 'idnumber'),
      passportIssueDate: normalizeDate(pick('dateofissue', 'issuedate', 'issuancedate')),
      passportExpiryDate: normalizeDate(pick('dateofexpiry', 'expirydate', 'expirationdate', 'expiry')),
      passportIssuePlace: toCountryName(countryRaw),
    },
  };

  return extractedData;
}

module.exports = { parsePassport };
