import { useLang, LANGUAGES } from './LanguageContext';
import './LanguageSwitcher.css';

/**
 * زر تبديل اللغة — يبقى في نفس الصفحة ويغيّر البادئة فقط.
 * variant="dark" للاستخدام فوق خلفية داكنة (الشريط العلوي والتذييل).
 */
const LanguageSwitcher = ({ variant = 'light', className = '' }) => {
  const { lang, switchLang } = useLang();

  return (
    <div
      className={`lang-switcher lang-switcher-${variant} ${className}`.trim()}
      role="group"
      aria-label={lang === 'en' ? 'Language' : 'اللغة'}
    >
      {LANGUAGES.map((option) => (
        <button
          key={option.code}
          type="button"
          className={`lang-switcher-btn ${option.code === lang ? 'active' : ''}`}
          onClick={() => switchLang(option.code)}
          aria-current={option.code === lang ? 'true' : undefined}
          lang={option.code}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};

export default LanguageSwitcher;
