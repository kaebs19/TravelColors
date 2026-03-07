import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { websiteApi } from '../../api';
import { useClientAuth } from '../../context/ClientAuthContext';
import '../../styles/public-shared.css';
import './InternationalLicense.css';

const InternationalLicense = () => {
  const [contact, setContact] = useState({ whatsapp: '966559229597' });
  const [licenseData, setLicenseData] = useState({
    price: '200', currency: 'ريال', offerEnabled: false, offerPrice: '', description: ''
  });
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated } = useClientAuth();

  useEffect(() => {
    const loadContent = async () => {
      try {
        const res = await websiteApi.getPublicContent();
        if (res.success) {
          if (res.data?.contact) setContact(res.data.contact);
          if (res.data?.internationalLicense) {
            setLicenseData(prev => ({ ...prev, ...res.data.internationalLicense }));
          }
        }
      } catch (err) { /* use default */ }
    };
    loadContent();
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) entry.target.classList.add('visible');
        });
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const whatsappLink = contact?.whatsapp ? `https://wa.me/${contact.whatsapp}` : '#';

  const handleApply = () => {
    navigate(isAuthenticated ? '/portal/license/apply' : '/portal/login');
  };

  return (
    <div className="license-page" dir="rtl">
      {/* Top Bar */}
      <div className="license-topbar">
        <div className="license-topbar-inner">
          {contact.whatsapp && (
            <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="license-topbar-link">
              <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/></svg>
              واتساب
            </a>
          )}
          <span className="license-topbar-text">خدمات التأشيرات والسفر</span>
        </div>
      </div>

      {/* Navbar */}
      <nav className={`license-nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="license-nav-container">
          <div className="license-nav-brand" onClick={() => navigate('/')}>
            <span className="license-nav-ar">ألوان المسافر</span>
            <span className="license-nav-en">TRAVEL COLORS</span>
          </div>
          <div className="license-nav-links">
            <Link to="/visas" className="license-nav-link">التأشيرات</Link>
            <Link to="/ContactUs" className="license-nav-link">تواصل معنا</Link>
            <button className="pbtn pbtn-sm pbtn-ghost license-back-btn" onClick={() => navigate('/')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round"/></svg>
              العودة للرئيسية
            </button>
          </div>
        </div>
      </nav>

      {/* Banner */}
      <div className="license-banner">
        <div className="license-banner-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="36" height="36">
            <rect x="3" y="4" width="18" height="16" rx="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M3 10h18M7 16h2M13 16h2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h1>الرخصة الدولية</h1>
        <p>استخراج رخصة القيادة الدولية بسرعة واحترافية</p>
      </div>

      {/* Content */}
      <div className="license-content">
        {/* Price Card */}
        <div className="license-price-card animate-on-scroll">
          <span className="license-price-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="40" height="40">
              <rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M7 16h2M13 16h2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
          <h3>رخصة القيادة الدولية</h3>
          <p>صالحة للقيادة في أكثر من 150 دولة حول العالم</p>
          {licenseData.offerEnabled && licenseData.offerPrice ? (
            <div className="license-price-amount-wrapper license-has-offer">
              <div className="license-price-old">
                <span className="license-price-old-amount">{licenseData.price}</span>
                <span className="license-price-old-currency">{licenseData.currency}</span>
              </div>
              <div className="license-price-new">
                <span className="license-price-amount">{licenseData.offerPrice}</span>
                <span className="license-price-currency">{licenseData.currency}</span>
              </div>
              <span className="license-offer-badge">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" strokeLinecap="round" strokeLinejoin="round"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                عرض خاص
              </span>
            </div>
          ) : (
            <div className="license-price-amount-wrapper">
              <span className="license-price-amount">{licenseData.price}</span>
              <span className="license-price-currency">{licenseData.currency}</span>
            </div>
          )}
        </div>

        {/* Add-ons */}
        {(licenseData.addons || []).filter(a => a.enabled !== false && a.name).length > 0 && (
          <div className="license-addons-section animate-on-scroll">
            <h2>
              <span className="license-section-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </span>
              خدمات إضافية متاحة
            </h2>
            <div className="license-addons-grid">
              {(licenseData.addons || []).filter(a => a.enabled !== false && a.name).map((addon, i) => (
                <div className="license-addon-item animate-on-scroll delay-1" key={i}>
                  <div className="license-addon-info">
                    <h4>{addon.name}</h4>
                    {addon.description && <p>{addon.description}</p>}
                  </div>
                  <div className="license-addon-price">+{addon.price} {licenseData.currency}</div>
                </div>
              ))}
            </div>
            <p className="license-addons-note">يمكنك اختيار الخدمات الإضافية عند تعبئة نموذج الطلب</p>
          </div>
        )}

        {/* Delivery Options */}
        {licenseData.deliveryOptions && (
          <div className="license-delivery-section animate-on-scroll">
            <h2>
              <span className="license-section-icon delivery">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
              </span>
              خيارات التسليم
            </h2>
            <div className="license-delivery-grid">
              {licenseData.deliveryOptions.pickup?.enabled !== false && (
                <div className="license-delivery-card animate-on-scroll delay-1">
                  <span className="license-delivery-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="28" height="28"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" strokeLinecap="round" strokeLinejoin="round"/><polyline points="9 22 9 12 15 12 15 22" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </span>
                  <h4>استلام من المكتب</h4>
                  <div className="license-delivery-price">
                    {parseFloat(licenseData.deliveryOptions.pickup?.price) === 0 ? 'مجاناً' : `${licenseData.deliveryOptions.pickup?.price} ${licenseData.currency}`}
                  </div>
                  {licenseData.deliveryOptions.pickup?.message && (
                    <p className="license-delivery-desc">{licenseData.deliveryOptions.pickup.message}</p>
                  )}
                </div>
              )}
              {licenseData.deliveryOptions.delivery?.enabled !== false && (
                <div className="license-delivery-card animate-on-scroll delay-2">
                  <span className="license-delivery-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="28" height="28"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                  </span>
                  <h4>توصيل</h4>
                  <div className="license-delivery-price">{licenseData.deliveryOptions.delivery?.price} {licenseData.currency}</div>
                  {licenseData.deliveryOptions.delivery?.message && (
                    <p className="license-delivery-desc">{licenseData.deliveryOptions.delivery.message}</p>
                  )}
                </div>
              )}
              {licenseData.deliveryOptions.shipping?.enabled !== false && (
                <div className="license-delivery-card animate-on-scroll delay-3">
                  <span className="license-delivery-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="28" height="28"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                  </span>
                  <h4>شحن</h4>
                  <div className="license-delivery-price">{licenseData.deliveryOptions.shipping?.price} {licenseData.currency}</div>
                  {licenseData.deliveryOptions.shipping?.message && (
                    <p className="license-delivery-desc">{licenseData.deliveryOptions.shipping.message}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Required Documents */}
        <div className="license-docs-section animate-on-scroll">
          <h2>
            <span className="license-section-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeLinecap="round" strokeLinejoin="round"/><path d="M14 2v6h6M9 15h6M9 11h6" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </span>
            المستندات المطلوبة
          </h2>
          <div className="license-docs-grid">
            <div className="license-doc-card animate-on-scroll delay-1">
              <span className="license-doc-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="28" height="28"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M7 16h2M13 16h2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </span>
              <h4>صورة رخصة القيادة السعودية</h4>
              <p>صورة واضحة للوجه الأمامي للرخصة</p>
            </div>
            <div className="license-doc-card animate-on-scroll delay-2">
              <span className="license-doc-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="28" height="28"><path d="M6 2h12a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"/><circle cx="12" cy="10" r="3"/><path d="M8 17h8"/></svg>
              </span>
              <h4>صورة الجواز</h4>
              <p>صورة صفحة البيانات من جواز السفر</p>
            </div>
            <div className="license-doc-card animate-on-scroll delay-3">
              <span className="license-doc-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="28" height="28"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
              </span>
              <h4>صورة شخصية</h4>
              <p>صورة شخصية حديثة بخلفية بيضاء</p>
            </div>
          </div>
        </div>

        {/* Processing Steps */}
        <div className="license-block animate-on-scroll">
          <div className="license-block-header">
            <span className="license-block-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </span>
            <h3>خطوات التقديم</h3>
          </div>
          <div className="license-steps">
            <div className="license-step animate-on-scroll delay-1">
              <div className="license-step-num">1</div>
              <div className="license-step-body">
                <h4>رفع المستندات</h4>
                <p>ارفع صور الرخصة والجواز والصورة الشخصية عبر النموذج الإلكتروني</p>
              </div>
            </div>
            <div className="license-step animate-on-scroll delay-2">
              <div className="license-step-num">2</div>
              <div className="license-step-body">
                <h4>تعبئة البيانات</h4>
                <p>أكمل بياناتك الشخصية - يتم تعبئة بعض الحقول تلقائياً من المستندات</p>
              </div>
            </div>
            <div className="license-step animate-on-scroll delay-3">
              <div className="license-step-num">3</div>
              <div className="license-step-body">
                <h4>المراجعة والإرسال</h4>
                <p>راجع بياناتك وأرسل الطلب - نتولى نحن الباقي</p>
              </div>
            </div>
          </div>
        </div>

        {/* Processing Time */}
        <div className="license-block animate-on-scroll">
          <div className="license-block-header">
            <span className="license-block-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </span>
            <h3>مدة الإصدار</h3>
          </div>
          <div className="license-info-card">
            <p>يتم إصدار الرخصة الدولية خلال 3 إلى 5 أيام عمل</p>
          </div>
          <ul className="license-checklist">
            <li>صالحة لمدة سنة واحدة من تاريخ الإصدار</li>
            <li>معترف بها دولياً في أكثر من 150 دولة</li>
            <li>تتطلب رخصة قيادة سعودية سارية المفعول</li>
          </ul>
        </div>

        {/* Privacy */}
        <div className="license-privacy-card animate-on-scroll">
          <div className="license-privacy-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="32" height="32"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <h4>حماية البيانات والخصوصية</h4>
          <p>نستخدم تقنية التشفير المتقدمة AES-256 لحماية جميع معلوماتك الشخصية والمستندات المرفقة، مما يضمن أعلى مستويات الأمان والخصوصية</p>
        </div>

        {/* CTA */}
        <div className="license-cta animate-on-scroll">
          <button className="pbtn pbtn-lg pbtn-primary license-cta-btn" onClick={handleApply}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeLinecap="round" strokeLinejoin="round"/><path d="M14 2v6h6" strokeLinecap="round" strokeLinejoin="round"/></svg>
            قدّم الآن
          </button>
          <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="pbtn pbtn-lg pbtn-whatsapp license-consult-btn">
            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/></svg>
            استشارة مجانية
          </a>
        </div>
      </div>

      {/* Footer */}
      <footer className="license-footer">
        <div className="license-footer-inner">
          <div className="license-footer-brand">
            <span className="license-footer-brand-ar">ألوان المسافر</span>
            <span className="license-footer-brand-en">TRAVEL COLORS</span>
          </div>
          <div className="license-footer-links">
            <Link to="/">الرئيسية</Link>
            <Link to="/visas">التأشيرات</Link>
            <Link to="/international-license">الرخصة الدولية</Link>
            <Link to="/ContactUs">تواصل معنا</Link>
          </div>
          <p className="license-footer-copy">© {new Date().getFullYear()} Travel Colors - ألوان المسافر. جميع الحقوق محفوظة</p>
        </div>
      </footer>

      {/* WhatsApp Float */}
      <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="license-whatsapp-float" aria-label="تواصل واتساب">
        <svg viewBox="0 0 24 24" fill="white" width="28" height="28"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/></svg>
      </a>
    </div>
  );
};

export default InternationalLicense;
