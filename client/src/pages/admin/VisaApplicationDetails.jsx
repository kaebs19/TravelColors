import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { visaApi, customersApi } from '../../api';
import { DataRow as SharedDataRow, ImageLightbox as SharedLightbox, StatusUpdatePanel, CustomerSearch } from '../../components/admin';
import { useToast } from '../../context';
import { BASE_STATUS_MAP, getImageUrl, copyToClipboard, toEnDigits } from '../../utils/adminHelpers';
import './VisaApplicationDetails.css';

// ─── Constants ───────────────────────────────────────────────────────────────

const VISA_STATUS_MAP = {
  ...BASE_STATUS_MAP,
  // Override: remove statuses not used in US visa
};

const VISA_TYPE_MAP = { tourism: 'سياحية', medical: 'علاج', study: 'دراسة' };
const MARITAL_MAP = { single: 'أعزب/عزباء', married: 'متزوج/ة', divorced: 'مطلق/ة', widowed: 'أرمل/ة' };
const GENDER_MAP = { male: 'ذكر', female: 'أنثى' };
const DURATION_MAP = { days: 'يوم', weeks: 'أسبوع', months: 'شهر' };
const PURPOSE_MAP = { tourism: 'سياحة', study: 'دراسة', medical: 'علاج', official: 'رسمي', other: 'أخرى' };
const INTERVIEW_LANG_MAP = { arabic: 'العربية', english: 'الإنجليزية', french: 'الفرنسية', other: 'أخرى' };

