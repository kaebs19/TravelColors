import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useClientAuth } from '../../context/ClientAuthContext';
import { useToast } from '../../context';
import licenseApi from '../../api/licenseApi';
import { generateLicenseReceipt } from '../../utils/licenseReceiptGenerator';
import './Portal.css';

const STATUS_CONFIG = {
  draft: { label: 'مسودة', color: '#f59e0b', bg: '#fef3c7', icon: '📝' },
  submitted: { label: 'مُرسل', color: '#3b82f6', bg: '#dbeafe', icon: '📤' },
  under_review: { label: 'قيد المراجعة', color: '#f97316', bg: '#ffedd5', icon: '⏳' },
  approved: { label: 'مقبول', color: '#10b981', bg: '#d1fae5', icon: '✅' },
  rejected: { label: 'مرفوض', color: '#ef4444', bg: '#fee2e2', icon: '❌' },
  completed: { label: 'مكتمل', color: '#7c3aed', bg: '#ede9fe', icon: '📦' },
  received: { label: 'مُستلم', color: '#06b6d4', bg: '#cffafe', icon: '🎉' }
};

const DELIVERY_LABELS = {
  pickup: { label: 'استلام من المكتب', icon: '🏢' },
  delivery: { label: 'توصيل', icon: '🚗' },
  shipping: { label: 'شحن', icon: '📦' }
};

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002';

