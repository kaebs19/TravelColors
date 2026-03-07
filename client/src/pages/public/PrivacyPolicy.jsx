import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { websiteApi } from '../../api';
import '../../styles/public-shared.css';
import './LegalPage.css';

const DEFAULT_CONTENT = {
  contact: {
    phone: '+966 55 922 9597',
    email: 'info@trcolors.com',
    whatsapp: '966559229597',
    address: 'المملكة العربية السعودية'
  },
  socialMedia: { twitter: '', instagram: '', facebook: '', snapchat: '' },
  general: { siteName: 'ألوان المسافر', siteNameEn: 'Travel Colors', siteDescription: '', logo: '' }
};

const PrivacyPolicy = () => {
  const [content, setContent] = useState(DEFAULT_CONTENT);
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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

  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';
  const baseUrl = apiUrl.replace('/api', '');

  const getImageUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${baseUrl}${path}`;
  };

  const scrollToSection = (sectionId) => {
    const el = document.getElementById(sectionId);
    if (el) {
      const offset = 80;
      const top = el.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  const sections = [
    {
      id: 'section-1',
      title: 'جمع المعلومات',
      content: (
        <>
          <p>
            تقوم شركة ألوان المسافر بجمع المعلومات الشخصية اللازمة لتقديم خدمات السفر والسياحة بأعلى مستوى من الجودة والكفاءة. نحرص على جمع البيانات الضرورية فقط لإتمام المعاملات وتوفير الخدمات المطلوبة.
          </p>
          <p>تشمل المعلومات التي قد نقوم بجمعها ما يلي:</p>
          <ul>
            <li>الاسم الكامل كما يظهر في جواز السفر والهوية الوطنية</li>
            <li>بيانات جواز السفر (رقم الجواز، تاريخ الإصدار والانتهاء، جهة الإصدار)</li>
            <li>معلومات الاتصال (رقم الهاتف، البريد الإلكتروني، العنوان البريدي)</li>
            <li>بيانات الدفع والمعاملات المالية المتعلقة بالخدمات المقدمة</li>
            <li>صور شخصية ومستندات ثبوتية مطلوبة لإجراءات التأشيرات</li>
            <li>معلومات الرحلة المفضلة وتفضيلات السفر</li>
            <li>كشوفات حساب بنكية وخطابات تعريف (عند الحاجة لإجراءات التأشيرة)</li>
            <li>بيانات التأمين الصحي وتأمين السفر</li>
          </ul>
        </>
      )
    },
    {
      id: 'section-2',
      title: 'استخدام المعلومات',
      content: (
        <>
          <p>
            نستخدم المعلومات التي نجمعها لأغراض محددة ومشروعة تتعلق بتقديم خدماتنا وتحسين تجربة عملائنا. لا نستخدم بياناتكم الشخصية لأي غرض آخر دون الحصول على موافقتكم المسبقة.
          </p>
          <p>تُستخدم المعلومات المجمّعة في الأغراض التالية:</p>
          <ul>
            <li>معالجة طلبات التأشيرات وتقديمها للسفارات والقنصليات المعنية</li>
            <li>إتمام حجوزات الطيران والفنادق والبرامج السياحية</li>
            <li>التواصل معكم بشأن حالة طلباتكم وحجوزاتكم</li>
            <li>إرسال تحديثات وإشعارات متعلقة بالخدمات المطلوبة</li>
            <li>تحسين جودة خدماتنا وتطوير تجربة المستخدم على موقعنا</li>
            <li>الامتثال للمتطلبات القانونية والتنظيمية في المملكة العربية السعودية</li>
            <li>إعداد التقارير الداخلية وتحليل بيانات الخدمات لتحسين الأداء</li>
            <li>الرد على استفساراتكم وتقديم الدعم الفني اللازم</li>
          </ul>
        </>
      )
    },
    {
      id: 'section-3',
      title: 'حماية البيانات',
      content: (
        <>
          <p>
            تلتزم شركة ألوان المسافر بتطبيق أعلى معايير الأمان لحماية بياناتكم الشخصية من أي وصول غير مصرح به أو استخدام غير قانوني أو إفصاح أو تعديل أو إتلاف. نتبع أفضل الممارسات العالمية في مجال أمن المعلومات.
          </p>
          <p>تشمل إجراءات الحماية المتبعة:</p>
          <ul>
            <li>تشفير جميع البيانات الشخصية والمالية باستخدام بروتوكولات التشفير المتقدمة (SSL/TLS)</li>
            <li>تخزين البيانات على خوادم آمنة ومحمية بجدران حماية متعددة الطبقات</li>
            <li>تقييد الوصول إلى البيانات الشخصية للموظفين المصرح لهم فقط</li>
            <li>إجراء مراجعات أمنية دورية وتحديث أنظمة الحماية بشكل مستمر</li>
            <li>تدريب جميع الموظفين على سياسات حماية البيانات والخصوصية</li>
            <li>الالتزام بنظام حماية البيانات الشخصية الصادر في المملكة العربية السعودية</li>
          </ul>
        </>
      )
    },
    {
      id: 'section-4',
      title: 'ملفات تعريف الارتباط',
      content: (
        <>
          <p>
            يستخدم موقعنا الإلكتروني ملفات تعريف الارتباط (Cookies) وتقنيات تتبع مشابهة لتحسين تجربة التصفح وتقديم محتوى مخصص يتناسب مع احتياجاتكم.
          </p>
          <p>نستخدم ملفات تعريف الارتباط للأغراض التالية:</p>
          <ul>
            <li>ملفات تعريف الارتباط الضرورية: لضمان عمل الموقع بشكل صحيح وتوفير الوظائف الأساسية</li>
            <li>ملفات تعريف الارتباط التحليلية: لفهم كيفية استخدام الزوار لموقعنا وتحسين أدائه</li>
            <li>ملفات تعريف الارتباط الوظيفية: لتذكر تفضيلاتكم وإعداداتكم السابقة</li>
            <li>حفظ حالة تسجيل الدخول لتسهيل الوصول إلى حساباتكم</li>
          </ul>
          <p>
            يمكنكم التحكم في إعدادات ملفات تعريف الارتباط من خلال إعدادات المتصفح الخاص بكم. يرجى العلم أن تعطيل بعض ملفات تعريف الارتباط قد يؤثر على وظائف الموقع وتجربة الاستخدام.
          </p>
        </>
      )
    },
    {
      id: 'section-5',
      title: 'مشاركة المعلومات',
      content: (
        <>
          <p>
            لا تقوم شركة ألوان المسافر ببيع أو تأجير بياناتكم الشخصية لأي أطراف خارجية. قد نشارك معلوماتكم فقط في الحالات الضرورية لإتمام الخدمات المطلوبة وفقاً للشروط التالية:
          </p>
          <ul>
            <li>السفارات والقنصليات: مشاركة البيانات المطلوبة لمعالجة طلبات التأشيرات والموافقة عليها</li>
            <li>شركات الطيران: تقديم بيانات المسافرين اللازمة لإصدار تذاكر السفر وإتمام الحجوزات</li>
            <li>الفنادق ومقدمو الخدمات السياحية: مشاركة بيانات الحجز الضرورية لتأكيد الإقامة</li>
            <li>شركات التأمين: تقديم المعلومات المطلوبة لإصدار وثائق تأمين السفر</li>
            <li>الجهات الحكومية: الامتثال للمتطلبات القانونية والأوامر القضائية عند الضرورة</li>
            <li>مراكز تقديم طلبات التأشيرات (VFS، TLS وغيرها): لإتمام إجراءات التقديم نيابة عنكم</li>
          </ul>
          <p>
            في جميع الحالات، نحرص على مشاركة الحد الأدنى من البيانات المطلوبة فقط، ونتأكد من التزام الأطراف المستقبلة بمعايير حماية البيانات المناسبة.
          </p>
        </>
      )
    },
    {
      id: 'section-6',
      title: 'حقوق المستخدم',
      content: (
        <>
          <p>
            وفقاً لنظام حماية البيانات الشخصية في المملكة العربية السعودية، يحق لكم ممارسة عدد من الحقوق المتعلقة ببياناتكم الشخصية المحفوظة لدينا.
          </p>
          <p>تشمل حقوقكم ما يلي:</p>
          <ul>
            <li>الحق في الوصول: الاطلاع على البيانات الشخصية المحفوظة لديكم لدينا والحصول على نسخة منها</li>
            <li>الحق في التصحيح: طلب تعديل أو تحديث أي بيانات شخصية غير دقيقة أو غير مكتملة</li>
            <li>الحق في الحذف: طلب حذف بياناتكم الشخصية عندما لا تكون هناك حاجة قانونية للاحتفاظ بها</li>
            <li>الحق في الاعتراض: الاعتراض على معالجة بياناتكم الشخصية في حالات معينة</li>
            <li>الحق في نقل البيانات: طلب نقل بياناتكم إلى جهة أخرى بصيغة قابلة للقراءة</li>
            <li>الحق في سحب الموافقة: سحب موافقتكم على معالجة البيانات في أي وقت</li>
          </ul>
          <p>
            لممارسة أي من هذه الحقوق، يرجى التواصل معنا عبر وسائل الاتصال المذكورة في نهاية هذه السياسة. سنعمل على الرد على طلباتكم خلال مدة لا تتجاوز 30 يوم عمل.
          </p>
        </>
      )
    },
    {
      id: 'section-7',
      title: 'تعديل السياسة',
      content: (
        <>
          <p>
            تحتفظ شركة ألوان المسافر بحق تعديل أو تحديث سياسة الخصوصية هذه في أي وقت لتعكس التغييرات في ممارساتنا أو المتطلبات القانونية والتنظيمية. نلتزم بإخطاركم بأي تغييرات جوهرية.
          </p>
          <ul>
            <li>سيتم نشر أي تعديلات على هذه الصفحة مع تحديث تاريخ "آخر تحديث"</li>
            <li>في حالة التعديلات الجوهرية، سنقوم بإشعاركم عبر البريد الإلكتروني أو من خلال إشعار بارز على موقعنا</li>
            <li>استمراركم في استخدام خدماتنا بعد نشر التعديلات يُعتبر موافقة على السياسة المحدّثة</li>
            <li>ننصحكم بمراجعة هذه السياسة بشكل دوري للاطلاع على أي تحديثات</li>
          </ul>
        </>
      )
    },
    {
      id: 'section-8',
      title: 'التواصل معنا',
      content: (
        <>
          <p>
            إذا كانت لديكم أي أسئلة أو استفسارات حول سياسة الخصوصية هذه أو كيفية تعاملنا مع بياناتكم الشخصية، يسعدنا تواصلكم معنا عبر القنوات التالية:
          </p>
          <div className="legal-contact-box">
            <div className="legal-contact-item">
              <span className="legal-contact-label">البريد الإلكتروني:</span>
              <a href={`mailto:${content.contact?.email || 'info@trcolors.com'}`}>
                {content.contact?.email || 'info@trcolors.com'}
              </a>
            </div>
            <div className="legal-contact-item">
              <span className="legal-contact-label">الهاتف:</span>
              <a href={`tel:${content.contact?.phone || '+966 55 922 9597'}`} dir="ltr">
                {content.contact?.phone || '+966 55 922 9597'}
              </a>
            </div>
            <div className="legal-contact-item">
              <span className="legal-contact-label">العنوان:</span>
              <span>{content.contact?.address || 'المملكة العربية السعودية'}</span>
            </div>
          </div>
          <p>
            فريق حماية البيانات في شركة ألوان المسافر مستعد للرد على جميع استفساراتكم وملاحظاتكم خلال أوقات العمل الرسمية.
          </p>
        </>
      )
    }
  ];

  return (
    <div className="public-page legal-page" dir="rtl">
      {/* Navbar */}
      <nav className="public-nav">
        <div className="public-nav-content">
          <div className="public-nav-brand" onClick={() => navigate('/')}>
            {content.general?.logo && (
              <img
                src={getImageUrl(content.general.logo)}
                alt={content.general?.siteName || 'ألوان المسافر'}
                className="public-nav-logo"
              />
            )}
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
      <section className="legal-hero">
        <div className="legal-hero-content">
          <h1>سياسة الخصوصية</h1>
          <p>
            نلتزم في شركة ألوان المسافر بحماية خصوصيتكم وبياناتكم الشخصية. توضح هذه السياسة كيفية جمعنا واستخدامنا وحمايتنا لمعلوماتكم عند استخدام خدماتنا.
          </p>
          <div className="legal-hero-badge">
            آخر تحديث: مارس 2026
          </div>
        </div>
      </section>

      {/* Content */}
      <div className="legal-content-wrapper">
        <div className="legal-content">
          {/* Table of Contents */}
          <div className="legal-toc">
            <h3>محتويات السياسة</h3>
            <ul>
              {sections.map((section, index) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToSection(section.id);
                    }}
                  >
                    <span className="legal-toc-number">{index + 1}</span>
                    {section.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Sections */}
          {sections.map((section, index) => (
            <div className="legal-section" id={section.id} key={section.id}>
              <div className="legal-section-header">
                <span className="legal-section-number">{index + 1}</span>
                <h2>{section.title}</h2>
              </div>
              {section.content}
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

export default PrivacyPolicy;
