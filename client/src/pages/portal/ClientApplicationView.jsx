import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useClientAuth } from '../../context/ClientAuthContext';
import clientApi from '../../api/clientApi';
import './Portal.css';

const STATUS_CONFIG = {
  draft: { label: 'مسودة', color: '#f59e0b', bg: '#fef3c7', icon: '📝' },
  submitted: { label: 'مُرسل', color: '#3b82f6', bg: '#dbeafe', icon: '📤' },
  under_review: { label: 'قيد المراجعة', color: '#f97316', bg: '#ffedd5', icon: '⏳' },
  approved: { label: 'مقبول', color: '#10b981', bg: '#d1fae5', icon: '✅' },
  rejected: { label: 'مرفوض', color: '#ef4444', bg: '#fee2e2', icon: '❌' }
};

const ClientApplicationView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { client, logout } = useClientAuth();
  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadApplication();
  }, [id]);

  const loadApplication = async () => {
    try {
      const res = await clientApi.getApplication(id);
      if (res.success) {
        setApp(res.data.application);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('ar-SA', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  };

  const renderField = (label, value) => {
    if (!value) return null;
    return (
      <div className="portal-view-field">
        <span className="portal-view-label">{label}</span>
        <span className="portal-view-value">{value}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="portal-page" dir="rtl">
        <div className="portal-loading-page">جاري التحميل...</div>
      </div>
    );
  }

  if (!app) {
    return (
      <div className="portal-page" dir="rtl">
        <div className="portal-loading-page">
          <h3>الطلب غير موجود</h3>
          <button className="portal-btn-primary" onClick={() => navigate('/portal/dashboard')}>
            العودة للوحة التحكم
          </button>
        </div>
      </div>
    );
  }

  const config = STATUS_CONFIG[app.status] || STATUS_CONFIG.draft;
  const marital = { single: 'أعزب', married: 'متزوج', divorced: 'مطلق', widowed: 'أرمل' };
  const visaTypes = { tourism: 'سياحة', medical: 'طبية', study: 'دراسة' };

  return (
    <div className="portal-page" dir="rtl">
      {/* Navbar */}
      <nav className="portal-nav">
        <div className="portal-nav-content">
          <div className="portal-nav-brand" onClick={() => navigate('/')}>
            <span className="portal-nav-name">
              <span className="portal-nav-name-ar">ألوان المسافر</span>
              <span className="portal-nav-name-en">Travel Colors</span>
            </span>
          </div>
          <div className="portal-nav-right">
            <span className="portal-nav-user">{client?.name}</span>
            <button className="portal-nav-logout" onClick={logout}>خروج</button>
          </div>
        </div>
      </nav>

      <main className="portal-main">
        {/* Back + Status */}
        <div className="portal-view-top">
          <button
            className="portal-btn-back"
            onClick={() => navigate('/portal/dashboard')}
          >
            → العودة للوحة التحكم
          </button>
          <span
            className="portal-app-status portal-app-status-lg"
            style={{ color: config.color, background: config.bg }}
          >
            {config.icon} {config.label}
          </span>
        </div>

        {/* Header */}
        <div className="portal-view-header">
          <h1>{app.personalInfo?.fullName || 'بدون اسم'}</h1>
          <div className="portal-view-meta">
            {app.applicationNumber && (
              <span className="portal-view-meta-item">رقم الطلب: {app.applicationNumber}</span>
            )}
            <span className="portal-view-meta-item">نوع التأشيرة: {visaTypes[app.visaType] || app.visaType}</span>
            {app.submittedAt && (
              <span className="portal-view-meta-item">تاريخ الإرسال: {formatDate(app.submittedAt)}</span>
            )}
          </div>
        </div>

        {/* Details Sections */}
        <div className="portal-view-sections">
          {/* البيانات الشخصية */}
          <div className="portal-view-section">
            <h3 className="portal-view-section-title">البيانات الشخصية</h3>
            <div className="portal-view-grid">
              {renderField('الاسم الكامل', app.personalInfo?.fullName)}
              {renderField('تاريخ الميلاد', formatDate(app.personalInfo?.dateOfBirth))}
              {renderField('مدينة الميلاد', app.personalInfo?.birthCity)}
              {renderField('الجنسية', app.personalInfo?.nationality)}
              {renderField('رقم الهوية', app.personalInfo?.nationalId)}
              {renderField('الحالة الاجتماعية', marital[app.personalInfo?.maritalStatus])}
            </div>
          </div>

          {/* بيانات الجواز */}
          <div className="portal-view-section">
            <h3 className="portal-view-section-title">بيانات الجواز</h3>
            <div className="portal-view-grid">
              {renderField('رقم الجواز', app.passportDetails?.passportNumber)}
              {renderField('مكان الإصدار', app.passportDetails?.passportIssuePlace)}
              {renderField('تاريخ الإصدار', formatDate(app.passportDetails?.passportIssueDate))}
              {renderField('تاريخ الانتهاء', formatDate(app.passportDetails?.passportExpiryDate))}
            </div>
          </div>

          {/* معلومات الاتصال */}
          <div className="portal-view-section">
            <h3 className="portal-view-section-title">معلومات الاتصال</h3>
            <div className="portal-view-grid">
              {renderField('البريد الإلكتروني', app.contactInfo?.emails?.[0] || app.contactInfo?.email)}
              {renderField('رقم الجوال', app.contactInfo?.phones?.[0] || app.contactInfo?.mobilePhone)}
              {renderField('العنوان', app.contactInfo?.streetAddress)}
              {renderField('المدينة', app.contactInfo?.districtCity)}
            </div>
          </div>

          {/* معلومات السفر */}
          <div className="portal-view-section">
            <h3 className="portal-view-section-title">معلومات السفر</h3>
            <div className="portal-view-grid">
              {renderField('تاريخ الوصول المتوقع', formatDate(app.travelInfo?.expectedArrivalDate))}
              {renderField('مدة الإقامة', app.travelInfo?.stayDurationNumber
                ? `${app.travelInfo.stayDurationNumber} ${app.travelInfo.stayDurationType === 'days' ? 'يوم' : app.travelInfo.stayDurationType === 'weeks' ? 'أسبوع' : 'شهر'}`
                : app.travelInfo?.stayDuration
              )}
              {renderField('العنوان في أمريكا', app.travelInfo?.usAddress || app.travelInfo?.usStreetAddress)}
            </div>
          </div>

          {/* العائلة */}
          {(app.familyInfo?.fatherFirstName || app.familyInfo?.fatherFullName) && (
            <div className="portal-view-section">
              <h3 className="portal-view-section-title">معلومات العائلة</h3>
              <div className="portal-view-grid">
                {renderField('اسم الأب', app.familyInfo?.fatherFullName || `${app.familyInfo?.fatherFirstName} ${app.familyInfo?.fatherLastName}`)}
                {renderField('اسم الأم', app.familyInfo?.motherFullName || `${app.familyInfo?.motherFirstName} ${app.familyInfo?.motherLastName}`)}
              </div>
            </div>
          )}

          {/* الزوج/ة */}
          {app.spouseInfo?.spouseFullName && (
            <div className="portal-view-section">
              <h3 className="portal-view-section-title">معلومات الزوج/ة</h3>
              <div className="portal-view-grid">
                {renderField('الاسم', app.spouseInfo?.spouseFullName)}
                {renderField('تاريخ الميلاد', formatDate(app.spouseInfo?.spouseDOB))}
                {renderField('الجنسية', app.spouseInfo?.spouseNationality)}
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="portal-footer">
        <p>&copy; {new Date().getFullYear()} Travel Colors - ألوان المسافر</p>
      </footer>
    </div>
  );
};

export default ClientApplicationView;