const ClientLicenseView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { client, logout } = useClientAuth();
  const { showToast } = useToast();
  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    loadApplication();
  }, [id]);

  const loadApplication = async () => {
    try {
      const res = await licenseApi.getApplication(id);
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
    if (!value || value === '—') return null;
    return (
      <div className="portal-view-field">
        <span className="portal-view-label">{label}</span>
        <span className="portal-view-value">{value}</span>
      </div>
    );
  };

  const getImageUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${API_URL}${path}`;
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

  const handleDownloadReceipt = async () => {
    setDownloading(true);
    try {
      await generateLicenseReceipt(app);
    } catch (err) {
      showToast('حدث خطأ أثناء إنشاء الإيصال', 'error');
    } finally {
      setDownloading(false);
    }
  };

  const config = STATUS_CONFIG[app.status] || STATUS_CONFIG.draft;
  const deliveryInfo = DELIVERY_LABELS[app.deliveryMethod];
  const fullName = [app.personalInfo?.givenName, app.personalInfo?.familyName].filter(Boolean).join(' ') || 'بدون اسم';

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
        {/* Back + Status + Receipt */}
        <div className="portal-view-top">
          <button
            className="portal-btn-back"
            onClick={() => navigate('/portal/dashboard')}
          >
            ← العودة للوحة التحكم
          </button>
          <div className="portal-view-top-actions">
            {app.status !== 'draft' && (
              <button
                className="portal-btn-receipt"
                onClick={handleDownloadReceipt}
                disabled={downloading}
              >
                {downloading ? '⏳ جاري التحميل...' : '📄 تحميل الإيصال'}
              </button>
            )}
            <span
              className="portal-app-status portal-app-status-lg"
              style={{ color: config.color, background: config.bg }}
            >
              {config.icon} {config.label}
            </span>
          </div>
        </div>

        {/* Header */}
        <div className="portal-view-header">
          <h1>🪪 {fullName}</h1>
          <div className="portal-view-meta">
            {app.applicationNumber && (
              <span className="portal-view-meta-item">رقم الطلب: {app.applicationNumber}</span>
            )}
            <span className="portal-view-meta-item">الخدمة: رخصة دولية</span>
            {app.createdAt && (
              <span className="portal-view-meta-item">تاريخ الإنشاء: {formatDate(app.createdAt)}</span>
            )}
          </div>
        </div>

        {/* Details Sections */}
        <div className="portal-view-sections">

          {/* البيانات الشخصية */}
          <div className="portal-view-section">
            <h3 className="portal-view-section-title">البيانات الشخصية</h3>
            <div className="portal-view-grid">
              {renderField('اسم العائلة', app.personalInfo?.familyName)}
              {renderField('الاسم الأول', app.personalInfo?.givenName)}
              {renderField('مكان الميلاد', app.personalInfo?.placeOfBirth)}
              {renderField('تاريخ الميلاد', formatDate(app.personalInfo?.dateOfBirth))}
              {renderField('الجنسية', app.personalInfo?.nationality)}
              {renderField('العنوان', app.personalInfo?.address)}
              {renderField('البريد الإلكتروني', app.personalInfo?.email)}
              {renderField('رقم الهوية/الإقامة', app.personalInfo?.nationalId)}
              {renderField('رقم الجوال', app.personalInfo?.phone)}
            </div>
          </div>

          {/* المستندات */}
          <div className="portal-view-section">
            <h3 className="portal-view-section-title">المستندات المرفقة</h3>
            <div className="portal-docs-grid">
              {app.licenseImage && (
                <div className="portal-doc-item">
                  <span className="portal-doc-label">📄 صورة رخصة القيادة</span>
                  <img src={getImageUrl(app.licenseImage)} alt="رخصة القيادة" className="portal-doc-img" />
                </div>
              )}
              {app.passportImage && (
                <div className="portal-doc-item">
                  <span className="portal-doc-label">📄 صورة الجواز</span>
                  <img src={getImageUrl(app.passportImage)} alt="الجواز" className="portal-doc-img" />
                </div>
              )}
              {app.personalPhoto && (
                <div className="portal-doc-item">
                  <span className="portal-doc-label">📄 الصورة الشخصية</span>
                  <img src={getImageUrl(app.personalPhoto)} alt="الصورة الشخصية" className="portal-doc-img" />
                </div>
              )}
              {!app.licenseImage && !app.passportImage && !app.personalPhoto && (
                <p style={{ color: 'var(--text-secondary)' }}>لم يتم رفع مستندات بعد</p>
              )}
            </div>
          </div>

          {/* طريقة التسليم */}
          {app.deliveryMethod && (
            <div className="portal-view-section">
              <h3 className="portal-view-section-title">طريقة التسليم</h3>
              <div className="portal-view-grid">
                {renderField('الطريقة', deliveryInfo ? `${deliveryInfo.icon} ${deliveryInfo.label}` : app.deliveryMethod)}
                {app.deliveryPrice > 0 && renderField('رسوم التسليم', `${app.deliveryPrice} ر.س`)}
              </div>
              {app.deliveryMethod === 'shipping' && app.shippingAddress && (
                <div className="portal-shipping-details">
                  <h4 className="portal-view-subtitle">العنوان الوطني</h4>
                  <div className="portal-view-grid">
                    {renderField('المدينة', app.shippingAddress.city)}
                    {renderField('الحي', app.shippingAddress.district)}
                    {renderField('الشارع', app.shippingAddress.streetName)}
                    {renderField('رقم المبنى', app.shippingAddress.buildingNumber)}
                    {renderField('الرمز البريدي', app.shippingAddress.postalCode)}
                    {renderField('الرمز الإضافي', app.shippingAddress.additionalCode)}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* الخدمات الإضافية */}
          {app.selectedAddons?.length > 0 && (
            <div className="portal-view-section">
              <h3 className="portal-view-section-title">الخدمات الإضافية</h3>
              <div className="portal-addons-list">
                {app.selectedAddons.map((addon, i) => (
                  <div className="portal-addon-item" key={i}>
                    <span>{addon.name}</span>
                    <span className="portal-addon-price">{addon.price} ر.س</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ملخص التسعير */}
          {app.totalPrice > 0 && (
            <div className="portal-view-section portal-pricing-section">
              <h3 className="portal-view-section-title">ملخص التسعير</h3>
              <div className="portal-pricing-rows">
                <div className="portal-pricing-row">
                  <span>السعر الأساسي</span>
                  <span>{app.basePrice || 0} ر.س</span>
                </div>
                {app.addonsTotal > 0 && (
                  <div className="portal-pricing-row">
                    <span>الخدمات الإضافية</span>
                    <span>{app.addonsTotal} ر.س</span>
                  </div>
                )}
                {app.deliveryPrice > 0 && (
                  <div className="portal-pricing-row">
                    <span>رسوم التسليم</span>
                    <span>{app.deliveryPrice} ر.س</span>
                  </div>
                )}
                {app.couponDiscount > 0 && (
                  <div className="portal-pricing-row portal-pricing-discount">
                    <span>خصم الكوبون ({app.couponCode})</span>
                    <span>- {app.couponDiscount} ر.س</span>
                  </div>
                )}
                <div className="portal-pricing-row portal-pricing-total">
                  <span>الإجمالي</span>
                  <span>{app.totalPrice} ر.س</span>
                </div>
              </div>
            </div>
          )}

          {/* ملاحظات الأدمن */}
          {app.adminNotes && (
            <div className="portal-view-section portal-admin-notes">
              <h3 className="portal-view-section-title">ملاحظات الإدارة</h3>
              <p className="portal-notes-text">{app.adminNotes}</p>
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

export default ClientLicenseView;
