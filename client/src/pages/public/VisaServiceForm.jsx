import { getIconSvg } from '../../utils/icons';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useClientAuth } from '../../context/ClientAuthContext';
import visaServiceApi from '../../api/visaServiceApi';
import { getPublicVisa } from '../../api/visaCatalogApi';
import { validateVisaCoupon } from '../../api/visaCatalogApi';
import './VisaServiceForm.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002';

const VisaServiceForm = () => {
  const { visaId, id } = useParams();
  const navigate = useNavigate();
  const { client } = useClientAuth();

  // State
  const [appId, setAppId] = useState(id || null);
  const [appNumber, setAppNumber] = useState('');
  const [visa, setVisa] = useState(null);
  const [form, setForm] = useState({
    personalInfo: {
      fullName: '', email: '', phone: '',
      nationalId: '', nationality: '', dateOfBirth: ''
    },
    documents: [],
    clientNotes: '',
    passportImage: '',
    personalPhoto: ''
  });
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [couponCode, setCouponCode] = useState('');
  const [couponData, setCouponData] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponMessage, setCouponMessage] = useState({ type: '', text: '' });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [uploading, setUploading] = useState({});
  const [dragging, setDragging] = useState({});
  const [message, setMessage] = useState({ type: '', text: '' });
  const [errors, setErrors] = useState({});

  const fileInputRefs = useRef({});
  const passportRef = useRef(null);
  const photoRef = useRef(null);
  const saveTimerRef = useRef(null);

  // Load data
  useEffect(() => {
    loadData();
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, []);

  // Auto-fill from client profile
  useEffect(() => {
    if (client && !id) {
      setForm(prev => ({
        ...prev,
        personalInfo: {
          ...prev.personalInfo,
          fullName: prev.personalInfo.fullName || client.fullName || '',
          email: prev.personalInfo.email || client.email || '',
          phone: prev.personalInfo.phone || client.phone || '',
          nationalId: prev.personalInfo.nationalId || client.nationalId || '',
        }
      }));
    }
  }, [client, id]);

  const loadData = async () => {
    try {
      setLoading(true);

      // 1. Load visa info
      let visaData = null;
      if (visaId) {
        try {
          const visaRes = await getPublicVisa(visaId);
          if (visaRes.success) visaData = visaRes.data.visa;
        } catch {
          // visaId might be ObjectId, not slug — will try from app
        }
      }

      // Helper to fill form from an existing application
      const fillFormFromApp = (app) => {
        setAppId(app._id);
        setAppNumber(app.applicationNumber);
        let docs = app.documents || [];
        if (docs.length === 0 && (app.passportImage || app.personalPhoto)) {
          if (app.passportImage) docs.push({ key: 'passport_image', label: 'صورة جواز السفر', fileUrl: app.passportImage, fileType: 'image/*' });
          if (app.personalPhoto) docs.push({ key: 'personal_photo', label: 'صورة شخصية', fileUrl: app.personalPhoto, fileType: 'image/*' });
        }
        setForm({
          personalInfo: app.personalInfo || {},
          documents: docs,
          clientNotes: app.clientNotes || '',
          passportImage: app.passportImage || '',
          personalPhoto: app.personalPhoto || ''
        });
        setSelectedAddons(app.selectedAddons?.map(a => a.name) || []);
        if (app.couponCode) {
          setCouponCode(app.couponCode);
          setCouponData({ code: app.couponCode, discount: app.couponDiscount });
        }
        if (app.visaId) visaData = app.visaId;
        if (app.status !== 'draft') setSubmitted(true);
      };

      // 2. Load existing application (if id in URL)
      if (id) {
        const appRes = await visaServiceApi.getApplication(id);
        if (appRes.success) fillFormFromApp(appRes.data.application);

      } else if (visaId && !id) {
        // 3. New application flow
        let resolvedVisaId = visaId;
        if (visaData) resolvedVisaId = visaData._id;

        // Check if user already has a draft for this visa
        let existingDraft = null;
        try {
          const myApps = await visaServiceApi.getMyApplications();
          if (myApps.success) {
            existingDraft = myApps.data.applications.find(
              a => a.status === 'draft' &&
                   (a.visaId?._id === resolvedVisaId || a.visaId === resolvedVisaId)
            );
          }
        } catch { /* ignore */ }

        if (existingDraft) {
          // Reuse existing draft instead of creating new one
          const appRes = await visaServiceApi.getApplication(existingDraft._id);
          if (appRes.success) {
            fillFormFromApp(appRes.data.application);
            window.history.replaceState(null, '', `/portal/visa-apply/${visaId}/${appRes.data.application._id}`);
          }
        } else {
          // Create new application — wrapped in its own try/catch
          try {
            const createRes = await visaServiceApi.createApplication(resolvedVisaId);
            if (createRes.success) {
              const app = createRes.data.application;
              setAppId(app._id);
              setAppNumber(app.applicationNumber);
              window.history.replaceState(null, '', `/portal/visa-apply/${visaId}/${app._id}`);
              // Re-fetch to get populated visa with requiredDocuments
              if (!visaData) {
                const fullApp = await visaServiceApi.getApplication(app._id);
                if (fullApp.success && fullApp.data.application.visaId) {
                  visaData = fullApp.data.application.visaId;
                }
              }
            }
          } catch (createErr) {
            // Rate limit or other error — show warning but DON'T prevent form display
            setMessage({ type: 'error', text: createErr.response?.data?.message || 'حدث خطأ في إنشاء الطلب' });
          }
        }
      }

      // ★ ALWAYS set visa data — even if createApplication failed
      if (visaData) setVisa(visaData);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'حدث خطأ في تحميل البيانات' });
    } finally {
      setLoading(false);
    }
  };

  // Auto-save
  const autoSave = useCallback((data) => {
    if (!appId) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      try {
        setSaving(true);
        await visaServiceApi.updateApplication(appId, data);
      } catch (e) {
        // silent
      } finally {
        setSaving(false);
      }
    }, 1500);
  }, [appId]);

  const getAcceptAttr = (acceptedTypes) => {
    switch (acceptedTypes) {
      case 'image': return 'image/jpeg,image/png,image/gif,image/webp';
      case 'pdf': return 'application/pdf';
      default: return 'image/jpeg,image/png,image/gif,image/webp,application/pdf';
    }
  };

  const isPdf = (fileUrl, fileType) => {
    if (fileType && fileType.includes('pdf')) return true;
    if (fileUrl && fileUrl.toLowerCase().endsWith('.pdf')) return true;
    return false;
  };

  const handleChange = (field, value) => {
    setForm(prev => {
      const updated = {
        ...prev,
        personalInfo: { ...prev.personalInfo, [field]: value }
      };
      autoSave(updated);
      return updated;
    });
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  // File upload (dynamic documents)
  const handleFileUpload = async (fileOrEvent, docKey) => {
    const file = fileOrEvent?.target?.files?.[0] || fileOrEvent;
    if (!file || !file.name) return;

    if (file.size > 10 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'حجم الملف يتجاوز 10 ميجا' });
      return;
    }

    setUploading(prev => ({ ...prev, [docKey]: true }));

    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await visaServiceApi.uploadFile(formData);
      if (res.success) {
        const docDef = visa?.requiredDocuments?.find(d => d.key === docKey);
        setForm(prev => {
          const docs = [...(prev.documents || [])];
          const existingIdx = docs.findIndex(d => d.key === docKey);
          const newDoc = {
            key: docKey,
            label: docDef?.label || docKey,
            fileUrl: res.data.url,
            fileType: res.data.fileType || file.type,
            originalName: res.data.originalName || file.name,
            uploadedAt: new Date()
          };
          if (existingIdx >= 0) {
            docs[existingIdx] = newDoc;
          } else {
            docs.push(newDoc);
          }
          const updated = { ...prev, documents: docs };
          autoSave(updated);
          return updated;
        });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'فشل رفع الملف' });
    } finally {
      setUploading(prev => ({ ...prev, [docKey]: false }));
    }
  };

  // Legacy file upload (for backward compat fallback)
  const handleLegacyFileUpload = async (e, field) => {
    const file = e.target?.files?.[0] || e;
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'حجم الملف يتجاوز 10 ميجا' });
      return;
    }

    const key = field === 'passportImage' ? 'passport' : 'photo';
    setUploading(prev => ({ ...prev, [key]: true }));

    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await visaServiceApi.uploadFile(formData);
      if (res.success) {
        setForm(prev => {
          const updated = { ...prev, [field]: res.data.url };
          autoSave(updated);
          return updated;
        });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'فشل رفع الملف' });
    } finally {
      setUploading(prev => ({ ...prev, [key]: false }));
    }
  };

  // Drag & drop (dynamic)
  const handleDrag = (e, docKey, entering) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(prev => ({ ...prev, [docKey]: entering }));
  };

  const handleDrop = (e, docKey) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(prev => ({ ...prev, [docKey]: false }));
    const file = e.dataTransfer?.files?.[0];
    if (file) handleFileUpload(file, docKey);
  };

  // Legacy drag & drop (for backward compat fallback)
  const handleLegacyDrag = (e, field, entering) => {
    e.preventDefault();
    e.stopPropagation();
    const key = field === 'passportImage' ? 'passport' : 'photo';
    setDragging(prev => ({ ...prev, [key]: entering }));
  };

  const handleLegacyDrop = (e, field) => {
    e.preventDefault();
    e.stopPropagation();
    const key = field === 'passportImage' ? 'passport' : 'photo';
    setDragging(prev => ({ ...prev, [key]: false }));
    const file = e.dataTransfer?.files?.[0];
    if (file) handleLegacyFileUpload(file, field);
  };

  // Addons
  const toggleAddon = (addonName) => {
    setSelectedAddons(prev => {
      const updated = prev.includes(addonName)
        ? prev.filter(n => n !== addonName)
        : [...prev, addonName];
      return updated;
    });
  };

  // Coupon
  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponMessage({ type: '', text: '' });
    try {
      const vId = visa?._id;
      const res = await validateVisaCoupon(vId, couponCode.trim());
      if (res.success) {
        setCouponData(res.data);
        setCouponMessage({ type: 'success', text: 'تم تطبيق الكوبون بنجاح' });
      }
    } catch (err) {
      setCouponMessage({ type: 'error', text: err.response?.data?.message || 'كود الكوبون غير صالح' });
      setCouponData(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setCouponCode('');
    setCouponData(null);
    setCouponMessage({ type: '', text: '' });
  };

  // Pricing
  const calculatePricing = () => {
    if (!visa) return { base: 0, addons: 0, discount: 0, total: 0 };

    const base = parseFloat(visa.offerEnabled && visa.offerPrice ? visa.offerPrice : visa.price) || 0;

    const addonsTotal = selectedAddons.reduce((sum, name) => {
      const addon = (visa.addons || []).find(a => a.name === name && a.enabled);
      return sum + (addon ? parseFloat(addon.price) || 0 : 0);
    }, 0);

    const subtotal = base + addonsTotal;

    let discount = 0;
    if (couponData) {
      if (couponData.discountType === 'percentage') {
        discount = subtotal * (parseFloat(couponData.discountValue) / 100);
      } else {
        discount = parseFloat(couponData.discountValue) || 0;
      }
      discount = Math.min(discount, subtotal);
    }

    return {
      base,
      addons: addonsTotal,
      discount: Math.round(discount),
      total: Math.max(0, Math.round(subtotal - discount))
    };
  };

  // Submit
  const handleSubmit = async () => {
    // Validate
    const errs = {};
    if (!form.personalInfo.fullName?.trim()) errs.fullName = 'الاسم مطلوب';
    if (!form.personalInfo.phone?.trim()) errs.phone = 'رقم الجوال مطلوب';

    if (visa?.requiredDocuments && visa.requiredDocuments.length > 0) {
      visa.requiredDocuments.forEach(docDef => {
        if (docDef.isRequired) {
          const uploaded = (form.documents || []).find(d => d.key === docDef.key && d.fileUrl);
          if (!uploaded) errs[`doc_${docDef.key}`] = `${docDef.label} مطلوب`;
        }
      });
    } else {
      if (!form.passportImage) errs.passport = 'صورة الجواز مطلوبة';
      if (!form.personalPhoto) errs.photo = 'الصورة الشخصية مطلوبة';
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      setMessage({ type: 'error', text: 'يرجى إكمال الحقول المطلوبة' });
      return;
    }

    setSubmitting(true);
    try {
      const pricing = calculatePricing();

      // Save final data (sync legacy fields from documents for backward compat)
      await visaServiceApi.updateApplication(appId, {
        ...form,
        passportImage: (form.documents || []).find(d => d.key === 'passport_image')?.fileUrl || form.passportImage || '',
        personalPhoto: (form.documents || []).find(d => d.key === 'personal_photo')?.fileUrl || form.personalPhoto || '',
        selectedAddons: selectedAddons.map(name => {
          const addon = (visa.addons || []).find(a => a.name === name);
          return { name, price: addon ? parseFloat(addon.price) || 0 : 0 };
        }),
        couponCode: couponData ? couponCode : '',
        couponDiscount: pricing.discount,
        basePrice: pricing.base,
        addonsTotal: pricing.addons,
        totalPrice: pricing.total
      });

      // Submit
      const res = await visaServiceApi.submitApplication(appId);
      if (res.success) {
        setSubmitted(true);
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'حدث خطأ في تقديم الطلب' });
    } finally {
      setSubmitting(false);
    }
  };

  const pricing = calculatePricing();

  // Loading state
  if (loading) {
    return (
      <div className="vsf-page" dir="rtl">
        <div className="vsf-loading">جاري التحميل...</div>
      </div>
    );
  }

  // Success state
  if (submitted) {
    return (
      <div className="vsf-page" dir="rtl">
        <div className="vsf-success">
          <div className="vsf-success-icon">{getIconSvg('✅', 48)}</div>
          <h2>تم تقديم طلبك بنجاح!</h2>
          <p className="vsf-success-number">رقم الطلب: {appNumber}</p>
          <p>سيتم مراجعة طلبك وإشعارك بالتحديثات عبر البريد الإلكتروني</p>
          <div className="vsf-success-actions">
            <button onClick={() => navigate('/portal/dashboard')} className="vsf-btn primary">
              لوحة التحكم
            </button>
            <button onClick={() => navigate('/visas')} className="vsf-btn secondary">
              العودة للتأشيرات
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="vsf-page" dir="rtl">
      {/* Header */}
      <header className="vsf-header">
        <div className="vsf-header-inner">
          <button className="vsf-back" onClick={() => navigate(-1)}>→ رجوع</button>
          <div className="vsf-header-title">
            <h2>{getIconSvg('📝', 22)} تقديم طلب تأشيرة</h2>
            {visa && <span>{visa.countryName}</span>}
          </div>
          <div className="vsf-save-indicator">
            {saving && <span className="vsf-saving">{getIconSvg('⏳', 16)} حفظ تلقائي...</span>}
          </div>
        </div>
      </header>

      <div className="vsf-content">
        {message.text && (
          <div className={`vsf-message ${message.type}`}>{message.text}</div>
        )}

        {/* Upload Section */}
        <div className="vsf-section">
          <h3 className="vsf-section-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
            رفع المستندات
          </h3>

          {visa?.requiredDocuments && visa.requiredDocuments.length > 0 ? (
            <div className="vsf-upload-grid">
              {visa.requiredDocuments.map((docDef) => {
                const uploaded = (form.documents || []).find(d => d.key === docDef.key);
                const isUploading = uploading[docDef.key];
                const isDragging = dragging[docDef.key];
                const hasError = errors[`doc_${docDef.key}`];
                const fileIsPdf = uploaded && isPdf(uploaded.fileUrl, uploaded.fileType);

                return (
                  <div key={docDef.key} className="vsf-upload-item">
                    <div className="vsf-upload-label">
                      {docDef.label} {docDef.isRequired && <span style={{ color: '#ef4444' }}>*</span>}
                    </div>
                    <div
                      className={`vsf-upload-box ${isDragging ? 'dragging' : ''} ${hasError ? 'error' : ''} ${uploaded?.fileUrl ? 'has-file' : ''}`}
                      onClick={() => fileInputRefs.current[docDef.key]?.click()}
                      onDragEnter={e => handleDrag(e, docDef.key, true)}
                      onDragOver={e => handleDrag(e, docDef.key, true)}
                      onDragLeave={e => handleDrag(e, docDef.key, false)}
                      onDrop={e => handleDrop(e, docDef.key)}
                    >
                      {isUploading ? (
                        <div className="vsf-upload-placeholder">
                          <span className="vsf-uploading-spinner">&#x23F3;</span>
                          <span>جاري الرفع...</span>
                        </div>
                      ) : uploaded?.fileUrl ? (
                        fileIsPdf ? (
                          <div className="vsf-pdf-preview">
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                            <span className="vsf-pdf-name">{uploaded.originalName || 'PDF'}</span>
                            <span className="vsf-upload-change">انقر للتغيير</span>
                          </div>
                        ) : (
                          <div className="vsf-image-preview">
                            <img src={`${API_URL.replace(/\/api\/?$/, '')}${uploaded.fileUrl}`} alt={docDef.label} />
                            <span className="vsf-upload-change">انقر للتغيير</span>
                          </div>
                        )
                      ) : (
                        <div className="vsf-upload-placeholder">
                          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                          <span>اسحب الملف هنا أو انقر للرفع</span>
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                            {docDef.acceptedTypes === 'image' ? 'صور فقط' : docDef.acceptedTypes === 'pdf' ? 'PDF فقط' : 'صور أو PDF'} — حد أقصى 10 ميجا
                          </span>
                        </div>
                      )}
                      <input
                        ref={el => { fileInputRefs.current[docDef.key] = el; }}
                        type="file"
                        accept={getAcceptAttr(docDef.acceptedTypes)}
                        hidden
                        onChange={e => handleFileUpload(e, docDef.key)}
                      />
                    </div>
                    {docDef.instructions && (
                      <p className="vsf-upload-instructions">{docDef.instructions}</p>
                    )}
                    {hasError && <span className="vsf-field-error">{hasError}</span>}
                  </div>
                );
              })}
            </div>
          ) : (
            /* Fallback for old visas without requiredDocuments */
            <div className="vsf-upload-row">
              {/* Passport */}
              <div
                className={`vsf-upload-box ${dragging.passport ? 'dragging' : ''} ${errors.passport ? 'error' : ''}`}
                onClick={() => passportRef.current?.click()}
                onDragEnter={e => handleLegacyDrag(e, 'passportImage', true)}
                onDragOver={e => handleLegacyDrag(e, 'passportImage', true)}
                onDragLeave={e => handleLegacyDrag(e, 'passportImage', false)}
                onDrop={e => handleLegacyDrop(e, 'passportImage')}
              >
                {form.passportImage ? (
                  <img src={`${API_URL.replace(/\/api\/?$/, '')}${form.passportImage}`} alt="جواز" className="vsf-upload-preview" />
                ) : uploading.passport ? (
                  <span className="vsf-uploading">جاري الرفع...</span>
                ) : (
                  <>
                    <span className="vsf-upload-icon">&#x1F6C2;</span>
                    <span>صورة الجواز *</span>
                  </>
                )}
                <input ref={passportRef} type="file" accept="image/*" hidden onChange={e => handleLegacyFileUpload(e, 'passportImage')} />
              </div>

              {/* Personal Photo */}
              <div
                className={`vsf-upload-box ${dragging.photo ? 'dragging' : ''} ${errors.photo ? 'error' : ''}`}
                onClick={() => photoRef.current?.click()}
                onDragEnter={e => handleLegacyDrag(e, 'personalPhoto', true)}
                onDragOver={e => handleLegacyDrag(e, 'personalPhoto', true)}
                onDragLeave={e => handleLegacyDrag(e, 'personalPhoto', false)}
                onDrop={e => handleLegacyDrop(e, 'personalPhoto')}
              >
                {form.personalPhoto ? (
                  <img src={`${API_URL.replace(/\/api\/?$/, '')}${form.personalPhoto}`} alt="صورة شخصية" className="vsf-upload-preview" />
                ) : uploading.photo ? (
                  <span className="vsf-uploading">جاري الرفع...</span>
                ) : (
                  <>
                    <span className="vsf-upload-icon">&#x1F4F7;</span>
                    <span>صورة شخصية *</span>
                  </>
                )}
                <input ref={photoRef} type="file" accept="image/*" hidden onChange={e => handleLegacyFileUpload(e, 'personalPhoto')} />
              </div>
            </div>
          )}
        </div>

        {/* Client Notes */}
        <div className="vsf-section">
          <h3 className="vsf-section-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            ملاحظات
          </h3>
          <textarea
            value={form.clientNotes || ''}
            onChange={e => {
              const val = e.target.value;
              setForm(prev => {
                const updated = { ...prev, clientNotes: val };
                autoSave(updated);
                return updated;
              });
            }}
            placeholder="أضف أي ملاحظات أو طلبات خاصة..."
            rows={3}
            className="vsf-notes-textarea"
          />
        </div>

        {/* Personal Info */}
        <div className="vsf-section">
          <h3>{getIconSvg('👤', 20)} البيانات الشخصية</h3>
          <div className="vsf-form-grid">
            <div className="vsf-field">
              <label>الاسم الكامل *</label>
              <input
                type="text"
                value={form.personalInfo.fullName || ''}
                onChange={e => handleChange('fullName', e.target.value)}
                className={errors.fullName ? 'error' : ''}
                placeholder="الاسم كما في الجواز"
              />
              {errors.fullName && <span className="vsf-error">{errors.fullName}</span>}
            </div>
            <div className="vsf-field">
              <label>البريد الإلكتروني</label>
              <input
                type="email"
                value={form.personalInfo.email || ''}
                onChange={e => handleChange('email', e.target.value)}
                placeholder="email@example.com"
                dir="ltr"
              />
            </div>
            <div className="vsf-field">
              <label>رقم الجوال *</label>
              <input
                type="tel"
                value={form.personalInfo.phone || ''}
                onChange={e => handleChange('phone', e.target.value)}
                className={errors.phone ? 'error' : ''}
                placeholder="05XXXXXXXX"
                dir="ltr"
              />
              {errors.phone && <span className="vsf-error">{errors.phone}</span>}
            </div>
            <div className="vsf-field">
              <label>رقم الهوية / الإقامة</label>
              <input
                type="text"
                value={form.personalInfo.nationalId || ''}
                onChange={e => handleChange('nationalId', e.target.value)}
                placeholder="رقم الهوية"
                dir="ltr"
              />
            </div>
            <div className="vsf-field">
              <label>الجنسية</label>
              <input
                type="text"
                value={form.personalInfo.nationality || ''}
                onChange={e => handleChange('nationality', e.target.value)}
                placeholder="الجنسية"
              />
            </div>
            <div className="vsf-field">
              <label>تاريخ الميلاد</label>
              <input
                type="date"
                value={form.personalInfo.dateOfBirth ? new Date(form.personalInfo.dateOfBirth).toISOString().slice(0, 10) : ''}
                onChange={e => handleChange('dateOfBirth', e.target.value)}
                dir="ltr"
              />
            </div>
          </div>
        </div>

        {/* Addons */}
        {visa?.addons && visa.addons.filter(a => a.enabled).length > 0 && (
          <div className="vsf-section">
            <h3>{getIconSvg('🔧', 20)} خدمات إضافية</h3>
            <div className="vsf-addons">
              {visa.addons.filter(a => a.enabled).map((addon, i) => (
                <label className={`vsf-addon-item ${selectedAddons.includes(addon.name) ? 'selected' : ''}`} key={i}>
                  <input
                    type="checkbox"
                    checked={selectedAddons.includes(addon.name)}
                    onChange={() => toggleAddon(addon.name)}
                  />
                  <div className="vsf-addon-info">
                    <span className="vsf-addon-name">{addon.name}</span>
                    {addon.description && <span className="vsf-addon-desc">{addon.description}</span>}
                  </div>
                  <span className="vsf-addon-price">+{addon.price} {visa.currency}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Coupon */}
        <div className="vsf-section">
          <h3>{getIconSvg('🎫', 20)} كوبون خصم</h3>
          {couponData ? (
            <div className="vsf-coupon-applied">
              <span>{getIconSvg('✅', 16)} {couponCode} — خصم {couponData.discountType === 'percentage' ? `${couponData.discountValue}%` : `${couponData.discountValue} ${visa?.currency || 'ريال'}`}</span>
              <button onClick={removeCoupon} className="vsf-coupon-remove">إزالة</button>
            </div>
          ) : (
            <div className="vsf-coupon-input">
              <input
                type="text"
                value={couponCode}
                onChange={e => setCouponCode(e.target.value.toUpperCase())}
                placeholder="أدخل كود الخصم"
                dir="ltr"
                style={{ textTransform: 'uppercase' }}
              />
              <button onClick={applyCoupon} disabled={couponLoading || !couponCode.trim()}>
                {couponLoading ? '...' : 'تطبيق'}
              </button>
            </div>
          )}
          {couponMessage.text && (
            <p className={`vsf-coupon-msg ${couponMessage.type}`}>{couponMessage.text}</p>
          )}
        </div>

        {/* Pricing Summary */}
        <div className="vsf-section vsf-pricing">
          <h3>{getIconSvg('💰', 20)} ملخص التسعير</h3>
          <div className="vsf-pricing-rows">
            <div className="vsf-pricing-row">
              <span>سعر التأشيرة</span>
              <span>{pricing.base} {visa?.currency || 'ريال'}</span>
            </div>
            {pricing.addons > 0 && (
              <div className="vsf-pricing-row">
                <span>خدمات إضافية</span>
                <span>+{pricing.addons} {visa?.currency || 'ريال'}</span>
              </div>
            )}
            {pricing.discount > 0 && (
              <div className="vsf-pricing-row discount">
                <span>خصم الكوبون</span>
                <span>-{pricing.discount} {visa?.currency || 'ريال'}</span>
              </div>
            )}
            <div className="vsf-pricing-row total">
              <span>الإجمالي</span>
              <span>{pricing.total} {visa?.currency || 'ريال'}</span>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="vsf-submit-section">
          <button
            className="vsf-btn primary large"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? 'جاري التقديم...' : <>{getIconSvg('📤', 18)} تقديم الطلب</>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VisaServiceForm;
