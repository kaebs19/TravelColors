import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClientAuth, useToast } from '../../context';
import clientApi from '../../api/clientApi';
import licenseApi from '../../api/licenseApi';
import visaServiceApi from '../../api/visaServiceApi';
import './Portal.css';

const VISA_STATUS = {
  draft: { label: 'مسودة', color: '#f59e0b', bg: '#fef3c7', icon: '📝' },
  submitted: { label: 'مُرسل', color: '#3b82f6', bg: '#dbeafe', icon: '📤' },
  under_review: { label: 'قيد المراجعة', color: '#f97316', bg: '#ffedd5', icon: '⏳' },
  approved: { label: 'مقبول', color: '#10b981', bg: '#d1fae5', icon: '✅' },
  rejected: { label: 'مرفوض', color: '#ef4444', bg: '#fee2e2', icon: '❌' }
};

const LICENSE_STATUS = {
  draft: { label: 'مسودة', color: '#f59e0b', bg: '#fef3c7', icon: '📝' },
  submitted: { label: 'مُرسل', color: '#3b82f6', bg: '#dbeafe', icon: '📤' },
  under_review: { label: 'قيد المراجعة', color: '#f97316', bg: '#ffedd5', icon: '⏳' },
  approved: { label: 'مقبول', color: '#10b981', bg: '#d1fae5', icon: '✅' },
  rejected: { label: 'مرفوض', color: '#ef4444', bg: '#fee2e2', icon: '❌' },
  completed: { label: 'مكتمل', color: '#7c3aed', bg: '#ede9fe', icon: '📦' },
  received: { label: 'مُستلم', color: '#06b6d4', bg: '#cffafe', icon: '🎉' }
};

const VISA_SERVICE_STATUS = {
  draft: { label: 'مسودة', color: '#f59e0b', bg: '#fef3c7', icon: '📝' },
  submitted: { label: 'مُرسل', color: '#3b82f6', bg: '#dbeafe', icon: '📤' },
  under_review: { label: 'قيد المراجعة', color: '#f97316', bg: '#ffedd5', icon: '⏳' },
  approved: { label: 'مقبول', color: '#10b981', bg: '#d1fae5', icon: '✅' },
  rejected: { label: 'مرفوض', color: '#ef4444', bg: '#fee2e2', icon: '❌' },
  completed: { label: 'مكتمل', color: '#7c3aed', bg: '#ede9fe', icon: '📦' }
};

const DELIVERY_LABELS = {
  pickup: '🏢 استلام من المكتب',
  delivery: '🚗 توصيل',
  shipping: '📦 شحن'
};

