import { getIconSvg } from '../../utils/icons';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { websiteApi } from '../../api';
import '../../styles/public-shared.css';
import './LegalPage.css';

const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';
const baseUrl = apiUrl.replace('/api', '');
const getImageUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${baseUrl}${path}`;
};

const DEFAULT_CONTENT = {
  contact: {
    phone: '+966 55 922 9597',
    email: 'info@trcolors.com',
    whatsapp: '966559229597',
    address: 'المملكة العربية السعودية'
  },
  socialMedia: { twitter: '', instagram: '', facebook: '', snapchat: '' },
  general: { siteName: 'ألوان المسافر', siteNameEn: 'Travel Colors', logo: '' }
};

const sections = [
  {
    id: 1,
    title: 'قبول الشروط',
    content: 'باستخدامك لموقع وخدمات شركة ألوان المسافر للسياحة والسفر، فإنك توافق على الالتزام بهذه الشروط والأحكام بالكامل. إذا كنت لا توافق على أي جزء من هذه الشروط، يُرجى عدم استخدام خدماتنا. تحتفظ الشركة بحقها في تعديل هذه الشروط في أي وقت، وسيتم إشعارك بأي تغييرات جوهرية عبر الموقع الإلكتروني أو البريد الإلكتروني المسجل لدينا.',
    points: [
      'يُعد استخدام الموقع أو أي من خدماتنا موافقة ضمنية على هذه الشروط والأحكام',
      'تسري هذه الشروط من تاريخ أول استخدام لخدماتنا',
      'يجب على المستخدم مراجعة هذه الشروط بشكل دوري للاطلاع على أي تحديثات',
      'في حال وجود تعارض بين هذه الشروط وأي اتفاقية خاصة مع العميل، تسري أحكام الاتفاقية الخاصة'
    ]
  },
  {
    id: 2,
    title: 'الخدمات المقدمة',
    content: 'تقدم شركة ألوان المسافر مجموعة شاملة من خدمات السفر والسياحة المرخصة من هيئة السياحة السعودية. نسعى لتقديم أفضل الخدمات بأعلى معايير الجودة والاحترافية.',
    points: [
      'استخراج التأشيرات السياحية لجميع الدول بما في ذلك تأشيرات الشنقن والتأشيرات الإلكترونية',
      'حجوزات الطيران على جميع خطوط الطيران المحلية والدولية بأفضل الأسعار',
      'حجوزات الفنادق والشقق الفندقية حول العالم بتصنيفات مختلفة',
      'تصميم وتنفيذ البرامج السياحية وبرامج شهر العسل المخصصة',
      'خدمات تأمين السفر الشامل بالتعاون مع شركات التأمين المعتمدة',
      'استخراج رخص القيادة الدولية المعترف بها دولياً'
    ]
  },
  {
    id: 3,
    title: 'التسجيل والمعلومات الشخصية',
    content: 'يلتزم العميل بتقديم معلومات صحيحة ودقيقة وكاملة عند التسجيل أو طلب أي خدمة من خدماتنا. تُستخدم هذه المعلومات لمعالجة الطلبات وتقديم الخدمات المطلوبة وفقاً لسياسة الخصوصية الخاصة بنا.',
    points: [
      'يجب أن تكون جميع المعلومات المقدمة (الاسم، رقم الجواز، تاريخ الميلاد، إلخ) مطابقة للوثائق الرسمية',
      'يتحمل العميل كامل المسؤولية عن صحة ودقة المعلومات المقدمة',
      'أي خطأ في المعلومات قد يؤدي إلى رفض التأشيرة أو إلغاء الحجز، ولا تتحمل الشركة مسؤولية ذلك',
      'يلتزم العميل بتحديث بياناته فور حدوث أي تغيير',
      'يجب الحفاظ على سرية بيانات الحساب وعدم مشاركتها مع أي طرف آخر'
    ]
  },
  {
    id: 4,
    title: 'الأسعار والدفع',
    content: 'جميع الأسعار المعروضة على موقعنا هي بالريال السعودي (SAR) ما لم يُذكر خلاف ذلك. تخضع الأسعار للتغيير دون إشعار مسبق وذلك تبعاً لتغيرات أسعار الصرف ورسوم الخدمات والضرائب المعمول بها.',
    points: [
      'الأسعار المعروضة قابلة للتغيير ولا تُعد ملزمة إلا بعد تأكيد الحجز والدفع',
      'يتم قبول الدفع عبر التحويل البنكي، والبطاقات الائتمانية (فيزا، ماستركارد)، ونقاط البيع، والدفع النقدي في مقر الشركة',
      'رسوم السفارات والجهات الحكومية منفصلة عن رسوم خدماتنا وغير قابلة للاسترداد',
      'قد تُضاف رسوم إضافية للخدمات العاجلة أو الطلبات الخاصة',
      'يتم إصدار فاتورة ضريبية معتمدة لجميع المعاملات وفقاً لنظام ضريبة القيمة المضافة',
      'في حال رفض عملية الدفع الإلكتروني، يجب على العميل التواصل مع البنك المصدر للبطاقة'
    ]
  },
  {
    id: 5,
    title: 'سياسة الإلغاء والاسترداد',
    content: 'تختلف سياسة الإلغاء والاسترداد حسب نوع الخدمة المقدمة. يُرجى مراجعة الشروط الخاصة بكل خدمة قبل إتمام عملية الحجز. فيما يلي السياسات العامة المطبقة:',
    points: [
      'رسوم التأشيرات: غير قابلة للاسترداد بعد تقديم الطلب للسفارة أو الجهة المختصة، حيث تُعد رسوم السفارة مدفوعة ولا يمكن استرجاعها',
      'حجوزات الطيران: تخضع لسياسة الإلغاء الخاصة بشركة الطيران المعنية، وقد تُفرض رسوم إلغاء أو تعديل حسب نوع التذكرة ووقت الإلغاء',
      'حجوزات الفنادق: تخضع لسياسة الإلغاء الخاصة بالفندق، وبعض الحجوزات غير قابلة للاسترداد خاصة خلال مواسم الذروة',
      'البرامج السياحية: يمكن الإلغاء قبل 14 يوم عمل من تاريخ بدء البرنامج مع خصم 25% من إجمالي المبلغ كرسوم إدارية',
      'تأمين السفر: يمكن إلغاء الوثيقة قبل تاريخ بدء سريانها واسترداد المبلغ بعد خصم الرسوم الإدارية',
      'يتم معالجة طلبات الاسترداد خلال 14 يوم عمل من تاريخ الموافقة على الطلب'
    ]
  },
  {
    id: 6,
    title: 'حدود المسؤولية',
    content: 'تبذل شركة ألوان المسافر قصارى جهدها لتقديم أفضل الخدمات، إلا أنها لا تتحمل المسؤولية عن الأمور الخارجة عن إرادتها. يُقر العميل بعلمه واطلاعه على حدود المسؤولية التالية:',
    points: [
      'لا تتحمل الشركة مسؤولية قرارات السفارات والقنصليات بشأن منح أو رفض التأشيرات',
      'لا تتحمل الشركة مسؤولية تأخير أو إلغاء الرحلات من قبل شركات الطيران لأي سبب كان',
      'لا تتحمل الشركة مسؤولية تغيير مستوى الخدمة في الفنادق أو أي ظروف قاهرة كالكوارث الطبيعية والأوبئة والحروب',
      'لا تتحمل الشركة مسؤولية فقدان أو تلف الأمتعة أثناء السفر',
      'لا تتحمل الشركة مسؤولية أي أضرار ناتجة عن تقديم العميل لمعلومات غير صحيحة أو غير مكتملة',
      'يتحمل العميل مسؤولية التحقق من صلاحية جواز السفر وتوفر جميع المستندات المطلوبة قبل السفر'
    ]
  },
  {
    id: 7,
    title: 'حقوق الملكية الفكرية',
    content: 'جميع المحتويات المعروضة على موقع شركة ألوان المسافر محمية بموجب قوانين حماية الملكية الفكرية المعمول بها في المملكة العربية السعودية والاتفاقيات الدولية ذات الصلة.',
    points: [
      'جميع النصوص والصور والشعارات والتصاميم والرسومات هي ملكية حصرية لشركة ألوان المسافر',
      'يُمنع نسخ أو إعادة إنتاج أو توزيع أو تعديل أي محتوى من الموقع دون إذن كتابي مسبق',
      'علامة "ألوان المسافر" التجارية وشعارها مسجلة ومحمية قانونياً',
      'أي استخدام غير مصرح به للمحتوى يعرّض المخالف للمساءلة القانونية والتعويض عن الأضرار'
    ]
  },
  {
    id: 8,
    title: 'إنهاء الخدمة',
    content: 'تحتفظ شركة ألوان المسافر بحقها في تعليق أو إنهاء حساب أي مستخدم أو رفض تقديم الخدمة في الحالات التالية:',
    points: [
      'مخالفة أي من هذه الشروط والأحكام',
      'تقديم معلومات كاذبة أو مضللة أو وثائق مزورة',
      'استخدام الخدمات لأغراض غير مشروعة أو مخالفة للأنظمة المعمول بها',
      'الإساءة لموظفي الشركة أو عملائها بأي شكل من الأشكال',
      'محاولة التحايل على أنظمة الدفع أو استغلال العروض بطرق غير مشروعة',
      'يحق للعميل إلغاء حسابه في أي وقت مع مراعاة الالتزامات المالية القائمة'
    ]
  },
  {
    id: 9,
    title: 'القانون المعمول به',
    content: 'تخضع هذه الشروط والأحكام وتُفسَّر وفقاً لأنظمة وقوانين المملكة العربية السعودية. في حال نشوء أي نزاع يتعلق بهذه الشروط أو الخدمات المقدمة، يتم حله وفقاً للإجراءات التالية:',
    points: [
      'يتم أولاً محاولة حل النزاع ودياً عن طريق التفاوض المباشر بين الأطراف',
      'في حال تعذر الحل الودي، يُحال النزاع إلى الجهات القضائية المختصة في مدينة الرياض',
      'تختص المحاكم السعودية في مدينة الرياض بالنظر في أي نزاع ينشأ عن هذه الشروط',
      'تُطبق أحكام نظام التجارة الإلكترونية ونظام حماية المستهلك السعودي على جميع المعاملات'
    ]
  },
  {
    id: 10,
    title: 'التواصل معنا',
    content: 'لأي استفسارات أو ملاحظات حول هذه الشروط والأحكام أو أي من خدماتنا، يسعدنا تواصلكم معنا عبر القنوات التالية:',
    points: []
  }
];

const Terms = () => {
  const [content, setContent] = useState(DEFAULT_CONTENT);
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
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

  const scrollToSection = (id) => {
    const element = document.getElementById(`section-${id}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const logo = content.general?.logo ? getImageUrl(content.general.logo) : '';
  const contact = content.contact || DEFAULT_CONTENT.contact;

  return (
    <div className="public-page legal-page" dir="rtl">
      {/* Navbar */}
      <nav className="public-nav">
        <div className="public-nav-content">
          <div className="public-nav-brand" onClick={() => navigate('/')}>
            {logo && <img src={logo} alt="ألوان المسافر" className="public-nav-logo" />}
            <span className="public-nav-name">
              <span className="public-nav-name-ar">{content.general?.siteName || 'ألوان المسافر'}</span>
              <span className="public-nav-name-en">{content.general?.siteNameEn || 'Travel Colors'}</span>
            </span>
          </div>
          <button className="public-nav-back" onClick={() => navigate('/')}>
            العودة للرئيسية
          </button>
        </div>
      </nav>

      {/* Hero */}
      <div className="legal-hero">
        <h1>الشروط والأحكام</h1>
        <p>يُرجى قراءة هذه الشروط والأحكام بعناية قبل استخدام خدمات شركة ألوان المسافر للسياحة والسفر</p>
        <div className="legal-updated">آخر تحديث: يناير 2025</div>
      </div>

      {/* Content */}
      <div className="legal-content-wrapper">
        <div className="legal-content">
          {/* Table of Contents */}
          <div className="legal-toc">
            <h3>محتويات الصفحة</h3>
            <ul className="legal-toc-list">
              {sections.map((section) => (
                <li
                  key={section.id}
                  className="legal-toc-item"
                  onClick={() => scrollToSection(section.id)}
                >
                  {section.id}. {section.title}
                </li>
              ))}
            </ul>
          </div>

          {/* Sections */}
          {sections.map((section) => (
            <div className="legal-section" id={`section-${section.id}`} key={section.id}>
              <div className="legal-section-header">
                <span className="legal-section-number">{section.id}</span>
                <h2>{section.title}</h2>
              </div>
              <p>{section.content}</p>
              {section.points.length > 0 && (
                <ul>
                  {section.points.map((point, idx) => (
                    <li key={idx}>{point}</li>
                  ))}
                </ul>
              )}

              {/* Contact box for last section */}
              {section.id === 10 && (
                <div className="legal-contact-box">
                  <h3>معلومات التواصل</h3>
                  <div className="legal-contact-item">
                    <span>{getIconSvg('📧', 18)}</span>
                    <span>البريد الإلكتروني: {contact.email}</span>
                  </div>
                  <div className="legal-contact-item">
                    <span>{getIconSvg('📱', 18)}</span>
                    <span>الهاتف: {contact.phone}</span>
                  </div>
                  <div className="legal-contact-item">
                    <span>{getIconSvg('💬', 18)}</span>
                    <span>واتساب: {contact.whatsapp}</span>
                  </div>
                  <div className="legal-contact-item">
                    <span>{getIconSvg('📍', 18)}</span>
                    <span>العنوان: {contact.address}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
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

export default Terms;
