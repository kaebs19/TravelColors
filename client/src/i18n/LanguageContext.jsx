import { createContext, useContext, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ar from './ar';
import en from './en';

const DICTIONARIES = { ar, en };

export const LANGUAGES = [
  { code: 'ar', label: 'العربية', short: 'ع', dir: 'rtl' },
  { code: 'en', label: 'English', short: 'EN', dir: 'ltr' }
];

const LanguageContext = createContext(null);

/** يستخرج اللغة من المسار: كل ما يبدأ بـ /en يُعرض بالإنجليزية */
export const langFromPath = (pathname) =>
  /^\/en(\/|$)/.test(pathname) ? 'en' : 'ar';

/** يزيل بادئة اللغة من المسار للحصول على المسار الأساسي */
export const stripLangPrefix = (pathname) => {
  const bare = pathname.replace(/^\/en(?=\/|$)/, '');
  return bare === '' ? '/' : bare;
};

/** يبني مساراً بلغة محددة: ('/visas','en') => '/en/visas' */
export const withLang = (path, lang) => {
  const bare = stripLangPrefix(path.startsWith('/') ? path : `/${path}`);
  if (lang !== 'en') return bare;
  return bare === '/' ? '/en' : `/en${bare}`;
};

/**
 * يقرأ قيمة متداخلة بمسار نقطي مع تجاهل المفاتيح الناقصة:
 * get(dict, 'nav.home') => dict.nav.home
 */
const get = (obj, path) =>
  path.split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);

export const LanguageProvider = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const lang = langFromPath(location.pathname);
  const dir = lang === 'en' ? 'ltr' : 'rtl';

  /**
   * t('nav.home') — يرجع نص اللغة الحالية.
   * يسقط إلى العربية ثم إلى المفتاح نفسه إذا لم تتوفر الترجمة،
   * حتى لا تختفي النصوص عند نقص مفتاح.
   */
  const t = useCallback(
    (key, vars) => {
      let value = get(DICTIONARIES[lang], key);
      if (value === undefined) value = get(DICTIONARIES.ar, key);
      if (value === undefined) return key;
      if (typeof value === 'string' && vars) {
        return value.replace(/\{(\w+)\}/g, (m, name) =>
          vars[name] !== undefined ? vars[name] : m
        );
      }
      return value;
    },
    [lang]
  );

  /**
   * يختار الحقل الإنجليزي من محتوى قاعدة البيانات مع السقوط للعربي.
   * يُستخدم للمحتوى الذي يكتبه المسؤول ولا توجد له ترجمة في الكود
   * (الخدمات، الأسئلة، آراء العملاء) — عرض العربي أفضل من فراغ.
   */
  const pick = useCallback(
    (source, field) => {
      if (!source) return '';
      if (lang === 'en') {
        const enValue = source[`${field}En`];
        if (enValue !== undefined && enValue !== null && enValue !== '') return enValue;
      }
      return source[field] ?? '';
    },
    [lang]
  );

  /**
   * مثل pick لكن بلا سقوط للعربي في الوضع الإنجليزي — يرجع '' إذا لم
   * يوجد حقل En. يُستخدم للحقول التي لها ترجمة جاهزة في الكود، ليأخذ
   * `|| t('...')` مكانها بدل عرض النص العربي.
   */
  const pickStrict = useCallback(
    (source, field) => {
      if (!source) return '';
      if (lang === 'en') return source[`${field}En`] || '';
      return source[field] ?? '';
    },
    [lang]
  );

  /** يحوّل أي مسار داخلي إلى مسار اللغة الحالية */
  const localePath = useCallback((path) => withLang(path, lang), [lang]);

  /** يبدّل اللغة مع البقاء في نفس الصفحة */
  const switchLang = useCallback(
    (nextLang) => {
      if (nextLang === lang) return;
      navigate(withLang(location.pathname, nextLang) + location.search, { replace: false });
    },
    [lang, location.pathname, location.search, navigate]
  );

  const value = useMemo(
    () => ({ lang, dir, isEn: lang === 'en', t, pick, pickStrict, localePath, switchLang }),
    [lang, dir, t, pick, pickStrict, localePath, switchLang]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLang = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLang must be used within a LanguageProvider');
  }
  return ctx;
};

export default LanguageContext;
