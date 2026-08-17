import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { websiteApi } from '../../api';
import DeveloperCredit from '../../components/common/DeveloperCredit';
import { getRegistration, SBC_URL } from '../../components/common/OfficialCredentials';
import visaCatalogApi from '../../api/visaCatalogApi';
import { useClientAuth } from '../../context/ClientAuthContext';
import { getIconSvg } from '../../utils/icons';
import { useLang } from '../../i18n/LanguageContext';
import LanguageSwitcher from '../../i18n/LanguageSwitcher';
import '../../styles/public-shared.css';
import './Home.css';

const DEFAULT_CONTENT = {
  hero: {
    title: 'دعنا نسافر مع ألوان السفر',
    subtitle: 'شركة سياحية مرخصة',
    description: 'خدمات تأشيرات احترافية، رحلات مخصصة، وتجارب سفر لا تُنسى',
    backgroundImage: ''
  },
  services: [
    { title: 'تأشيرات سفر', description: 'استخراج تأشيرات الشنقن وجميع الدول بسرعة واحترافية', icon: '📋' },
    { title: 'حجوزات طيران', description: 'أفضل أسعار تذاكر الطيران على جميع الخطوط', icon: '✈️' },
    { title: 'حجوزات فنادق', description: 'حجز فنادق حول العالم بأسعار تنافسية', icon: '🏨' },
    { title: 'برامج سياحية', description: 'رحلات مخصصة وبرامج شهر عسل مميزة', icon: '🌍' },
    { title: 'تأمين سفر', description: 'تأمين شامل لرحلتك وراحة بالك', icon: '🛡️' },
    { title: 'رخص دولية', description: 'استخراج رخص القيادة الدولية', icon: '🪪' }
  ],
  aboutUs: {
    title: 'من نحن',
    description: 'شركة ألوان السفر متخصصون في استخراج تأشيرة الشنقن في وقت قصير. حجز طيران - حجوزات فندقيه حول العالم - برامج شهر العسل للعرسان - رخص دولية / مرخص من هيئة السياحة رقم : 73104877',
    features: [
      { title: 'خبرة واسعة', description: 'سنوات من الخبرة في مجال السياحة والسفر', icon: '⭐' },
      { title: 'أسعار تنافسية', description: 'نقدم أفضل الأسعار مع جودة عالية', icon: '💰' },
      { title: 'دعم متواصل', description: 'فريق دعم متاح لمساعدتك في أي وقت', icon: '💬' },
      { title: 'مرخصة رسمياً', description: 'مرخصة من هيئة السياحة السعودية', icon: '✅' }
    ]
  },
  faq: [
    { question: 'كم يستغرق استخراج تأشيرة الشنقن؟', answer: 'عادة تستغرق من 5 إلى 15 يوم عمل حسب السفارة والموسم.' },
    { question: 'ما هي المستندات المطلوبة للتأشيرة؟', answer: 'جواز سفر ساري، صور شخصية، كشف حساب بنكي، تأمين سفر، وحجز فندق وطيران.' },
    { question: 'هل يمكن إلغاء الحجز واسترداد المبلغ؟', answer: 'نعم، حسب سياسة الإلغاء الخاصة بكل خدمة. رسوم التأشيرة غير قابلة للاسترداد بعد التقديم.' },
    { question: 'هل تقدمون خدمات لجميع مدن المملكة؟', answer: 'نعم، نخدم عملاءنا في جميع مدن المملكة مع توفير مواعيد في الرياض وجدة والدمام.' }
  ],
  contact: {
    phone: '+966 55 874 1741',
    email: 'info@trcolors.com',
    whatsapp: '966558741741',
    address: 'شارع الأمير ناصر بن سعود بن فرحان آل سعود، الصحافة، الرياض 13321'
  },
  socialMedia: { twitter: '', instagram: '', facebook: '', snapchat: '' },
  footer: { copyrightText: '© {year} Travel Colors - ألوان السفر. جميع الحقوق محفوظة' },
  general: { siteName: 'ألوان السفر', siteNameEn: 'Travel Colors', siteDescription: '', logo: '' }
};

