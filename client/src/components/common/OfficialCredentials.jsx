import { useEffect, useState } from 'react';
import { websiteApi } from '../../api';
import { useLang } from '../../i18n/LanguageContext';
import './OfficialCredentials.css';

// قيم احتياطية فقط — المصدر الفعلي هو الإعدادات (لوحة التحكم ← الإعدادات
// ← الإعدادات العامة)، وتصل للموقع ضمن استجابة محتوى الموقع العام.
export const DEFAULT_TOURISM_LICENSE = '73104877';
export const DEFAULT_UNIFIED_NUMBER = '7049580140';
export const SBC_URL = 'https://businesscenter.gov.sa';

/** يقرأ أرقام التسجيل من محتوى الموقع مع السقوط للقيم الافتراضية */
export const getRegistration = (content) => ({
  tourismLicense: content?.registration?.tourismLicense || DEFAULT_TOURISM_LICENSE,
  unifiedNationalNumber: content?.registration?.unifiedNationalNumber || DEFAULT_UNIFIED_NUMBER
});

// طلب واحد مشترك لكل الصفحات التي لا تمرّر المحتوى — يُخزَّن على مستوى
// الوحدة حتى لا يتكرر الطلب مع كل استخدام للمكوّن.
let contentPromise = null;
const fetchContentOnce = () => {
  if (!contentPromise) {
    contentPromise = websiteApi.getPublicContent().catch(() => null);
  }
  return contentPromise;
};

/**
 * سطر التوثيق الرسمي — يظهر في تذييل صفحات الموقع.
 * مرّر `content` إذا كانت الصفحة تحمله أصلاً لتفادي طلب إضافي؛
 * وإلا يجلبه المكوّن بنفسه مرة واحدة.
 * مستقل بأنماطه ليعمل داخل أي تذييل بغضّ النظر عن أصنافه.
 */
const OfficialCredentials = ({ content }) => {
  const { t } = useLang();
  const [fetched, setFetched] = useState(null);

  useEffect(() => {
    if (content?.registration) return undefined;
    let active = true;
    fetchContentOnce().then((res) => {
      if (active && res?.success && res.data) setFetched(res.data);
    });
    return () => { active = false; };
  }, [content]);

  const { tourismLicense, unifiedNationalNumber } = getRegistration(
    content?.registration ? content : fetched
  );

  return (
    <div className="official-credentials">
      <a
        className="official-credentials-logo"
        href={SBC_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t('credentials.sbcAlt')}
      >
        <img
          src="/Saudi_Business_Center.jpeg"
          alt={t('credentials.sbcAlt')}
          width="325"
          height="295"
          loading="lazy"
        />
      </a>
      <div className="official-credentials-body">
        <span className="official-credentials-title">{t('credentials.title')}</span>
        <span className="official-credentials-items">
          {unifiedNationalNumber && (
            <span className="official-credential">
              {t('credentials.unifiedNumber')}
              <b dir="ltr">{unifiedNationalNumber}</b>
            </span>
          )}
          {tourismLicense && (
            <span className="official-credential">
              {t('credentials.tourismLicense')}
              <b dir="ltr">{tourismLicense}</b>
            </span>
          )}
        </span>
      </div>
    </div>
  );
};

export default OfficialCredentials;
