import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { websiteApi } from '../../api';
import '../../styles/public-shared.css';
import './UsVisa.css';

const API_URL = (process.env.REACT_APP_API_URL || 'http://localhost:5002/api');

const UsVisa = () => {
  const [contact, setContact] = useState({ whatsapp: '966559229597' });
  const [visaSettings, setVisaSettings] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const loadContent = async () => {
      try {
        const [contentRes, visaRes] = await Promise.all([
          websiteApi.getPublicContent(),
          fetch(`${API_URL}/settings/us-visa-public`).then(r => r.json())
        ]);
        if (contentRes.success && contentRes.data?.contact) {
          setContact(contentRes.data.contact);
        }
        if (visaRes.success && visaRes.data) {
          setVisaSettings(visaRes.data);
        }
      } catch (err) {
        // use defaults
      }
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
  }, [visaSettings]);

  // استخدام رقم واتساب خاص بالتأشيرة الأمريكية أو الافتراضي
  const whatsappNum = visaSettings?.whatsappNumber || contact?.whatsapp || '966559229597';
  const whatsappLink = `https://wa.me/${whatsappNum}`;

  // بيانات الأسعار والنصوص من الإعدادات
  const bannerTitle = visaSettings?.bannerTitle || 'التأشيرة الأمريكية';
  const bannerSubtitle = visaSettings?.bannerSubtitle || 'جميع المتطلبات والمستندات المطلوبة للحصول على تأشيرتك';
  const currency = visaSettings?.currency || 'ريال';
  const processingDays = visaSettings?.processingDays || 'من 2 إلى 5 أيام عمل بعد إجراء المقابلة الشخصية';

  const visaTypes = [
    {
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="32" height="32"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" strokeLinecap="round" strokeLinejoin="round"/><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round"/></svg>,
      title: visaSettings?.touristLabel || 'تأشيرة سياحية',
      desc: visaSettings?.touristDesc || 'للسياحة والزيارات العائلية',
      price: visaSettings?.touristPrice || 950
    },
    {
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="32" height="32"><path d="M22 12h-4l-3 9L9 3l-3 9H2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
      title: visaSettings?.medicalLabel || 'تأشيرة علاج',
      desc: visaSettings?.medicalDesc || 'للعلاج والاستشفاء في أمريكا',
      price: visaSettings?.medicalPrice || 950
    },
    {
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="32" height="32"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 1.657 2.686 3 6 3s6-1.343 6-3v-5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
      title: visaSettings?.studentLabel || 'تأشيرة دراسة',
      desc: visaSettings?.studentDesc || 'للدراسة في الجامعات الأمريكية',
      price: visaSettings?.studentPrice || 1200
    }
  ];

  return (
    <div className="usvisa-page" dir="rtl">
      {/* Top Bar */}
      <div className="usvisa-topbar">
        <div className="usvisa-topbar-inner">
          {whatsappNum && (
            <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="usvisa-topbar-link">
              <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/></svg>
              واتساب
            </a>
          )}
          {whatsappNum && (
            <a href={`tel:${whatsappNum}`} className="usvisa-topbar-link">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" strokeLinecap="round" strokeLinejoin="round"/></svg>
              {whatsappNum}
            </a>
          )}
          <span className="usvisa-topbar-text">خدمات التأشيرات والسفر</span>
        </div>
      </div>

      {/* Navbar */}
      <nav className={`usvisa-nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="usvisa-nav-container">
          <div className="usvisa-nav-brand" onClick={() => navigate('/')}>
            <span className="usvisa-nav-ar">ألوان المسافر</span>
            <span className="usvisa-nav-en">TRAVEL COLORS</span>
          </div>
          <div className="usvisa-nav-links">
            <Link to="/visas" className="usvisa-nav-link">التأشيرات</Link>
            <Link to="/ContactUs" className="usvisa-nav-link">تواصل معنا</Link>
            <button className="pbtn pbtn-sm pbtn-ghost usvisa-back-btn" onClick={() => navigate('/')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round"/></svg>
              العودة للرئيسية
            </button>
          </div>
        </div>
      </nav>

      {/* Banner with CTA */}
      <div className="usvisa-banner">
        <div className="usvisa-banner-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="36" height="36">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h1>{bannerTitle}</h1>
        <p>{bannerSubtitle}</p>
        <div className="usvisa-banner-cta">
          <button className="pbtn pbtn-lg pbtn-primary usvisa-banner-cta-btn" onClick={() => navigate('/portal/login')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeLinecap="round" strokeLinejoin="round"/><path d="M14 2v6h6" strokeLinecap="round" strokeLinejoin="round"/></svg>
            ابدأ التقديم الآن
          </button>
          <a href={`${whatsappLink}?text=${encodeURIComponent('استفسار مجاني عن التأشيرة الأمريكية')}`} target="_blank" rel="noopener noreferrer" className="pbtn pbtn-lg pbtn-whatsapp usvisa-banner-consult-btn">
            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/>
            </svg>
            استشارة مجانية
          </a>
        </div>
      </div>

      {/* Visa Types */}
      <div className="usvisa-content">
        <div className="usvisa-types-section animate-on-scroll">
          <h2>أنواع التأشيرات المتاحة</h2>
          <div className="usvisa-types-grid">
            {visaTypes.map((vt, i) => (
              <div className={`usvisa-type-card animate-on-scroll delay-${i + 1}`} key={i}>
                <div className="usvisa-type-icon">{vt.icon}</div>
                <h4>{vt.title}</h4>
                <p>{vt.desc}</p>
                <div className="usvisa-type-price">
                  <span className="usvisa-price-amount">{vt.price}</span>
                  <span className="usvisa-price-currency">{currency}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* المستندات المطلوبة */}
        <div className="usvisa-block animate-on-scroll">
          <div className="usvisa-block-header">
            <span className="usvisa-block-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeLinecap="round" strokeLinejoin="round"/><path d="M14 2v6h6M9 15h6M9 11h6" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </span>
            <h3>المستندات المطلوبة</h3>
          </div>

          <div className="usvisa-doc animate-on-scroll delay-1">
            <div className="usvisa-doc-num">1</div>
            <div className="usvisa-doc-body">
              <h4>جواز السفر الأصلي</h4>
              <p>يجب أن يكون جواز السفر ساري المفعول لمدة لا تقل عن 6 أشهر من تاريخ انتهاء الرحلة المخطط لها</p>
            </div>
          </div>

          <div className="usvisa-doc animate-on-scroll delay-2">
            <div className="usvisa-doc-num">2</div>
            <div className="usvisa-doc-body">
              <h4>الصور الشخصية (5 صور)</h4>
              <ul className="usvisa-checklist">
                <li>التقاط الصور من استوديو تصوير متخصص</li>
                <li>رفع نسخة رقمية عند التقديم الإلكتروني</li>
                <li>طباعة 5 نسخ ورقية لكل متقدم</li>
              </ul>
              <div className="usvisa-specs-box">
                <strong>مواصفات الصورة المطلوبة:</strong>
                <ul>
                  <li>الأبعاد: 5×5 سم مع خلفية بيضاء نقية</li>
                  <li>الوجه واضح تماماً دون أي تعديل أو فلاتر</li>
                  <li>للرجال: عدم ارتداء غطاء الرأس (الشماغ أو الغترة)</li>
                  <li>للنساء: إظهار الوجه كاملاً مع خط الشعر الأمامي</li>
                  <li>التقاط الصور خلال الأشهر الستة الماضية</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="usvisa-doc animate-on-scroll delay-3">
            <div className="usvisa-doc-num">3</div>
            <div className="usvisa-doc-body">
              <h4>خطاب تعريف من جهة العمل (باللغة الإنجليزية)</h4>
              <ul className="usvisa-checklist">
                <li>للموظفين الحكوميين: خطاب رسمي مختوم بالختم الرسمي الملون للجهة الحكومية</li>
                <li>للموظفين في القطاع الخاص: خطاب على الأوراق الرسمية للشركة مع التصديق من الغرفة التجارية</li>
              </ul>
              <p className="usvisa-note">يجب أن يتضمن الخطاب: المسمى الوظيفي، تاريخ التعيين، الراتب الشهري، وأن يكون حديث الإصدار</p>
            </div>
          </div>

          <div className="usvisa-doc animate-on-scroll delay-1">
            <div className="usvisa-doc-num">4</div>
            <div className="usvisa-doc-body">
              <h4>كشف حساب بنكي</h4>
              <ul className="usvisa-checklist">
                <li>كشف حساب مفصل لآخر 3 أشهر</li>
                <li>يجب أن يكون باللغة الإنجليزية ومختوم من البنك</li>
                <li>الحد الأدنى للرصيد: 15,000 ريال سعودي أو ما يعادلها</li>
              </ul>
            </div>
          </div>

          <div className="usvisa-doc animate-on-scroll delay-2">
            <div className="usvisa-doc-num">5</div>
            <div className="usvisa-doc-body">
              <h4>للطلاب فقط: نموذج I-20</h4>
              <p>خطاب القبول الرسمي (I-20) من الجامعة أو المعهد الأمريكي المعتمد</p>
            </div>
          </div>
        </div>

        {/* المقابلة الشخصية */}
        <div className="usvisa-block animate-on-scroll">
          <div className="usvisa-block-header">
            <span className="usvisa-block-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2" strokeLinecap="round" strokeLinejoin="round"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
            </span>
            <h3>المقابلة الشخصية</h3>
          </div>
          <ul className="usvisa-checklist">
            <li>مقابلة إلزامية لجميع المتقدمين من عمر 14 سنة فما فوق</li>
            <li>المقابلة مطلوبة حتى لحاملي التأشيرات السابقة</li>
            <li>يتم تحديد موعد المقابلة بعد إكمال التقديم الإلكتروني</li>
          </ul>
        </div>

        {/* المدة المتوقعة */}
        <div className="usvisa-block animate-on-scroll">
          <div className="usvisa-block-header">
            <span className="usvisa-block-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </span>
            <h3>المدة المتوقعة لصدور التأشيرة</h3>
          </div>
          <div className="usvisa-info-card">
            <p>المدة المعتادة: {processingDays}</p>
          </div>
          <div className="usvisa-warning-card">
            <span className="usvisa-warning-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" strokeLinecap="round" strokeLinejoin="round"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </span>
            <p>قد تستغرق بعض الطلبات وقتاً أطول (حتى 30 يوم أو أكثر) بسبب المراجعة الإدارية الإضافية من قبل السفارة</p>
          </div>
        </div>

        {/* تنبيه مهم */}
        <div className="usvisa-block animate-on-scroll">
          <div className="usvisa-block-header">
            <span className="usvisa-block-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            </span>
            <h3>تنبيه مهم قبل السفر</h3>
          </div>
          <div className="usvisa-warning-card">
            <span className="usvisa-warning-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" strokeLinecap="round" strokeLinejoin="round"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </span>
            <p>ننصح بعدم إجراء أي حجوزات نهائية (طيران أو فنادق) قبل الحصول على التأشيرة المعتمدة لتجنب أي خسائر مالية</p>
          </div>
        </div>

        {/* حماية البيانات */}
        <div className="usvisa-privacy-card animate-on-scroll">
          <div className="usvisa-privacy-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="32" height="32"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <h4>حماية البيانات والخصوصية</h4>
          <p>نستخدم تقنية التشفير المتقدمة AES-256 لحماية جميع معلوماتك الشخصية والمستندات المرفقة، مما يضمن أعلى مستويات الأمان والخصوصية</p>
        </div>

        {/* معلومات مهمة */}
        <div className="usvisa-important-card animate-on-scroll">
          <strong>معلومات مهمة:</strong>
          <ul className="usvisa-checklist">
            <li>يجب ملء استمارة DS-160 الخاصة بالسفارة الأمريكية قبل حجز موعد المقابلة</li>
            <li>يمكنك البدء الآن وتجهيز المستندات قبل موعد المقابلة بـ 2-3 أيام</li>
          </ul>
        </div>

        {/* CTA */}
        <div className="usvisa-cta-wrapper animate-on-scroll">
          <button className="pbtn pbtn-lg pbtn-primary usvisa-cta-btn" onClick={() => navigate('/portal/login')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeLinecap="round" strokeLinejoin="round"/><path d="M14 2v6h6" strokeLinecap="round" strokeLinejoin="round"/></svg>
            ابدأ التقديم الآن
          </button>
          <a href={`${whatsappLink}?text=${encodeURIComponent('استفسار مجاني عن التأشيرة الأمريكية')}`} target="_blank" rel="noopener noreferrer" className="pbtn pbtn-lg pbtn-whatsapp usvisa-consult-btn">
            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            استشارة مجانية
          </a>
        </div>
      </div>

      {/* Footer */}
      <footer className="usvisa-footer">
        <div className="usvisa-footer-inner">
          <div className="usvisa-footer-brand">
            <span className="usvisa-footer-brand-ar">ألوان المسافر</span>
            <span className="usvisa-footer-brand-en">TRAVEL COLORS</span>
          </div>
          <div className="usvisa-footer-links">
            <Link to="/">الرئيسية</Link>
            <Link to="/visas">التأشيرات</Link>
            <Link to="/international-license">الرخصة الدولية</Link>
            <Link to="/ContactUs">تواصل معنا</Link>
          </div>
          <p className="usvisa-footer-copy">© {new Date().getFullYear()} Travel Colors - ألوان المسافر. جميع الحقوق محفوظة</p>
        </div>
      </footer>

      {/* WhatsApp Float */}
      <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="usvisa-whatsapp-float" aria-label="تواصل واتساب">
        <svg viewBox="0 0 24 24" fill="white" width="28" height="28">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
          <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/>
        </svg>
      </a>
    </div>
  );
};

export default UsVisa;