const TABS = [
  { id: 'basic', label: 'المعلومات الأساسية', icon: '👤' },
  { id: 'contact', label: 'معلومات الاتصال', icon: '📞' },
  { id: 'travel', label: 'معلومات السفر', icon: '✈️' },
  { id: 'financial', label: 'المالية والوظيفية', icon: '💼' },
  { id: 'education', label: 'التعليم', icon: '🎓' },
  { id: 'family', label: 'العائلة', icon: '👨‍👩‍👦' },
  { id: 'previousTravel', label: 'السفر السابق', icon: '🛂' },
  { id: 'travelHistory', label: 'السفر والعسكرية', icon: '🌍' },
  { id: 'interview', label: 'المقابلة والتواصل', icon: '💬' },
  { id: 'declaration', label: 'الإقرار والملاحظات', icon: '📝' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatDate = (d) => {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' });
};

const displayBool = (v) => v === true ? 'نعم' : v === false ? 'لا' : '-';

const getParentName = (info, prefix) => {
  const first = info?.[`${prefix}FirstName`];
  const last = info?.[`${prefix}LastName`];
  const full = info?.[`${prefix}FullName`];
  if (first && last) return `${first} ${last}`;
  return full || first || '-';
};

// ─── Use shared DataRow component ────────────────────────────────────────────
const DataRow = SharedDataRow;

const Section = ({ title, children }) => (
  <div className="vad-section">
    <h3 className="vad-section-title">{title}</h3>
    <div className="vad-data-grid">{children}</div>
  </div>
);

// ─── Main Component ──────────────────────────────────────────────────────────

const VisaApplicationDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('basic');
  const [newStatus, setNewStatus] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [lightbox, setLightbox] = useState({ src: null, title: '', isPdf: false });
  const [linkedCustomer, setLinkedCustomer] = useState(null);
  const [linkLoading, setLinkLoading] = useState(false);
  const [allCopied, setAllCopied] = useState(false);
  const { showToast } = useToast();

  // ─── Copy All Data ─────────────────────────────────────────────────────────

  const handleCopyAll = useCallback(async () => {
    if (!app) return;
    const p = app.personalInfo || {};
    const pp = app.passportDetails || {};
    const c = app.contactInfo || {};
    const st = VISA_STATUS_MAP[app.status] || VISA_STATUS_MAP.draft;
    const lines = [
      `طلب تأشيرة أمريكية — ${VISA_TYPE_MAP[app.visaType] || app.visaType || ''}`,
      `رقم الطلب: ${app.applicationNumber || ''}`,
      `الحالة: ${st.label}`,
      '',
      'البيانات الشخصية:',
      `الاسم: ${p.fullName || ''}`,
      `الجنسية: ${p.nationality || ''}`,
      `تاريخ الميلاد: ${formatDate(p.dateOfBirth)}`,
      `رقم الهوية: ${p.nationalId || ''}`,
      '',
      'جواز السفر:',
      `رقم الجواز: ${pp.passportNumber || ''}`,
      `تاريخ الانتهاء: ${formatDate(pp.passportExpiryDate)}`,
      '',
      'التواصل:',
      c.emails?.length > 0 ? `البريد: ${c.emails[0]}` : '',
      c.phones?.length > 0 ? `الجوال: ${c.phones[0]}` : c.mobilePhone ? `الجوال: ${c.mobilePhone}` : '',
    ];
    await copyToClipboard(lines.filter(Boolean).join('\n'));
    setAllCopied(true);
    setTimeout(() => setAllCopied(false), 2000);
  }, [app]);

  // ─── WhatsApp ──────────────────────────────────────────────────────────────

  const handleWhatsApp = useCallback(() => {
    if (!app) return;
    const c = app.contactInfo || {};
    const phone = (c.phones?.[0] || c.mobilePhone || '').replace(/\D/g, '');
    if (!phone) { showToast('لا يوجد رقم جوال', 'error'); return; }
    const num = phone.startsWith('0') ? `966${phone.slice(1)}` : phone;
    window.open(`https://wa.me/${num}`, '_blank');
  }, [app, showToast]);

  // ─── Load Application ──────────────────────────────────────────────────────

  useEffect(() => {
    loadApplication();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadApplication = async () => {
    try {
      setLoading(true);
      const res = await visaApi.getApplication(id);
      if (res.success) {
        const application = res.data.application || res.data;
        setApp(application);
        setNewStatus(application.status);
        setAdminNotes(application.adminNotes || '');
        // جلب بيانات العميل المربوط
        if (application.customer) {
          try {
            const custRes = await customersApi.getCustomer(application.customer);
            setLinkedCustomer(custRes.data?.customer || null);
          } catch (e) {
            console.error('Error fetching linked customer:', e);
          }
        }
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'حدث خطأ في تحميل بيانات الطلب' });
    } finally {
      setLoading(false);
    }
  };

  // ─── Status & Notes Handler ────────────────────────────────────────────────

  const handleUpdateStatus = async () => {
    if (!newStatus) return;
    setSaving(true);
    try {
      const res = await visaApi.updateStatus(id, { status: newStatus, adminNotes });
      if (res.success) {
        const application = res.data?.application || res.data;
        setApp(application);
        setMessage({ type: 'success', text: 'تم تحديث الحالة بنجاح' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'حدث خطأ' });
    } finally {
      setSaving(false);
    }
  };

  // ─── Link / Unlink Customer ──────────────────────────────────────────────

  const handleLinkCustomer = async (customerId, customer) => {
    setLinkLoading(true);
    try {
      await visaApi.linkCustomerToVisa(id, customerId);
      setLinkedCustomer(customer);
      showToast('تم ربط العميل بالطلب بنجاح', 'success');
    } catch (err) {
      showToast('فشل في ربط العميل', 'error');
    } finally {
      setLinkLoading(false);
    }
  };

  const handleUnlinkCustomer = async () => {
    setLinkLoading(true);
    try {
      await visaApi.linkCustomerToVisa(id, null);
      setLinkedCustomer(null);
      showToast('تم إلغاء ربط العميل', 'success');
    } catch (err) {
      showToast('فشل في إلغاء الربط', 'error');
    } finally {
      setLinkLoading(false);
    }
  };

  // ─── Loading / Error States ────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="vad-page">
        <div className="vad-loading">جاري تحميل بيانات الطلب...</div>
      </div>
    );
  }

  if (!app) {
    return (
      <div className="vad-page">
        <div className="vad-error">
          لم يتم العثور على الطلب.
          <button onClick={() => navigate(-1)}>العودة</button>
        </div>
      </div>
    );
  }

  const statusInfo = VISA_STATUS_MAP[app.status] || VISA_STATUS_MAP.draft;
  const hasImages = app.passportImage || app.personalPhoto;

  const isPdfFile = (path) => path && (path.toLowerCase().endsWith('.pdf'));

  const openLightbox = (path, title) => {
    setLightbox({
      src: getImageUrl(path),
      title,
      isPdf: isPdfFile(path)
    });
  };

  // ─── Tab 1: Basic Info ─────────────────────────────────────────────────────

  const renderBasicTab = () => {
    const p = app.personalInfo || {};
    const pp = app.passportDetails || {};

    return (
      <>
        {/* Images & Documents */}
        {hasImages && (
          <div className="vad-section">
            <h3 className="vad-section-title">الصور والمستندات</h3>
            <div className="vad-images-row">
              {app.passportImage && (
                <div
                  className="vad-image-card vad-image-clickable"
                  onClick={() => openLightbox(app.passportImage, 'صورة الجواز')}
                >
                  <span className="vad-image-label">صورة الجواز</span>
                  {isPdfFile(app.passportImage) ? (
                    <div className="vad-pdf-preview">
                      <span className="vad-pdf-icon">📄</span>
                      <span className="vad-pdf-text">PDF</span>
                    </div>
                  ) : (
                    <img src={getImageUrl(app.passportImage)} alt="صورة الجواز" />
                  )}
                  <span className="vad-image-link">🔍 استعراض</span>
                </div>
              )}
              {app.personalPhoto && (
                <div
                  className="vad-image-card vad-image-clickable"
                  onClick={() => openLightbox(app.personalPhoto, 'الصورة الشخصية')}
                >
                  <span className="vad-image-label">الصورة الشخصية</span>
                  <img src={getImageUrl(app.personalPhoto)} alt="الصورة الشخصية" />
                  <span className="vad-image-link">🔍 استعراض</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Personal Info */}
        <Section title="البيانات الشخصية">
          <DataRow label="الاسم الكامل" value={p.fullName} />
          <DataRow label="الحالة الاجتماعية" value={MARITAL_MAP[p.maritalStatus] || p.maritalStatus} />
          <DataRow label="تاريخ الميلاد" value={formatDate(p.dateOfBirth)} />
          <DataRow label="مدينة الميلاد" value={p.birthCity} />
          <DataRow label="الدولة" value={p.country} />
          <DataRow label="الجنسية" value={p.nationality} />
          <DataRow label="رقم الهوية الوطنية" value={p.nationalId} dir="ltr" />
          <DataRow label="هل يحمل جنسية أخرى؟" value={displayBool(p.hasOtherNationality)} />
          {p.hasOtherNationality && (
            <DataRow label="تفاصيل الجنسية الأخرى" value={p.otherNationalityDetails} />
          )}
          <DataRow label="هل يقيم في دولة أخرى؟" value={displayBool(p.hasResidencyOtherCountry)} />
          {p.hasResidencyOtherCountry && (
            <DataRow label="تفاصيل الإقامة" value={p.residencyDetails} />
          )}
        </Section>

        {/* Passport Details */}
        <Section title="بيانات جواز السفر">
          <DataRow label="رقم الجواز" value={pp.passportNumber} dir="ltr" />
          <DataRow label="مكان الإصدار" value={pp.passportIssuePlace} />
          <DataRow label="تاريخ الإصدار" value={formatDate(pp.passportIssueDate)} />
          <DataRow label="تاريخ الانتهاء" value={formatDate(pp.passportExpiryDate)} />
          <DataRow label="هل فُقد الجواز سابقاً؟" value={displayBool(pp.passportLost)} />
        </Section>
      </>
    );
  };

  // ─── Tab 2: Contact Info ───────────────────────────────────────────────────

  const renderContactTab = () => {
    const c = app.contactInfo || {};
    const primaryEmail = (c.emails && c.emails.length > 0) ? c.emails[0] : c.email;
    const primaryPhone = (c.phones && c.phones.length > 0) ? c.phones[0] : c.mobilePhone;
    const additionalEmails = (c.emails && c.emails.length > 1) ? c.emails.slice(1).join(', ') : null;
    const additionalPhones = (c.phones && c.phones.length > 1) ? c.phones.slice(1).join(', ') : null;

    return (
      <Section title="معلومات الاتصال">
        <DataRow label="العنوان" value={c.streetAddress} />
        <DataRow label="المدينة / الحي" value={c.districtCity} />
        <DataRow label="البريد الإلكتروني الرئيسي" value={primaryEmail} dir="ltr" />
        <DataRow label="رقم الجوال الرئيسي" value={primaryPhone} dir="ltr" />
        <DataRow label="هاتف العمل" value={c.workPhone} dir="ltr" />
        {additionalEmails && (
          <DataRow label="بريد إلكتروني إضافي" value={additionalEmails} dir="ltr" />
        )}
        {additionalPhones && (
          <DataRow label="أرقام هاتف إضافية" value={additionalPhones} dir="ltr" />
        )}
        <DataRow label="أرقام وبريد سابقة" value={c.previousPhonesEmails} />
      </Section>
    );
  };

  // ─── Tab 3: Travel Info ────────────────────────────────────────────────────

  const renderTravelTab = () => {
    const t = app.travelInfo || {};
    const h = app.hostInfo || {};
    const tc = app.travelCompanions || {};

    const stayDisplay = t.stayDurationNumber
      ? `${t.stayDurationNumber} ${DURATION_MAP[t.stayDurationType] || t.stayDurationType || ''}`
      : t.stayDuration || '-';

    return (
      <>
        <Section title="معلومات السفر">
          <DataRow label="تاريخ الوصول المتوقع" value={formatDate(t.expectedArrivalDate)} />
          <DataRow label="الغرض من السفر" value={PURPOSE_MAP[t.travelPurpose] || t.travelPurpose} />
          <DataRow label="مدة الإقامة" value={stayDisplay} />
        </Section>

        <Section title="العنوان في أمريكا">
          <DataRow label="العنوان" value={t.usAddress || t.usStreetAddress} />
          <DataRow label="المدينة" value={t.usCity} />
          <DataRow label="الولاية" value={t.usState} />
        </Section>

        <Section title="معلومات المضيف">
          <DataRow label="اسم المضيف" value={h.hostName} />
          <DataRow label="عنوان المضيف" value={h.hostAddress} />
          <DataRow label="هاتف المضيف" value={h.hostPhone} dir="ltr" />
          <DataRow label="بريد المضيف" value={h.hostEmail} dir="ltr" />
        </Section>

        <Section title="مرافقو السفر">
          <DataRow label="هل يوجد مرافقون؟" value={displayBool(tc.hasCompanions)} />
          {tc.hasCompanions && tc.companions && tc.companions.length > 0 && (
            <div className="vad-companions-list">
              {tc.companions.map((comp, idx) => (
                <div key={idx} className="vad-companion-item">
                  <DataRow label={`المرافق ${idx + 1}`} value={comp.companionName} />
                  <DataRow label="صلة القرابة" value={comp.companionRelationship} />
                </div>
              ))}
            </div>
          )}
        </Section>
      </>
    );
  };

  // ─── Tab 4: Financial & Employment ─────────────────────────────────────────

  const renderFinancialTab = () => {
    const f = app.financialInfo || {};
    const e = app.employmentInfo || {};

    return (
      <>
        <Section title="المعلومات المالية">
          <DataRow label="الدفع الذاتي" value={displayBool(f.selfPaying)} />
          {!f.selfPaying && (
            <>
              <DataRow label="اسم الكفيل / المتكفل" value={f.sponsorName} />
              <DataRow label="عنوان الكفيل" value={f.sponsorAddress} />
              <DataRow label="صلة القرابة بالكفيل" value={f.sponsorRelationship} />
              <DataRow label="هاتف الكفيل" value={f.sponsorPhone} dir="ltr" />
              <DataRow label="بريد الكفيل" value={f.sponsorEmail} dir="ltr" />
            </>
          )}
        </Section>

        <Section title="الوظيفة الحالية">
          <DataRow label="يعمل حالياً؟" value={displayBool(e.isEmployed)} />
          {e.isEmployed && (
            <>
              <DataRow label="المسمى الوظيفي" value={e.currentJobTitle} />
              <DataRow label="جهة العمل" value={e.currentEmployer} />
              <DataRow label="عنوان جهة العمل" value={e.employerAddress} />
              <DataRow label="الراتب الشهري" value={e.monthlySalary} />
              <DataRow label="وصف العمل" value={e.jobDescription} />
              <DataRow label="تاريخ بدء العمل" value={formatDate(e.currentJobStartDate)} />
            </>
          )}
        </Section>

        {e.hasPreviousJob && (
          <Section title="الوظيفة السابقة">
            <DataRow label="جهة العمل السابقة" value={e.prevEmployerName} />
            <DataRow label="عنوان جهة العمل السابقة" value={e.prevEmployerAddress} />
            <DataRow label="المسمى الوظيفي السابق" value={e.prevJobTitle} />
            <DataRow label="اسم المدير السابق" value={e.prevManagerName} />
            <DataRow label="تاريخ بدء العمل السابق" value={formatDate(e.prevJobStartDate)} />
            <DataRow label="تاريخ انتهاء العمل السابق" value={formatDate(e.prevJobEndDate)} />
          </Section>
        )}
      </>
    );
  };

  // ─── Tab 5: Education ──────────────────────────────────────────────────────

  const renderEducationTab = () => {
    const ed = app.educationInfo || {};
    const refs = app.studentAdditionalInfo?.references || [];

    return (
      <>
        <Section title="التعليم">
          <DataRow label="هل لديه تعليم جامعي؟" value={displayBool(ed.hasEducation)} />
          {ed.hasEducation && (
            <>
              <DataRow label="اسم الجامعة" value={ed.universityName} />
              <DataRow label="مدينة الجامعة" value={ed.universityCity} />
              <DataRow label="عنوان الجامعة" value={ed.universityAddress} />
              <DataRow label="التخصص" value={ed.major} />
              <DataRow label="تاريخ بدء الدراسة" value={formatDate(ed.studyStartDate)} />
              <DataRow label="تاريخ التخرج" value={formatDate(ed.graduationDate)} />
            </>
          )}
        </Section>

        {refs.length > 0 && (
          <Section title="المراجع (تأشيرة الدراسة)">
            {refs.map((ref, idx) => (
              <div key={idx} className="vad-ref-item">
                <DataRow label={`اسم المرجع ${idx + 1}`} value={ref.refName} />
                <DataRow label="عنوان المرجع" value={ref.refAddress} />
                <DataRow label="هاتف المرجع" value={ref.refPhone} dir="ltr" />
              </div>
            ))}
          </Section>
        )}
      </>
    );
  };

  // ─── Tab 6: Family ─────────────────────────────────────────────────────────

  const renderFamilyTab = () => {
    const fam = app.familyInfo || {};
    const sp = app.spouseInfo || {};
    const isMarried = app.personalInfo?.maritalStatus === 'married';

    return (
      <>
        <Section title="الأب">
          <DataRow label="اسم الأب" value={getParentName(fam, 'father')} />
          <DataRow label="تاريخ ميلاد الأب" value={formatDate(fam.fatherDOB)} />
        </Section>

        <Section title="الأم">
          <DataRow label="اسم الأم" value={getParentName(fam, 'mother')} />
          <DataRow label="تاريخ ميلاد الأم" value={formatDate(fam.motherDOB)} />
        </Section>

        {isMarried && (
          <Section title="الزوج/ة">
            <DataRow label="الجنس" value={GENDER_MAP[sp.spouseGender] || sp.spouseGender} />
            <DataRow label="الاسم الكامل" value={sp.spouseFullName} />
            <DataRow label="تاريخ الميلاد" value={formatDate(sp.spouseDOB)} />
            <DataRow label="الجنسية" value={sp.spouseNationality} />
            <DataRow label="مكان الميلاد" value={sp.spouseBirthPlace} />
            <DataRow label="العنوان" value={sp.spouseAddress} />
          </Section>
        )}

        <Section title="أقارب في أمريكا">
          <DataRow label="أقارب من الدرجة الأولى في أمريكا؟" value={displayBool(fam.hasImmediateRelativesUS)} />
          <DataRow label="أي أقارب في أمريكا؟" value={displayBool(fam.hasAnyRelativesUS)} />
          {(fam.hasImmediateRelativesUS || fam.hasAnyRelativesUS) && (
            <>
              <DataRow label="اسم القريب" value={fam.relativeName} />
              <DataRow label="عنوان القريب" value={fam.relativeAddress} />
              <DataRow label="هاتف القريب" value={fam.relativePhone} dir="ltr" />
              <DataRow label="صلة القرابة" value={fam.relativeRelationship} />
            </>
          )}
        </Section>
      </>
    );
  };

  // ─── Tab 7: Previous US Travel ─────────────────────────────────────────────

  const renderPreviousTravelTab = () => {
    const pt = app.previousUSTravel || {};

    return (
      <Section title="السفر السابق لأمريكا">
        <DataRow label="هل سبق زيارة أمريكا؟" value={displayBool(pt.beenToUS)} />
        {pt.beenToUS && (
          <>
            <DataRow label="تاريخ آخر وصول لأمريكا" value={formatDate(pt.lastUSArrival)} />
            <DataRow label="نوع التأشيرة السابقة" value={pt.previousVisaType} />
            <DataRow label="تاريخ إصدار آخر تأشيرة" value={formatDate(pt.lastVisaIssueDate)} />
            <DataRow label="رقم التأشيرة" value={pt.visaNumber} dir="ltr" />
          </>
        )}
        <DataRow label="هل يتقدم لنفس نوع التأشيرة؟" value={displayBool(pt.sameVisaType)} />
        <DataRow label="هل تم أخذ بصمات سابقاً؟" value={displayBool(pt.fingerprinted)} />
        <DataRow label="هل فُقدت أو سُرقت التأشيرة؟" value={displayBool(pt.visaLostStolen)} />
        <DataRow label="هل أُلغيت التأشيرة؟" value={displayBool(pt.visaCancelled)} />
        <DataRow label="هل يملك رخصة قيادة أمريكية؟" value={displayBool(pt.usDriversLicense)} />
        {pt.usDriversLicense && (
          <DataRow label="رقم الرخصة والولاية" value={pt.licenseNumberState} dir="ltr" />
        )}
        <DataRow label="هل رُفضت تأشيرة سابقاً؟" value={displayBool(pt.visaRefused)} />
      </Section>
    );
  };

  // ─── Tab 8: Travel History & Military ──────────────────────────────────────

  const renderTravelHistoryTab = () => {
    const th = app.travelHistoryMilitary || {};
    const countries = (th.visitedCountries && th.visitedCountries.length > 0)
      ? th.visitedCountries.join(', ')
      : th.countriesVisited5Years;

    return (
      <>
        <Section title="الدول المزارة خلال 5 سنوات">
          <DataRow label="الدول" value={countries} />
        </Section>

        <Section title="الخدمة العسكرية">
          <DataRow label="هل خدم في الجيش؟" value={displayBool(th.militaryService)} />
          {th.militaryService && (
            <>
              <DataRow label="الرتبة" value={th.militaryRank} />
              <DataRow label="التخصص العسكري" value={th.militarySpecialty} />
              <DataRow label="تاريخ بدء الخدمة" value={formatDate(th.militaryStartDate)} />
              <DataRow label="تاريخ انتهاء الخدمة" value={formatDate(th.militaryEndDate)} />
            </>
          )}
        </Section>
      </>
    );
  };

  // ─── Tab 9: Interview & Social Media ───────────────────────────────────────

  const renderInterviewTab = () => {
    const isoc = app.interviewSocialMedia || {};

    return (
      <Section title="المقابلة والتواصل الاجتماعي">
        <DataRow label="لغة المقابلة" value={INTERVIEW_LANG_MAP[isoc.interviewLanguage] || isoc.interviewLanguage} />
        <DataRow label="Facebook" value={isoc.socialFacebook} dir="ltr" />
        <DataRow label="Instagram" value={isoc.socialInstagram} dir="ltr" />
        <DataRow label="Twitter / X" value={isoc.socialTwitter} dir="ltr" />
        <DataRow label="LinkedIn" value={isoc.socialLinkedin} dir="ltr" />
        <DataRow label="WhatsApp" value={isoc.socialWhatsapp} dir="ltr" />
        <DataRow label="أخرى" value={isoc.socialOther} dir="ltr" />
      </Section>
    );
  };

  // ─── Tab 10: Declaration & Admin Notes ─────────────────────────────────────

  const renderDeclarationTab = () => {
    const dec = app.declaration || {};

    return (
      <>
        <Section title="الإقرار">
          <DataRow label="تم قبول الإقرار؟" value={displayBool(dec.declarationAccepted)} />
          <DataRow label="اسم المُقر" value={dec.declarantName} />
          <DataRow label="تاريخ الإقرار" value={formatDate(dec.declarationDate)} />
          {dec.signature && (
            <div className="vad-data-row">
              <span className="vad-data-label">التوقيع</span>
              <span className="vad-data-value">
                <img src={dec.signature} alt="التوقيع" className="vad-signature-img" />
              </span>
            </div>
          )}
        </Section>

        {/* Status Update — shared component */}
        <div className="vad-section">
          <h3 className="vad-section-title">تحديث الحالة والملاحظات</h3>
          <StatusUpdatePanel
            statusMap={VISA_STATUS_MAP}
            currentStatus={newStatus}
            adminNotes={adminNotes}
            onStatusChange={setNewStatus}
            onNotesChange={setAdminNotes}
            onSave={handleUpdateStatus}
            saving={saving}
          />
        </div>
      </>
    );
  };

  // ─── Tab Router ────────────────────────────────────────────────────────────

  const renderTabContent = () => {
    switch (activeTab) {
      case 'basic': return renderBasicTab();
      case 'contact': return renderContactTab();
      case 'travel': return renderTravelTab();
      case 'financial': return renderFinancialTab();
      case 'education': return renderEducationTab();
      case 'family': return renderFamilyTab();
      case 'previousTravel': return renderPreviousTravelTab();
      case 'travelHistory': return renderTravelHistoryTab();
      case 'interview': return renderInterviewTab();
      case 'declaration': return renderDeclarationTab();
      default: return null;
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="vad-page">
      {/* Image Lightbox — shared component */}
      <SharedLightbox
        src={lightbox.src}
        title={lightbox.title}
        isPdf={lightbox.isPdf}
        onClose={() => setLightbox({ src: null, title: '', isPdf: false })}
      />

      {/* Breadcrumb */}
      <div className="vad-breadcrumb">
        <span onClick={() => navigate('/control/dashboard')} className="vad-breadcrumb-link">لوحة التحكم</span>
        <span className="vad-breadcrumb-sep">/</span>
        <span onClick={() => navigate('/control/website')} className="vad-breadcrumb-link">إدارة الموقع</span>
        <span className="vad-breadcrumb-sep">/</span>
        <span onClick={() => navigate(-1)} className="vad-breadcrumb-link">طلبات التأشيرة</span>
        <span className="vad-breadcrumb-sep">/</span>
        <span className="vad-breadcrumb-current">{app.applicationNumber || 'تفاصيل الطلب'}</span>
      </div>

      {/* Message */}
      {message.text && (
        <div className={`vad-message ${message.type}`}>
          {message.text}
        </div>
      )}

      {/* Header Card */}
      <div className="vad-header-card">
        <div className="vad-header-info">
          <h1 className="vad-header-name">{app.personalInfo?.fullName || 'بدون اسم'}</h1>
          {app.passportDetails?.passportNumber && (
            <span className="vad-header-passport">جواز السفر: {app.passportDetails.passportNumber}</span>
          )}
          <div className="vad-header-meta">
            <span className="vad-app-number">{app.applicationNumber}</span>
            <span className="vad-visa-type-badge">{VISA_TYPE_MAP[app.visaType] || app.visaType}</span>
            <span className="vad-submit-date">
              تاريخ التقديم: {formatDate(app.submittedAt || app.createdAt)}
            </span>
            <span
              className="vad-status-badge"
              style={{ color: statusInfo.color, background: statusInfo.bg }}
            >
              {statusInfo.label}
            </span>
          </div>
        </div>
        <div className="vad-header-actions">
          <button className="vad-btn-back" onClick={() => navigate(-1)}>
            العودة للقائمة
          </button>
          {app.passportImage && (
            <button
              className="vad-btn-download"
              onClick={() => openLightbox(app.passportImage, 'صورة الجواز')}
            >
              📄 الجواز
            </button>
          )}
          {app.personalPhoto && (
            <button
              className="vad-btn-download vad-btn-photo"
              onClick={() => openLightbox(app.personalPhoto, 'الصورة الشخصية')}
            >
              📷 الصورة
            </button>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="vad-actions-bar">
        <button className={`vad-action-btn ${allCopied ? 'copied' : ''}`} onClick={handleCopyAll}>
          {allCopied ? (
            <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5" /></svg> تم النسخ</>
          ) : (
            <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg> نسخ البيانات</>
          )}
        </button>
        <button className="vad-action-btn vad-action-whatsapp" onClick={handleWhatsApp}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          واتساب
        </button>
        <button className="vad-action-btn" onClick={() => window.print()}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></svg>
          طباعة
        </button>
      </div>

      {/* ربط بعميل */}
      <div className="detail-card" style={{ marginBottom: '20px' }}>
        <h3 style={{ marginBottom: '12px', fontSize: '1rem', color: 'var(--text-primary)' }}>
          🔗 ربط بعميل
        </h3>
        <CustomerSearch
          currentCustomer={linkedCustomer}
          onSelect={handleLinkCustomer}
          onUnlink={handleUnlinkCustomer}
          loading={linkLoading}
        />
      </div>

      {/* Tabs Bar */}
      <div className="vad-tabs-wrapper">
        <div className="vad-tabs-bar">
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`vad-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="vad-tab-icon">{tab.icon}</span>
              <span className="vad-tab-label">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="vad-tab-content">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default VisaApplicationDetails;
