import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getPublicVisas } from '../../api/visaCatalogApi';
import { websiteApi } from '../../api';
import { useClientAuth } from '../../context/ClientAuthContext';
import '../../styles/public-shared.css';
import './VisaCatalog.css';

const API_URL = (process.env.REACT_APP_API_URL || 'http://localhost:5002').replace(/\/api\/?$/, '');

const VisaCatalog = () => {
  const [visas, setVisas] = useState([]);
  const [contact, setContact] = useState({ whatsapp: '966559229597' });
  const [loading, setLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated } = useClientAuth();

  useEffect(() => { loadData(); }, []);

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
  }, [visas]);

  const loadData = async () => {
    try {
      const [visaRes, contentRes] = await Promise.all([
        getPublicVisas(),
        websiteApi.getPublicContent()
      ]);
      if (visaRes.success) setVisas(visaRes.data.visas);
      if (contentRes) setContact(contentRes.contact || {});
    } catch (err) {
      console.error('Error loading visas:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={`vcat-star ${i < rating ? 'vcat-star-filled' : ''}`}>
        <svg viewBox="0 0 24 24" fill={i < rating ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" width="14" height="14">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      </span>
    ));
  };

  return (
    <div className="vcat-page" dir="rtl">
      {/* Top Bar */}
      <div className="vcat-topbar">
        <div className="vcat-topbar-inner">
          {contact.whatsapp && (
            <a href={`https://wa.me/${contact.whatsapp}`} target="_blank" rel="noopener noreferrer" className="vcat-topbar-link">
              <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/></svg>
              واتساب
            </a>
          )}
          {contact.phone && (
            <a href={`tel:${contact.phone}`} className="vcat-topbar-link">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" strokeLinecap="round" strokeLinejoin="round"/></svg>
              {contact.phone}
            </a>
          )}
          <span className="vcat-topbar-text">خدمات التأشيرات والسفر</span>
        </div>
      </div>

      {/* Navbar */}
      <nav className={`vcat-nav ${scrolled ? 'vcat-nav-scrolled' : ''}`}>
        <div className="vcat-nav-inner">
          <Link to="/" className="vcat-brand">
            <span className="vcat-brand-ar">ألوان المسافر</span>
            <span className="vcat-brand-en">TRAVEL COLORS</span>
          </Link>
          <div className={`vcat-nav-links ${mobileMenuOpen ? 'open' : ''}`}>
            <Link to="/">الرئيسية</Link>
            <Link to="/visas" className="active">التأشيرات</Link>
            <Link to="/international-license">الرخصة الدولية</Link>
            <Link to="/ContactUs">تواصل معنا</Link>
            {isAuthenticated ? (
              <Link to="/portal/dashboard" className="vcat-nav-portal">لوحتي</Link>
            ) : (
              <Link to="/portal/login" className="vcat-nav-portal">تسجيل الدخول</Link>
            )}
          </div>
          <button className="vcat-menu-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24"><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"/></svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24"><path d="M3 12h18M3 6h18M3 18h18" strokeLinecap="round" strokeLinejoin="round"/></svg>
            )}
          </button>
        </div>
      </nav>

      {/* Hero Banner */}
      <section className="vcat-hero">
        <div className="vcat-hero-bg"></div>
        <div className="vcat-hero-content">
          <div className="vcat-hero-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="40" height="40">
              <circle cx="12" cy="12" r="10" />
              <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1>التأشيرات</h1>
          <p>اختر وجهتك واحصل على تأشيرتك بسهولة واحترافية</p>
          <div className="vcat-hero-stats">
            <div className="vcat-stat">
              <span className="vcat-stat-num">{visas.length}+</span>
              <span className="vcat-stat-label">وجهة متاحة</span>
            </div>
            <div className="vcat-stat-sep"></div>
            <div className="vcat-stat">
              <span className="vcat-stat-num">24/7</span>
              <span className="vcat-stat-label">دعم متواصل</span>
            </div>
            <div className="vcat-stat-sep"></div>
            <div className="vcat-stat">
              <span className="vcat-stat-num">100%</span>
              <span className="vcat-stat-label">خدمة موثوقة</span>
            </div>
          </div>
        </div>
      </section>

      {/* Visa Cards */}
      <section className="vcat-section">
        {loading ? (
          <div className="vcat-loading">
            <div className="vcat-loading-spinner"></div>
            <p>جاري التحميل...</p>
          </div>
        ) : visas.length === 0 ? (
          <div className="vcat-empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="48" height="48">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 8v4M12 16h.01" strokeLinecap="round"/>
            </svg>
            <p>لا توجد تأشيرات متاحة حالياً</p>
          </div>
        ) : (
          <div className="vcat-grid">
            {visas.map((visa, index) => (
              <div className="vcat-card animate-on-scroll" key={visa._id} style={{ animationDelay: `${index * 0.1}s` }}>
                {/* Cover Image */}
                <div className="vcat-card-cover">
                  {visa.coverImage ? (
                    <img src={`${API_URL}${visa.coverImage}`} alt={visa.countryName} loading="lazy" />
                  ) : (
                    <div className="vcat-card-cover-placeholder">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="48" height="48">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  )}
                  <div className="vcat-card-overlay"></div>

                  {/* Flag */}
                  <div className="vcat-card-flag">
                    {visa.flagImage ? (
                      <img src={`${API_URL}${visa.flagImage}`} alt="علم" loading="lazy" />
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" width="24" height="24">
                        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" strokeLinecap="round" strokeLinejoin="round"/>
                        <line x1="4" y1="22" x2="4" y2="15" strokeLinecap="round"/>
                      </svg>
                    )}
                  </div>

                  {/* Offer Badge */}
                  {visa.offerEnabled && visa.offerPrice && (
                    <span className="vcat-card-offer">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
                        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" strokeLinecap="round" strokeLinejoin="round"/>
                        <line x1="7" y1="7" x2="7.01" y2="7"/>
                      </svg>
                      عرض خاص
                    </span>
                  )}
                </div>

                {/* Card Body */}
                <div className="vcat-card-body">
                  <h3 className="vcat-card-title">{visa.countryName}</h3>

                  {/* Rating */}
                  <div className="vcat-card-rating">
                    {renderStars(visa.rating || 5)}
                  </div>

                  {/* Price */}
                  <div className="vcat-card-price">
                    {visa.offerEnabled && visa.offerPrice ? (
                      <>
                        <span className="vcat-price-old">{visa.price} {visa.currency}</span>
                        <span className="vcat-price-new">{visa.offerPrice} {visa.currency}</span>
                      </>
                    ) : (
                      <span className="vcat-price-current">{visa.price} {visa.currency}</span>
                    )}
                  </div>

                  {visa.processingDays && (
                    <p className="vcat-card-days">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M12 6v6l4 2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      {visa.processingDays}
                    </p>
                  )}

                  {/* CTA */}
                  <button
                    className="pbtn pbtn-full pbtn-primary vcat-card-btn"
                    onClick={() => navigate(`/visas/${visa.slug}`)}
                  >
                    تقدم بطلب تأشيرة {visa.countryName.replace(/^التأشيرة\s*/i, '')} الآن
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                      <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="vcat-footer">
        <div className="vcat-footer-inner">
          <div className="vcat-footer-brand">
            <span className="vcat-footer-brand-ar">ألوان المسافر</span>
            <span className="vcat-footer-brand-en">TRAVEL COLORS</span>
          </div>
          <div className="vcat-footer-links">
            <Link to="/">الرئيسية</Link>
            <Link to="/visas">التأشيرات</Link>
            <Link to="/international-license">الرخصة الدولية</Link>
            <Link to="/ContactUs">تواصل معنا</Link>
          </div>
          {contact.whatsapp && (
            <div className="vcat-footer-contact">
              <a href={`https://wa.me/${contact.whatsapp}`} target="_blank" rel="noopener noreferrer" className="vcat-footer-wa">
                <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/></svg>
                تواصل عبر واتساب
              </a>
            </div>
          )}
          <p className="vcat-footer-copy">© {new Date().getFullYear()} Travel Colors - ألوان المسافر. جميع الحقوق محفوظة</p>
        </div>
      </footer>

      {/* WhatsApp Float */}
      {contact.whatsapp && (
        <a
          href={`https://wa.me/${contact.whatsapp}`}
          target="_blank"
          rel="noopener noreferrer"
          className="vcat-whatsapp-float"
          title="تواصل عبر واتساب"
        >
          <svg viewBox="0 0 24 24" fill="white" width="28" height="28"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/></svg>
        </a>
      )}
    </div>
  );
};

export default VisaCatalog;
