import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useClientAuth } from '../../context/ClientAuthContext';
import licenseApi from '../../api/licenseApi';
import { websiteApi } from '../../api';
import './LicenseForm.css';

const INITIAL_FORM = {
  licenseImage: '',
  passportImage: '',
  personalPhoto: '',
  familyName: '',
  givenName: '',
  placeOfBirth: '',
  dateOfBirth: '',
  nationality: '',
  address: '',
  email: '',
  nationalId: '',
  phone: '',
};

const UPLOAD_FIELDS = [
  { field: 'licenseImage', label: 'صورة الرخصة', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="28" height="28"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M7 16h2M13 16h2" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  { field: 'passportImage', label: 'صورة الجواز', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="28" height="28"><path d="M6 2h12a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"/><circle cx="12" cy="10" r="3"/><path d="M8 17h8"/></svg> },
  { field: 'personalPhoto', label: 'صورة شخصية', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="28" height="28"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg> },
];

const DELIVERY_LABELS = {
  pickup: { label: 'استلام من المكتب', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" strokeLinecap="round" strokeLinejoin="round"/><polyline points="9 22 9 12 15 12 15 22" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  delivery: { label: 'توصيل', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg> },
  shipping: { label: 'شحن', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg> },
};

const LicenseForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { client } = useClientAuth();

  const [appId, setAppId] = useState(id || null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [uploading, setUploading] = useState({});
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [appNumber, setAppNumber] = useState('');
  const [message, setMessage] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [dragging, setDragging] = useState({});

  // Pricing & addons state
  const [licenseSettings, setLicenseSettings] = useState(null);
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [couponCode, setCouponCode] = useState('');
  const [couponData, setCouponData] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponMessage, setCouponMessage] = useState(null);

  // OCR state
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrMessage, setOcrMessage] = useState(null);

  // Delivery state
  const [deliveryMethod, setDeliveryMethod] = useState('');
  const [shippingAddress, setShippingAddress] = useState({
    buildingNumber: '', streetName: '', district: '', city: '', postalCode: '', additionalCode: ''
  });

  const saveTimerRef = useRef(null);
  const fileInputRefs = useRef({});

  // Load license settings (pricing, addons, delivery)
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await websiteApi.getPublicContent();
        if (res.success && res.data?.internationalLicense) {
          setLicenseSettings(res.data.internationalLicense);
        }
      } catch (err) {
        // use defaults
      }
    };
    loadSettings();
  }, []);

  // Create or load application on mount
  useEffect(() => {
    const init = async () => {
      try {
        if (id) {
          const res = await licenseApi.getApplication(id);
          if (res.success) {
            const app = res.data.application || res.data;
            if (['submitted', 'approved', 'rejected', 'under_review', 'completed', 'received'].includes(app.status)) {
              setSubmitted(true);
              setAppNumber(app.applicationNumber || app._id);
            }
            setAppId(app._id);
            setForm(prev => ({
              ...prev,
              licenseImage: app.licenseImage ?? '',
              passportImage: app.passportImage ?? '',
              personalPhoto: app.personalPhoto ?? '',
              familyName: app.personalInfo?.familyName ?? '',
              givenName: app.personalInfo?.givenName ?? '',
              placeOfBirth: app.personalInfo?.placeOfBirth ?? '',
              dateOfBirth: app.personalInfo?.dateOfBirth ? app.personalInfo.dateOfBirth.slice(0, 10) : '',
              nationality: app.personalInfo?.nationality ?? '',
              address: app.personalInfo?.address ?? '',
              email: app.personalInfo?.email ?? '',
              nationalId: app.personalInfo?.nationalId ?? '',
              phone: app.personalInfo?.phone ?? '',
            }));
            if (app.selectedAddons?.length) {
              setSelectedAddons(app.selectedAddons.map(a => a.name));
            }
            if (app.couponCode) {
              setCouponCode(app.couponCode);
              if (app.couponDiscount > 0) {
                setCouponData({ code: app.couponCode, discountValue: String(app.couponDiscount), discountType: 'fixed' });
              }
            }
            if (app.deliveryMethod) {
              setDeliveryMethod(app.deliveryMethod);
            }
            if (app.shippingAddress) {
              setShippingAddress(prev => ({ ...prev, ...app.shippingAddress }));
            }
          }
        } else {
          const res = await licenseApi.createApplication();
          if (res.success) {
            const app = res.data.application || res.data;
            setAppId(app._id);
            window.history.replaceState(null, '', `/portal/license/apply/${app._id}`);
          }
        }
      } catch (err) {
        console.error('Init error:', err);
        setMessage({ type: 'error', text: err.response?.data?.message || 'حدث خطأ في تحميل الطلب' });
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [id]);

  // Auto-fill from client profile (email, phone, address, nationalId, shippingAddress)
  useEffect(() => {
    if (client && !id) {
      setForm(prev => ({
        ...prev,
        email: prev.email || client.email || '',
        phone: prev.phone || client.phone || '',
        address: prev.address || client.address || '',
        nationalId: prev.nationalId || client.nationalId || '',
      }));
      // تعبئة عنوان الشحن من الحساب أو localStorage
      if (client.shippingAddress?.city) {
        setShippingAddress(prev => {
          if (prev.city) return prev; // لا نكتب فوق بيانات موجودة
          return { ...prev, ...client.shippingAddress };
        });
      } else {
        try {
          const saved = localStorage.getItem('trcolors_shipping');
          if (saved) {
            const parsed = JSON.parse(saved);
            setShippingAddress(prev => {
              if (prev.city) return prev;
              return { ...prev, ...parsed };
            });
          }
        } catch (e) { /* ignore */ }
      }
    }
  }, [client, id]);

  // ===== Pricing calculations =====
  const getBasePrice = () => {
    if (!licenseSettings) return 200;
    if (licenseSettings.offerEnabled && licenseSettings.offerPrice) {
      return parseFloat(licenseSettings.offerPrice) || 0;
    }
    return parseFloat(licenseSettings.price) || 200;
  };

  const getAddonsTotal = () => {
    if (!licenseSettings?.addons) return 0;
    return licenseSettings.addons
      .filter(a => a.enabled !== false && selectedAddons.includes(a.name))
      .reduce((sum, a) => sum + (parseFloat(a.price) || 0), 0);
  };

  const getDeliveryPrice = () => {
    if (!deliveryMethod || !licenseSettings?.deliveryOptions) return 0;
    const opt = licenseSettings.deliveryOptions[deliveryMethod];
    if (!opt?.enabled) return 0;
    return parseFloat(opt.price) || 0;
  };

  const getCouponDiscount = (subtotal) => {
    if (!couponData) return 0;
    if (couponData.discountType === 'percentage') {
      return Math.round((subtotal * parseFloat(couponData.discountValue || 0)) / 100);
    }
    return parseFloat(couponData.discountValue || 0);
  };

  const basePrice = getBasePrice();
  const addonsTotal = getAddonsTotal();
  const deliveryPrice = getDeliveryPrice();
  const subtotal = basePrice + addonsTotal + deliveryPrice;
  const couponDiscount = getCouponDiscount(subtotal);
  const totalPrice = Math.max(0, subtotal - couponDiscount);
  const currency = licenseSettings?.currency ?? 'ريال';

  // Delivery options from settings
  const deliveryOptions = licenseSettings?.deliveryOptions ?? {};
  const availableDeliveryMethods = ['pickup', 'delivery', 'shipping'].filter(
    m => deliveryOptions[m]?.enabled !== false
  );

  // Toggle addon selection
  const toggleAddon = (addonName) => {
    setSelectedAddons(prev =>
      prev.includes(addonName) ? prev.filter(n => n !== addonName) : [...prev, addonName]
    );
  };

  // Validate coupon
  const handleValidateCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponMessage(null);
    try {
      const res = await licenseApi.validateCoupon(couponCode.trim());
      if (res.success) {
        setCouponData(res.data);
        setCouponMessage({ type: 'success', text: `تم تطبيق الكوبون — خصم ${res.data.discountType === 'percentage' ? res.data.discountValue + '%' : res.data.discountValue + ' ' + currency}` });
      }
    } catch (err) {
      setCouponData(null);
      setCouponMessage({ type: 'error', text: err.response?.data?.message || 'كود الكوبون غير صالح' });
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setCouponCode('');
    setCouponData(null);
    setCouponMessage(null);
  };

  // Transform flat form to API format
  const buildApiData = (formData) => {
    const { licenseImage, passportImage, personalPhoto, ...personalFields } = formData;
    return { licenseImage, passportImage, personalPhoto, personalInfo: personalFields };
  };

  // Debounced auto-save
  const autoSave = useCallback((updatedForm) => {
    if (!appId) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      try {
        setSaving(true);
        await licenseApi.updateApplication(appId, buildApiData(updatedForm));
      } catch (err) {
        console.error('Auto-save error:', err);
      } finally {
        setSaving(false);
      }
    }, 1500);
  }, [appId]);

  useEffect(() => {
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, []);

  const handleChange = (field, value) => {
    const updated = { ...form, [field]: value };
    setForm(updated);
    setErrors(prev => ({ ...prev, [field]: '' }));
    autoSave(updated);
  };

  const handleShippingChange = (field, value) => {
    setShippingAddress(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [`shipping_${field}`]: '' }));
  };

  // OCR للجواز — قراءة البيانات تلقائياً
  const runOcr = async (file) => {
    setOcrLoading(true);
    setOcrMessage({ type: 'info', text: 'جاري قراءة بيانات الجواز...' });
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await licenseApi.ocrPassport(fd);
      if (res.success && res.data) {
        setForm(prev => ({
          ...prev,
          familyName: prev.familyName || res.data.familyName || '',
          givenName: prev.givenName || res.data.givenName || '',
          dateOfBirth: prev.dateOfBirth || (res.data.dateOfBirth ? res.data.dateOfBirth.slice(0, 10) : ''),
          nationality: prev.nationality || res.data.nationality || '',
          placeOfBirth: prev.placeOfBirth || res.data.placeOfBirth || '',
        }));
        setOcrMessage({ type: 'success', text: '✅ تم تعبئة البيانات تلقائياً من الجواز' });
      }
    } catch (err) {
      console.error('OCR error:', err);
      setOcrMessage({ type: 'warning', text: 'لم نتمكن من قراءة الجواز تلقائياً — يمكنك إدخال البيانات يدوياً' });
    } finally {
      setOcrLoading(false);
      setTimeout(() => setOcrMessage(null), 5000);
    }
  };

  const handleFileUpload = async (field, file) => {
    if (!file) return;
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setMessage({ type: 'error', text: 'حجم الملف كبير جداً. الحد الأقصى 10 ميغابايت' });
      return;
    }
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setMessage({ type: 'error', text: 'نوع الملف غير مدعوم. يرجى رفع صورة (JPG, PNG, WEBP)' });
      return;
    }
    setUploading(prev => ({ ...prev, [field]: true }));
    setMessage(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('field', field);
      if (appId) formData.append('applicationId', appId);
      const res = await licenseApi.uploadFile(formData);
      if (res.success) {
        const url = res.data?.url || res.data?.path || res.url;
        const updated = { ...form, [field]: url };
        setForm(updated);
        setErrors(prev => ({ ...prev, [field]: '' }));
        if (appId) {
          try { await licenseApi.updateApplication(appId, { [field]: url }); } catch (e) { console.error('Save after upload error:', e); }
        }
        // تشغيل OCR تلقائياً عند رفع صورة الجواز
        if (field === 'passportImage') {
          runOcr(file);
        }
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'حدث خطأ في رفع الملف' });
    } finally {
      setUploading(prev => ({ ...prev, [field]: false }));
    }
  };

  const handleDragOver = (e, field) => { e.preventDefault(); e.stopPropagation(); setDragging(prev => ({ ...prev, [field]: true })); };
  const handleDragLeave = (e, field) => { e.preventDefault(); e.stopPropagation(); setDragging(prev => ({ ...prev, [field]: false })); };
  const handleDrop = (e, field) => { e.preventDefault(); e.stopPropagation(); setDragging(prev => ({ ...prev, [field]: false })); const file = e.dataTransfer.files[0]; if (file) handleFileUpload(field, file); };

  const validate = () => {
    const errs = {};
    if (!form.licenseImage) errs.licenseImage = 'مطلوب';
    if (!form.passportImage) errs.passportImage = 'مطلوب';
    if (!form.personalPhoto) errs.personalPhoto = 'مطلوب';
    if (!form.familyName.trim()) errs.familyName = 'مطلوب';
    if (!form.givenName.trim()) errs.givenName = 'مطلوب';
    if (!form.dateOfBirth) errs.dateOfBirth = 'مطلوب';
    if (!form.nationality.trim()) errs.nationality = 'مطلوب';
    if (!form.nationalId.trim()) errs.nationalId = 'مطلوب';
    if (!form.phone.trim()) errs.phone = 'مطلوب';
    if (!deliveryMethod) errs.deliveryMethod = 'يرجى اختيار طريقة التسليم';
    if (deliveryMethod === 'shipping') {
      if (!shippingAddress.city.trim()) errs.shipping_city = 'مطلوب';
      if (!shippingAddress.district.trim()) errs.shipping_district = 'مطلوب';
      if (!shippingAddress.streetName.trim()) errs.shipping_streetName = 'مطلوب';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      setMessage({ type: 'error', text: 'يرجى تعبئة جميع الحقول المطلوبة' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setSubmitting(true);
    setMessage(null);
    try {
      const addonsList = (licenseSettings?.addons || [])
        .filter(a => a.enabled !== false && selectedAddons.includes(a.name))
        .map(a => ({ name: a.name, price: parseFloat(a.price) || 0 }));

      const pricingData = {
        ...buildApiData(form),
        selectedAddons: addonsList,
        couponCode: couponData ? couponData.code : '',
        couponDiscount: couponDiscount,
        basePrice: basePrice,
        addonsTotal: addonsTotal,
        deliveryPrice: deliveryPrice,
        totalPrice: totalPrice,
        deliveryMethod: deliveryMethod,
        shippingAddress: deliveryMethod === 'shipping' ? shippingAddress : {}
      };

      await licenseApi.updateApplication(appId, pricingData);
      const res = await licenseApi.submitApplication(appId);
      if (res.success) {
        setSubmitted(true);
        setAppNumber(res.data?.applicationNumber || res.data?.application?.applicationNumber || appId);
        // حفظ عنوان الشحن في localStorage لتعبئته في الطلبات القادمة
        if (deliveryMethod === 'shipping' && shippingAddress.city) {
          try { localStorage.setItem('trcolors_shipping', JSON.stringify(shippingAddress)); } catch (e) { /* ignore */ }
        }
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'حدث خطأ في إرسال الطلب' });
    } finally {
      setSubmitting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="lf-page" dir="rtl">
        <header className="lf-header">
          <div className="lf-header-container">
            <div className="lf-header-title"><h1>طلب رخصة دولية</h1></div>
          </div>
        </header>
        <div className="lf-loading">جاري التحميل...</div>
      </div>
    );
  }

  // Success state
  if (submitted) {
    return (
      <div className="lf-page" dir="rtl">
        <header className="lf-header">
          <div className="lf-header-container">
            <div className="lf-header-title"><h1>طلب رخصة دولية</h1></div>
          </div>
        </header>
        <div className="lf-main">
          <div className="lf-success">
            <span className="lf-success-icon">&#10003;</span>
            <h2>تم إرسال طلبك بنجاح!</h2>
            {appNumber && <p className="lf-success-app-num">رقم الطلب: {appNumber}</p>}
            <p>سيتم مراجعة طلبك والتواصل معك قريباً</p>
            <div className="lf-success-actions">
              <button className="lf-btn-primary" onClick={() => navigate('/portal/dashboard')}>لوحة التحكم</button>
              <button className="lf-btn-secondary" onClick={() => navigate('/international-license')}>العودة للصفحة</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const availableAddons = (licenseSettings?.addons || []).filter(a => a.enabled !== false && a.name);

  return (
    <div className="lf-page" dir="rtl">
      {/* Header */}
      <header className="lf-header">
        <div className="lf-header-container">
          <button className="lf-back-btn" onClick={() => navigate('/portal/dashboard')}>← لوحة التحكم</button>
          <div className="lf-header-title"><h1>طلب رخصة دولية</h1></div>
          {saving && <span className="lf-saving-badge">جاري الحفظ...</span>}
        </div>
      </header>

      {/* Main */}
      <div className="lf-main">
        {message && <div className={`lf-message ${message.type}`}>{message.text}</div>}

        <div className="lf-card">
          <h1>طلب رخصة دولية</h1>
          <p>ارفع المستندات المطلوبة وأكمل بياناتك الشخصية</p>

          {/* Section 1: Upload Images */}
          <h2 className="lf-section-title"><span className="lf-section-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" strokeLinecap="round" strokeLinejoin="round"/></svg></span> رفع المستندات</h2>
          <div className="lf-uploads">
            {UPLOAD_FIELDS.map(({ field, label, icon }) => (
              <div
                key={field}
                className={`lf-upload-box ${form[field] ? 'has-file' : ''} ${dragging[field] ? 'dragging' : ''}`}
                onClick={() => fileInputRefs.current[field]?.click()}
                onDragOver={(e) => handleDragOver(e, field)}
                onDragLeave={(e) => handleDragLeave(e, field)}
                onDrop={(e) => handleDrop(e, field)}
              >
                <input type="file" accept="image/*" style={{ display: 'none' }} ref={el => fileInputRefs.current[field] = el} onChange={(e) => handleFileUpload(field, e.target.files[0])} />
                {uploading[field] ? (
                  <div className="lf-upload-loading">جاري الرفع...</div>
                ) : form[field] ? (
                  <div className="lf-upload-preview">
                    <img src={form[field]} alt={label} />
                    <span className="lf-upload-change">اضغط لتغيير الصورة</span>
                  </div>
                ) : (
                  <>
                    <span className="lf-upload-icon">{icon}</span>
                    <span className="lf-upload-label">{label}</span>
                    <span className="lf-upload-hint">اضغط أو اسحب الصورة هنا</span>
                  </>
                )}
                {errors[field] && <span className="lf-upload-error">{errors[field]}</span>}
              </div>
            ))}
          </div>

          {/* OCR Message */}
          {ocrMessage && (
            <div className={`lf-ocr-message lf-ocr-${ocrMessage.type}`}>
              {ocrLoading && <span className="lf-ocr-spinner"></span>}
              {ocrMessage.text}
            </div>
          )}

          {/* Section 2: Personal Info */}
          <h2 className="lf-section-title"><span className="lf-section-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></span> البيانات الشخصية</h2>
          <div className="lf-personal">
            <div className="lf-row">
              <div className="lf-field">
                <label>الاسم الأول <span className="lf-required">*</span></label>
                <input type="text" value={form.givenName} onChange={(e) => handleChange('givenName', e.target.value)} placeholder="مثال: محمد" className={errors.givenName ? 'lf-error' : ''} />
                {errors.givenName && <span className="lf-error-text">{errors.givenName}</span>}
              </div>
              <div className="lf-field">
                <label>اسم العائلة <span className="lf-required">*</span></label>
                <input type="text" value={form.familyName} onChange={(e) => handleChange('familyName', e.target.value)} placeholder="مثال: الأحمدي" className={errors.familyName ? 'lf-error' : ''} />
                {errors.familyName && <span className="lf-error-text">{errors.familyName}</span>}
              </div>
            </div>
            <div className="lf-row">
              <div className="lf-field">
                <label>تاريخ الميلاد <span className="lf-required">*</span></label>
                <input type="date" value={form.dateOfBirth} onChange={(e) => handleChange('dateOfBirth', e.target.value)} className={errors.dateOfBirth ? 'lf-error' : ''} />
                {errors.dateOfBirth && <span className="lf-error-text">{errors.dateOfBirth}</span>}
              </div>
              <div className="lf-field">
                <label>مكان الميلاد</label>
                <input type="text" value={form.placeOfBirth} onChange={(e) => handleChange('placeOfBirth', e.target.value)} placeholder="مثال: الرياض" />
              </div>
            </div>
            <div className="lf-row">
              <div className="lf-field">
                <label>الجنسية <span className="lf-required">*</span></label>
                <input type="text" value={form.nationality} onChange={(e) => handleChange('nationality', e.target.value)} placeholder="مثال: سعودي" className={errors.nationality ? 'lf-error' : ''} />
                {errors.nationality && <span className="lf-error-text">{errors.nationality}</span>}
              </div>
              <div className="lf-field">
                <label>رقم الهوية / الإقامة <span className="lf-required">*</span></label>
                <input type="text" value={form.nationalId} onChange={(e) => handleChange('nationalId', e.target.value)} placeholder="مثال: 1234567890" className={errors.nationalId ? 'lf-error' : ''} />
                {errors.nationalId && <span className="lf-error-text">{errors.nationalId}</span>}
              </div>
            </div>
            <div className="lf-field">
              <label>العنوان</label>
              <input type="text" value={form.address} onChange={(e) => handleChange('address', e.target.value)} placeholder="المدينة - الحي - الشارع" />
            </div>
            <div className="lf-row">
              <div className="lf-field">
                <label>البريد الإلكتروني</label>
                <input type="email" value={form.email} onChange={(e) => handleChange('email', e.target.value)} placeholder="example@email.com" dir="ltr" style={{ textAlign: 'right' }} />
              </div>
              <div className="lf-field">
                <label>رقم الجوال <span className="lf-required">*</span></label>
                <input type="tel" value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} placeholder="05XXXXXXXX" dir="ltr" style={{ textAlign: 'right' }} className={errors.phone ? 'lf-error' : ''} />
                {errors.phone && <span className="lf-error-text">{errors.phone}</span>}
              </div>
            </div>
          </div>

          {/* Section 3: Delivery Method */}
          {availableDeliveryMethods.length > 0 && (
            <>
              <h2 className="lf-section-title"><span className="lf-section-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg></span> طريقة التسليم <span className="lf-required">*</span></h2>
              {errors.deliveryMethod && <div className="lf-delivery-error">{errors.deliveryMethod}</div>}
              <div className="lf-delivery-options">
                {availableDeliveryMethods.map(method => {
                  const opt = deliveryOptions[method];
                  const info = DELIVERY_LABELS[method];
                  const price = parseFloat(opt?.price) || 0;
                  return (
                    <label
                      key={method}
                      className={`lf-delivery-card ${deliveryMethod === method ? 'selected' : ''}`}
                    >
                      <input
                        type="radio"
                        name="deliveryMethod"
                        value={method}
                        checked={deliveryMethod === method}
                        onChange={() => { setDeliveryMethod(method); setErrors(prev => ({ ...prev, deliveryMethod: '' })); }}
                      />
                      <div className="lf-delivery-card-icon">{info.icon}</div>
                      <div className="lf-delivery-card-body">
                        <span className="lf-delivery-card-label">{info.label}</span>
                        <span className="lf-delivery-card-price">
                          {price === 0 ? 'مجاناً' : `${price} ${currency}`}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>

              {/* Delivery method messages */}
              {deliveryMethod === 'pickup' && deliveryOptions.pickup && (
                <div className="lf-delivery-message lf-delivery-info">
                  <span className="lf-delivery-msg-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" strokeLinecap="round" strokeLinejoin="round"/><polyline points="9 22 9 12 15 12 15 22" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
                  <div>
                    <strong>{deliveryOptions.pickup.message}</strong>
                    {deliveryOptions.pickup.address && (
                      <p className="lf-delivery-address">{deliveryOptions.pickup.address}</p>
                    )}
                  </div>
                </div>
              )}

              {deliveryMethod === 'delivery' && deliveryOptions.delivery && (
                <div className="lf-delivery-message lf-delivery-warning">
                  <span className="lf-delivery-msg-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg></span>
                  <div>
                    <strong>{deliveryOptions.delivery.message}</strong>
                  </div>
                </div>
              )}

              {deliveryMethod === 'shipping' && deliveryOptions.shipping && (
                <>
                  <div className="lf-delivery-message lf-delivery-warning">
                    <span className="lf-delivery-msg-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg></span>
                    <div>
                      <strong>{deliveryOptions.shipping.message}</strong>
                    </div>
                  </div>

                  {/* National Address Form */}
                  <div className="lf-shipping-form">
                    <h3 className="lf-shipping-title">العنوان الوطني</h3>
                    <div className="lf-row">
                      <div className="lf-field">
                        <label>المدينة <span className="lf-required">*</span></label>
                        <input
                          type="text"
                          value={shippingAddress.city}
                          onChange={e => handleShippingChange('city', e.target.value)}
                          placeholder="مثال: الرياض"
                          className={errors.shipping_city ? 'lf-error' : ''}
                        />
                        {errors.shipping_city && <span className="lf-error-text">{errors.shipping_city}</span>}
                      </div>
                      <div className="lf-field">
                        <label>الحي <span className="lf-required">*</span></label>
                        <input
                          type="text"
                          value={shippingAddress.district}
                          onChange={e => handleShippingChange('district', e.target.value)}
                          placeholder="مثال: حي النرجس"
                          className={errors.shipping_district ? 'lf-error' : ''}
                        />
                        {errors.shipping_district && <span className="lf-error-text">{errors.shipping_district}</span>}
                      </div>
                    </div>
                    <div className="lf-row">
                      <div className="lf-field">
                        <label>اسم الشارع <span className="lf-required">*</span></label>
                        <input
                          type="text"
                          value={shippingAddress.streetName}
                          onChange={e => handleShippingChange('streetName', e.target.value)}
                          placeholder="مثال: شارع الملك فهد"
                          className={errors.shipping_streetName ? 'lf-error' : ''}
                        />
                        {errors.shipping_streetName && <span className="lf-error-text">{errors.shipping_streetName}</span>}
                      </div>
                      <div className="lf-field">
                        <label>رقم المبنى</label>
                        <input
                          type="text"
                          value={shippingAddress.buildingNumber}
                          onChange={e => handleShippingChange('buildingNumber', e.target.value)}
                          placeholder="مثال: 1234"
                        />
                      </div>
                    </div>
                    <div className="lf-row">
                      <div className="lf-field">
                        <label>الرمز البريدي</label>
                        <input
                          type="text"
                          value={shippingAddress.postalCode}
                          onChange={e => handleShippingChange('postalCode', e.target.value)}
                          placeholder="مثال: 12345"
                          dir="ltr"
                          style={{ textAlign: 'right' }}
                        />
                      </div>
                      <div className="lf-field">
                        <label>الرمز الإضافي</label>
                        <input
                          type="text"
                          value={shippingAddress.additionalCode}
                          onChange={e => handleShippingChange('additionalCode', e.target.value)}
                          placeholder="مثال: 6789"
                          dir="ltr"
                          style={{ textAlign: 'right' }}
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {/* Section 4: Add-ons */}
          {availableAddons.length > 0 && (
            <>
              <h2 className="lf-section-title"><span className="lf-section-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" strokeLinecap="round" strokeLinejoin="round"/></svg></span> خدمات إضافية</h2>
              <div className="lf-addons">
                {availableAddons.map((addon, i) => (
                  <label key={i} className={`lf-addon-card ${selectedAddons.includes(addon.name) ? 'selected' : ''}`}>
                    <div className="lf-addon-check">
                      <input type="checkbox" checked={selectedAddons.includes(addon.name)} onChange={() => toggleAddon(addon.name)} />
                    </div>
                    <div className="lf-addon-info">
                      <span className="lf-addon-name">{addon.name}</span>
                      {addon.description && <span className="lf-addon-desc">{addon.description}</span>}
                    </div>
                    <div className="lf-addon-price">+{addon.price} {currency}</div>
                  </label>
                ))}
              </div>
            </>
          )}

          {/* Section 5: Coupon */}
          <h2 className="lf-section-title"><span className="lf-section-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" strokeLinecap="round" strokeLinejoin="round"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg></span> كوبون خصم</h2>
          <div className="lf-coupon-section">
            {couponData ? (
              <div className="lf-coupon-applied">
                <div className="lf-coupon-applied-info">
                  <span className="lf-coupon-applied-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
                  <span className="lf-coupon-applied-text">
                    الكوبون <strong>{couponData.code}</strong> مطبق — خصم {couponData.discountType === 'percentage' ? `${couponData.discountValue}%` : `${couponData.discountValue} ${currency}`}
                  </span>
                </div>
                <button className="lf-coupon-remove" onClick={removeCoupon}>إزالة</button>
              </div>
            ) : (
              <div className="lf-coupon-input-row">
                <input
                  type="text" value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="أدخل كود الكوبون" dir="ltr" style={{ textAlign: 'right' }}
                  className="lf-coupon-input"
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleValidateCoupon(); } }}
                />
                <button className="lf-coupon-btn" onClick={handleValidateCoupon} disabled={couponLoading || !couponCode.trim()}>
                  {couponLoading ? '...' : 'تطبيق'}
                </button>
              </div>
            )}
            {couponMessage && <div className={`lf-coupon-message ${couponMessage.type}`}>{couponMessage.text}</div>}
          </div>

          {/* Section 6: Pricing Summary */}
          <div className="lf-pricing-summary">
            <h3>ملخص التكلفة</h3>
            <div className="lf-pricing-row">
              <span>رسوم الرخصة الدولية</span>
              <span>{basePrice} {currency}</span>
            </div>
            {selectedAddons.length > 0 && (licenseSettings?.addons || [])
              .filter(a => a.enabled !== false && selectedAddons.includes(a.name))
              .map((addon, i) => (
                <div className="lf-pricing-row lf-pricing-addon" key={i}>
                  <span>{addon.name}</span>
                  <span>+{addon.price} {currency}</span>
                </div>
              ))
            }
            {deliveryMethod && deliveryPrice > 0 && (
              <div className="lf-pricing-row lf-pricing-addon">
                <span>{DELIVERY_LABELS[deliveryMethod]?.label ?? 'التسليم'}</span>
                <span>+{deliveryPrice} {currency}</span>
              </div>
            )}
            {deliveryMethod && deliveryPrice === 0 && (
              <div className="lf-pricing-row lf-pricing-addon">
                <span>{DELIVERY_LABELS[deliveryMethod]?.label ?? 'التسليم'}</span>
                <span style={{ color: '#16a34a', fontWeight: 700 }}>مجاناً</span>
              </div>
            )}
            {couponData && couponDiscount > 0 && (
              <div className="lf-pricing-row lf-pricing-discount">
                <span>خصم الكوبون ({couponData.code})</span>
                <span>-{couponDiscount} {currency}</span>
              </div>
            )}
            <div className="lf-pricing-row lf-pricing-total">
              <span>الإجمالي</span>
              <span>{totalPrice} {currency}</span>
            </div>
          </div>

          {/* Submit */}
          <button className="lf-submit" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'جاري الإرسال...' : `إرسال الطلب — ${totalPrice} ${currency}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LicenseForm;
