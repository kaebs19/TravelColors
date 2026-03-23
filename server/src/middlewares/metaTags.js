const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// مسار ملف index.html المبني
const SPA_INDEX_PATH = process.env.SPA_INDEX_PATH || path.join(__dirname, '../../../client/build/index.html');

// كاش لملف HTML
let cachedHtml = null;
let cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 دقائق

const getBaseHtml = () => {
  const now = Date.now();
  if (cachedHtml && (now - cacheTime) < CACHE_TTL) return cachedHtml;
  try {
    cachedHtml = fs.readFileSync(SPA_INDEX_PATH, 'utf8');
    cacheTime = now;
    return cachedHtml;
  } catch (err) {
    console.error('Meta tags: Could not read index.html from', SPA_INDEX_PATH);
    return null;
  }
};

// القيم الافتراضية
const DEFAULTS = {
  title: 'ألوان المسافر للسفر والسياحة',
  description: 'ألوان المسافر - شركة سياحية مرخصة متخصصة في استخراج التأشيرات وحجوزات الطيران والفنادق والبرامج السياحية',
  image: '/logo512.png',
  siteName: 'ألوان المسافر'
};

// خريطة الصفحات الثابتة
const STATIC_PAGES = {
  '/': {
    title: 'ألوان المسافر للسفر والسياحة',
    description: 'شركة سياحية مرخصة متخصصة في استخراج التأشيرات وحجوزات الطيران والفنادق والبرامج السياحية'
  },
  '/us-visa': {
    title: 'التأشيرة الأمريكية - ألوان المسافر',
    description: 'خدمات استخراج التأشيرة الأمريكية - سياحية، علاج، دراسة. جميع المتطلبات والمستندات المطلوبة للحصول على تأشيرتك'
  },
  '/international-license': {
    title: 'الرخصة الدولية - ألوان المسافر',
    description: 'خدمة استخراج رخصة القيادة الدولية بسهولة وسرعة من خلال ألوان المسافر'
  },
  '/visas': {
    title: 'التأشيرات المتاحة - ألوان المسافر',
    description: 'تصفح جميع التأشيرات المتاحة واختر وجهتك القادمة مع ألوان المسافر'
  },
  '/ContactUs': {
    title: 'تواصل معنا - ألوان المسافر',
    description: 'تواصل مع فريق ألوان المسافر للسفر والسياحة للاستفسارات والحجوزات'
  },
  '/privacy': {
    title: 'سياسة الخصوصية - ألوان المسافر',
    description: 'سياسة الخصوصية وحماية البيانات لشركة ألوان المسافر'
  },
  '/terms': {
    title: 'الشروط والأحكام - ألوان المسافر',
    description: 'الشروط والأحكام الخاصة بخدمات شركة ألوان المسافر للسفر والسياحة'
  }
};

// جلب بيانات التأشيرة من DB للصفحات الديناميكية
const getVisaMeta = async (slug) => {
  try {
    const Visa = mongoose.model('Visa');
    const visa = await Visa.findOne({ slug, isActive: true }).select('metaTitle metaDescription countryName coverImage').lean();
    if (!visa) return null;

    const API_URL = process.env.API_PUBLIC_URL || 'https://new.trcolors.com';
    return {
      title: visa.metaTitle || `${visa.countryName} - ألوان المسافر`,
      description: visa.metaDescription || `خدمات تأشيرة ${visa.countryName} من ألوان المسافر`,
      image: visa.coverImage ? `${API_URL}${visa.coverImage}` : ''
    };
  } catch (err) {
    return null;
  }
};

// حقن meta tags في HTML
const injectMeta = (html, meta, fullUrl) => {
  const title = meta.title || DEFAULTS.title;
  const description = meta.description || DEFAULTS.description;
  const rawImage = meta.image || DEFAULTS.image;

  // تحويل المسار النسبي لرابط كامل
  const baseUrl = fullUrl.split('/').slice(0, 3).join('/'); // https://www.trcolors.com
  const image = rawImage.startsWith('http') ? rawImage : `${baseUrl}${rawImage}`;

  // استبدال القيم الافتراضية بالقيم الديناميكية
  return html
    .replace(/ألوان المسافر للسفر والسياحة/g, title)
    .replace(/شركة سياحية مرخصة متخصصة في استخراج التأشيرات وحجوزات الطيران والفنادق والبرامج السياحية/g, description)
    .replace(/content="\/logo512\.png"/g, `content="${image}"`)
    .replace(/content=""/g, `content="${fullUrl}"`);
};

// Middleware الرئيسي
const serveWithMeta = async (req, res) => {
  const html = getBaseHtml();
  if (!html) {
    return res.status(500).send('Server Error');
  }

  const urlPath = req.path;
  const fullUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;

  let meta = null;

  // صفحات ثابتة
  if (STATIC_PAGES[urlPath]) {
    meta = STATIC_PAGES[urlPath];
  }
  // صفحات التأشيرات الديناميكية /visas/:slug
  else if (urlPath.startsWith('/visas/') && urlPath.split('/').length === 3) {
    const slug = urlPath.split('/')[2];
    meta = await getVisaMeta(slug);
  }

  // القيم الافتراضية
  if (!meta) {
    meta = { title: DEFAULTS.title, description: DEFAULTS.description };
  }

  const result = injectMeta(html, meta, fullUrl);
  res.set('Content-Type', 'text/html');
  res.send(result);
};

module.exports = { serveWithMeta };
