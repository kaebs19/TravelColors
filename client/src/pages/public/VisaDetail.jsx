import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getPublicVisa } from '../../api/visaCatalogApi';
import { websiteApi } from '../../api';
import '../../styles/public-shared.css';
import './VisaDetail.css';

const API_URL = (process.env.REACT_APP_API_URL || 'http://localhost:5002').replace(/\/api\/?$/, '');

// أيقونات SVG للمتطلبات
const REQ_ICONS = {
  passport: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2h12a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"/><circle cx="12" cy="10" r="3"/><path d="M8 17h8"/></svg>,
  medical: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2v4M16 2v4M3 10h18"/><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M12 14v4M10 16h4"/></svg>,
  translate: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 8l6 6M4 14l6-6 2-3M2 5h12M7 2h1"/><path d="M22 22l-5-10-5 10M14 18h6"/></svg>,
  bank: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="14" rx="2"/><path d="M2 10h20M6 14h.01M10 14h4"/></svg>,
  photo: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>,
  salary: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M9 15h6M9 11h6"/></svg>,
  info: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>,
  clock: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>,
  document: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>,
  check: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>
};

const ICON_COLORS = {
  passport: { bg: '#dbeafe', color: '#2563eb' },
  medical: { bg: '#fce7f3', color: '#db2777' },
  translate: { bg: '#e0e7ff', color: '#4f46e5' },
  bank: { bg: '#d1fae5', color: '#059669' },
  photo: { bg: '#fef3c7', color: '#d97706' },
  salary: { bg: '#e0f2fe', color: '#0284c7' },
  info: { bg: '#fef9c3', color: '#ca8a04' },
  clock: { bg: '#ede9fe', color: '#7c3aed' },
  document: { bg: '#f1f5f9', color: '#475569' },
  check: { bg: '#d1fae5', color: '#16a34a' }
};

const VisaDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [visa, setVisa] = useState(null);
  const [contact, setContact] = useState({ whatsapp: '966559229597' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  useEffect(() => { loadData(); }, [slug]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) entry.target.classList.add('visible');
        });
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [visa]);

  const loadData = async () => {
    try {
      setLoading(true);
      setImgLoaded(false);
      setError(null);
      const [visaRes, contentRes] = await Promise.all([
        getPublicVisa(slug),
        websiteApi.getPublicContent()
      ]);
      if (visaRes.success) setVisa(visaRes.data.visa);
      if (contentRes) setContact(contentRes.contact || {});
    } catch (err) {
      console.error('Error loading visa:', err);
      if (err.response?.status === 429 || err.status === 429) {
        setError('rate_limit');
      } else {
        setError('general');
      }
    } finally {
      setLoading(false);
    }
  };

  const whatsappNum = visa?.contactNumber || contact.whatsapp || '966559229597';

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={`vd-star ${i < rating ? 'vd-star-filled' : ''}`}>
        <svg viewBox="0 0 24 24" fill={i < rating ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" width="16" height="16">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      </span>
    ));
  };

  if (loading) {
    return (
      <div className="vd-page" dir="rtl">
        <div className="vd-loading">
          <div className="vd-loading-spinner"></div>
          <p>جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!visa) {
    return (
      <div className="vd-page" dir="rtl">
        <div className="vd-not-found">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="48" height="48">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 8v4M12 16h.01" strokeLinecap="round"/>
          </svg>
          {error ? (
            <>
              <h2>{error === 'rate_limit' ? 'عذراً، تم تجاوز الحد المسموح من الطلبات' : 'حدث خطأ أثناء تحميل البيانات'}</h2>
              <button className="pbtn pbtn-primary" onClick={() => { setLoading(true); loadData(); }} style={{ marginTop: '1rem' }}>
                إعادة المحاولة
              </button>
            </>
          ) : (
            <>
              <h2>التأشيرة غير موجودة</h2>
              <Link to="/visas">العودة للتأشيرات</Link>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="vd-page" dir="rtl">
      {/* Top Bar */}
      <div className="vd-topbar">
        <div className="vd-topbar-inner">
          {whatsappNum && (
            <a href={`https://wa.me/${whatsappNum}`} target="_blank" rel="noopener noreferrer" className="vd-topbar-link">
              <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/></svg>
              واتساب
            </a>
          )}
          {whatsappNum && (
            <a href={`tel:${whatsappNum}`} className="vd-topbar-link">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" strokeLinecap="round" strokeLinejoin="round"/></svg>
              {whatsappNum}
            </a>
          )}
          <span className="vd-topbar-text">خدمات التأشيرات والسفر</span>
        </div>
      </div>

      {/* Navbar */}
      <nav className={`vd-nav ${scrolled ? 'vd-nav-scrolled' : ''}`}>
        <div className="vd-nav-inner">
          <Link to="/" className="vd-brand">
            <span className="vd-brand-ar">ألوان المسافر</span>
            <span className="vd-brand-en">TRAVEL COLORS</span>
          </Link>
          <div className="vd-nav-links">
            <Link to="/visas" className="vd-nav-link">التأشيرات</Link>
            <Link to="/ContactUs" className="vd-nav-link">تواصل معنا</Link>
            <button className="vd-back-btn" onClick={() => navigate('/visas')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              العودة للتأشيرات
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Banner */}
      <section className="vd-hero">
        <div className={`vd-hero-img-wrapper ${imgLoaded ? 'loaded' : ''}`}>
          {visa.coverImage && (
            <img
              src={`${API_URL}${visa.coverImage}`}
              alt={visa.countryName}
              className="vd-hero-bg-img"
              onLoad={() => setImgLoaded(true)}
            />
          )}
          {/* Shimmer overlay while loading */}
          {visa.coverImage && !imgLoaded && <div className="vd-hero-shimmer"></div>}
        </div>
        <div className="vd-hero-overlay"></div>
        <div className="vd-hero-content">
          <div className="vd-hero-info">
            {visa.flagImage && (
              <div className="vd-hero-flag">
                <img src={`${API_URL}${visa.flagImage}`} alt="علم" />
              </div>
            )}
            <div className="vd-hero-text">
              <h1>{visa.countryName}</h1>
              {visa.countryNameEn && <p className="vd-hero-en">{visa.countryNameEn}</p>}
              <div className="vd-hero-meta">
                <div className="vd-hero-rating">{renderStars(visa.rating || 5)}</div>
                <span className={`vd-hero-type ${visa.visaType === 'إلكترونية' ? 'elec' : 'normal'}`}>
                  تأشيرة {visa.visaType}
                </span>
              </div>
            </div>
          </div>
          {/* CTA in Hero */}
          <div className="vd-hero-cta">
            {visa.visaType === 'إلكترونية' ? (
              <button
                onClick={() => navigate(`/portal/visa-apply/${visa.slug || visa._id}`)}
                className="pbtn pbtn-md pbtn-primary vd-hero-cta-btn"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M14 2v6h6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                تقدم بطلب تأشيرة {visa.countryName.replace(/^التأشيرة\s*/i, '')} الآن
              </button>
            ) : (
              <a
                href={`https://wa.me/${whatsappNum}?text=${encodeURIComponent(`أرغب بالتقديم على ${visa.countryName}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="pbtn pbtn-md pbtn-primary vd-hero-cta-btn"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M14 2v6h6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                تقدم بطلب تأشيرة {visa.countryName.replace(/^التأشيرة\s*/i, '')} الآن
              </a>
            )}
            <a
              href={`https://wa.me/${whatsappNum}?text=${encodeURIComponent(`استفسار مجاني عن ${visa.countryName}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="pbtn pbtn-md pbtn-whatsapp vd-hero-cta-btn"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/>
              </svg>
              استفسارات مجانية
            </a>
          </div>
        </div>
      </section>

      {/* Content */}
      <div className="vd-content">
        {/* Price Card */}
        <div className="vd-price-card animate-on-scroll">
          <div className="vd-price-main">
            {visa.offerEnabled && visa.offerPrice ? (
              <>
                <span className="vd-price-old">{visa.price} {visa.currency}</span>
                <span className="vd-price-new">{visa.offerPrice} {visa.currency}</span>
                <span className="vd-price-badge">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" strokeLinecap="round" strokeLinejoin="round"/>
                    <line x1="7" y1="7" x2="7.01" y2="7"/>
                  </svg>
                  عرض خاص
                </span>
              </>
            ) : (
              <span className="vd-price-new">{visa.price} {visa.currency}</span>
            )}
          </div>
          {visa.processingDays && (
            <p className="vd-processing">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 6v6l4 2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              مدة المعالجة: {visa.processingDays}
            </p>
          )}
        </div>

        {/* Description */}
        {visa.description && (
          <div className="vd-section animate-on-scroll">
            <h3>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14 2v6h6M9 15h6M9 11h6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              عن التأشيرة
            </h3>
            <p className="vd-description">{visa.description}</p>
          </div>
        )}

        {/* Requirements */}
        {visa.requirements && visa.requirements.length > 0 && (
          <div className="vd-section vd-req-section animate-on-scroll">
            <h3>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M22 4L12 14.01l-3-3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              متطلبات التأشيرة
            </h3>
            <div className="vd-requirements-grid">
              {visa.requirements.map((req, i) => {
                const iconKey = req.icon || 'document';
                const colors = ICON_COLORS[iconKey] || ICON_COLORS.document;
                return (
                  <div className="vd-req-card" key={i}>
                    <div className="vd-req-card-top">
                      <span className="vd-req-icon" style={{ background: colors.bg, color: colors.color }}>
                        {REQ_ICONS[iconKey] || REQ_ICONS.document}
                      </span>
                      <span className={`vd-req-badge ${req.isRequired !== false ? 'required' : 'optional'}`}>
                        {req.isRequired !== false ? 'مطلوب' : 'معلومة'}
                      </span>
                    </div>
                    <h4 className="vd-req-card-title">{req.title}</h4>
                    {req.details && <p className="vd-req-card-details">{req.details}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Addons */}
        {visa.visaType === 'إلكترونية' && visa.addons && visa.addons.filter(a => a.enabled).length > 0 && (
          <div className="vd-section animate-on-scroll">
            <h3>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              خدمات إضافية
            </h3>
            <div className="vd-addons">
              {visa.addons.filter(a => a.enabled).map((addon, i) => (
                <div className="vd-addon-card" key={i}>
                  <div className="vd-addon-info">
                    <h4>{addon.name}</h4>
                    {addon.description && <p>{addon.description}</p>}
                  </div>
                  <span className="vd-addon-price">
                    +{addon.price} {visa.currency}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bottom CTA */}
        <div className="vd-bottom-cta animate-on-scroll">
          <p>هل أنت جاهز للتقديم؟</p>
          {visa.visaType === 'إلكترونية' ? (
            <button
              onClick={() => navigate(`/portal/visa-apply/${visa.slug || visa._id}`)}
              className="pbtn pbtn-lg pbtn-primary vd-bottom-cta-btn"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14 2v6h6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              قدّم طلب تأشيرة {visa.countryName.replace(/^التأشيرة\s*/i, '')} الآن
            </button>
          ) : (
            <a
              href={`https://wa.me/${whatsappNum}?text=${encodeURIComponent(`أرغب بالتقديم على ${visa.countryName}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="pbtn pbtn-lg pbtn-whatsapp vd-bottom-cta-btn"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/>
              </svg>
              تقدم بطلب تأشيرة {visa.countryName.replace(/^التأشيرة\s*/i, '')} عبر واتساب
            </a>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="vd-footer">
        <div className="vd-footer-inner">
          <div className="vd-footer-brand">
            <span className="vd-footer-brand-ar">ألوان المسافر</span>
            <span className="vd-footer-brand-en">TRAVEL COLORS</span>
          </div>
          <div className="vd-footer-links">
            <Link to="/">الرئيسية</Link>
            <Link to="/visas">التأشيرات</Link>
            <Link to="/international-license">الرخصة الدولية</Link>
            <Link to="/ContactUs">تواصل معنا</Link>
          </div>
          <p className="vd-footer-copy">© {new Date().getFullYear()} Travel Colors - ألوان المسافر. جميع الحقوق محفوظة</p>
        </div>
      </footer>

      {/* WhatsApp Float */}
      {contact.whatsapp && (
        <a
          href={`https://wa.me/${contact.whatsapp}`}
          target="_blank"
          rel="noopener noreferrer"
          className="vd-whatsapp-float"
          title="تواصل عبر واتساب"
        >
          <svg viewBox="0 0 24 24" fill="white" width="28" height="28"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/></svg>
        </a>
      )}
    </div>
  );
};

export default VisaDetail;
