import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { LanguageProvider, useLang } from './LanguageContext';

/**
 * يزامن lang/dir على عنصر <html> مع لغة الصفحة الحالية،
 * ويعيدهما للعربية عند مغادرة صفحات الموقع العام (لوحة التحكم وبوابة
 * العملاء عربية دائماً).
 */
const DocumentLangSync = () => {
  const { lang, dir } = useLang();

  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute('lang', lang);
    html.setAttribute('dir', dir);
    return () => {
      html.setAttribute('lang', 'ar');
      html.setAttribute('dir', 'rtl');
    };
  }, [lang, dir]);

  return null;
};

/** غلاف صفحات الموقع العام — يوفّر سياق اللغة لكل الصفحات تحته */
const PublicLayout = () => (
  <LanguageProvider>
    <DocumentLangSync />
    <Outlet />
  </LanguageProvider>
);

export default PublicLayout;
