// أصل الخادم — الرفوعات تُقدَّم على /uploads وليس تحت /api.
// في الإنتاج الواجهة والخادم على نفس الأصل، وفي التطوير يختلفان
// (3000 مقابل 5002)، لذا نبنيه من REACT_APP_API_URL بدل window.location.
export const serverOrigin = () =>
  (process.env.REACT_APP_API_URL || 'http://localhost:5002/api').replace(/\/api\/?$/, '');

/**
 * يحوّل مسار ملف مرفوع (مثل "/uploads/logo-1.jpg") إلى رابط كامل.
 * يمرّر الروابط المطلقة كما هي، ويرجع القيمة الاحتياطية عند غياب المسار.
 */
export const assetUrl = (path, fallback = '') => {
  if (!path) return fallback;
  if (/^(https?:)?\/\//.test(path) || path.startsWith('data:')) return path;
  return `${serverOrigin()}${path.startsWith('/') ? path : `/${path}`}`;
};

export default assetUrl;
