import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { visaApi, customersApi } from '../../api';
import { DataRow, ImageLightbox, StatusUpdatePanel, CustomerSearch } from '../../components/admin';
import { useToast } from '../../context';
import { BASE_STATUS_MAP, toEnDigits, formatDate, getImageUrl, copyToClipboard } from '../../utils/adminHelpers';
import './VisaServiceAppDetails.css';

/* ─── Status map override ─── */
const STATUS_MAP = {
  ...BASE_STATUS_MAP,
  submitted: { ...BASE_STATUS_MAP.submitted, label: 'جديد' }
};

/* ─── Main Component ─── */
const VisaServiceAppDetails = () => {
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
  const [allCopied, setAllCopied] = useState(false);
  const [linkedCustomer, setLinkedCustomer] = useState(null);
  const [linkLoading, setLinkLoading] = useState(false);
  const { showToast } = useToast();

  const showMsg = useCallback((type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  }, []);

  useEffect(() => {
    loadApp();
  }, [id]);

  const loadApp = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/visa-service/admin/applications/${id}`);
      if (res.data.success) {
        const data = res.data.data.application;
        setApp(data);
        setNewStatus(data.status);
        setAdminNotes(data.adminNotes || '');
        // جلب بيانات العميل المربوط
        if (data.customer) {
          try {
            const custRes = await customersApi.getCustomer(data.customer);
            setLinkedCustomer(custRes.data?.customer || null);
          } catch (e) {
            console.error('Error fetching linked customer:', e);
          }
        }
      }
    } catch (err) {
      setError('حدث خطأ في تحميل الطلب');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    try {
      setUpdating(true);
      const res = await api.put(`/visa-service/admin/applications/${id}/status`, {
        status: newStatus,
        adminNotes
      });
      if (res.data.success) {
        setApp(prev => ({ ...prev, status: newStatus, adminNotes }));
        showMsg('success', 'تم تحديث الحالة بنجاح');
      }
    } catch (err) {
      showMsg('error', 'حدث خطأ في تحديث الحالة');
    } finally {
      setUpdating(false);
    }
  };

  /* Copy all data */
  const handleCopyAll = async () => {
    if (!app) return;
    const info = app.personalInfo || {};
    const st = STATUS_MAP[app.status] || STATUS_MAP.draft;
    const lines = [
      `طلب تأشيرة إلكترونية — ${app.visaId?.countryName || ''}`,
      `رقم الطلب: ${app.applicationNumber || ''}`,
      `الحالة: ${st.label}`,
      '',
      'البيانات الشخصية:',
      `الاسم: ${info.fullName || ''}`,
      `البريد: ${info.email || ''}`,
      `الجوال: ${info.phone || ''}`,
      `الهوية: ${info.nationalId || ''}`,
      `الجنسية: ${info.nationality || ''}`,
      info.dateOfBirth ? `تاريخ الميلاد: ${formatDate(info.dateOfBirth)}` : '',
      '',
      'التسعير:',
      `سعر التأشيرة: ${app.basePrice || 0} ريال`,
      app.addonsTotal > 0 ? `الإضافات: +${app.addonsTotal} ريال` : '',
      app.couponDiscount > 0 ? `الخصم (${app.couponCode}): -${app.couponDiscount} ريال` : '',
      `الإجمالي: ${app.totalPrice || 0} ريال`,
    ];
    if (app.clientNotes) lines.push('', `ملاحظات العميل: ${app.clientNotes}`);
    if (app.selectedAddons?.length > 0) {
      lines.push('', 'الخدمات الإضافية:');
      app.selectedAddons.forEach(a => lines.push(`- ${a.name}: ${a.price} ريال`));
    }
    await copyToClipboard(lines.filter(Boolean).join('\n'));
    setAllCopied(true);
    setTimeout(() => setAllCopied(false), 2000);
  };

  /* WhatsApp */
  const handleWhatsApp = () => {
    const phone = (app?.personalInfo?.phone || app?.clientId?.phone || '').replace(/\D/g, '');
    if (!phone) { showMsg('error', 'لا يوجد رقم جوال'); return; }
    const num = phone.startsWith('0') ? `966${phone.slice(1)}` : phone;
    window.open(`https://wa.me/${num}`, '_blank');
  };

  const handleLinkCustomer = async (customerId, customer) => {
    setLinkLoading(true);
    try {
      await visaApi.linkCustomerToVisaService(id, customerId);
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
      await visaApi.linkCustomerToVisaService(id, null);
      setLinkedCustomer(null);
      showToast('تم إلغاء ربط العميل', 'success');
    } catch (err) {
      showToast('فشل في إلغاء الربط', 'error');
    } finally {
      setLinkLoading(false);
    }
  };

  if (loading) return <div className="vsad-loading">جاري التحميل...</div>;
  if (error) return <div className="vsad-error">{error}</div>;
  if (!app) return <div className="vsad-error">الطلب غير موجود</div>;

  const st = STATUS_MAP[app.status] || STATUS_MAP.draft;
  const info = app.personalInfo || {};
  const requiredDocs = app.visaId?.requiredDocuments || [];
  const uploadedDocs = app.documents || [];
  const hasNewDocs = uploadedDocs.length > 0 || requiredDocs.length > 0;
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002';

  return (
    <div className="vsad-page">
      {/* Message */}
      {message.text && (
        <div className={`vsad-message vsad-message-${message.type}`}>{message.text}</div>
      )}

      {/* Breadcrumb */}
      <div className="vsad-breadcrumb">
        <button onClick={() => navigate('/control/visa-service-applications')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
          طلبات التأشيرة الإلكترونية
        </button>
      </div>

      {/* Header Card */}
      <div className="vsad-header-card">
        <div className="vsad-header-main">
          {app.visaId?.flagImage && (
            <img src={`${API_URL}${app.visaId.flagImage}`} alt="" className="vsad-header-flag" />
          )}
          <div>
            <h2>{info.fullName || '—'}</h2>
            <p className="vsad-header-country">{app.visaId?.countryName || ''} — {app.visaId?.visaType || ''}</p>
          </div>
        </div>
        <div className="vsad-header-meta">
          <span className="vsad-app-number" dir="ltr">{toEnDigits(app.applicationNumber)}</span>
          <span className="vsad-status-badge" style={{ color: st.color, background: st.bg }}>{st.label}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="vsad-actions-bar">
        <button className={`vsad-action-btn ${allCopied ? 'copied' : ''}`} onClick={handleCopyAll}>
          {allCopied ? (
            <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5" /></svg> تم النسخ</>
          ) : (
            <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg> نسخ البيانات</>
          )}
        </button>
        <button className="vsad-action-btn vsad-action-whatsapp" onClick={handleWhatsApp}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          واتساب
        </button>
        <button className="vsad-action-btn" onClick={() => window.print()}>
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

      {/* Two Column Layout */}
      <div className="vsad-grid">
        {/* Main Column */}
        <div className="vsad-main">
          {/* Personal Info */}
          <div className="vsad-card">
            <h3>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
              البيانات الشخصية
            </h3>
            <DataRow label="الاسم الكامل" value={info.fullName} />
            <DataRow label="البريد الإلكتروني" value={info.email} dir="ltr" />
            <DataRow label="رقم الجوال" value={info.phone} dir="ltr" />
            <DataRow label="رقم الهوية" value={info.nationalId} dir="ltr" />
            <DataRow label="الجنسية" value={info.nationality} />
            <DataRow label="تاريخ الميلاد" value={info.dateOfBirth ? formatDate(info.dateOfBirth) : ''} dir="ltr" />
          </div>

          {/* Documents */}
          <div className="vsad-card">
            <h3>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
              المستندات
            </h3>
            <div className="vsad-docs">
              {hasNewDocs ? (
                requiredDocs.length > 0 ? (
                  requiredDocs.map((reqDoc) => {
                    const uploaded = uploadedDocs.find(d => d.key === reqDoc.key);
                    const hasFile = uploaded && uploaded.fileUrl;
                    const isPdf = hasFile && (uploaded.fileType?.includes('pdf') || uploaded.fileUrl?.endsWith('.pdf'));
                    const url = hasFile ? getImageUrl(uploaded.fileUrl) : null;
                    return (
                      <div key={reqDoc.key} className={`vsad-doc-item ${hasFile ? '' : 'vsad-doc-missing'}`}
                        onClick={() => url && setLightbox({ src: url, title: reqDoc.label || reqDoc.key, isPdf })}>
                        {hasFile ? (
                          isPdf ? (
                            <div className="vsad-pdf-placeholder">
                              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
                              <span className="vsad-pdf-filename">{uploaded.originalName || 'PDF'}</span>
                            </div>
                          ) : (
                            <img src={url} alt={reqDoc.label || ''} />
                          )
                        ) : (
                          <div className="vsad-doc-empty">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
                            <span>لم يتم الرفع</span>
                          </div>
                        )}
                        <div className="vsad-doc-label">
                          <span className={`vsad-doc-status ${hasFile ? 'uploaded' : 'missing'}`}>{hasFile ? '✓' : '✕'}</span>
                          {reqDoc.label || reqDoc.key}
                          {reqDoc.isRequired && <span className="vsad-doc-required">*</span>}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  uploadedDocs.filter(d => d.fileUrl).map((doc, i) => {
                    const isPdf = doc.fileType?.includes('pdf') || doc.fileUrl?.endsWith('.pdf');
                    const url = getImageUrl(doc.fileUrl);
                    return (
                      <div key={i} className="vsad-doc-item" onClick={() => setLightbox({ src: url, title: doc.label || doc.key, isPdf })}>
                        {isPdf ? (
                          <div className="vsad-pdf-placeholder">
                            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
                            <span className="vsad-pdf-filename">{doc.originalName || 'PDF'}</span>
                          </div>
                        ) : (
                          <img src={url} alt={doc.label || ''} />
                        )}
                        <div className="vsad-doc-label">{doc.label || doc.key}</div>
                      </div>
                    );
                  })
                )
              ) : (
                <>
                  {app.passportImage && (
                    <div className="vsad-doc-item" onClick={() => setLightbox({ src: getImageUrl(app.passportImage), title: 'صورة الجواز', isPdf: false })}>
                      <img src={getImageUrl(app.passportImage)} alt="جواز" />
                      <div className="vsad-doc-label">صورة الجواز</div>
                    </div>
                  )}
                  {app.personalPhoto && (
                    <div className="vsad-doc-item" onClick={() => setLightbox({ src: getImageUrl(app.personalPhoto), title: 'الصورة الشخصية', isPdf: false })}>
                      <img src={getImageUrl(app.personalPhoto)} alt="صورة شخصية" />
                      <div className="vsad-doc-label">الصورة الشخصية</div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Client Notes */}
          {app.clientNotes && (
            <div className="vsad-card">
              <h3>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                ملاحظات العميل
              </h3>
              <p className="vsad-client-notes">{app.clientNotes}</p>
            </div>
          )}

          {/* Addons */}
          {app.selectedAddons?.length > 0 && (
            <div className="vsad-card">
              <h3>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                الخدمات الإضافية
              </h3>
              {app.selectedAddons.map((addon, i) => (
                <div className="vsad-addon-row" key={i}>
                  <span>{addon.name}</span>
                  <span>{toEnDigits(addon.price)} ريال</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="vsad-sidebar">
          {/* Pricing */}
          <div className="vsad-card">
            <h3>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
              التسعير
            </h3>
            <DataRow label="سعر التأشيرة" value={`${toEnDigits(app.basePrice || 0)} ريال`} copyable={false} />
            {app.addonsTotal > 0 && <DataRow label="الإضافات" value={`+${toEnDigits(app.addonsTotal)} ريال`} copyable={false} />}
            {app.couponDiscount > 0 && (
              <div className="vsad-data-row vsad-discount">
                <span className="admin-data-label">خصم ({toEnDigits(app.couponCode)})</span>
                <span className="admin-data-value" style={{ color: 'var(--status-rejected)' }}>-{toEnDigits(app.couponDiscount)} ريال</span>
              </div>
            )}
            <div className="vsad-pricing-total">
              <span>الإجمالي</span>
              <span>{toEnDigits(app.totalPrice || 0)} ريال</span>
            </div>
          </div>

          {/* Status Update */}
          <div className="vsad-card">
            <h3>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
              تحديث الحالة
            </h3>
            <StatusUpdatePanel
              statusMap={STATUS_MAP}
              currentStatus={newStatus}
              adminNotes={adminNotes}
              onStatusChange={setNewStatus}
              onNotesChange={setAdminNotes}
              onSave={handleUpdateStatus}
              saving={updating}
            />
          </div>

          {/* Client Account Info */}
          {app.clientId && (
            <div className="vsad-card">
              <h3>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" /></svg>
                بيانات الحساب
              </h3>
              <DataRow label="الاسم" value={app.clientId.fullName} />
              <DataRow label="البريد" value={app.clientId.email} dir="ltr" />
              <DataRow label="الجوال" value={app.clientId.phone} dir="ltr" />
            </div>
          )}

          {/* Dates */}
          <div className="vsad-card">
            <h3>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
              التواريخ
            </h3>
            <DataRow label="تاريخ الإنشاء" value={formatDate(app.createdAt)} dir="ltr" />
            <DataRow label="تاريخ التقديم" value={app.submittedAt ? formatDate(app.submittedAt) : '—'} dir="ltr" />
            <DataRow label="آخر تحديث" value={formatDate(app.updatedAt)} dir="ltr" />
          </div>
        </div>
      </div>

      {/* Lightbox */}
      <ImageLightbox
        src={lightbox.src}
        title={lightbox.title}
        isPdf={lightbox.isPdf}
        onClose={() => setLightbox({ src: null, title: '', isPdf: false })}
      />
    </div>
  );
};

export default VisaServiceAppDetails;
