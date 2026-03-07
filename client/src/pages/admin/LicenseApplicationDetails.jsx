import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { visaApi, customersApi } from '../../api';
import { DataRow, ImageLightbox, StatusUpdatePanel, CustomerSearch } from '../../components/admin';
import { useToast } from '../../context';
import { BASE_STATUS_MAP, toEnDigits, formatDate, formatDateTime, getImageUrl } from '../../utils/adminHelpers';
import './LicenseApplicationDetails.css';

/* ─── Constants ─── */
const STATUS_MAP = {
  ...BASE_STATUS_MAP,
  approved: { ...BASE_STATUS_MAP.approved, label: 'معتمد' }
};

const DELIVERY_MAP = {
  pickup: { label: 'استلام من المكتب', icon: '🏢' },
  delivery: { label: 'توصيل', icon: '🚗' },
  shipping: { label: 'شحن', icon: '📦' }
};

/* ─── Main Component ─── */
const LicenseApplicationDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [lightbox, setLightbox] = useState({ src: null, title: '', isPdf: false });
  const [linkedCustomer, setLinkedCustomer] = useState(null);
  const [linkLoading, setLinkLoading] = useState(false);
  const { showToast } = useToast();

  const showMsg = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  useEffect(() => { loadApplication(); }, [id]);

  const loadApplication = async () => {
    try {
      setLoading(true);
      const res = await visaApi.getLicenseApplication(id);
      if (res.success) {
        const application = res.data.application;
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
      setError('حدث خطأ في جلب بيانات الطلب');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!newStatus) return;
    setUpdating(true);
    try {
      const res = await visaApi.updateLicenseStatus(id, { status: newStatus, adminNotes });
      if (res.success) {
        setApp(prev => ({ ...prev, status: newStatus, adminNotes }));
        showMsg('success', 'تم تحديث الحالة بنجاح');
      }
    } catch (err) {
      showMsg('error', err.response?.data?.message || 'حدث خطأ');
    } finally {
      setUpdating(false);
    }
  };

  const handleLinkCustomer = async (customerId, customer) => {
    setLinkLoading(true);
    try {
      await visaApi.linkCustomerToLicense(id, customerId);
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
      await visaApi.linkCustomerToLicense(id, null);
      setLinkedCustomer(null);
      showToast('تم إلغاء ربط العميل', 'success');
    } catch (err) {
      showToast('فشل في إلغاء الربط', 'error');
    } finally {
      setLinkLoading(false);
    }
  };

  if (loading) return <div className="lad-page"><div className="lad-loading">جاري التحميل...</div></div>;
  if (error) return (
    <div className="lad-page">
      <div className="lad-error"><p>{error}</p><button onClick={() => navigate('/control/website')}>العودة</button></div>
    </div>
  );
  if (!app) return null;

  const status = STATUS_MAP[app.status] || STATUS_MAP.draft;
  const delivery = DELIVERY_MAP[app.deliveryMethod];
  const fullName = [app.personalInfo?.givenName, app.personalInfo?.familyName].filter(Boolean).join(' ') || 'بدون اسم';

  return (
    <div className="lad-page">
      {/* Message */}
      {message.text && (
        <div className={`lad-message lad-message-${message.type}`}>{message.text}</div>
      )}

      {/* Breadcrumb */}
      <div className="lad-breadcrumb">
        <span className="lad-breadcrumb-link" onClick={() => navigate('/control/website')}>إدارة الموقع</span>
        <span>/</span>
        <span className="lad-breadcrumb-link" onClick={() => navigate('/control/website')}>الرخصة الدولية</span>
        <span>/</span>
        <span>{app.applicationNumber || 'طلب جديد'}</span>
      </div>

      {/* Header Card */}
      <div className="lad-header">
        <div className="lad-header-main">
          <div className="lad-header-info">
            <h1 className="lad-header-name">{fullName}</h1>
            <div className="lad-header-meta">
              {app.applicationNumber && <span className="lad-meta-item lad-meta-number">{app.applicationNumber}</span>}
              <span className="lad-meta-item">تاريخ الإنشاء: {formatDate(app.createdAt)}</span>
              {app.clientId && <span className="lad-meta-item">العميل: {app.clientId.name || app.clientId.email}</span>}
            </div>
          </div>
          <span className="lad-status-badge" style={{ color: status.color, background: status.bg }}>{status.label}</span>
        </div>
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

      {/* Content Grid */}
      <div className="lad-grid">
        {/* Right Column */}
        <div className="lad-main-col">
          {/* Personal Info */}
          <div className="lad-card">
            <h3 className="lad-card-title">البيانات الشخصية</h3>
            <div className="lad-rows">
              <DataRow label="اسم العائلة" value={app.personalInfo?.familyName} />
              <DataRow label="الاسم الأول" value={app.personalInfo?.givenName} />
              <DataRow label="مكان الميلاد" value={app.personalInfo?.placeOfBirth} />
              <DataRow label="تاريخ الميلاد" value={formatDate(app.personalInfo?.dateOfBirth)} />
              <DataRow label="الجنسية" value={app.personalInfo?.nationality} />
              <DataRow label="العنوان" value={app.personalInfo?.address} />
              <DataRow label="البريد الإلكتروني" value={app.personalInfo?.email} dir="ltr" />
              <DataRow label="رقم الهوية/الإقامة" value={app.personalInfo?.nationalId} dir="ltr" />
              <DataRow label="رقم الجوال" value={app.personalInfo?.phone} dir="ltr" />
            </div>
          </div>

          {/* Documents */}
          <div className="lad-card">
            <h3 className="lad-card-title">المستندات المرفقة</h3>
            <div className="lad-docs">
              {app.licenseImage && (
                <div className="lad-doc" onClick={() => setLightbox({ src: getImageUrl(app.licenseImage), title: 'رخصة القيادة', isPdf: false })}>
                  <img src={getImageUrl(app.licenseImage)} alt="رخصة القيادة" />
                  <span>رخصة القيادة</span>
                </div>
              )}
              {app.passportImage && (
                <div className="lad-doc" onClick={() => setLightbox({ src: getImageUrl(app.passportImage), title: 'صورة الجواز', isPdf: false })}>
                  <img src={getImageUrl(app.passportImage)} alt="الجواز" />
                  <span>صورة الجواز</span>
                </div>
              )}
              {app.personalPhoto && (
                <div className="lad-doc" onClick={() => setLightbox({ src: getImageUrl(app.personalPhoto), title: 'الصورة الشخصية', isPdf: false })}>
                  <img src={getImageUrl(app.personalPhoto)} alt="صورة شخصية" />
                  <span>الصورة الشخصية</span>
                </div>
              )}
              {!app.licenseImage && !app.passportImage && !app.personalPhoto && (
                <p className="lad-empty-text">لم يتم رفع مستندات بعد</p>
              )}
            </div>
          </div>

          {/* Delivery */}
          {app.deliveryMethod && (
            <div className="lad-card">
              <h3 className="lad-card-title">طريقة التسليم</h3>
              <div className="lad-rows">
                <DataRow label="الطريقة" value={delivery ? `${delivery.icon} ${delivery.label}` : app.deliveryMethod} />
                {app.deliveryPrice > 0 && <DataRow label="رسوم التسليم" value={`${toEnDigits(app.deliveryPrice)} ر.س`} />}
              </div>
              {app.deliveryMethod === 'shipping' && app.shippingAddress && (
                <div className="lad-shipping-box">
                  <h4>العنوان الوطني</h4>
                  <div className="lad-rows">
                    <DataRow label="المدينة" value={app.shippingAddress.city} />
                    <DataRow label="الحي" value={app.shippingAddress.district} />
                    <DataRow label="الشارع" value={app.shippingAddress.streetName} />
                    <DataRow label="رقم المبنى" value={app.shippingAddress.buildingNumber} />
                    <DataRow label="الرمز البريدي" value={app.shippingAddress.postalCode} dir="ltr" />
                    <DataRow label="الرمز الإضافي" value={app.shippingAddress.additionalCode} dir="ltr" />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Addons */}
          {app.selectedAddons?.length > 0 && (
            <div className="lad-card">
              <h3 className="lad-card-title">الخدمات الإضافية</h3>
              <div className="lad-addons">
                {app.selectedAddons.map((addon, i) => (
                  <div className="lad-addon-item" key={i}>
                    <span>{addon.name}</span>
                    <span className="lad-addon-price">{toEnDigits(addon.price)} ر.س</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Left Column — Sidebar */}
        <div className="lad-side-col">
          {/* Pricing */}
          <div className="lad-card lad-pricing-card">
            <h3 className="lad-card-title">ملخص التسعير</h3>
            <div className="lad-pricing">
              <div className="lad-pricing-row">
                <span>السعر الأساسي</span>
                <span>{toEnDigits(app.basePrice || 0)} ر.س</span>
              </div>
              {app.addonsTotal > 0 && (
                <div className="lad-pricing-row"><span>الخدمات الإضافية</span><span>{toEnDigits(app.addonsTotal)} ر.س</span></div>
              )}
              {app.deliveryPrice > 0 && (
                <div className="lad-pricing-row"><span>رسوم التسليم</span><span>{toEnDigits(app.deliveryPrice)} ر.س</span></div>
              )}
              {app.couponDiscount > 0 && (
                <div className="lad-pricing-row lad-discount"><span>خصم ({app.couponCode})</span><span>- {toEnDigits(app.couponDiscount)} ر.س</span></div>
              )}
              <div className="lad-pricing-total"><span>الإجمالي</span><span>{toEnDigits(app.totalPrice || 0)} ر.س</span></div>
            </div>
          </div>

          {/* Status Update — using shared StatusUpdatePanel */}
          <div className="lad-card lad-status-card">
            <h3 className="lad-card-title">تحديث الحالة</h3>
            <StatusUpdatePanel
              statusMap={STATUS_MAP}
              currentStatus={newStatus}
              adminNotes={adminNotes}
              onStatusChange={setNewStatus}
              onNotesChange={setAdminNotes}
              onSave={handleUpdateStatus}
              saving={updating}
              excludeStatuses={[]}
            />
          </div>

          {/* Client Info */}
          {app.clientId && (
            <div className="lad-card">
              <h3 className="lad-card-title">بيانات العميل</h3>
              <div className="lad-rows">
                <DataRow label="الاسم" value={app.clientId.name} />
                <DataRow label="البريد" value={app.clientId.email} dir="ltr" />
                <DataRow label="الجوال" value={app.clientId.phone} dir="ltr" />
              </div>
            </div>
          )}

          {/* Dates */}
          <div className="lad-card">
            <h3 className="lad-card-title">التواريخ</h3>
            <div className="lad-rows">
              <DataRow label="تاريخ الإنشاء" value={formatDateTime(app.createdAt)} />
              <DataRow label="آخر تحديث" value={formatDateTime(app.updatedAt)} />
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox — shared component */}
      <ImageLightbox
        src={lightbox.src}
        title={lightbox.title}
        isPdf={lightbox.isPdf}
        onClose={() => setLightbox({ src: null, title: '', isPdf: false })}
      />
    </div>
  );
};

export default LicenseApplicationDetails;
