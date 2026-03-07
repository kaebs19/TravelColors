import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { websiteApi } from '../../api';
import { getIconSvg } from '../../utils/icons';
import '../../styles/public-shared.css';
import './ContactUs.css';

const ContactUs = () => {
  const navigate = useNavigate();

  const [contacts, setContacts] = useState([]);
  const [workingHours, setWorkingHours] = useState(null);
  const [mapEmbed, setMapEmbed] = useState('');
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);

    const loadData = async () => {
      try {
        const res = await websiteApi.getPublicContent();
        const data = res.data;
        // Sort by order, filter active only
        const depts = (data.contactDepartments || [])
          .filter(d => d.isActive !== false)
          .sort((a, b) => (a.order || 0) - (b.order || 0));
        setContacts(depts);
        setWorkingHours(data.workingHours || null);
        setMapEmbed(data.mapEmbed || '');
      } catch (err) {
        console.error('Error loading contact data:', err);
        // Fallback to empty
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleWhatsApp = (number) => {
    window.open(`https://wa.me/${number}`, '_blank');
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text.replace(/\s/g, ''));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const renderContactAction = (contact, index) => {
    if (contact.type === 'whatsapp') {
      return (
        <button
          className="wa-btn-round"
          onClick={() => handleWhatsApp(contact.whatsapp)}
          title="تواصل عبر واتساب"
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="#fff">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
        </button>
      );
    }
    if (contact.type === 'email') {
      return (
        <a
          className="contactus-email-btn"
          href={`mailto:${contact.phone}`}
          title="أرسل بريد إلكتروني"
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="#fff">
            <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
          </svg>
        </a>
      );
    }
    if (contact.type === 'location') {
      return (
        <span className="contactus-location-btn" title="الموقع">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="#fff">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
          </svg>
        </span>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="public-page" dir="rtl">
        {/* Navbar */}
        <nav className="public-nav">
          <div className="public-nav-content">
            <div className="public-nav-brand" onClick={() => navigate('/')}>
              <span className="public-nav-name">
                <span className="public-nav-name-ar">ألوان المسافر</span>
                <span className="public-nav-name-en">Travel Colors</span>
              </span>
            </div>
            <button className="public-nav-back" onClick={() => navigate('/')}>
              العودة للرئيسية
            </button>
          </div>
        </nav>

        <div className="contactus-loading">
          <div className="contactus-loading-spinner" />
          <p>جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="public-page" dir="rtl">
      {/* Navbar */}
      <nav className="public-nav">
        <div className="public-nav-content">
          <div className="public-nav-brand" onClick={() => navigate('/')}>
            <span className="public-nav-name">
              <span className="public-nav-name-ar">ألوان المسافر</span>
              <span className="public-nav-name-en">Travel Colors</span>
            </span>
          </div>
          <button className="public-nav-back" onClick={() => navigate('/')}>
            العودة للرئيسية
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="public-hero">
        <div className="public-hero-content">
          <h1>تواصل معنا</h1>
          <p>نسعد بتواصلكم معنا في أي وقت. فريقنا جاهز لخدمتكم ومساعدتكم في كل ما يخص السفر والسياحة.</p>
        </div>
      </section>

      {/* Main Content Grid */}
      <div className="contactus-main">
        <div className="contactus-grid">
          {/* Right Column - Info */}
          <div className="contactus-info-col">
            {/* Working Hours Card */}
            {workingHours && (
              <div className="contactus-hours-card">
                <div className="contactus-hours-header">
                  <span className="contactus-hours-icon">{getIconSvg('🕐', 28)}</span>
                  <h3>ساعات العمل</h3>
                </div>
                <div className="contactus-hours-body">
                  <div className="contactus-hours-row">
                    <span className="contactus-hours-status open">
                      <span className="contactus-status-dot contactus-status-dot--open" />
                    </span>
                    <div>
                      <strong>{workingHours.weekdays}</strong>
                      {workingHours.weekdaysTime && (
                        <span className="contactus-hours-time">{workingHours.weekdaysTime}</span>
                      )}
                    </div>
                  </div>
                  <div className="contactus-hours-row">
                    <span className="contactus-hours-status closed">
                      <span className="contactus-status-dot contactus-status-dot--closed" />
                    </span>
                    <div>
                      <strong>{workingHours.friday}</strong>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Contact Info Heading */}
            <div className="contactus-info-heading">
              <h2>معلومات التواصل</h2>
              <p>تواصل مع القسم المناسب مباشرة عبر الهاتف أو واتساب</p>
            </div>

            {/* Contact List */}
            <div className="contactus-cards-list">
              {contacts.map((contact, index) => (
                <div
                  className={`contactus-card contactus-card--${contact.type}`}
                  key={contact._id || index}
                >
                  <div className="contactus-card-info">
                    <span className="contactus-card-icon">{getIconSvg(contact.icon, 20)}</span>
                    <div className="contactus-card-text">
                      <span className="contactus-card-dept">{contact.name}</span>
                      <span
                        className="contactus-card-phone"
                        dir={contact.type === 'location' ? 'rtl' : 'ltr'}
                      >
                        {contact.phone}
                        {contact.type === 'whatsapp' && contact.phone && (
                          <button
                            className="contactus-copy-btn"
                            onClick={() => handleCopy(contact.phone, contact._id || index)}
                            title="نسخ الرقم"
                          >
                            {copiedId === (contact._id || index) ? (
                              <>
                                <span className="contactus-copy-icon">{getIconSvg('✓', 14)}</span>
                                <span className="contactus-copied-text">تم النسخ</span>
                              </>
                            ) : (
                              <span className="contactus-copy-icon">{getIconSvg('📄', 14)}</span>
                            )}
                          </button>
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="contactus-card-action">
                    {renderContactAction(contact, index)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Left Column - Map */}
          {mapEmbed && (
            <div className="contactus-map-col">
              <div className="contactus-map-wrapper">
                <div className="contactus-map-badge">
                  <span className="contactus-map-badge-icon">{getIconSvg('📍', 18)}</span>
                  {' '}موقعنا على الخريطة
                </div>
                <iframe
                  className="contactus-map-iframe"
                  src={mapEmbed}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="موقع ألوان المسافر على الخريطة"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="public-footer">
        <div className="public-footer-brand">
          <span className="public-footer-brand-ar">ألوان المسافر</span>
          <span className="public-footer-brand-en">TRAVEL COLORS</span>
        </div>
        <nav className="public-footer-nav">
          <span onClick={() => navigate('/')}>الرئيسية</span>
          <span onClick={() => navigate('/visas')}>التأشيرات</span>
          <span onClick={() => navigate('/international-license')}>الرخصة الدولية</span>
          <span onClick={() => navigate('/ContactUs')}>تواصل معنا</span>
        </nav>
        <p>&copy; {new Date().getFullYear()} Travel Colors - ألوان المسافر. جميع الحقوق محفوظة</p>
        <div className="public-footer-links">
          <span onClick={() => navigate('/privacy')}>سياسة الخصوصية</span>
          <span className="public-footer-sep">|</span>
          <span onClick={() => navigate('/terms')}>الشروط والأحكام</span>
        </div>
      </footer>
    </div>
  );
};

export default ContactUs;