const ClientDashboard = () => {
  const navigate = useNavigate();
  const { client, logout } = useClientAuth();
  const { showToast } = useToast();

  // Visa state
  const [visaApps, setVisaApps] = useState([]);
  const [visaStats, setVisaStats] = useState({ total: 0, draft: 0, submitted: 0, under_review: 0, approved: 0, rejected: 0 });

  // License state
  const [licenseApps, setLicenseApps] = useState([]);

  // Visa Service state (electronic visas)
  const [vsApps, setVsApps] = useState([]);

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [creatingLicense, setCreatingLicense] = useState(false);
  const [deleting, setDeleting] = useState(null);

  // Active tab
  const [activeTab, setActiveTab] = useState('visa');

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      const [visaRes, licenseRes, vsRes] = await Promise.all([
        clientApi.getApplications().catch(() => null),
        licenseApi.getMyApplications().catch(() => null),
        visaServiceApi.getMyApplications().catch(() => null)
      ]);

      if (visaRes?.success) {
        setVisaApps(visaRes.data.applications);
        setVisaStats(visaRes.data.stats);
      }

      if (licenseRes?.success) {
        setLicenseApps(licenseRes.data.applications);
      }

      if (vsRes?.success) {
        setVsApps(vsRes.data.applications || []);
      }
    } catch (err) {
      console.error('Error loading:', err);
    } finally {
      setLoading(false);
    }
  };

  // === Visa Actions ===
  const handleCreateVisa = async () => {
    setCreating(true);
    try {
      const res = await clientApi.createApplication({ visaType: 'tourism' });
      if (res.success) {
        navigate(`/portal/apply/${res.data.application._id}`);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'حدث خطأ', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleAddFamilyMember = async (sourceAppId) => {
    setCreating(true);
    try {
      const res = await clientApi.createApplication({ copyFrom: sourceAppId });
      if (res.success) {
        navigate(`/portal/apply/${res.data.application._id}`);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'حدث خطأ', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteVisa = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه المسودة؟')) return;
    setDeleting(id);
    try {
      const res = await clientApi.deleteApplication(id);
      if (res.success) {
        setVisaApps(prev => prev.filter(a => a._id !== id));
        setVisaStats(prev => ({ ...prev, total: prev.total - 1, draft: prev.draft - 1 }));
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'حدث خطأ', 'error');
    } finally {
      setDeleting(null);
    }
  };

  // === License Actions ===
  const handleCreateLicense = async () => {
    setCreatingLicense(true);
    try {
      const res = await licenseApi.createApplication();
      if (res.success) {
        navigate(`/portal/license/apply/${res.data.application._id}`);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'حدث خطأ', 'error');
    } finally {
      setCreatingLicense(false);
    }
  };

  // === Helpers ===
  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('ar-SA', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  const getRelativeTime = (date) => {
    if (!date) return '';
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'الآن';
    if (mins < 60) return `قبل ${mins} دقيقة`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `قبل ${hours} ساعة`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `قبل ${days} يوم`;
    return formatDate(date);
  };

  // === Computed Stats ===
  const licenseStats = {
    total: licenseApps.length,
    draft: licenseApps.filter(a => a.status === 'draft').length,
    processing: licenseApps.filter(a => ['submitted', 'under_review'].includes(a.status)).length,
    approved: licenseApps.filter(a => a.status === 'approved').length,
    completed: licenseApps.filter(a => ['completed', 'received'].includes(a.status)).length,
    rejected: licenseApps.filter(a => a.status === 'rejected').length
  };

  const vsStats = {
    total: vsApps.length,
    draft: vsApps.filter(a => a.status === 'draft').length,
    processing: vsApps.filter(a => ['submitted', 'under_review'].includes(a.status)).length,
    approved: vsApps.filter(a => a.status === 'approved').length,
    completed: vsApps.filter(a => a.status === 'completed').length,
    rejected: vsApps.filter(a => a.status === 'rejected').length
  };

  const totalApps = visaStats.total + licenseStats.total + vsStats.total;

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
            <button className="portal-nav-profile" onClick={() => navigate('/portal/profile')}>
              ⚙️ حسابي
            </button>
            <span className="portal-nav-user">
              {client?.name}
            </span>
            <button className="portal-nav-logout" onClick={logout}>
              خروج
            </button>
          </div>
        </div>
      </nav>

      {/* Main */}
      <main className="portal-main">
        {/* Welcome */}
        <div className="portal-welcome">
          <div>
            <h1>مرحباً {client?.name?.split(' ')[0]}</h1>
            <p>تابع جميع طلباتك من هنا — لديك {totalApps} طلب</p>
          </div>
        </div>

        {/* Service Tabs */}
        <div className="portal-service-tabs">
          <button
            className={`portal-service-tab ${activeTab === 'visa' ? 'active' : ''}`}
            onClick={() => setActiveTab('visa')}
          >
            <span className="portal-service-tab-icon">🛂</span>
            <span className="portal-service-tab-label">التأشيرة الأمريكية</span>
            {visaStats.total > 0 && (
              <span className="portal-service-tab-count">{visaStats.total}</span>
            )}
          </button>
          <button
            className={`portal-service-tab ${activeTab === 'license' ? 'active' : ''}`}
            onClick={() => setActiveTab('license')}
          >
            <span className="portal-service-tab-icon">🪪</span>
            <span className="portal-service-tab-label">الرخصة الدولية</span>
            {licenseStats.total > 0 && (
              <span className="portal-service-tab-count">{licenseStats.total}</span>
            )}
          </button>
          <button
            className={`portal-service-tab ${activeTab === 'visaService' ? 'active' : ''}`}
            onClick={() => setActiveTab('visaService')}
          >
            <span className="portal-service-tab-icon">🌍</span>
            <span className="portal-service-tab-label">تأشيرات إلكترونية</span>
            {vsStats.total > 0 && (
              <span className="portal-service-tab-count">{vsStats.total}</span>
            )}
          </button>
        </div>

        {/* ========== VISA TAB ========== */}
        {activeTab === 'visa' && (
          <>
            {/* Visa Stats */}
            <div className="portal-stats">
              <div className="portal-stat-card">
                <span className="portal-stat-icon">📋</span>
                <span className="portal-stat-number">{visaStats.total}</span>
                <span className="portal-stat-label">إجمالي الطلبات</span>
              </div>
              <div className="portal-stat-card portal-stat-draft">
                <span className="portal-stat-icon">📝</span>
                <span className="portal-stat-number">{visaStats.draft}</span>
                <span className="portal-stat-label">مسودة</span>
              </div>
              <div className="portal-stat-card portal-stat-submitted">
                <span className="portal-stat-icon">📤</span>
                <span className="portal-stat-number">{visaStats.submitted + visaStats.under_review}</span>
                <span className="portal-stat-label">قيد المعالجة</span>
              </div>
              <div className="portal-stat-card portal-stat-approved">
                <span className="portal-stat-icon">✅</span>
                <span className="portal-stat-number">{visaStats.approved}</span>
                <span className="portal-stat-label">مكتملة</span>
              </div>
            </div>

            {/* Visa Section Header */}
            <div className="portal-section">
              <div className="portal-section-header">
                <h2 className="portal-section-title">طلبات التأشيرة الأمريكية</h2>
                <button
                  className="portal-btn-primary portal-btn-sm"
                  onClick={handleCreateVisa}
                  disabled={creating}
                >
                  {creating ? 'جاري الإنشاء...' : '+ طلب جديد'}
                </button>
              </div>

              {loading ? (
                <div className="portal-loading">جاري التحميل...</div>
              ) : visaApps.length === 0 ? (
                <div className="portal-empty">
                  <span className="portal-empty-icon">🛂</span>
                  <h3>لا توجد طلبات تأشيرة بعد</h3>
                  <p>ابدأ بتقديم طلب تأشيرة أمريكية جديد</p>
                  <button
                    className="portal-btn-primary"
                    onClick={handleCreateVisa}
                    disabled={creating}
                  >
                    + طلب تأشيرة جديد
                  </button>
                </div>
              ) : (
                <div className="portal-apps-list">
                  {visaApps.map(app => {
                    const config = VISA_STATUS[app.status] || VISA_STATUS.draft;
                    return (
                      <div className="portal-app-card" key={app._id}>
                        <div className="portal-app-header">
                          <span className="portal-app-type-badge portal-app-type-visa">🛂 تأشيرة</span>
                          <span
                            className="portal-app-status"
                            style={{ color: config.color, background: config.bg }}
                          >
                            {config.icon} {config.label}
                          </span>
                          {app.status === 'draft' && (
                            <span className="portal-app-step">
                              خطوة {app.currentStep || 1}/11
                            </span>
                          )}
                          {app.applicationNumber && app.status !== 'draft' && (
                            <span className="portal-app-number">{app.applicationNumber}</span>
                          )}
                        </div>

                        <div className="portal-app-body">
                          <div className="portal-app-info">
                            <span className="portal-app-name">
                              {app.personalInfo?.fullName || 'بدون اسم'}
                            </span>
                            {app.passportDetails?.passportNumber && (
                              <span className="portal-app-passport">
                                جواز: {app.passportDetails.passportNumber}
                              </span>
                            )}
                          </div>
                          <span className="portal-app-date">
                            {app.status === 'draft'
                              ? `آخر تعديل: ${getRelativeTime(app.updatedAt)}`
                              : app.submittedAt
                                ? `تاريخ الإرسال: ${formatDate(app.submittedAt)}`
                                : formatDate(app.createdAt)
                            }
                          </span>
                        </div>

                        <div className="portal-app-actions">
                          {app.status === 'draft' ? (
                            <>
                              <button
                                className="portal-btn-primary portal-btn-sm"
                                onClick={() => navigate(`/portal/apply/${app._id}`)}
                              >
                                أكمل التعبئة
                              </button>
                              <button
                                className="portal-btn-danger portal-btn-sm"
                                onClick={() => handleDeleteVisa(app._id)}
                                disabled={deleting === app._id}
                              >
                                {deleting === app._id ? '...' : 'حذف'}
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                className="portal-btn-secondary portal-btn-sm"
                                onClick={() => navigate(`/portal/view/${app._id}`)}
                              >
                                عرض التفاصيل
                              </button>
                              {(app.status === 'submitted' || app.status === 'approved') && (
                                <button
                                  className="portal-btn-family portal-btn-sm"
                                  onClick={() => handleAddFamilyMember(app._id)}
                                  disabled={creating}
                                >
                                  + أضف فرد عائلة
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {/* ========== LICENSE TAB ========== */}
        {activeTab === 'license' && (
          <>
            {/* License Stats */}
            <div className="portal-stats portal-stats-5">
              <div className="portal-stat-card">
                <span className="portal-stat-icon">📋</span>
                <span className="portal-stat-number">{licenseStats.total}</span>
                <span className="portal-stat-label">إجمالي الطلبات</span>
              </div>
              <div className="portal-stat-card portal-stat-draft">
                <span className="portal-stat-icon">📝</span>
                <span className="portal-stat-number">{licenseStats.draft}</span>
                <span className="portal-stat-label">مسودة</span>
              </div>
              <div className="portal-stat-card portal-stat-submitted">
                <span className="portal-stat-icon">📤</span>
                <span className="portal-stat-number">{licenseStats.processing}</span>
                <span className="portal-stat-label">قيد المعالجة</span>
              </div>
              <div className="portal-stat-card portal-stat-approved">
                <span className="portal-stat-icon">✅</span>
                <span className="portal-stat-number">{licenseStats.approved}</span>
                <span className="portal-stat-label">معتمد</span>
              </div>
              <div className="portal-stat-card" style={{ borderTop: '3px solid #7c3aed' }}>
                <span className="portal-stat-icon">📦</span>
                <span className="portal-stat-number">{licenseStats.completed}</span>
                <span className="portal-stat-label">مكتمل/مستلم</span>
              </div>
            </div>

            {/* License Section */}
            <div className="portal-section">
              <div className="portal-section-header">
                <h2 className="portal-section-title">طلبات الرخصة الدولية</h2>
                <button
                  className="portal-btn-primary portal-btn-sm"
                  onClick={handleCreateLicense}
                  disabled={creatingLicense}
                >
                  {creatingLicense ? 'جاري الإنشاء...' : '+ طلب جديد'}
                </button>
              </div>

              {loading ? (
                <div className="portal-loading">جاري التحميل...</div>
              ) : licenseApps.length === 0 ? (
                <div className="portal-empty">
                  <span className="portal-empty-icon">🪪</span>
                  <h3>لا توجد طلبات رخصة دولية بعد</h3>
                  <p>ابدأ بتقديم طلب رخصة دولية جديد</p>
                  <button
                    className="portal-btn-primary"
                    onClick={handleCreateLicense}
                    disabled={creatingLicense}
                  >
                    + طلب رخصة دولية
                  </button>
                </div>
              ) : (
                <div className="portal-apps-list">
                  {licenseApps.map(app => {
                    const config = LICENSE_STATUS[app.status] || LICENSE_STATUS.draft;
                    return (
                      <div className="portal-app-card" key={app._id}>
                        <div className="portal-app-header">
                          <span className="portal-app-type-badge portal-app-type-license">🪪 رخصة دولية</span>
                          <span
                            className="portal-app-status"
                            style={{ color: config.color, background: config.bg }}
                          >
                            {config.icon} {config.label}
                          </span>
                          {app.applicationNumber && app.status !== 'draft' && (
                            <span className="portal-app-number">{app.applicationNumber}</span>
                          )}
                        </div>

                        <div className="portal-app-body">
                          <div className="portal-app-info">
                            <span className="portal-app-name">
                              {app.personalInfo?.givenName || app.personalInfo?.familyName
                                ? `${app.personalInfo?.givenName ?? ''} ${app.personalInfo?.familyName ?? ''}`.trim()
                                : 'بدون اسم'}
                            </span>
                            {app.deliveryMethod && (
                              <span className="portal-app-delivery">
                                {DELIVERY_LABELS[app.deliveryMethod] || app.deliveryMethod}
                              </span>
                            )}
                          </div>
                          <div className="portal-app-meta">
                            {app.totalPrice > 0 && (
                              <span className="portal-app-price">{app.totalPrice} ر.س</span>
                            )}
                            <span className="portal-app-date">
                              {app.status === 'draft'
                                ? `آخر تعديل: ${getRelativeTime(app.updatedAt)}`
                                : `تاريخ الإنشاء: ${formatDate(app.createdAt)}`
                              }
                            </span>
                          </div>
                        </div>

                        <div className="portal-app-actions">
                          {app.status === 'draft' ? (
                            <button
                              className="portal-btn-primary portal-btn-sm"
                              onClick={() => navigate(`/portal/license/apply/${app._id}`)}
                            >
                              أكمل التعبئة
                            </button>
                          ) : (
                            <button
                              className="portal-btn-secondary portal-btn-sm"
                              onClick={() => navigate(`/portal/license/view/${app._id}`)}
                            >
                              عرض التفاصيل
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {/* ========== VISA SERVICE TAB (Electronic Visas) ========== */}
        {activeTab === 'visaService' && (
          <>
            {/* Visa Service Stats */}
            <div className="portal-stats portal-stats-5">
              <div className="portal-stat-card">
                <span className="portal-stat-icon">📋</span>
                <span className="portal-stat-number">{vsStats.total}</span>
                <span className="portal-stat-label">إجمالي الطلبات</span>
              </div>
              <div className="portal-stat-card portal-stat-draft">
                <span className="portal-stat-icon">📝</span>
                <span className="portal-stat-number">{vsStats.draft}</span>
                <span className="portal-stat-label">مسودة</span>
              </div>
              <div className="portal-stat-card portal-stat-submitted">
                <span className="portal-stat-icon">📤</span>
                <span className="portal-stat-number">{vsStats.processing}</span>
                <span className="portal-stat-label">قيد المعالجة</span>
              </div>
              <div className="portal-stat-card portal-stat-approved">
                <span className="portal-stat-icon">✅</span>
                <span className="portal-stat-number">{vsStats.approved}</span>
                <span className="portal-stat-label">معتمد</span>
              </div>
              <div className="portal-stat-card" style={{ borderTop: '3px solid #7c3aed' }}>
                <span className="portal-stat-icon">📦</span>
                <span className="portal-stat-number">{vsStats.completed}</span>
                <span className="portal-stat-label">مكتمل</span>
              </div>
            </div>

            {/* Visa Service Section */}
            <div className="portal-section">
              <div className="portal-section-header">
                <h2 className="portal-section-title">طلبات التأشيرات الإلكترونية</h2>
                <button
                  className="portal-btn-primary portal-btn-sm"
                  onClick={() => navigate('/visas')}
                >
                  🌍 تصفح التأشيرات
                </button>
              </div>

              {loading ? (
                <div className="portal-loading">جاري التحميل...</div>
              ) : vsApps.length === 0 ? (
                <div className="portal-empty">
                  <span className="portal-empty-icon">🌍</span>
                  <h3>لا توجد طلبات تأشيرات إلكترونية بعد</h3>
                  <p>تصفح كتالوج التأشيرات واختر الدولة التي تريد</p>
                  <button
                    className="portal-btn-primary"
                    onClick={() => navigate('/visas')}
                  >
                    🌍 تصفح التأشيرات
                  </button>
                </div>
              ) : (
                <div className="portal-apps-list">
                  {vsApps.map(app => {
                    const config = VISA_SERVICE_STATUS[app.status] || VISA_SERVICE_STATUS.draft;
                    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';
                    const flagSrc = app.visaId?.flagImage
                      ? (app.visaId.flagImage.startsWith('http') ? app.visaId.flagImage : `${API_URL.replace('/api', '')}${app.visaId.flagImage}`)
                      : null;
                    return (
                      <div className="portal-app-card" key={app._id}>
                        <div className="portal-app-header">
                          <span className="portal-app-type-badge" style={{ background: '#e0f2fe', color: '#0369a1' }}>
                            {flagSrc && <img src={flagSrc} alt="" style={{ width: 18, height: 18, borderRadius: '50%', marginLeft: 4, objectFit: 'cover', verticalAlign: 'middle' }} />}
                            {app.visaId?.countryName || 'تأشيرة إلكترونية'}
                          </span>
                          <span
                            className="portal-app-status"
                            style={{ color: config.color, background: config.bg }}
                          >
                            {config.icon} {config.label}
                          </span>
                          {app.applicationNumber && app.status !== 'draft' && (
                            <span className="portal-app-number">{app.applicationNumber}</span>
                          )}
                        </div>

                        <div className="portal-app-body">
                          <div className="portal-app-info">
                            <span className="portal-app-name">
                              {app.personalInfo?.fullName || 'بدون اسم'}
                            </span>
                            {app.personalInfo?.phone && (
                              <span className="portal-app-passport">
                                {app.personalInfo.phone}
                              </span>
                            )}
                          </div>
                          <div className="portal-app-meta">
                            {app.totalPrice > 0 && (
                              <span className="portal-app-price">{app.totalPrice} ر.س</span>
                            )}
                            <span className="portal-app-date">
                              {app.status === 'draft'
                                ? `آخر تعديل: ${getRelativeTime(app.updatedAt)}`
                                : app.submittedAt
                                  ? `تاريخ الإرسال: ${formatDate(app.submittedAt)}`
                                  : formatDate(app.createdAt)
                              }
                            </span>
                          </div>
                        </div>

                        <div className="portal-app-actions">
                          {app.status === 'draft' ? (
                            <button
                              className="portal-btn-primary portal-btn-sm"
                              onClick={() => navigate(`/portal/visa-apply/${app.visaId?._id || app.visaId}/${app._id}`)}
                            >
                              أكمل التعبئة
                            </button>
                          ) : (
                            <button
                              className="portal-btn-secondary portal-btn-sm"
                              onClick={() => navigate(`/portal/visa-apply/${app.visaId?._id || app.visaId}/${app._id}`)}
                            >
                              عرض التفاصيل
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="portal-footer">
        <p>&copy; {new Date().getFullYear()} Travel Colors - ألوان المسافر</p>
      </footer>
    </div>
  );
};

export default ClientDashboard;