// شعار العلامة — يُستخدم كبديل عند عدم رفع شعار من لوحة التحكم
const BrandMark = ({ size = 40 }) => (
  <svg className="brand-mark" width={size} height={size} viewBox="0 0 200 200" aria-hidden="true">
    <g transform="translate(100 100) rotate(45)">
      <rect x="-74" y="-74" width="66" height="66" rx="8" fill="#3BC177" />
      <rect x="8" y="-74" width="66" height="66" rx="8" fill="#2E7EB3" />
      <rect x="-74" y="8" width="66" height="66" rx="8" fill="#2EC4FF" />
      <rect x="8" y="8" width="66" height="66" rx="8" fill="#1F5C85" />
      <g transform="translate(41 41) scale(0.56) translate(-50 -50)">
        <path d="M50 6 L56 30 L94 54 L94 62 L56 51 L54 76 L69 88 L69 94 L50 87 L31 94 L31 88 L46 76 L44 51 L6 62 L6 54 L44 30 Z" fill="#fff" />
      </g>
    </g>
  </svg>
);

const Home = () => {
  const [content, setContent] = useState(DEFAULT_CONTENT);
  const [openFaq, setOpenFaq] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [statsVisible, setStatsVisible] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [visas, setVisas] = useState([]);
  const sectionsRef = useRef({});
  const statsRef = useRef(null);
  const userMenuRef = useRef(null);
  const navigate = useNavigate();
  const { client, isAuthenticated, logout } = useClientAuth();
  const { t, pick, pickStrict, dir, localePath, isEn } = useLang();
  const registration = getRegistration(content);

  useEffect(() => {
    const loadContent = async () => {
      try {
        const res = await websiteApi.getPublicContent();
        if (res.success && res.data) {
          setContent(prev => ({ ...prev, ...res.data }));
        }
      } catch (err) {
        // استخدام المحتوى الافتراضي
      }
    };
    loadContent();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadVisas = async (attempt = 1) => {
      try {
        const res = await visaCatalogApi.getPublicVisas();
        if (!cancelled && res.success) {
          setVisas((res.data?.visas || res.data) || []);
        }
      } catch (err) {
        console.warn(`[Home] Visa load attempt ${attempt} failed:`, err.message);
        if (!cancelled && attempt < 3) {
          await new Promise(r => setTimeout(r, attempt * 1500));
          return loadVisas(attempt + 1);
        }
      }
    };
    loadVisas();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    handleScroll(); // ضبط الحالة عند التحميل على موضع مُمرَّر مسبقاً
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // منع تمرير الخلفية أثناء فتح قائمة الجوال
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  // إغلاق القائمة المنسدلة عند الضغط خارجها
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scroll animations — يستخدم data-visible بدل className لتجنب تعارض مع React
  // React يعيد كتابة className عند إعادة الرسم لكن لا يمس data attributes اليدوية
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.setAttribute('data-visible', '');
            observer.unobserve(entry.target); // تحسين الأداء — مرة واحدة فقط
          }
        });
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll('.animate-on-scroll:not([data-visible])').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [content, visas]);

  // Stats counter animation
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setStatsVisible(true);
    }, { threshold: 0.3 });
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  const scrollTo = (sectionId) => {
    setMobileMenuOpen(false);
    const el = sectionsRef.current[sectionId];
    if (el) {
      const offset = 80;
      const top = el.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';
  const baseUrl = apiUrl.replace('/api', '');

  const getImageUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${baseUrl}${path}`;
  };

  // اسم الدولة باللغة الحالية (Visa يحمل countryNameEn)، بلا بادئة "التأشيرة"
  const visaName = (visa) => (pick(visa, 'countryName') || '').replace(/^التأشيرة\s*/i, '');

  const whatsappLink = content.contact?.whatsapp
    ? `https://wa.me/${content.contact.whatsapp}`
    : '#';

  // بالإنجليزية نتجاهل النص المخزّن (عربي) ونستخدم الترجمة
  const footerText = (isEn
    ? t('footer.copyright')
    : (content.footer?.copyrightText || DEFAULT_CONTENT.footer.copyrightText)
  ).replace('{year}', new Date().getFullYear());

  const navLinks = [
    { id: 'home', label: t('nav.home') },
    { id: 'visas', label: t('nav.visas'), href: '/visas' },
    { id: 'us-visa', label: t('nav.usVisa'), href: '/us-visa' },
    { id: 'services', label: t('nav.services') },
    { id: 'contact', label: t('nav.contact'), href: '/ContactUs' }
  ];

  return (
    <div className="website" dir={dir}>
      {/* Header */}
      <header className={`site-header ${scrolled ? 'scrolled' : ''}`}>
        {/* شريط علوي — بيانات التواصل والتوثيق */}
        <div className="topbar">
          <div className="topbar-inner">
            <div className="topbar-group">
              {content.contact?.phone && (
                <a className="topbar-item" href={whatsappLink} target="_blank" rel="noopener noreferrer">
                  {getIconSvg('📞', 14)}
                  <span dir="ltr">{content.contact.phone}</span>
                </a>
              )}
              {content.contact?.email && (
                <a className="topbar-item" href={`mailto:${content.contact.email}`}>
                  {getIconSvg('✉️', 14)}
                  <span dir="ltr">{content.contact.email}</span>
                </a>
              )}
            </div>
            <div className="topbar-group">
              <LanguageSwitcher variant="dark" />
              <span className="topbar-badge">
                {getIconSvg('✅', 13)}
                {t('topbar.licensed')} · {registration.tourismLicense}
              </span>
              {(content.socialMedia?.twitter || content.socialMedia?.instagram || content.socialMedia?.facebook) && (
                <div className="topbar-social">
                  {content.socialMedia?.twitter && <a href={content.socialMedia.twitter} target="_blank" rel="noopener noreferrer" aria-label="X">𝕏</a>}
                  {content.socialMedia?.instagram && <a href={content.socialMedia.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram">{getIconSvg('📷', 14)}</a>}
                  {content.socialMedia?.facebook && <a href={content.socialMedia.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook">f</a>}
                </div>
              )}
            </div>
          </div>
        </div>

        <nav className="site-nav">
        <div className="nav-container">
          <div className="nav-brand" onClick={() => scrollTo('home')}>
            {content.general?.logo ? (
              <img src={getImageUrl(content.general.logo)} alt={content.general?.siteName} className="nav-logo-img" width="140" height="44" />
            ) : (
              <>
                <BrandMark size={42} />
                <div className="nav-logo-text">
                  <span className="nav-logo-ar" lang={isEn ? 'en' : 'ar'}>
                    {isEn
                      ? (content.general?.siteNameEn || 'Travel Colors')
                      : (content.general?.siteName || 'ألوان السفر')}
                  </span>
                  <span className="nav-logo-en" lang={isEn ? 'ar' : 'en'}>
                    {isEn
                      ? (content.general?.siteName || 'ألوان السفر')
                      : (content.general?.siteNameEn || 'Travel Colors')}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* طبقة تعتيم خلف قائمة الجوال */}
          <div
            className={`nav-overlay ${mobileMenuOpen ? 'open' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          <div className={`nav-links ${mobileMenuOpen ? 'open' : ''}`}>
            {navLinks.map(link => (
              <button key={link.id} className="nav-link" onClick={() => {
                if (link.href) {
                  setMobileMenuOpen(false);
                  navigate(localePath(link.href));
                } else {
                  scrollTo(link.id);
                }
              }}>
                {link.label}
              </button>
            ))}
            <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="nav-whatsapp">
              {t('common.whatsapp')}
            </a>
            <LanguageSwitcher variant="light" className="nav-lang" />

            {/* Auth — Mobile: يظهر داخل القائمة */}
            <div className="nav-auth-mobile">
              {isAuthenticated ? (
                <>
                  <button className="nav-link" onClick={() => { setMobileMenuOpen(false); navigate('/portal/dashboard'); }}>
                    {t('common.dashboard')}
                  </button>
                  <button className="nav-link nav-logout-mobile" onClick={() => { setMobileMenuOpen(false); logout(); }}>
                    {t('common.logout')}
                  </button>
                </>
              ) : (
                <>
                  <button className="nav-link" onClick={() => { setMobileMenuOpen(false); navigate('/portal/login'); }}>
                    {t('common.login')}
                  </button>
                  <button className="nav-auth-register-mobile" onClick={() => { setMobileMenuOpen(false); navigate('/portal/login?tab=register'); }}>
                    {t('common.register')}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Auth — Desktop */}
          <div className="nav-auth-desktop">
            {isAuthenticated ? (
              <div className="nav-user" ref={userMenuRef}>
                <button className="nav-user-btn" onClick={() => setUserMenuOpen(!userMenuOpen)}>
                  <span className="nav-user-avatar">{client?.name?.charAt(0)}</span>
                  <span className="nav-user-name">{client?.name}</span>
                  <svg className={`nav-user-arrow ${userMenuOpen ? 'open' : ''}`} width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                {userMenuOpen && (
                  <div className="nav-user-dropdown">
                    <button className="nav-user-dropdown-item" onClick={() => { setUserMenuOpen(false); navigate('/portal/dashboard'); }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
                      {t('common.dashboard')}
                    </button>
                    <button className="nav-user-dropdown-item logout" onClick={() => { setUserMenuOpen(false); logout(); }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                      {t('common.logout')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="nav-auth-buttons">
                <button className="nav-login-btn" onClick={() => navigate('/portal/login')}>
                  {t('common.login')}
                </button>
                <button className="nav-register-btn" onClick={() => navigate('/portal/login?tab=register')}>
                  {t('common.register')}
                </button>
              </div>
            )}
          </div>

          <button
            className={`nav-toggle ${mobileMenuOpen ? 'open' : ''}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={t('common.menu')}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
        </nav>
      </header>

      <main>
      {/* Hero - Compact Cards */}
      <section className="hero-compact" ref={el => sectionsRef.current.home = el}>
        <div className="hero-compact-container">
          <div className="hero-cards-grid">
            {/* Main Card */}
            <div className="hero-card hero-card-main">
              <span className="hero-card-badge">
                <span className="hero-card-badge-icon">{getIconSvg('🏛️', 16)}</span>
                {pickStrict(content.hero, 'subtitle') || t('home.hero.badge')}
              </span>
              <h1 className="hero-card-title">{pickStrict(content.hero, 'title') || t('home.hero.title')}</h1>
              <p className="hero-card-desc">{pickStrict(content.hero, 'description') || t('home.hero.description')}</p>
              <div className="hero-card-actions">
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="pbtn pbtn-lg pbtn-whatsapp">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  {t('common.contactWhatsapp')}
                </a>
                <button className="pbtn pbtn-lg pbtn-secondary" onClick={() => scrollTo('services')}>
                  {t('home.hero.ctaServices')}
                </button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="hero-stats-col">
              <div className="hero-stat-card">
                <span className="hero-stat-icon">{getIconSvg('👥')}</span>
                <div className="hero-stat-info">
                  <strong>+5,000</strong>
                  <span>{t('home.stats.happyClients')}</span>
                </div>
              </div>
              <div className="hero-stat-card">
                <span className="hero-stat-icon">{getIconSvg('📅')}</span>
                <div className="hero-stat-info">
                  <strong>+10</strong>
                  <span>{t('home.stats.yearsExperience')}</span>
                </div>
              </div>
              <div className="hero-stat-card">
                <span className="hero-stat-icon">{getIconSvg('✈️')}</span>
                <div className="hero-stat-info">
                  <strong>+3,000</strong>
                  <span>{t('home.stats.organizedTrips')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="trust-bar">
        <div className="trust-container">
          <div className="trust-item"><span className="trust-icon">{getIconSvg('🏛️', 20)}</span><span>{t('home.trust.licensed')}</span></div>
          <div className="trust-item"><span className="trust-icon">{getIconSvg('⭐', 20)}</span><span>{t('home.trust.clients')}</span></div>
          <div className="trust-item"><span className="trust-icon">{getIconSvg('📅', 20)}</span><span>{t('home.trust.years')}</span></div>
          <div className="trust-item"><span className="trust-icon">{getIconSvg('✅', 20)}</span><span>{t('home.trust.bestPrice')}</span></div>
        </div>
      </section>

      {/* Services */}
      <section className="services-section" ref={el => sectionsRef.current.services = el}>
        <div className="section-container">
          <div className="section-header animate-on-scroll">
            <h2>{t('home.services.title')}</h2>
            <p>{t('home.services.subtitle')}</p>
          </div>
          <div className="services-grid">
            {(content.services || []).map((service, i) => {
              const titleLower = (service.title || '').toLowerCase();
              const isLicense = titleLower.includes('رخص') || titleLower.includes('رخصة') || service.icon === '🪪';
              const isUsVisa = titleLower.includes('تأشير') && (titleLower.includes('أمريك') || titleLower.includes('امريك'));
              const isVisaCatalog = !isUsVisa && (titleLower.includes('تأشير') || titleLower.includes('فيز'));
              let serviceLink = whatsappLink;
              let serviceLinkProps = { target: '_blank', rel: 'noopener noreferrer' };

              if (isLicense) {
                serviceLink = '/international-license';
                serviceLinkProps = {};
              } else if (isUsVisa) {
                serviceLink = '/us-visa';
                serviceLinkProps = {};
              } else if (isVisaCatalog) {
                serviceLink = '/visas';
                serviceLinkProps = {};
              }

              return (
                <div className={`service-card animate-on-scroll delay-${(i % 3) + 1}`} key={i}>
                  <div className="service-icon">{getIconSvg(service.icon, 32)}</div>
                  <h3>{pick(service, 'title')}</h3>
                  <p>{pick(service, 'description')}</p>
                  {isLicense || isUsVisa || isVisaCatalog ? (
                    <button className="pbtn pbtn-sm pbtn-primary service-btn" onClick={() => navigate(localePath(serviceLink))}>{t('common.orderNow')}</button>
                  ) : (
                    <a href={serviceLink} {...serviceLinkProps} className="pbtn pbtn-sm pbtn-whatsapp service-btn">{t('common.orderNow')}</a>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Visa Catalog */}
      {visas.length > 0 && (() => {
        const electronicVisas = visas.filter(v => v.visaType === 'إلكترونية').slice(0, 5);
        const regularVisas = visas.filter(v => v.visaType !== 'إلكترونية').slice(0, 5);

        const renderVisaCard = (visa, i) => (
          <div
            className="visa-catalog-card animate-on-scroll"
            key={visa._id}
            style={{ animationDelay: `${i * 0.1}s` }}
            onClick={() => navigate(localePath(`/visas/${visa.slug}`))}
          >
            <div className="visa-catalog-cover">
              {visa.coverImage ? (
                <img src={getImageUrl(visa.coverImage)} alt={visa.countryName} loading="lazy" />
              ) : (
                <div className="visa-catalog-cover-placeholder">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="40" height="40"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
              )}
              <div className="visa-catalog-overlay"></div>
              <div className="visa-catalog-flag">
                {visa.flagImage ? (
                  <img src={getImageUrl(visa.flagImage)} alt="" loading="lazy" />
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" width="22" height="22"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" strokeLinecap="round" strokeLinejoin="round"/><line x1="4" y1="22" x2="4" y2="15" strokeLinecap="round"/></svg>
                )}
              </div>
              {visa.isFeatured && (
                <span className="visa-catalog-popular">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="11" height="11"><path d="M12 2L9 9H2l5.5 4.5L5 21l7-4.5L19 21l-2.5-7.5L22 9h-7L12 2z"/></svg>
                  {t('home.visas.mostRequested')}
                </span>
              )}
            </div>
            <div className="visa-catalog-body">
              <h3 className="visa-catalog-name">{visaName(visa)}</h3>
              <p className="visa-catalog-desc">{t('home.visas.cardDesc', { country: visaName(visa) })}</p>
              <div className="visa-catalog-price-row">
                <div className="visa-catalog-price">
                  {visa.offerEnabled && visa.offerPrice ? (
                    <>
                      <span className="visa-catalog-price-old">{visa.price} {visa.currency || t('common.currency')}</span>
                      <span className="visa-catalog-price-new">{visa.offerPrice} {visa.currency || t('common.currency')}</span>
                    </>
                  ) : (
                    <span className="visa-catalog-price-current">{visa.price} <small>{visa.currency || t('common.currency')}</small></span>
                  )}
                </div>
                <span className="visa-catalog-available">{t('home.visas.available')}</span>
              </div>
              <button className="pbtn pbtn-full pbtn-primary visa-catalog-btn">
                {visa.visaType === 'إلكترونية' ? t('common.applyNow') : t('common.bookNow')}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            </div>
          </div>
        );

        return (
          <section className="visa-catalog-section">
            <div className="section-container">
              <div className="visa-catalog-header animate-on-scroll">
                <div className="visa-catalog-header-top">
                  <div>
                    <h2>{t('home.visas.title')}</h2>
                    <span className="visa-catalog-header-line"></span>
                    <p>{t('home.visas.subtitle')}</p>
                  </div>
                  <button className="pbtn pbtn-secondary visa-catalog-browse-btn" onClick={() => navigate(localePath('/visas'))}>
                    {t('home.visas.browseAll')}
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                </div>
              </div>

              {/* Electronic Visas Row */}
              {electronicVisas.length > 0 && (
                <>
                  <div className="visa-catalog-row-header animate-on-scroll">
                    <span className="visa-catalog-row-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeLinecap="round" strokeLinejoin="round"/><path d="M14 2v6h6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </span>
                    <h3>{t('home.visas.electronic')}</h3>
                    <span className="visa-catalog-row-badge elec">{t('common.applyOnline')}</span>
                  </div>
                  <div className="visa-catalog-grid">
                    {electronicVisas.map((visa, i) => renderVisaCard(visa, i))}
                  </div>
                </>
              )}

              {/* Regular Visas Row */}
              {regularVisas.length > 0 && (
                <>
                  <div className="visa-catalog-row-header animate-on-scroll">
                    <span className="visa-catalog-row-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><path d="M6 2h12a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"/><circle cx="12" cy="10" r="3"/><path d="M8 17h8"/></svg>
                    </span>
                    <h3>{t('home.visas.regular')}</h3>
                    <span className="visa-catalog-row-badge regular">{t('home.visas.weArrange')}</span>
                  </div>
                  <div className="visa-catalog-grid">
                    {regularVisas.map((visa, i) => renderVisaCard(visa, i))}
                  </div>
                </>
              )}

            </div>
          </section>
        );
      })()}

      {/* About */}
      <section className="about-section" ref={el => sectionsRef.current.about = el}>
        <div className="section-container">
          <div className="section-header animate-on-scroll">
            <h2>{pickStrict(content.aboutUs, 'title') || t('home.about.title')}</h2>
          </div>
          <p className="about-desc animate-on-scroll">{pick(content.aboutUs, 'description')}</p>
          <div className="about-features">
            {(content.aboutUs?.features || []).map((feature, i) => (
              <div className={`about-feature animate-on-scroll delay-${(i % 2) + 1}`} key={i}>
                <div className="about-feature-icon">{getIconSvg(feature.icon, 28)}</div>
                <div className="about-feature-text">
                  <h3>{pick(feature, 'title')}</h3>
                  <p>{pick(feature, 'description')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="stats-section" ref={statsRef}>
        <div className="section-container">
          <div className="stats-grid">
            {[
              { number: 5000, suffix: '+', label: t('home.stats.happyClients') },
              { number: 3000, suffix: '+', label: t('home.stats.organizedTrips') },
              { number: 2000, suffix: '+', label: t('home.stats.approvedVisas') },
              { number: 10, suffix: '+', label: t('home.stats.yearsExperience') }
            ].map((stat, i) => (
              <div className="stat-card" key={i}>
                <span className="stat-number">
                  {statsVisible ? stat.number.toLocaleString('en-US') : '0'}{stat.suffix}
                </span>
                <span className="stat-label">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="faq-section" ref={el => sectionsRef.current.faq = el}>
        <div className="section-container">
          <div className="section-header animate-on-scroll">
            <h2>{t('home.faq.title')}</h2>
            <p>{t('home.faq.subtitle')}</p>
          </div>
          <div className="faq-list">
            {(content.faq || []).map((item, i) => (
              <div className={`faq-item animate-on-scroll delay-${(i % 3) + 1} ${openFaq === i ? 'open' : ''}`} key={i}>
                <button className="faq-question" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  <span>{pick(item, 'question')}</span>
                  <span className="faq-arrow">{openFaq === i ? '−' : '+'}</span>
                </button>
                {openFaq === i && (
                  <div className="faq-answer">
                    <p>{pick(item, 'answer')}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      {(content.testimonials || []).filter(item => item.isActive !== false).length > 0 && (
        <section className="testimonials-section">
          <div className="section-container">
            <div className="section-header animate-on-scroll">
              <h2>{t('home.testimonials.title')}</h2>
              <p>{t('home.testimonials.subtitle')}</p>
            </div>
            <div className="testimonials-grid">
              {(content.testimonials || []).filter(item => item.isActive !== false).map((item, i) => (
                <div className={`testimonial-card animate-on-scroll delay-${(i % 3) + 1}`} key={i}>
                  <div className="testimonial-quote">"</div>
                  <div className="testimonial-stars">{'★'.repeat(item.stars || 5)}</div>
                  <p className="testimonial-text">{pick(item, 'text')}</p>
                  <div className="testimonial-author">
                    <span>{item.name}</span>
                    {item.source && item.source !== 'direct' && (
                      <span className="testimonial-source">
                        {item.source === 'google' ? '— Google' : item.source === 'twitter' ? '— Twitter' : item.source === 'instagram' ? '— Instagram' : ''}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Contact + Map */}
      <section className="contact-section" ref={el => sectionsRef.current.contact = el}>
        <div className="section-container">
          <div className="section-header animate-on-scroll">
            <h2>{t('home.contact.title')}</h2>
            <p>{t('home.contact.subtitle')}</p>
          </div>

          {/* Contact + Map Layout */}
          <div className="contact-map-layout">
            {/* Contact Info Side */}
            <div className="contact-info-side animate-on-scroll delay-1">
              {/* WhatsApp CTA */}
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="pbtn contact-whatsapp-cta">
                <div className="contact-wa-icon">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </div>
                <div className="contact-wa-text">
                  <strong>{t('common.contactWhatsapp')}</strong>
                  <span>{t('home.contact.freeConsult')}</span>
                </div>
              </a>

              {/* Contact Items */}
              <div className="contact-info-list">
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="contact-info-item">
                  <div className="contact-info-icon">{getIconSvg('📞', 22)}</div>
                  <div className="contact-info-text">
                    <strong>{t('home.contact.callUs')}</strong>
                    <span>{content.contact?.phone}</span>
                  </div>
                </a>

                <a href={`mailto:${content.contact?.email}`} className="contact-info-item">
                  <div className="contact-info-icon">{getIconSvg('✉️', 22)}</div>
                  <div className="contact-info-text">
                    <strong>{t('home.contact.email')}</strong>
                    <span>{content.contact?.email}</span>
                  </div>
                </a>

                <a href="https://maps.google.com/?q=24.810952199999996,46.646181899999995" target="_blank" rel="noopener noreferrer" className="contact-info-item">
                  <div className="contact-info-icon">{getIconSvg('📍', 22)}</div>
                  <div className="contact-info-text">
                    <strong>{t('home.contact.address')}</strong>
                    <span>{pick(content.contact, 'address')}</span>
                  </div>
                </a>
              </div>

              {/* Social Media */}
              {(content.socialMedia?.twitter || content.socialMedia?.instagram || content.socialMedia?.facebook || content.socialMedia?.snapchat) && (
                <div className="contact-social">
                  {content.socialMedia?.twitter && <a href={content.socialMedia.twitter} target="_blank" rel="noopener noreferrer" aria-label="Twitter">𝕏</a>}
                  {content.socialMedia?.instagram && <a href={content.socialMedia.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram">{getIconSvg('📷', 18)}</a>}
                  {content.socialMedia?.facebook && <a href={content.socialMedia.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook">f</a>}
                  {content.socialMedia?.snapchat && <a href={content.socialMedia.snapchat} target="_blank" rel="noopener noreferrer" aria-label="Snapchat">{getIconSvg('👻', 18)}</a>}
                </div>
              )}
            </div>

            {/* Map Side */}
            <div className="contact-map-side animate-on-scroll delay-2">
              <div className="contact-map-wrapper">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3550.813903803563!2d46.646181899999995!3d24.810952199999996!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3e2f01b654ba264b%3A0x30a7fd8506bf489a!2z2KfZhNmI2KfZhiDYp9mE2YXYs9in2YHYsSDZhNmE2LPZgdixINmIINin2YTYs9mK2KfYrdip!5e1!3m2!1sar!2sus!4v1772396758449!5m2!1sar!2sus"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title={t('home.contact.mapTitle')}
                ></iframe>
              </div>
              <a href="https://maps.google.com/?q=24.810952199999996,46.646181899999995" target="_blank" rel="noopener noreferrer" className="contact-map-link">
                {t('home.contact.openInMaps')}
              </a>
            </div>
          </div>
        </div>
      </section>

      </main>

      {/* Footer */}
      <footer className="footer-main">
        <div className="footer-container">
          <div className="footer-grid">
            {/* Col 1: Logo & About */}
            <div className="footer-col">
              <div className="footer-brand">
                {content.general?.logo ? (
                  <img src={getImageUrl(content.general.logo)} alt={content.general?.siteName} className="footer-logo-img" width="140" height="48" />
                ) : (
                  <>
                    <BrandMark size={44} />
                    <span className="footer-logo-text">
                      {isEn
                        ? (content.general?.siteNameEn || 'Travel Colors')
                        : (content.general?.siteName || 'ألوان السفر')}
                    </span>
                  </>
                )}
              </div>
              <p className="footer-about">{(pick(content.aboutUs, 'description') || '').substring(0, 150)}...</p>
              <div className="footer-social">
                {content.socialMedia?.twitter && <a href={content.socialMedia.twitter} target="_blank" rel="noopener noreferrer" aria-label="X">𝕏</a>}
                {content.socialMedia?.instagram && <a href={content.socialMedia.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram">{getIconSvg('📷', 16)}</a>}
                {content.socialMedia?.facebook && <a href={content.socialMedia.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook">f</a>}
              </div>
            </div>

            {/* Col 2: Services */}
            <div className="footer-col">
              <h3 className="footer-col-title">{t('footer.servicesTitle')}</h3>
              <ul className="footer-links">
                <li><button onClick={() => scrollTo('services')}>{t('footer.hotelBooking')}</button></li>
                <li><button onClick={() => scrollTo('services')}>{t('footer.flightBooking')}</button></li>
                <li><button onClick={() => navigate(localePath('/us-visa'))}>{t('footer.visas')}</button></li>
                <li><button onClick={() => scrollTo('services')}>{t('footer.tourPackages')}</button></li>
              </ul>
            </div>

            {/* Col 3: Company */}
            <div className="footer-col">
              <h3 className="footer-col-title">{t('footer.companyTitle')}</h3>
              <ul className="footer-links">
                <li><button onClick={() => scrollTo('about')}>{t('footer.aboutUs')}</button></li>
                <li><button onClick={() => scrollTo('contact')}>{t('footer.contactUs')}</button></li>
                <li><button onClick={() => scrollTo('services')}>{t('footer.ourServices')}</button></li>
                <li><button onClick={() => navigate(localePath('/us-visa'))}>{t('footer.visas')}</button></li>
              </ul>
            </div>

            {/* Col 4: Contact */}
            <div className="footer-col">
              <h3 className="footer-col-title">{t('footer.contactTitle')}</h3>
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="footer-whatsapp-card">
                <span><span style={{ display: 'inline-flex', verticalAlign: 'middle', marginLeft: '6px' }}>{getIconSvg('💬', 16)}</span> {t('common.contactWhatsapp')}</span>
                <span className="footer-whatsapp-sub">{t('footer.whatsappSub')}</span>
              </a>
              <div className="footer-contact-list">
                <div className="footer-contact-item">
                  <span>{getIconSvg('📞', 16)}</span>
                  <a href={whatsappLink} target="_blank" rel="noopener noreferrer" dir="ltr">{content.contact?.phone}</a>
                </div>
                <div className="footer-contact-item">
                  <span>{getIconSvg('✉️', 16)}</span>
                  <a href={`mailto:${content.contact?.email}`} dir="ltr">{content.contact?.email}</a>
                </div>
                <div className="footer-contact-item">
                  <span>{getIconSvg('📍', 16)}</span>
                  <span>{pick(content.contact, 'address')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* شريط التوثيق الرسمي */}
          <div className="footer-credentials">
            <a
              className="footer-sbc"
              href={SBC_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src="/Saudi_Business_Center.jpeg"
                alt={t('credentials.sbcAlt')}
                className="footer-sbc-logo"
                width="325"
                height="295"
                loading="lazy"
              />
            </a>
            <div className="footer-credentials-text">
              <p className="footer-credentials-title">{t('credentials.title')}</p>
              <div className="footer-credentials-items">
                <span className="footer-credential">
                  {t('credentials.unifiedNumber')}
                  <b dir="ltr">{registration.unifiedNationalNumber}</b>
                </span>
                <span className="footer-credential">
                  {t('credentials.tourismLicense')}
                  <b dir="ltr">{registration.tourismLicense}</b>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom">
          <div className="footer-container">
            <div className="footer-bottom-inner">
              <p>{footerText}</p>
              <div className="footer-legal-links">
                <Link to={localePath('/privacy')}>{t('common.privacy')}</Link>
                <Link to={localePath('/terms')}>{t('common.terms')}</Link>
              </div>
              <DeveloperCredit />
            </div>
          </div>
        </div>
      </footer>

      {/* WhatsApp Floating Button */}
      <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="whatsapp-float" aria-label={t('common.contactWhatsapp')}>
        <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </a>
    </div>
  );
};

export default Home;
