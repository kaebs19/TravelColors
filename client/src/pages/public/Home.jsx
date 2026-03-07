import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { websiteApi } from '../../api';
import visaCatalogApi from '../../api/visaCatalogApi';
import { useClientAuth } from '../../context/ClientAuthContext';
import { getIconSvg } from '../../utils/icons';
import '../../styles/public-shared.css';
import './Home.css';

const DEFAULT_CONTENT = {
  hero: {
    title: 'دعنا نسافر مع ألوان المسافر',
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
    description: 'شركة ألوان المسافر متخصصون في استخراج تأشيرة الشنقن في وقت قصير. حجز طيران - حجوزات فندقيه حول العالم - برامج شهر العسل للعرسان - رخص دولية / مرخص من هيئة السياحة رقم : 73104877',
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
    phone: '+966 55 922 9597',
    email: 'info@trcolors.com',
    whatsapp: '966559229597',
    address: 'شارع الأمير ناصر بن سعود بن فرحان آل سعود، الصحافة، الرياض 13321'
  },
  socialMedia: { twitter: '', instagram: '', facebook: '', snapchat: '' },
  footer: { copyrightText: '© {year} Travel Colors - ألوان المسافر. جميع الحقوق محفوظة' },
  general: { siteName: 'ألوان المسافر', siteNameEn: 'Travel Colors', siteDescription: '', logo: '' }
};

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
    const loadVisas = async () => {
      try {
        const res = await visaCatalogApi.getPublicVisas();
        if (res.success) setVisas(((res.data?.visas || res.data) || []).slice(0, 6));
      } catch (err) { /* ignore */ }
    };
    loadVisas();
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  // Scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [content]);

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

  const whatsappLink = content.contact?.whatsapp
    ? `https://wa.me/${content.contact.whatsapp}`
    : '#';

  const footerText = (content.footer?.copyrightText || DEFAULT_CONTENT.footer.copyrightText)
    .replace('{year}', new Date().getFullYear());

  const navLinks = [
    { id: 'home', label: 'الرئيسية' },
    { id: 'visas', label: 'التأشيرات', href: '/visas' },
    { id: 'us-visa', label: 'التأشيرة الأمريكية', href: '/us-visa' },
    { id: 'services', label: 'خدماتنا' },
    { id: 'contact', label: 'تواصل معنا', href: '/ContactUs' }
  ];

  return (
    <div className="website" dir="rtl">
      {/* Navbar */}
      <nav className={`site-nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="nav-container">
          <div className="nav-brand" onClick={() => scrollTo('home')}>
            {content.general?.logo ? (
              <img src={getImageUrl(content.general.logo)} alt={content.general?.siteName} className="nav-logo-img" />
            ) : (
              <div className="nav-logo-text">
                <span className="nav-logo-ar">{content.general?.siteName || 'ألوان المسافر'}</span>
                <span className="nav-logo-en">{content.general?.siteNameEn || 'Travel Colors'}</span>
              </div>
            )}
          </div>

          <div className={`nav-links ${mobileMenuOpen ? 'open' : ''}`}>
            {navLinks.map(link => (
              <button key={link.id} className="nav-link" onClick={() => {
                if (link.href) {
                  setMobileMenuOpen(false);
                  navigate(link.href);
                } else {
                  scrollTo(link.id);
                }
              }}>
                {link.label}
              </button>
            ))}
            <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="nav-whatsapp">
              واتساب
            </a>

            {/* Auth — Mobile: يظهر داخل القائمة */}
            <div className="nav-auth-mobile">
              {isAuthenticated ? (
                <>
                  <button className="nav-link" onClick={() => { setMobileMenuOpen(false); navigate('/portal/dashboard'); }}>
                    لوحة التحكم
                  </button>
                  <button className="nav-link nav-logout-mobile" onClick={() => { setMobileMenuOpen(false); logout(); }}>
                    تسجيل خروج
                  </button>
                </>
              ) : (
                <>
                  <button className="nav-link" onClick={() => { setMobileMenuOpen(false); navigate('/portal/login'); }}>
                    تسجيل دخول
                  </button>
                  <button className="nav-auth-register-mobile" onClick={() => { setMobileMenuOpen(false); navigate('/portal/login?tab=register'); }}>
                    إنشاء حساب
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
                      لوحة التحكم
                    </button>
                    <button className="nav-user-dropdown-item logout" onClick={() => { setUserMenuOpen(false); logout(); }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                      تسجيل خروج
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="nav-auth-buttons">
                <button className="nav-login-btn" onClick={() => navigate('/portal/login')}>
                  تسجيل دخول
                </button>
                <button className="nav-register-btn" onClick={() => navigate('/portal/login?tab=register')}>
                  إنشاء حساب
                </button>
              </div>
            )}
          </div>

          <button
            className={`nav-toggle ${mobileMenuOpen ? 'open' : ''}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="القائمة"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </nav>

      {/* Hero - Compact Cards */}
      <section className="hero-compact" ref={el => sectionsRef.current.home = el}>
        <div className="hero-compact-container">
          <div className="hero-cards-grid">
            {/* Main Card */}
            <div className="hero-card hero-card-main">
              <span className="hero-card-badge">
                <span className="hero-card-badge-icon">{getIconSvg('🏛️', 16)}</span>
                {content.hero?.subtitle || 'شركة سياحية مرخصة'}
              </span>
              <h1 className="hero-card-title">{content.hero?.title || 'دعنا نسافر مع ألوان المسافر'}</h1>
              <p className="hero-card-desc">{content.hero?.description || ''}</p>
              <div className="hero-card-actions">
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="pbtn pbtn-lg pbtn-whatsapp">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  تواصل عبر واتساب
                </a>
                <button className="pbtn pbtn-lg pbtn-secondary" onClick={() => scrollTo('services')}>
                  تعرف على خدماتنا
                </button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="hero-stats-col">
              <div className="hero-stat-card">
                <span className="hero-stat-icon">{getIconSvg('👥')}</span>
                <div className="hero-stat-info">
                  <strong>+5,000</strong>
                  <span>عميل سعيد</span>
                </div>
              </div>
              <div className="hero-stat-card">
                <span className="hero-stat-icon">{getIconSvg('📅')}</span>
                <div className="hero-stat-info">
                  <strong>+10</strong>
                  <span>سنوات خبرة</span>
                </div>
              </div>
              <div className="hero-stat-card">
                <span className="hero-stat-icon">{getIconSvg('✈️')}</span>
                <div className="hero-stat-info">
                  <strong>+3,000</strong>
                  <span>رحلة منظمة</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="trust-bar">
        <div className="trust-container">
          <div className="trust-item"><span className="trust-icon">{getIconSvg('🏛️', 20)}</span><span>مرخص من هيئة السياحة</span></div>
          <div className="trust-item"><span className="trust-icon">{getIconSvg('⭐', 20)}</span><span>+5000 عميل سعيد</span></div>
          <div className="trust-item"><span className="trust-icon">{getIconSvg('📅', 20)}</span><span>+10 سنوات خبرة</span></div>
          <div className="trust-item"><span className="trust-icon">{getIconSvg('✅', 20)}</span><span>ضمان أفضل الأسعار</span></div>
        </div>
      </section>

      {/* Services */}
      <section className="services-section" ref={el => sectionsRef.current.services = el}>
        <div className="section-container">
          <div className="section-header animate-on-scroll">
            <h2>خدماتنا</h2>
            <p>نقدم لك مجموعة متكاملة من خدمات السفر والسياحة</p>
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
                  <h3>{service.title}</h3>
                  <p>{service.description}</p>
                  {isLicense || isUsVisa || isVisaCatalog ? (
                    <button className="pbtn pbtn-sm pbtn-primary service-btn" onClick={() => navigate(serviceLink)}>اطلب الآن</button>
                  ) : (
                    <a href={serviceLink} {...serviceLinkProps} className="pbtn pbtn-sm pbtn-whatsapp service-btn">اطلب الآن</a>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Visa Catalog */}
      {visas.length > 0 && (
        <section className="visa-catalog-section">
          <div className="section-container">
            <div className="visa-catalog-header animate-on-scroll">
              <h2>تأشيراتنا</h2>
              <span className="visa-catalog-header-line"></span>
              <p>اختر وجهتك واحصل على تأشيرتك بأسرع وقت</p>
            </div>
            <div className="visa-catalog-grid">
              {visas.map((visa, i) => (
                <div
                  className={`visa-catalog-card animate-on-scroll delay-${(i % 3) + 1}`}
                  key={visa._id}
                  onClick={() => navigate(`/visas/${visa.slug}`)}
                >
                  {/* Cover Image */}
                  <div className="visa-catalog-cover">
                    {visa.coverImage ? (
                      <img src={getImageUrl(visa.coverImage)} alt={visa.countryName} loading="lazy" />
                    ) : (
                      <div className="visa-catalog-cover-placeholder">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="48" height="48"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>
                    )}
                    <div className="visa-catalog-overlay"></div>

                    {/* Flag */}
                    <div className="visa-catalog-flag">
                      {visa.flagImage ? (
                        <img src={getImageUrl(visa.flagImage)} alt="علم" loading="lazy" />
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" width="24" height="24"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" strokeLinecap="round" strokeLinejoin="round"/><line x1="4" y1="22" x2="4" y2="15" strokeLinecap="round"/></svg>
                      )}
                    </div>

                    {/* Rating Stars */}
                    {visa.rating > 0 && (
                      <span className="visa-catalog-rating">
                        <span className="star-rating">
                          {[1, 2, 3, 4, 5].map(star => (
                            <svg key={star} viewBox="0 0 24 24" fill={star <= visa.rating ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" width="14" height="14" className={star <= visa.rating ? 'star-filled' : 'star-empty'}>
                              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                            </svg>
                          ))}
                        </span>
                      </span>
                    )}

                    {/* Popular Badge */}
                    {visa.isFeatured && (
                      <span className="visa-catalog-popular">
                        <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12"><path d="M12 2L9 9H2l5.5 4.5L5 21l7-4.5L19 21l-2.5-7.5L22 9h-7L12 2z"/></svg>
                        الأكثر طلباً
                      </span>
                    )}
                  </div>

                  {/* Card Body */}
                  <div className="visa-catalog-body">
                    <h3 className="visa-catalog-name">{visa.countryName?.replace(/^التأشيرة\s*/i, '')}</h3>

                    {visa.requirements?.[0]?.title && (
                      <p className="visa-catalog-desc">{visa.requirements[0].title}</p>
                    )}

                    {/* Price Row */}
                    <div className="visa-catalog-price-row">
                      <div className="visa-catalog-price">
                        {visa.offerEnabled && visa.offerPrice ? (
                          <>
                            <span className="visa-catalog-price-old">{visa.price} {visa.currency || 'ريال'}</span>
                            <span className="visa-catalog-price-new">{visa.offerPrice} {visa.currency || 'ريال'}</span>
                          </>
                        ) : (
                          <span className="visa-catalog-price-current">{visa.price} <small>{visa.currency || 'ريال'}</small></span>
                        )}
                      </div>
                      <span className="visa-catalog-available">متاح</span>
                    </div>

                    {/* CTA */}
                    <button className="pbtn pbtn-full pbtn-primary visa-catalog-btn">
                      {visa.visaType === 'إلكترونية' ? 'قدّم الآن' : 'احجز الآن'}
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="visa-catalog-browse animate-on-scroll">
              <button className="pbtn pbtn-lg pbtn-secondary visa-catalog-browse-btn" onClick={() => navigate('/visas')}>
                تصفح جميع التأشيرات
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* About */}
      <section className="about-section" ref={el => sectionsRef.current.about = el}>
        <div className="section-container">
          <div className="section-header animate-on-scroll">
            <h2>{content.aboutUs?.title || 'من نحن'}</h2>
          </div>
          <p className="about-desc animate-on-scroll">{content.aboutUs?.description || ''}</p>
          <div className="about-features">
            {(content.aboutUs?.features || []).map((feature, i) => (
              <div className={`about-feature animate-on-scroll delay-${(i % 2) + 1}`} key={i}>
                <div className="about-feature-icon">{getIconSvg(feature.icon, 28)}</div>
                <div className="about-feature-text">
                  <h4>{feature.title}</h4>
                  <p>{feature.description}</p>
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
              { number: 5000, suffix: '+', label: 'عميل سعيد' },
              { number: 3000, suffix: '+', label: 'رحلة منظمة' },
              { number: 2000, suffix: '+', label: 'تأشيرة معتمدة' },
              { number: 10, suffix: '+', label: 'سنوات خبرة' }
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
            <h2>الأسئلة الشائعة</h2>
            <p>إجابات على أكثر الأسئلة شيوعاً</p>
          </div>
          <div className="faq-list">
            {(content.faq || []).map((item, i) => (
              <div className={`faq-item animate-on-scroll delay-${(i % 3) + 1} ${openFaq === i ? 'open' : ''}`} key={i}>
                <button className="faq-question" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  <span>{item.question}</span>
                  <span className="faq-arrow">{openFaq === i ? '−' : '+'}</span>
                </button>
                {openFaq === i && (
                  <div className="faq-answer">
                    <p>{item.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="testimonials-section">
        <div className="section-container">
          <div className="section-header animate-on-scroll">
            <h2>آراء عملائنا</h2>
            <p>ثقة عملائنا هي أكبر إنجاز لنا</p>
          </div>
          <div className="testimonials-grid">
            {[
              { name: 'أحمد م.', text: 'تجربة ممتازة في استخراج تأشيرة الشنقن. الفريق محترف وسريع في الإنجاز. أنصح بالتعامل معهم.', stars: 5 },
              { name: 'سارة ع.', text: 'حجزت رحلة شهر العسل عن طريقهم وكانت التجربة مذهلة. التنظيم كان ممتاز والأسعار منافسة.', stars: 5 },
              { name: 'خالد ف.', text: 'ساعدوني في استخراج التأشيرة الأمريكية بكل سهولة. الدعم كان متواصل من البداية للنهاية.', stars: 5 }
            ].map((t, i) => (
              <div className={`testimonial-card animate-on-scroll delay-${i + 1}`} key={i}>
                <div className="testimonial-quote">"</div>
                <div className="testimonial-stars">{'★'.repeat(t.stars)}</div>
                <p className="testimonial-text">{t.text}</p>
                <div className="testimonial-author">{t.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact + Map */}
      <section className="contact-section" ref={el => sectionsRef.current.contact = el}>
        <div className="section-container">
          <div className="section-header animate-on-scroll">
            <h2>تواصل معنا</h2>
            <p>نسعد بتواصلكم معنا في أي وقت</p>
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
                  <strong>تواصل عبر واتساب</strong>
                  <span>احصل على استشارة مجانية فورية</span>
                </div>
              </a>

              {/* Contact Items */}
              <div className="contact-info-list">
                <a href={`tel:${content.contact?.phone}`} className="contact-info-item">
                  <div className="contact-info-icon">{getIconSvg('📞', 22)}</div>
                  <div className="contact-info-text">
                    <strong>اتصل بنا</strong>
                    <span>{content.contact?.phone}</span>
                  </div>
                </a>

                <a href={`mailto:${content.contact?.email}`} className="contact-info-item">
                  <div className="contact-info-icon">{getIconSvg('✉️', 22)}</div>
                  <div className="contact-info-text">
                    <strong>البريد الإلكتروني</strong>
                    <span>{content.contact?.email}</span>
                  </div>
                </a>

                <a href="https://maps.google.com/?q=24.810952199999996,46.646181899999995" target="_blank" rel="noopener noreferrer" className="contact-info-item">
                  <div className="contact-info-icon">{getIconSvg('📍', 22)}</div>
                  <div className="contact-info-text">
                    <strong>العنوان</strong>
                    <span>{content.contact?.address}</span>
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
                  title="موقع ألوان المسافر"
                ></iframe>
              </div>
              <a href="https://maps.google.com/?q=24.810952199999996,46.646181899999995" target="_blank" rel="noopener noreferrer" className="contact-map-link">
                فتح في خرائط جوجل ←
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer-main">
        <div className="footer-container">
          <div className="footer-grid">
            {/* Col 1: Logo & About */}
            <div className="footer-col">
              <div className="footer-brand">
                {content.general?.logo ? (
                  <img src={getImageUrl(content.general.logo)} alt={content.general?.siteName} className="footer-logo-img" />
                ) : (
                  <span className="footer-logo-text">{content.general?.siteName || 'ألوان المسافر'}</span>
                )}
              </div>
              <p className="footer-about">{content.aboutUs?.description?.substring(0, 150) || 'شركة ألوان المسافر متخصصون في استخراج تأشيرة الشنقن في وقت قصير. حجز طيران - حجوزات فندقيه حول العالم - برامج شهر العسل للعرسان - رخص دولية'}...</p>
              <div className="footer-social">
                {content.socialMedia?.twitter && <a href={content.socialMedia.twitter} target="_blank" rel="noopener noreferrer" aria-label="X">𝕏</a>}
                {content.socialMedia?.instagram && <a href={content.socialMedia.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram">{getIconSvg('📷', 16)}</a>}
                {content.socialMedia?.facebook && <a href={content.socialMedia.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook">f</a>}
              </div>
            </div>

            {/* Col 2: Services */}
            <div className="footer-col">
              <h4 className="footer-col-title">خدماتنا</h4>
              <ul className="footer-links">
                <li><button onClick={() => scrollTo('services')}>حجوزات الفنادق</button></li>
                <li><button onClick={() => scrollTo('services')}>حجوزات الطيران</button></li>
                <li><button onClick={() => navigate('/us-visa')}>التأشيرات</button></li>
                <li><button onClick={() => scrollTo('services')}>برامج سياحية</button></li>
              </ul>
            </div>

            {/* Col 3: Company */}
            <div className="footer-col">
              <h4 className="footer-col-title">الشركة</h4>
              <ul className="footer-links">
                <li><button onClick={() => scrollTo('about')}>من نحن</button></li>
                <li><button onClick={() => scrollTo('contact')}>تواصل معنا</button></li>
                <li><button onClick={() => scrollTo('services')}>خدماتنا</button></li>
                <li><button onClick={() => navigate('/us-visa')}>التأشيرات</button></li>
              </ul>
            </div>

            {/* Col 4: Contact */}
            <div className="footer-col">
              <h4 className="footer-col-title">تواصل معنا</h4>
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="footer-whatsapp-card">
                <span><span style={{ display: 'inline-flex', verticalAlign: 'middle', marginLeft: '6px' }}>{getIconSvg('💬', 16)}</span> تواصل عبر واتساب</span>
                <span className="footer-whatsapp-sub">احصل على استشارة مجانية من خبرائنا</span>
              </a>
              <div className="footer-contact-list">
                <div className="footer-contact-item">
                  <span>{getIconSvg('📞', 16)}</span>
                  <a href={`tel:${content.contact?.phone}`}>{content.contact?.phone}</a>
                </div>
                <div className="footer-contact-item">
                  <span>{getIconSvg('✉️', 16)}</span>
                  <a href={`mailto:${content.contact?.email}`}>{content.contact?.email}</a>
                </div>
                <div className="footer-contact-item">
                  <span>{getIconSvg('📍', 16)}</span>
                  <span>{content.contact?.address}</span>
                </div>
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
                <Link to="/privacy">سياسة الخصوصية</Link>
                <Link to="/terms">الشروط والأحكام</Link>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* WhatsApp Floating Button */}
      <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="whatsapp-float" aria-label="تواصل واتساب">
        <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </a>
    </div>
  );
};

export default Home;
