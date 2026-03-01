import { useState, useEffect, useRef } from 'react';
import { websiteApi } from '../../api';
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
    address: 'المملكة العربية السعودية'
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
  const sectionsRef = useRef({});

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
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
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
    { id: 'services', label: 'خدماتنا' },
    { id: 'about', label: 'من نحن' },
    { id: 'faq', label: 'الأسئلة الشائعة' },
    { id: 'contact', label: 'تواصل معنا' }
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
              <button key={link.id} className="nav-link" onClick={() => scrollTo(link.id)}>
                {link.label}
              </button>
            ))}
            <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="nav-whatsapp">
              واتساب
            </a>
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

      {/* Hero */}
      <section
        className="hero-section"
        ref={el => sectionsRef.current.home = el}
        style={content.hero?.backgroundImage ? { backgroundImage: `url(${getImageUrl(content.hero.backgroundImage)})` } : {}}
      >
        <div className="hero-overlay"></div>
        <div className="hero-container">
          <span className="hero-badge">{content.hero?.subtitle || 'شركة سياحية مرخصة'}</span>
          <h1 className="hero-title">{content.hero?.title || 'دعنا نسافر مع ألوان المسافر'}</h1>
          <p className="hero-desc">{content.hero?.description || ''}</p>
          <div className="hero-actions">
            <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="btn-primary">
              تواصل عبر واتساب
            </a>
            <button className="btn-outline-light" onClick={() => scrollTo('services')}>
              تعرف على خدماتنا
            </button>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="services-section" ref={el => sectionsRef.current.services = el}>
        <div className="section-container">
          <div className="section-header">
            <h2>خدماتنا</h2>
            <p>نقدم لك مجموعة متكاملة من خدمات السفر والسياحة</p>
          </div>
          <div className="services-grid">
            {(content.services || []).map((service, i) => (
              <div className="service-card" key={i}>
                <div className="service-icon">{service.icon}</div>
                <h3>{service.title}</h3>
                <p>{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section className="about-section" ref={el => sectionsRef.current.about = el}>
        <div className="section-container">
          <div className="section-header">
            <h2>{content.aboutUs?.title || 'من نحن'}</h2>
          </div>
          <p className="about-desc">{content.aboutUs?.description || ''}</p>
          <div className="about-features">
            {(content.aboutUs?.features || []).map((feature, i) => (
              <div className="about-feature" key={i}>
                <div className="about-feature-icon">{feature.icon}</div>
                <div className="about-feature-text">
                  <h4>{feature.title}</h4>
                  <p>{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="faq-section" ref={el => sectionsRef.current.faq = el}>
        <div className="section-container">
          <div className="section-header">
            <h2>الأسئلة الشائعة</h2>
            <p>إجابات على أكثر الأسئلة شيوعاً</p>
          </div>
          <div className="faq-list">
            {(content.faq || []).map((item, i) => (
              <div className={`faq-item ${openFaq === i ? 'open' : ''}`} key={i}>
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

      {/* Contact */}
      <section className="contact-section" ref={el => sectionsRef.current.contact = el}>
        <div className="section-container">
          <div className="section-header">
            <h2>تواصل معنا</h2>
            <p>نسعد بتواصلكم معنا في أي وقت</p>
          </div>
          <div className="contact-grid">
            <div className="contact-card">
              <div className="contact-icon">📞</div>
              <h4>اتصل بنا</h4>
              <a href={`tel:${content.contact?.phone}`}>{content.contact?.phone}</a>
            </div>
            <div className="contact-card">
              <div className="contact-icon">✉️</div>
              <h4>البريد الإلكتروني</h4>
              <a href={`mailto:${content.contact?.email}`}>{content.contact?.email}</a>
            </div>
            <div className="contact-card highlight">
              <div className="contact-icon">💬</div>
              <h4>واتساب</h4>
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer">تواصل الآن</a>
            </div>
            <div className="contact-card">
              <div className="contact-icon">📍</div>
              <h4>العنوان</h4>
              <span>{content.contact?.address}</span>
            </div>
          </div>

          {/* Social Media */}
          {(content.socialMedia?.twitter || content.socialMedia?.instagram || content.socialMedia?.facebook || content.socialMedia?.snapchat) && (
            <div className="social-links">
              {content.socialMedia?.twitter && (
                <a href={content.socialMedia.twitter} target="_blank" rel="noopener noreferrer" className="social-link" aria-label="Twitter">𝕏</a>
              )}
              {content.socialMedia?.instagram && (
                <a href={content.socialMedia.instagram} target="_blank" rel="noopener noreferrer" className="social-link" aria-label="Instagram">📷</a>
              )}
              {content.socialMedia?.facebook && (
                <a href={content.socialMedia.facebook} target="_blank" rel="noopener noreferrer" className="social-link" aria-label="Facebook">f</a>
              )}
              {content.socialMedia?.snapchat && (
                <a href={content.socialMedia.snapchat} target="_blank" rel="noopener noreferrer" className="social-link" aria-label="Snapchat">👻</a>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="site-footer">
        <div className="section-container">
          <p>{footerText}</p>
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
