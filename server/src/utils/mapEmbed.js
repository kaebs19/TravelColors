// تحويل أي رابط خرائط Google إلى رابط قابل للتضمين داخل iframe (embed)
// يدعم: رابط embed الجاهز، روابط المشاركة المختصرة (maps.app.goo.gl / goo.gl)،
// وروابط المكان /maps/place/... — ويستخرج الإحداثيات أو اسم المكان لبناء رابط embed صالح.

// استخراج الإحداثيات من رابط خرائط Google بمختلف صيغها
const extractCoords = (url) => {
  // الصيغة !3dLAT!4dLNG (الأدق لموضع الدبوس)
  let m = url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  if (m) return { lat: m[1], lng: m[2] };

  // الصيغة @LAT,LNG (مركز الخريطة)
  m = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (m) return { lat: m[1], lng: m[2] };

  // الصيغة q=LAT,LNG أو query=LAT,LNG
  m = url.match(/[?&](?:q|query)=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (m) return { lat: m[1], lng: m[2] };

  return null;
};

const https = require('https');
const http = require('http');

// متابعة إعادة التوجيه لروابط المشاركة المختصرة للحصول على الرابط الكامل
// نستخدم وحدات Node المدمجة (https/http) لضمان العمل على جميع إصدارات Node
const resolveRedirect = (url, depth = 0) => {
  return new Promise((resolve) => {
    if (depth > 5) return resolve(url);
    try {
      const lib = url.startsWith('http://') ? http : https;
      const req = lib.request(
        url,
        { method: 'GET', headers: { 'User-Agent': 'Mozilla/5.0' } },
        (res) => {
          const { statusCode, headers } = res;
          res.resume(); // تجاهل الجسم
          if (statusCode >= 300 && statusCode < 400 && headers.location) {
            const next = new URL(headers.location, url).toString();
            resolveRedirect(next, depth + 1).then(resolve);
          } else {
            resolve(url);
          }
        }
      );
      req.setTimeout(8000, () => { req.destroy(); resolve(url); });
      req.on('error', () => resolve(url));
      req.end();
    } catch (e) {
      resolve(url);
    }
  });
};

const buildEmbed = (q) => `https://maps.google.com/maps?q=${q}&z=16&hl=ar&output=embed`;

const normalizeMapEmbed = async (input) => {
  if (!input || typeof input !== 'string') return input;

  let url = input.trim();

  // إذا لصق المستخدم وسم iframe كاملاً، نستخرج الـ src منه
  const iframeSrc = url.match(/src=["']([^"']+)["']/i);
  if (iframeSrc) url = iframeSrc[1];

  // رابط embed جاهز بالفعل — نتركه كما هو
  if (/\/maps\/embed/i.test(url) || /[?&]output=embed/i.test(url)) {
    return url;
  }

  // روابط المشاركة المختصرة: نتابع التوجيه للحصول على الرابط الكامل
  if (/(?:maps\.app\.)?goo\.gl/i.test(url)) {
    url = await resolveRedirect(url);
  }

  // استخراج الإحداثيات وبناء رابط embed
  const coords = extractCoords(url);
  if (coords) {
    return buildEmbed(`${coords.lat},${coords.lng}`);
  }

  // كحل بديل: استخدام اسم المكان من رابط /maps/place/...
  const placeMatch = url.match(/\/maps\/place\/([^/@]+)/);
  if (placeMatch) {
    const place = decodeURIComponent(placeMatch[1]).replace(/\+/g, ' ').trim();
    if (place) return buildEmbed(encodeURIComponent(place));
  }

  // لم نتمكن من التحويل — نعيد القيمة كما هي
  return url;
};

module.exports = { normalizeMapEmbed, extractCoords };
