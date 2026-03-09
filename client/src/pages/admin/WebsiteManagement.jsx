import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { websiteApi, visaApi } from '../../api';
import VisaCatalogTab from './VisaCatalogTab';
import ContactsManagement from './ContactsManagement';
import './WebsiteManagement.css';

const TABS = [
  { id: 'hero', label: 'البانر الرئيسي', icon: '🖼️' },
  { id: 'services', label: 'الخدمات', icon: '🛎️' },
  { id: 'about', label: 'من نحن', icon: '🏢' },
  { id: 'faq', label: 'الأسئلة الشائعة', icon: '❓' },
  { id: 'contact', label: 'التواصل', icon: '📞' },
  { id: 'general', label: 'عام', icon: '⚙️' },
  { id: 'americanVisa', label: 'التأشيرة الأمريكية', icon: '🇺🇸' },
  { id: 'licenseSettings', label: 'إعدادات الرخصة', icon: '⚙️' },
  { id: 'licenseApps', label: 'طلبات الرخصة', icon: '🪪' },
  { id: 'clients', label: 'المستخدمين', icon: '👥' },
  { id: 'email', label: 'خدمات البريد', icon: '📧' },
  { id: 'testimonials', label: 'آراء العملاء', icon: '⭐' },
  { id: 'visaCatalog', label: 'كتالوج التأشيرات', icon: '🌍' }
];

const VISA_STATUS_MAP = {
  draft: { label: 'مسودة', color: '#64748b', bg: '#f1f5f9' },
  submitted: { label: 'جديد', color: '#2563eb', bg: '#eff6ff' },
  under_review: { label: 'قيد المراجعة', color: '#d97706', bg: '#fffbeb' },
  approved: { label: 'مقبول', color: '#16a34a', bg: '#f0fdf4' },
  rejected: { label: 'مرفوض', color: '#dc2626', bg: '#fef2f2' }
};

const VISA_TYPE_MAP = {
  tourism: 'سياحية',
  medical: 'علاج',
  study: 'دراسة'
};

const LICENSE_STATUS_MAP = {
  draft: { label: 'مسودة', color: '#64748b', bg: '#f1f5f9' },
  submitted: { label: 'جديد', color: '#2563eb', bg: '#eff6ff' },
  under_review: { label: 'قيد المراجعة', color: '#d97706', bg: '#fffbeb' },
  approved: { label: 'مقبول', color: '#16a34a', bg: '#f0fdf4' },
  rejected: { label: 'مرفوض', color: '#dc2626', bg: '#fef2f2' },
  completed: { label: 'مكتمل', color: '#7c3aed', bg: '#f5f3ff' },
  received: { label: 'مستلم', color: '#0891b2', bg: '#ecfeff' }
};

const DELIVERY_METHOD_MAP = {
  pickup: { label: 'استلام من المكتب', icon: '🏢' },
  delivery: { label: 'توصيل', icon: '🚗' },
  shipping: { label: 'شحن', icon: '📦' }
};

const WebsiteManagement = ({ initialTab = 'hero' }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Visa applications state
  const [visaApps, setVisaApps] = useState([]);
  const [visaStats, setVisaStats] = useState({});
  const [visaLoading, setVisaLoading] = useState(false);
  const [visaSearch, setVisaSearch] = useState('');
  const [visaFilter, setVisaFilter] = useState('all');
  const [visaPage, setVisaPage] = useState(1);
  const [visaPagination, setVisaPagination] = useState({});

  // Registered clients state
  const [clients, setClients] = useState([]);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [clientsSearch, setClientsSearch] = useState('');

  // Client detail state
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientDetail, setClientDetail] = useState(null);
  const [clientDetailLoading, setClientDetailLoading] = useState(false);

  // License applications state
  const [licenseApps, setLicenseApps] = useState([]);
  const [licenseStats, setLicenseStats] = useState({});
  const [licenseLoading, setLicenseLoading] = useState(false);
  const [licenseSearch, setLicenseSearch] = useState('');
  const [licenseFilter, setLicenseFilter] = useState('all');
  const [licensePage, setLicensePage] = useState(1);
  const [licensePagination, setLicensePagination] = useState({});

  // Email settings state
  const [emailOpenSections, setEmailOpenSections] = useState({});

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      setLoading(true);
      const res = await websiteApi.getContent();
      if (res.success) {
        setContent(res.data);
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'حدث خطأ في تحميل المحتوى' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      // استبعاد الحقول التي يديرها ContactsManagement بشكل مستقل
      // حتى لا يتم الكتابة فوق البيانات المحفوظة من هناك
      const { contactDepartments, workingHours, mapEmbed, ...safeContent } = content;
      const res = await websiteApi.updateContent(safeContent);
      if (res.success) {
        setMessage({ type: 'success', text: 'تم حفظ التغييرات بنجاح' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'حدث خطأ في الحفظ' });
    } finally {
      setSaving(false);
    }
  };

  const updateField = (path, value) => {
    setContent(prev => {
      const updated = { ...prev };
      const keys = path.split('.');
      let obj = updated;
      for (let i = 0; i < keys.length - 1; i++) {
        if (obj[keys[i]] === undefined) obj[keys[i]] = {};
        obj[keys[i]] = { ...obj[keys[i]] };
        obj = obj[keys[i]];
      }
      obj[keys[keys.length - 1]] = value;
      return updated;
    });
  };

  const updateArrayItem = (arrayPath, index, field, value) => {
    setContent(prev => {
      const updated = { ...prev };
      const arr = [...(arrayPath.split('.').reduce((o, k) => o?.[k], updated) || [])];
      arr[index] = { ...arr[index], [field]: value };
      const keys = arrayPath.split('.');
      let obj = updated;
      for (let i = 0; i < keys.length - 1; i++) {
        obj[keys[i]] = { ...obj[keys[i]] };
        obj = obj[keys[i]];
      }
      obj[keys[keys.length - 1]] = arr;
      return updated;
    });
  };

  const addArrayItem = (arrayPath, defaultItem) => {
    setContent(prev => {
      const updated = { ...prev };
      const keys = arrayPath.split('.');
      let obj = updated;
      for (let i = 0; i < keys.length - 1; i++) {
        obj[keys[i]] = { ...obj[keys[i]] };
        obj = obj[keys[i]];
      }
      const arr = [...(obj[keys[keys.length - 1]] || [])];
      arr.push(defaultItem);
      obj[keys[keys.length - 1]] = arr;
      return updated;
    });
  };

  const removeArrayItem = (arrayPath, index) => {
    setContent(prev => {
      const updated = { ...prev };
      const keys = arrayPath.split('.');
      let obj = updated;
      for (let i = 0; i < keys.length - 1; i++) {
        obj[keys[i]] = { ...obj[keys[i]] };
        obj = obj[keys[i]];
      }
      const arr = [...(obj[keys[keys.length - 1]] || [])];
      arr.splice(index, 1);
      obj[keys[keys.length - 1]] = arr;
      return updated;
    });
  };

  const handleImageUpload = async (e, field) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('field', field);
      const res = await websiteApi.uploadImage(formData);
      if (res.success) {
        updateField(field, res.data.path);
        setMessage({ type: 'success', text: 'تم رفع الصورة بنجاح' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'حدث خطأ في رفع الصورة' });
    }
  };

  // === Visa Functions ===
  const loadVisaApplications = async (page = 1) => {
    try {
      setVisaLoading(true);
      const params = { page, limit: 15 };
      if (visaSearch) params.search = visaSearch;
      if (visaFilter !== 'all') params.status = visaFilter;
      const res = await visaApi.getApplications(params);
      if (res.success) {
        setVisaApps(res.data.applications);
        setVisaStats(res.data.stats);
        setVisaPagination(res.data.pagination);
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'خطأ في تحميل طلبات التأشيرة' });
    } finally {
      setVisaLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'americanVisa') {
      loadVisaApplications(visaPage);
    }
    if (activeTab === 'clients') {
      loadClients();
    }
    if (activeTab === 'licenseApps') {
      loadLicenseApplications(licensePage);
    }
  }, [activeTab, visaPage, visaFilter, licensePage, licenseFilter]);

  // === Clients Functions ===
  const loadClients = async () => {
    try {
      setClientsLoading(true);
      const res = await visaApi.getRegisteredClients();
      if (res.success) {
        setClients(res.data);
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'خطأ في تحميل المستخدمين' });
    } finally {
      setClientsLoading(false);
    }
  };

  const filteredClients = clients.filter(c => {
    if (!clientsSearch) return true;
    const q = clientsSearch.toLowerCase();
    return c.name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q) || c.phone?.includes(q);
  });

  // === Client Detail Functions ===
  const loadClientDetail = async (clientId) => {
    try {
      setClientDetailLoading(true);
      setSelectedClient(clientId);
      const res = await visaApi.getClientDetail(clientId);
      if (res.success) {
        setClientDetail(res.data);
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'خطأ في تحميل بيانات العميل' });
    } finally {
      setClientDetailLoading(false);
    }
  };

  const closeClientDetail = () => {
    setSelectedClient(null);
    setClientDetail(null);
  };

  const handleToggleClientActive = async (clientId) => {
    try {
      const res = await visaApi.toggleClientActive(clientId);
      if (res.success) {
        setMessage({ type: 'success', text: res.message });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        // تحديث محلي
        if (clientDetail) {
          setClientDetail(prev => ({
            ...prev,
            client: { ...prev.client, isActive: res.data.isActive }
          }));
        }
        setClients(prev => prev.map(c => c._id === clientId ? { ...c, isActive: res.data.isActive } : c));
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'خطأ في تحديث حالة العميل' });
    }
  };

  const handleDeleteClient = async (clientId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا العميل؟ لا يمكن التراجع عن هذا الإجراء.')) return;
    try {
      const res = await visaApi.deleteClient(clientId);
      if (res.success) {
        setMessage({ type: 'success', text: 'تم حذف العميل بنجاح' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        setClients(prev => prev.filter(c => c._id !== clientId));
        closeClientDetail();
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'خطأ في حذف العميل' });
    }
  };

  // === License Functions ===
  const loadLicenseApplications = async (page = 1) => {
    try {
      setLicenseLoading(true);
      const params = { page, limit: 15 };
      if (licenseSearch) params.search = licenseSearch;
      if (licenseFilter !== 'all') params.status = licenseFilter;
      const res = await visaApi.getLicenseApplications(params);
      if (res.success) {
        setLicenseApps(res.data.applications);
        setLicenseStats(res.data.stats);
        setLicensePagination(res.data.pagination);
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'خطأ في تحميل طلبات الرخصة' });
    } finally {
      setLicenseLoading(false);
    }
  };

  const handleLicenseSearch = (e) => {
    e.preventDefault();
    setLicensePage(1);
    loadLicenseApplications(1);
  };

  const handleLicenseStatusChange = async (appId, newStatus, adminNotes) => {
    try {
      const data = { status: newStatus };
      if (adminNotes !== undefined) data.adminNotes = adminNotes;
      const res = await visaApi.updateLicenseStatus(appId, data);
      if (res.success) {
        setMessage({ type: 'success', text: 'تم تحديث حالة الطلب' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        loadLicenseApplications(licensePage);
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'خطأ في تحديث الحالة' });
    }
  };

  const handleVisaSearch = (e) => {
    e.preventDefault();
    setVisaPage(1);
    loadVisaApplications(1);
  };

  const handleVisaStatusChange = async (appId, newStatus, adminNotes) => {
    try {
      const data = { status: newStatus };
      if (adminNotes !== undefined) data.adminNotes = adminNotes;
      const res = await visaApi.updateStatus(appId, data);
      if (res.success) {
        setMessage({ type: 'success', text: 'تم تحديث حالة الطلب' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        loadVisaApplications(visaPage);
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'خطأ في تحديث الحالة' });
    }
  };

  const handleVisaDelete = async (appId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الطلب؟')) return;
    try {
      const res = await visaApi.deleteApplication(appId);
      if (res.success) {
        setMessage({ type: 'success', text: 'تم حذف الطلب' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        loadVisaApplications(visaPage);
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'خطأ في حذف الطلب' });
    }
  };

  const formatDate = (d) => {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';
  const baseUrl = apiUrl.replace('/api', '');
  const getImageUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${baseUrl}${path}`;
  };

  if (loading) {
    return (
      <div className="wm-page">
        <div className="wm-loading">جاري تحميل محتوى الموقع...</div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="wm-page">
        <div className="wm-error">لم يتم تحميل المحتوى. <button onClick={loadContent}>إعادة المحاولة</button></div>
      </div>
    );
  }

  const renderHeroTab = () => (
    <div className="wm-form-section">
      <h3>البانر الرئيسي</h3>
      <div className="wm-form-group">
        <label>العنوان الرئيسي</label>
        <input type="text" value={content.hero?.title || ''} onChange={e => updateField('hero.title', e.target.value)} />
      </div>
      <div className="wm-form-group">
        <label>العنوان الفرعي</label>
        <input type="text" value={content.hero?.subtitle || ''} onChange={e => updateField('hero.subtitle', e.target.value)} />
      </div>
      <div className="wm-form-group">
        <label>الوصف</label>
        <textarea rows={3} value={content.hero?.description || ''} onChange={e => updateField('hero.description', e.target.value)} />
      </div>
      <div className="wm-form-group">
        <label>صورة الخلفية</label>
        <input type="file" accept="image/*" onChange={e => handleImageUpload(e, 'hero.backgroundImage')} />
        {content.hero?.backgroundImage && (
          <div className="wm-image-preview">
            <img src={getImageUrl(content.hero.backgroundImage)} alt="Hero" />
          </div>
        )}
      </div>
    </div>
  );

  const renderServicesTab = () => (
    <div className="wm-form-section">
      <div className="wm-section-header">
        <h3>الخدمات ({content.services?.length || 0})</h3>
        <button className="wm-btn-add" onClick={() => addArrayItem('services', { title: '', description: '', icon: '⭐' })}>
          + إضافة خدمة
        </button>
      </div>
      {(content.services || []).map((service, i) => (
        <div className="wm-array-item" key={i}>
          <div className="wm-array-item-header">
            <span>خدمة {i + 1}</span>
            <button className="wm-btn-remove" onClick={() => removeArrayItem('services', i)}>حذف</button>
          </div>
          <div className="wm-form-row">
            <div className="wm-form-group" style={{ flex: '0 0 80px' }}>
              <label>أيقونة</label>
              <input type="text" value={service.icon || ''} onChange={e => updateArrayItem('services', i, 'icon', e.target.value)} style={{ textAlign: 'center', fontSize: '1.5rem' }} />
            </div>
            <div className="wm-form-group" style={{ flex: 1 }}>
              <label>العنوان</label>
              <input type="text" value={service.title || ''} onChange={e => updateArrayItem('services', i, 'title', e.target.value)} />
            </div>
          </div>
          <div className="wm-form-group">
            <label>الوصف</label>
            <input type="text" value={service.description || ''} onChange={e => updateArrayItem('services', i, 'description', e.target.value)} />
          </div>
        </div>
      ))}
    </div>
  );

  const renderAboutTab = () => (
    <div className="wm-form-section">
      <h3>من نحن</h3>
      <div className="wm-form-group">
        <label>العنوان</label>
        <input type="text" value={content.aboutUs?.title || ''} onChange={e => updateField('aboutUs.title', e.target.value)} />
      </div>
      <div className="wm-form-group">
        <label>الوصف</label>
        <textarea rows={4} value={content.aboutUs?.description || ''} onChange={e => updateField('aboutUs.description', e.target.value)} />
      </div>

      <div className="wm-section-header" style={{ marginTop: '24px' }}>
        <h4>المميزات ({content.aboutUs?.features?.length || 0})</h4>
        <button className="wm-btn-add" onClick={() => addArrayItem('aboutUs.features', { title: '', description: '', icon: '⭐' })}>
          + إضافة ميزة
        </button>
      </div>
      {(content.aboutUs?.features || []).map((feature, i) => (
        <div className="wm-array-item" key={i}>
          <div className="wm-array-item-header">
            <span>ميزة {i + 1}</span>
            <button className="wm-btn-remove" onClick={() => removeArrayItem('aboutUs.features', i)}>حذف</button>
          </div>
          <div className="wm-form-row">
            <div className="wm-form-group" style={{ flex: '0 0 80px' }}>
              <label>أيقونة</label>
              <input type="text" value={feature.icon || ''} onChange={e => updateArrayItem('aboutUs.features', i, 'icon', e.target.value)} style={{ textAlign: 'center', fontSize: '1.5rem' }} />
            </div>
            <div className="wm-form-group" style={{ flex: 1 }}>
              <label>العنوان</label>
              <input type="text" value={feature.title || ''} onChange={e => updateArrayItem('aboutUs.features', i, 'title', e.target.value)} />
            </div>
          </div>
          <div className="wm-form-group">
            <label>الوصف</label>
            <input type="text" value={feature.description || ''} onChange={e => updateArrayItem('aboutUs.features', i, 'description', e.target.value)} />
          </div>
        </div>
      ))}
    </div>
  );

  const renderFaqTab = () => (
    <div className="wm-form-section">
      <div className="wm-section-header">
        <h3>الأسئلة الشائعة ({content.faq?.length || 0})</h3>
        <button className="wm-btn-add" onClick={() => addArrayItem('faq', { question: '', answer: '' })}>
          + إضافة سؤال
        </button>
      </div>
      {(content.faq || []).map((item, i) => (
        <div className="wm-array-item" key={i}>
          <div className="wm-array-item-header">
            <span>سؤال {i + 1}</span>
            <button className="wm-btn-remove" onClick={() => removeArrayItem('faq', i)}>حذف</button>
          </div>
          <div className="wm-form-group">
            <label>السؤال</label>
            <input type="text" value={item.question || ''} onChange={e => updateArrayItem('faq', i, 'question', e.target.value)} />
          </div>
          <div className="wm-form-group">
            <label>الإجابة</label>
            <textarea rows={3} value={item.answer || ''} onChange={e => updateArrayItem('faq', i, 'answer', e.target.value)} />
          </div>
        </div>
      ))}
    </div>
  );

  const renderTestimonialsTab = () => (
    <div className="wm-form-section">
      <div className="wm-section-header">
        <h3>آراء العملاء ({(content.testimonials || []).filter(t => t.isActive !== false).length} مفعّل من {content.testimonials?.length || 0})</h3>
        <button className="wm-btn-add" onClick={() => addArrayItem('testimonials', { name: '', text: '', stars: 5, source: 'google', isActive: true })}>
          + إضافة رأي
        </button>
      </div>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '16px' }}>
        أضف آراء العملاء يدوياً من تقييمات قوقل أو غيرها. فقط الآراء المفعّلة ستظهر في الصفحة الرئيسية.
      </p>
      {(content.testimonials || []).map((item, i) => (
        <div className="wm-array-item" key={i} style={{ borderRight: item.isActive !== false ? '4px solid var(--primary-color)' : '4px solid #ccc', opacity: item.isActive !== false ? 1 : 0.6 }}>
          <div className="wm-array-item-header">
            <span>رأي {i + 1} {item.isActive === false ? '(مخفي)' : ''}</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="wm-btn-remove"
                style={{ background: item.isActive !== false ? '#f59e0b' : '#22c55e', color: '#fff' }}
                onClick={() => updateArrayItem('testimonials', i, 'isActive', item.isActive === false ? true : false)}
              >
                {item.isActive !== false ? 'إخفاء' : 'تفعيل'}
              </button>
              <button className="wm-btn-remove" onClick={() => removeArrayItem('testimonials', i)}>حذف</button>
            </div>
          </div>
          <div className="wm-form-row">
            <div className="wm-form-group">
              <label>اسم العميل</label>
              <input type="text" value={item.name || ''} onChange={e => updateArrayItem('testimonials', i, 'name', e.target.value)} placeholder="مثال: أحمد م." />
            </div>
            <div className="wm-form-group" style={{ maxWidth: '120px' }}>
              <label>التقييم</label>
              <select value={item.stars || 5} onChange={e => updateArrayItem('testimonials', i, 'stars', Number(e.target.value))}>
                <option value={5}>★★★★★</option>
                <option value={4}>★★★★</option>
                <option value={3}>★★★</option>
                <option value={2}>★★</option>
                <option value={1}>★</option>
              </select>
            </div>
            <div className="wm-form-group" style={{ maxWidth: '150px' }}>
              <label>المصدر</label>
              <select value={item.source || 'google'} onChange={e => updateArrayItem('testimonials', i, 'source', e.target.value)}>
                <option value="google">Google</option>
                <option value="twitter">Twitter</option>
                <option value="instagram">Instagram</option>
                <option value="direct">مباشر</option>
              </select>
            </div>
          </div>
          <div className="wm-form-group">
            <label>نص الرأي</label>
            <textarea rows={3} value={item.text || ''} onChange={e => updateArrayItem('testimonials', i, 'text', e.target.value)} placeholder="اكتب رأي العميل هنا..." />
          </div>
        </div>
      ))}
      {(!content.testimonials || content.testimonials.length === 0) && (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
          <p style={{ fontSize: '2rem', marginBottom: '8px' }}>⭐</p>
          <p>لا توجد آراء بعد. أضف أول رأي من الزر أعلاه.</p>
        </div>
      )}
    </div>
  );

  const renderContactTab = () => (
    <div className="wm-form-section">
      {/* ===== جهات الاتصال + ساعات العمل + الخريطة ===== */}
      <ContactsManagement embedded />

      <div style={{ borderTop: '1px solid var(--border-color)', margin: '32px 0', paddingTop: '32px' }}>
        <h3>معلومات التواصل الأساسية</h3>
        <div className="wm-form-row">
          <div className="wm-form-group">
            <label>رقم الهاتف</label>
            <input type="text" value={content.contact?.phone || ''} onChange={e => updateField('contact.phone', e.target.value)} dir="ltr" />
          </div>
          <div className="wm-form-group">
            <label>رقم واتساب (بدون + أو 00)</label>
            <input type="text" value={content.contact?.whatsapp || ''} onChange={e => updateField('contact.whatsapp', e.target.value)} dir="ltr" placeholder="966559229597" />
          </div>
        </div>
        <div className="wm-form-row">
          <div className="wm-form-group">
            <label>البريد الإلكتروني</label>
            <input type="email" value={content.contact?.email || ''} onChange={e => updateField('contact.email', e.target.value)} dir="ltr" />
          </div>
          <div className="wm-form-group">
            <label>العنوان</label>
            <input type="text" value={content.contact?.address || ''} onChange={e => updateField('contact.address', e.target.value)} />
          </div>
        </div>
      </div>

      <div style={{ borderTop: '1px solid var(--border-color)', margin: '32px 0', paddingTop: '32px' }}>
        <h3>وسائل التواصل الاجتماعي</h3>
        <div className="wm-form-row">
          <div className="wm-form-group">
            <label>Twitter / X</label>
            <input type="text" value={content.socialMedia?.twitter || ''} onChange={e => updateField('socialMedia.twitter', e.target.value)} dir="ltr" placeholder="https://twitter.com/..." />
          </div>
          <div className="wm-form-group">
            <label>Instagram</label>
            <input type="text" value={content.socialMedia?.instagram || ''} onChange={e => updateField('socialMedia.instagram', e.target.value)} dir="ltr" placeholder="https://instagram.com/..." />
          </div>
        </div>
        <div className="wm-form-row">
          <div className="wm-form-group">
            <label>Facebook</label>
            <input type="text" value={content.socialMedia?.facebook || ''} onChange={e => updateField('socialMedia.facebook', e.target.value)} dir="ltr" placeholder="https://facebook.com/..." />
          </div>
          <div className="wm-form-group">
            <label>Snapchat</label>
            <input type="text" value={content.socialMedia?.snapchat || ''} onChange={e => updateField('socialMedia.snapchat', e.target.value)} dir="ltr" placeholder="https://snapchat.com/..." />
          </div>
        </div>
      </div>
    </div>
  );

  const renderGeneralTab = () => (
    <div className="wm-form-section">
      <h3>إعدادات عامة</h3>
      <div className="wm-form-row">
        <div className="wm-form-group">
          <label>اسم الموقع (عربي)</label>
          <input type="text" value={content.general?.siteName || ''} onChange={e => updateField('general.siteName', e.target.value)} />
        </div>
        <div className="wm-form-group">
          <label>اسم الموقع (إنجليزي)</label>
          <input type="text" value={content.general?.siteNameEn || ''} onChange={e => updateField('general.siteNameEn', e.target.value)} dir="ltr" />
        </div>
      </div>
      <div className="wm-form-group">
        <label>وصف الموقع</label>
        <textarea rows={2} value={content.general?.siteDescription || ''} onChange={e => updateField('general.siteDescription', e.target.value)} />
      </div>
      <div className="wm-form-group">
        <label>شعار الموقع</label>
        <input type="file" accept="image/*" onChange={e => handleImageUpload(e, 'general.logo')} />
        {content.general?.logo && (
          <div className="wm-image-preview small">
            <img src={getImageUrl(content.general.logo)} alt="Logo" />
          </div>
        )}
      </div>
      <div className="wm-form-group">
        <label>نص حقوق النشر (استخدم {'{year}'} للسنة الحالية)</label>
        <input type="text" value={content.footer?.copyrightText || ''} onChange={e => updateField('footer.copyrightText', e.target.value)} />
      </div>
    </div>
  );

  const renderAmericanVisaTab = () => (
    <div className="wm-form-section wm-visa-section">
      {/* إحصائيات */}
      <div className="wm-visa-stats">
        <div
          className={`wm-visa-stat ${visaFilter === 'all' ? 'active' : ''}`}
          onClick={() => { setVisaFilter('all'); setVisaPage(1); }}
        >
          <span className="wm-visa-stat-num">{visaStats.total || 0}</span>
          <span className="wm-visa-stat-label">إجمالي الطلبات</span>
        </div>
        <div
          className={`wm-visa-stat ${visaFilter === 'submitted' ? 'active' : ''}`}
          style={{ borderColor: '#2563eb' }}
          onClick={() => { setVisaFilter('submitted'); setVisaPage(1); }}
        >
          <span className="wm-visa-stat-num" style={{ color: '#2563eb' }}>{visaStats.submitted || 0}</span>
          <span className="wm-visa-stat-label">جديدة</span>
        </div>
        <div
          className={`wm-visa-stat ${visaFilter === 'under_review' ? 'active' : ''}`}
          style={{ borderColor: '#d97706' }}
          onClick={() => { setVisaFilter('under_review'); setVisaPage(1); }}
        >
          <span className="wm-visa-stat-num" style={{ color: '#d97706' }}>{visaStats.under_review || 0}</span>
          <span className="wm-visa-stat-label">قيد المراجعة</span>
        </div>
        <div
          className={`wm-visa-stat ${visaFilter === 'approved' ? 'active' : ''}`}
          style={{ borderColor: '#16a34a' }}
          onClick={() => { setVisaFilter('approved'); setVisaPage(1); }}
        >
          <span className="wm-visa-stat-num" style={{ color: '#16a34a' }}>{visaStats.approved || 0}</span>
          <span className="wm-visa-stat-label">مقبولة</span>
        </div>
        <div
          className={`wm-visa-stat ${visaFilter === 'rejected' ? 'active' : ''}`}
          style={{ borderColor: '#dc2626' }}
          onClick={() => { setVisaFilter('rejected'); setVisaPage(1); }}
        >
          <span className="wm-visa-stat-num" style={{ color: '#dc2626' }}>{visaStats.rejected || 0}</span>
          <span className="wm-visa-stat-label">مرفوضة</span>
        </div>
      </div>

      {/* بحث وفلاتر */}
      <div className="wm-visa-filters">
        <form onSubmit={handleVisaSearch} className="wm-visa-search">
          <input
            type="text"
            placeholder="بحث بالاسم، رقم الطلب، رقم الجواز..."
            value={visaSearch}
            onChange={e => setVisaSearch(e.target.value)}
          />
          <button type="submit">بحث</button>
        </form>
        <button
          className="wm-visa-btn-full-page"
          onClick={() => navigate('/control/visa-applications')}
          title="فتح الصفحة الكاملة"
        >
          📋 عرض الصفحة الكاملة
        </button>
      </div>

      {/* جدول الطلبات */}
      {visaLoading ? (
        <div className="wm-loading">جاري تحميل الطلبات...</div>
      ) : visaApps.length === 0 ? (
        <div className="wm-visa-empty">
          <span style={{ fontSize: '2rem' }}>📋</span>
          <p>لا توجد طلبات</p>
          {(visaSearch || visaFilter !== 'all') && (
            <button
              className="wm-visa-btn-view"
              onClick={() => { setVisaSearch(''); setVisaFilter('all'); setVisaPage(1); }}
            >
              إعادة ضبط الفلاتر
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="wm-visa-table-wrap">
            <table className="wm-visa-table">
              <thead>
                <tr>
                  <th>المتقدم</th>
                  <th>رقم الجواز</th>
                  <th>النوع</th>
                  <th>التاريخ</th>
                  <th>الحالة</th>
                  <th>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {visaApps.map(app => (
                  <tr
                    key={app._id}
                    className="wm-visa-row-clickable"
                    onClick={() => navigate(`/control/visa-applications/${app._id}`)}
                  >
                    <td>
                      <div className="wm-visa-applicant-cell">
                        {app.passportImage && (
                          <img
                            src={getImageUrl(app.passportImage)}
                            alt=""
                            className="wm-visa-applicant-thumb"
                          />
                        )}
                        <div>
                          <span className="wm-visa-applicant-name">{app.personalInfo?.fullName || '-'}</span>
                          <span className="wm-visa-applicant-meta">
                            {app.applicationNumber}
                            {app.personalInfo?.nationality && ` · ${app.personalInfo.nationality}`}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td dir="ltr" className="wm-visa-app-num">{app.passportDetails?.passportNumber || '-'}</td>
                    <td>{VISA_TYPE_MAP[app.visaType] || '-'}</td>
                    <td>{formatDate(app.submittedAt || app.createdAt)}</td>
                    <td>
                      <span
                        className="wm-visa-badge"
                        style={{
                          color: VISA_STATUS_MAP[app.status]?.color,
                          background: VISA_STATUS_MAP[app.status]?.bg
                        }}
                      >
                        {VISA_STATUS_MAP[app.status]?.label || app.status}
                      </span>
                    </td>
                    <td>
                      <div className="wm-visa-actions" onClick={e => e.stopPropagation()}>
                        <button
                          className="wm-visa-btn-view"
                          onClick={() => navigate(`/control/visa-applications/${app._id}`)}
                        >
                          👁️ عرض
                        </button>
                        <button
                          className="wm-btn-remove"
                          onClick={() => handleVisaDelete(app._id)}
                        >
                          حذف
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {visaPagination.pages > 1 && (
            <div className="wm-visa-pagination">
              <button
                disabled={visaPage <= 1}
                onClick={() => setVisaPage(p => p - 1)}
              >
                السابق
              </button>
              <span>صفحة {visaPage} من {visaPagination.pages}</span>
              <button
                disabled={visaPage >= visaPagination.pages}
                onClick={() => setVisaPage(p => p + 1)}
              >
                التالي
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );

  const renderClientDetail = () => {
    if (!selectedClient) return null;

    if (clientDetailLoading) {
      return (
        <div className="wm-client-detail-panel">
          <div className="wm-client-detail-back">
            <button onClick={closeClientDetail}>→ العودة للقائمة</button>
          </div>
          <div className="wm-loading">جاري تحميل بيانات العميل...</div>
        </div>
      );
    }

    if (!clientDetail) return null;
    const { client, visaApplications = [], licenseApplications = [] } = clientDetail;

    return (
      <div className="wm-client-detail-panel">
        <div className="wm-client-detail-back">
          <button onClick={closeClientDetail}>→ العودة للقائمة</button>
        </div>

        {/* بيانات العميل */}
        <div className="wm-client-info-card">
          <div className="wm-client-info-avatar">
            {client.name?.charAt(0) || '?'}
          </div>
          <div className="wm-client-info-body">
            <h3>{client.name}</h3>
            <div className="wm-client-info-grid">
              <div><span className="wm-label">البريد:</span> <span dir="ltr">{client.email}</span></div>
              <div><span className="wm-label">الجوال:</span> <span dir="ltr">{client.phone || '—'}</span></div>
              <div><span className="wm-label">الحالة:</span> <span className={`wm-client-badge ${client.isActive ? 'active' : 'inactive'}`}>{client.isActive ? 'نشط' : 'معطل'}</span></div>
              <div><span className="wm-label">تاريخ التسجيل:</span> {formatDate(client.createdAt)}</div>
              <div><span className="wm-label">آخر دخول:</span> {client.lastLogin ? formatDate(client.lastLogin) : '—'}</div>
            </div>
            <div className="wm-client-actions">
              <button
                className={`wm-client-action-btn ${client.isActive ? 'ban' : 'unban'}`}
                onClick={() => handleToggleClientActive(client._id)}
              >
                {client.isActive ? '🚫 حظر العميل' : '✅ إلغاء الحظر'}
              </button>
              <button
                className="wm-client-action-btn delete"
                onClick={() => handleDeleteClient(client._id)}
              >
                🗑️ حذف العميل
              </button>
            </div>
          </div>
        </div>

        {/* طلبات التأشيرة الأمريكية */}
        <div className="wm-client-apps-section">
          <h4>🇺🇸 طلبات التأشيرة الأمريكية ({visaApplications.length})</h4>
          {visaApplications.length === 0 ? (
            <p className="wm-client-apps-empty">لا توجد طلبات تأشيرة</p>
          ) : (
            <div className="wm-client-apps-table">
              <table>
                <thead>
                  <tr>
                    <th>رقم الطلب</th>
                    <th>الاسم</th>
                    <th>رقم الجواز</th>
                    <th>الحالة</th>
                    <th>التاريخ</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {visaApplications.map(app => (
                    <tr key={app._id}>
                      <td className="wm-visa-app-num">{app.applicationNumber}</td>
                      <td>{app.personalInfo?.fullNameEn || '—'}</td>
                      <td dir="ltr">{app.passportDetails?.passportNumber || '—'}</td>
                      <td>
                        <span className="wm-visa-badge" style={{
                          color: VISA_STATUS_MAP[app.status]?.color,
                          background: VISA_STATUS_MAP[app.status]?.bg
                        }}>
                          {VISA_STATUS_MAP[app.status]?.label || app.status}
                        </span>
                      </td>
                      <td>{formatDate(app.createdAt)}</td>
                      <td>
                        <button
                          className="wm-visa-btn-view"
                          onClick={() => navigate(`/control/visa-applications/${app._id}`)}
                        >
                          عرض
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* طلبات الرخصة الدولية */}
        <div className="wm-client-apps-section">
          <h4>🪪 طلبات الرخصة الدولية ({licenseApplications.length})</h4>
          {licenseApplications.length === 0 ? (
            <p className="wm-client-apps-empty">لا توجد طلبات رخصة</p>
          ) : (
            <div className="wm-client-apps-table">
              <table>
                <thead>
                  <tr>
                    <th>رقم الطلب</th>
                    <th>الاسم</th>
                    <th>الحالة</th>
                    <th>التاريخ</th>
                  </tr>
                </thead>
                <tbody>
                  {licenseApplications.map(app => (
                    <tr key={app._id}>
                      <td className="wm-visa-app-num">{app.applicationNumber}</td>
                      <td>{app.personalInfo ? `${app.personalInfo.givenName || ''} ${app.personalInfo.familyName || ''}`.trim() || '—' : '—'}</td>
                      <td>
                        <span className="wm-visa-badge" style={{
                          color: LICENSE_STATUS_MAP[app.status]?.color,
                          background: LICENSE_STATUS_MAP[app.status]?.bg
                        }}>
                          {LICENSE_STATUS_MAP[app.status]?.label || app.status}
                        </span>
                      </td>
                      <td>{formatDate(app.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderClientsTab = () => (
    <div className="wm-section">
      {selectedClient ? renderClientDetail() : (
        <>
          <h2>المستخدمين المسجلين</h2>
          <p className="wm-section-desc">العملاء المسجلين من الموقع الإلكتروني — اضغط على الاسم لعرض التفاصيل</p>

          <div className="wm-clients-toolbar">
            <input
              type="text"
              placeholder="بحث بالاسم أو الإيميل أو الجوال..."
              value={clientsSearch}
              onChange={(e) => setClientsSearch(e.target.value)}
              className="wm-clients-search"
            />
            <span className="wm-clients-count">{filteredClients.length} مستخدم</span>
          </div>

          {clientsLoading ? (
            <div className="wm-visa-loading">جاري التحميل...</div>
          ) : filteredClients.length === 0 ? (
            <div className="wm-visa-loading">{clientsSearch ? 'لا توجد نتائج' : 'لا يوجد مستخدمين مسجلين بعد'}</div>
          ) : (
            <div className="wm-clients-table">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>الاسم</th>
                    <th>البريد الإلكتروني</th>
                    <th>الجوال</th>
                    <th>الحالة</th>
                    <th>تاريخ التسجيل</th>
                    <th>آخر دخول</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.map((client, i) => (
                    <tr key={client._id} className="wm-client-row-clickable" onClick={() => loadClientDetail(client._id)}>
                      <td>{i + 1}</td>
                      <td className="wm-client-name wm-client-name-link">{client.name}</td>
                      <td dir="ltr">{client.email}</td>
                      <td dir="ltr">{client.phone || '—'}</td>
                      <td>
                        <span className={`wm-client-badge ${client.isActive ? 'active' : 'inactive'}`}>
                          {client.isActive ? 'نشط' : 'معطل'}
                        </span>
                      </td>
                      <td>{new Date(client.createdAt).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                      <td>{client.lastLogin ? new Date(client.lastLogin).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );

  const renderLicenseSettingsTab = () => (
    <div className="wm-form-section">
      {/* إعدادات خدمة الرخصة الدولية */}
      <div className="wm-license-settings">
        <h4>إعدادات الخدمة</h4>
        <div className="wm-form-row">
          <div className="wm-form-group">
            <label>السعر الأساسي</label>
            <input
              type="text"
              value={content.internationalLicense?.price ?? '200'}
              onChange={e => updateField('internationalLicense.price', e.target.value)}
              dir="ltr"
              placeholder="200"
            />
          </div>
          <div className="wm-form-group">
            <label>العملة</label>
            <input
              type="text"
              value={content.internationalLicense?.currency ?? 'ريال'}
              onChange={e => updateField('internationalLicense.currency', e.target.value)}
              placeholder="ريال"
            />
          </div>
        </div>

        {/* عرض / خصم */}
        <div className="wm-offer-section">
          <label className="wm-offer-toggle">
            <input
              type="checkbox"
              checked={content.internationalLicense?.offerEnabled || false}
              onChange={e => updateField('internationalLicense.offerEnabled', e.target.checked)}
            />
            <span className="wm-offer-toggle-label">تفعيل عرض خاص</span>
          </label>
          {content.internationalLicense?.offerEnabled && (
            <div className="wm-offer-price-row">
              <div className="wm-form-group">
                <label>سعر العرض</label>
                <input
                  type="text"
                  value={content.internationalLicense?.offerPrice ?? ''}
                  onChange={e => updateField('internationalLicense.offerPrice', e.target.value)}
                  dir="ltr"
                  placeholder="مثال: 150"
                  className="wm-offer-price-input"
                />
              </div>
              <div className="wm-offer-preview">
                <span className="wm-offer-preview-label">معاينة:</span>
                <span className="wm-offer-old-price">{content.internationalLicense?.price || '200'} {content.internationalLicense?.currency || 'ريال'}</span>
                <span className="wm-offer-new-price">{content.internationalLicense?.offerPrice || '—'} {content.internationalLicense?.currency || 'ريال'}</span>
              </div>
            </div>
          )}
        </div>

        <div className="wm-form-group">
          <label>وصف الخدمة</label>
          <textarea
            rows={2}
            value={content.internationalLicense?.description ?? ''}
            onChange={e => updateField('internationalLicense.description', e.target.value)}
            placeholder="وصف مختصر عن خدمة الرخصة الدولية..."
          />
        </div>
        <div className="wm-form-group">
          <label>صورة الخدمة</label>
          <input type="file" accept="image/*" onChange={e => handleImageUpload(e, 'internationalLicense.image')} />
          {content.internationalLicense?.image && (
            <div className="wm-image-preview small">
              <img src={getImageUrl(content.internationalLicense.image)} alt="License" />
            </div>
          )}
        </div>
        <div className="wm-form-group">
          <label>رقم واتساب الرخصة الدولية</label>
          <input
            type="text"
            value={content.internationalLicense?.contactWhatsapp ?? ''}
            onChange={e => updateField('internationalLicense.contactWhatsapp', e.target.value)}
            dir="ltr"
            placeholder="966XXXXXXXXX"
          />
          <small style={{ color: '#888', fontSize: '12px' }}>رقم واتساب خاص بصفحة الرخصة الدولية — إذا فارغ سيتم استخدام رقم التواصل العام</small>
        </div>
      </div>

      {/* إدارة الخدمات الإضافية (Add-ons) */}
      <div className="wm-addons-section">
        <div className="wm-section-header">
          <h4>🛒 الخدمات الإضافية</h4>
          <button className="wm-btn-add" onClick={() => {
            const addons = [...(content.internationalLicense?.addons || [])];
            addons.push({ name: '', price: '0', enabled: true, description: '' });
            updateField('internationalLicense.addons', addons);
          }}>
            + إضافة خدمة
          </button>
        </div>
        <p className="wm-section-desc">خدمات اختيارية يمكن للعميل إضافتها مع الطلب (طباعة صورة، توصيل، إلخ)</p>

        {(content.internationalLicense?.addons || []).length === 0 ? (
          <p className="wm-empty-hint">لا توجد خدمات إضافية — اضغط "إضافة خدمة" لإنشاء واحدة</p>
        ) : (
          (content.internationalLicense?.addons || []).map((addon, i) => (
            <div className="wm-addon-item" key={i}>
              <div className="wm-addon-item-header">
                <label className="wm-addon-toggle">
                  <input
                    type="checkbox"
                    checked={addon.enabled !== false}
                    onChange={e => {
                      const addons = [...(content.internationalLicense?.addons || [])];
                      addons[i] = { ...addons[i], enabled: e.target.checked };
                      updateField('internationalLicense.addons', addons);
                    }}
                  />
                  <span>{addon.enabled !== false ? 'مفعّل' : 'معطّل'}</span>
                </label>
                <button className="wm-btn-remove" onClick={() => {
                  const addons = [...(content.internationalLicense?.addons || [])];
                  addons.splice(i, 1);
                  updateField('internationalLicense.addons', addons);
                }}>حذف</button>
              </div>
              <div className="wm-form-row">
                <div className="wm-form-group" style={{ flex: 2 }}>
                  <label>اسم الخدمة</label>
                  <input
                    type="text"
                    value={addon.name ?? ''}
                    onChange={e => {
                      const addons = [...(content.internationalLicense?.addons || [])];
                      addons[i] = { ...addons[i], name: e.target.value };
                      updateField('internationalLicense.addons', addons);
                    }}
                    placeholder="مثال: طباعة صورة شخصية"
                  />
                </div>
                <div className="wm-form-group" style={{ flex: 1 }}>
                  <label>السعر ({content.internationalLicense?.currency || 'ريال'})</label>
                  <input
                    type="text"
                    value={addon.price ?? '0'}
                    onChange={e => {
                      const addons = [...(content.internationalLicense?.addons || [])];
                      addons[i] = { ...addons[i], price: e.target.value };
                      updateField('internationalLicense.addons', addons);
                    }}
                    dir="ltr"
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="wm-form-group">
                <label>وصف مختصر (اختياري)</label>
                <input
                  type="text"
                  value={addon.description ?? ''}
                  onChange={e => {
                    const addons = [...(content.internationalLicense?.addons || [])];
                    addons[i] = { ...addons[i], description: e.target.value };
                    updateField('internationalLicense.addons', addons);
                  }}
                  placeholder="وصف مختصر عن الخدمة..."
                />
              </div>
            </div>
          ))
        )}

        {/* معاينة التسعير */}
        {(content.internationalLicense?.addons || []).filter(a => a.enabled !== false && a.name).length > 0 && (
          <div className="wm-pricing-preview">
            <h5>معاينة التسعير:</h5>
            <div className="wm-pricing-line">
              <span>السعر الأساسي</span>
              <span>{content.internationalLicense?.price || '200'} {content.internationalLicense?.currency || 'ريال'}</span>
            </div>
            {(content.internationalLicense?.addons || []).filter(a => a.enabled !== false && a.name).map((addon, i) => (
              <div className="wm-pricing-line" key={i}>
                <span>+ {addon.name}</span>
                <span>{addon.price || '0'} {content.internationalLicense?.currency || 'ريال'}</span>
              </div>
            ))}
            <div className="wm-pricing-line wm-pricing-total">
              <span>الإجمالي (مع جميع الإضافات)</span>
              <span>{
                (parseFloat(content.internationalLicense?.price || '200') +
                (content.internationalLicense?.addons || [])
                  .filter(a => a.enabled !== false && a.name)
                  .reduce((sum, a) => sum + parseFloat(a.price || '0'), 0)
                ).toFixed(0)
              } {content.internationalLicense?.currency || 'ريال'}</span>
            </div>
          </div>
        )}
      </div>

      {/* إعدادات التسليم */}
      <div className="wm-delivery-section">
        <div className="wm-section-header">
          <h4>📦 خيارات التسليم</h4>
        </div>
        <p className="wm-section-desc">حدد طرق التسليم المتاحة مع الأسعار والرسائل التوضيحية</p>

        {/* استلام */}
        <div className="wm-delivery-item">
          <div className="wm-addon-item-header">
            <label className="wm-addon-toggle">
              <input
                type="checkbox"
                checked={content.internationalLicense?.deliveryOptions?.pickup?.enabled !== false}
                onChange={e => updateField('internationalLicense.deliveryOptions.pickup.enabled', e.target.checked)}
              />
              <span>🏢 استلام من المكتب</span>
            </label>
          </div>
          <div className="wm-form-row">
            <div className="wm-form-group" style={{ flex: 1 }}>
              <label>السعر ({content.internationalLicense?.currency ?? 'ريال'})</label>
              <input
                type="text"
                value={content.internationalLicense?.deliveryOptions?.pickup?.price ?? '0'}
                onChange={e => updateField('internationalLicense.deliveryOptions.pickup.price', e.target.value)}
                dir="ltr"
                placeholder="0"
              />
            </div>
          </div>
          <div className="wm-form-group">
            <label>رسالة للعميل</label>
            <input
              type="text"
              value={content.internationalLicense?.deliveryOptions?.pickup?.message ?? ''}
              onChange={e => updateField('internationalLicense.deliveryOptions.pickup.message', e.target.value)}
              placeholder="مثال: يرجى الاستلام من المكتب على العنوان التالي"
            />
          </div>
          <div className="wm-form-group">
            <label>عنوان المكتب</label>
            <input
              type="text"
              value={content.internationalLicense?.deliveryOptions?.pickup?.address ?? ''}
              onChange={e => updateField('internationalLicense.deliveryOptions.pickup.address', e.target.value)}
              placeholder="مثال: الرياض - حي العليا - شارع الأمير محمد"
            />
          </div>
        </div>

        {/* توصيل */}
        <div className="wm-delivery-item">
          <div className="wm-addon-item-header">
            <label className="wm-addon-toggle">
              <input
                type="checkbox"
                checked={content.internationalLicense?.deliveryOptions?.delivery?.enabled !== false}
                onChange={e => updateField('internationalLicense.deliveryOptions.delivery.enabled', e.target.checked)}
              />
              <span>🚗 توصيل</span>
            </label>
          </div>
          <div className="wm-form-row">
            <div className="wm-form-group" style={{ flex: 1 }}>
              <label>السعر ({content.internationalLicense?.currency ?? 'ريال'})</label>
              <input
                type="text"
                value={content.internationalLicense?.deliveryOptions?.delivery?.price ?? '30'}
                onChange={e => updateField('internationalLicense.deliveryOptions.delivery.price', e.target.value)}
                dir="ltr"
                placeholder="30"
              />
            </div>
          </div>
          <div className="wm-form-group">
            <label>رسالة للعميل</label>
            <input
              type="text"
              value={content.internationalLicense?.deliveryOptions?.delivery?.message ?? ''}
              onChange={e => updateField('internationalLicense.deliveryOptions.delivery.message', e.target.value)}
              placeholder="مثال: التوصيل يشمل مدينة الرياض فقط"
            />
          </div>
        </div>

        {/* شحن */}
        <div className="wm-delivery-item">
          <div className="wm-addon-item-header">
            <label className="wm-addon-toggle">
              <input
                type="checkbox"
                checked={content.internationalLicense?.deliveryOptions?.shipping?.enabled !== false}
                onChange={e => updateField('internationalLicense.deliveryOptions.shipping.enabled', e.target.checked)}
              />
              <span>📦 شحن</span>
            </label>
          </div>
          <div className="wm-form-row">
            <div className="wm-form-group" style={{ flex: 1 }}>
              <label>السعر ({content.internationalLicense?.currency ?? 'ريال'})</label>
              <input
                type="text"
                value={content.internationalLicense?.deliveryOptions?.shipping?.price ?? '50'}
                onChange={e => updateField('internationalLicense.deliveryOptions.shipping.price', e.target.value)}
                dir="ltr"
                placeholder="50"
              />
            </div>
          </div>
          <div className="wm-form-group">
            <label>رسالة للعميل</label>
            <input
              type="text"
              value={content.internationalLicense?.deliveryOptions?.shipping?.message ?? ''}
              onChange={e => updateField('internationalLicense.deliveryOptions.shipping.message', e.target.value)}
              placeholder="مثال: مدة الشحن تعتمد على شركة الشحن ومنطقتك"
            />
          </div>
        </div>
      </div>

      {/* إدارة كوبونات الخصم */}
      <div className="wm-coupons-section">
        <div className="wm-section-header">
          <h4>🎫 كوبونات الخصم</h4>
          <button className="wm-btn-add" onClick={() => {
            const coupons = [...(content.internationalLicense?.coupons || [])];
            coupons.push({ code: '', discountType: 'percentage', discountValue: '0', enabled: true, maxUses: 0, usedCount: 0, expiresAt: '' });
            updateField('internationalLicense.coupons', coupons);
          }}>
            + إضافة كوبون
          </button>
        </div>
        <p className="wm-section-desc">كوبونات خصم يمكن للعميل استخدامها عند التقديم — الخصم بنسبة مئوية أو مبلغ ثابت</p>

        {(content.internationalLicense?.coupons || []).length === 0 ? (
          <p className="wm-empty-hint">لا توجد كوبونات — اضغط "إضافة كوبون" لإنشاء واحد</p>
        ) : (
          (content.internationalLicense?.coupons || []).map((coupon, i) => (
            <div className="wm-coupon-item" key={i}>
              <div className="wm-addon-item-header">
                <label className="wm-addon-toggle">
                  <input
                    type="checkbox"
                    checked={coupon.enabled !== false}
                    onChange={e => {
                      const coupons = [...(content.internationalLicense?.coupons || [])];
                      coupons[i] = { ...coupons[i], enabled: e.target.checked };
                      updateField('internationalLicense.coupons', coupons);
                    }}
                  />
                  <span>{coupon.enabled !== false ? 'مفعّل' : 'معطّل'}</span>
                </label>
                <div className="wm-coupon-usage">
                  استخدام: {coupon.usedCount || 0}{coupon.maxUses > 0 ? ` / ${coupon.maxUses}` : ' (غير محدود)'}
                </div>
                <button className="wm-btn-remove" onClick={() => {
                  const coupons = [...(content.internationalLicense?.coupons || [])];
                  coupons.splice(i, 1);
                  updateField('internationalLicense.coupons', coupons);
                }}>حذف</button>
              </div>
              <div className="wm-form-row">
                <div className="wm-form-group" style={{ flex: 2 }}>
                  <label>كود الكوبون</label>
                  <input
                    type="text"
                    value={coupon.code ?? ''}
                    onChange={e => {
                      const coupons = [...(content.internationalLicense?.coupons || [])];
                      coupons[i] = { ...coupons[i], code: e.target.value.toUpperCase() };
                      updateField('internationalLicense.coupons', coupons);
                    }}
                    dir="ltr"
                    placeholder="مثال: SAVE20"
                    style={{ textTransform: 'uppercase' }}
                  />
                </div>
                <div className="wm-form-group" style={{ flex: 1 }}>
                  <label>نوع الخصم</label>
                  <select
                    value={coupon.discountType || 'percentage'}
                    onChange={e => {
                      const coupons = [...(content.internationalLicense?.coupons || [])];
                      coupons[i] = { ...coupons[i], discountType: e.target.value };
                      updateField('internationalLicense.coupons', coupons);
                    }}
                  >
                    <option value="percentage">نسبة مئوية (%)</option>
                    <option value="fixed">مبلغ ثابت ({content.internationalLicense?.currency || 'ريال'})</option>
                  </select>
                </div>
                <div className="wm-form-group" style={{ flex: 1 }}>
                  <label>قيمة الخصم</label>
                  <input
                    type="text"
                    value={coupon.discountValue ?? '0'}
                    onChange={e => {
                      const coupons = [...(content.internationalLicense?.coupons || [])];
                      coupons[i] = { ...coupons[i], discountValue: e.target.value };
                      updateField('internationalLicense.coupons', coupons);
                    }}
                    dir="ltr"
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="wm-form-row">
                <div className="wm-form-group">
                  <label>الحد الأقصى للاستخدام (0 = غير محدود)</label>
                  <input
                    type="number"
                    value={coupon.maxUses ?? 0}
                    onChange={e => {
                      const coupons = [...(content.internationalLicense?.coupons || [])];
                      coupons[i] = { ...coupons[i], maxUses: parseInt(e.target.value) || 0 };
                      updateField('internationalLicense.coupons', coupons);
                    }}
                    min="0"
                    dir="ltr"
                  />
                </div>
                <div className="wm-form-group">
                  <label>تاريخ الانتهاء (اختياري)</label>
                  <input
                    type="date"
                    value={coupon.expiresAt ? new Date(coupon.expiresAt).toISOString().slice(0, 10) : ''}
                    onChange={e => {
                      const coupons = [...(content.internationalLicense?.coupons || [])];
                      coupons[i] = { ...coupons[i], expiresAt: e.target.value || null };
                      updateField('internationalLicense.coupons', coupons);
                    }}
                    dir="ltr"
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderLicenseAppsTab = () => (
    <div className="wm-form-section wm-visa-section">
      {/* إحصائيات */}
      <div className="wm-license-stats">
        {[
          { key: 'all', label: 'الكل', color: '#64748b', count: licenseStats.total },
          { key: 'submitted', label: 'جديدة', color: '#2563eb', count: licenseStats.submitted },
          { key: 'under_review', label: 'قيد المراجعة', color: '#d97706', count: licenseStats.under_review },
          { key: 'approved', label: 'مقبولة', color: '#16a34a', count: licenseStats.approved },
          { key: 'completed', label: 'مكتملة', color: '#7c3aed', count: licenseStats.completed },
          { key: 'received', label: 'مستلمة', color: '#0891b2', count: licenseStats.received },
          { key: 'rejected', label: 'مرفوضة', color: '#dc2626', count: licenseStats.rejected },
        ].map(s => (
          <div
            key={s.key}
            className={`wm-visa-stat ${licenseFilter === s.key ? 'active' : ''}`}
            style={{ borderColor: s.color }}
            onClick={() => { setLicenseFilter(s.key); setLicensePage(1); }}
          >
            <span className="wm-visa-stat-num" style={{ color: s.color }}>{s.count || 0}</span>
            <span className="wm-visa-stat-label">{s.label}</span>
          </div>
        ))}
      </div>

      {/* بحث */}
      <div className="wm-visa-filters">
        <form onSubmit={handleLicenseSearch} className="wm-visa-search">
          <input
            type="text"
            placeholder="بحث بالاسم، رقم الطلب، رقم الهوية..."
            value={licenseSearch}
            onChange={e => setLicenseSearch(e.target.value)}
          />
          <button type="submit">بحث</button>
        </form>
      </div>

      {/* جدول الطلبات */}
      {licenseLoading ? (
        <div className="wm-loading">جاري تحميل الطلبات...</div>
      ) : licenseApps.length === 0 ? (
        <div className="wm-visa-empty">
          <span style={{ fontSize: '2rem' }}>🪪</span>
          <p>لا توجد طلبات رخصة</p>
          {(licenseSearch || licenseFilter !== 'all') && (
            <button
              className="wm-visa-btn-view"
              onClick={() => { setLicenseSearch(''); setLicenseFilter('all'); setLicensePage(1); }}
            >
              إعادة ضبط الفلاتر
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="wm-visa-table-wrap">
            <table className="wm-visa-table">
              <thead>
                <tr>
                  <th>رقم الطلب</th>
                  <th>مقدم الطلب</th>
                  <th>الاسم</th>
                  <th>رقم الهوية</th>
                  <th>التسليم</th>
                  <th>الإجمالي</th>
                  <th>التاريخ</th>
                  <th>الحالة</th>
                  <th>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {licenseApps.map(app => (
                  <tr key={app._id}>
                    <td className="wm-visa-app-num">{app.applicationNumber}</td>
                    <td>{app.clientId?.name || '—'}</td>
                    <td>{app.personalInfo ? `${app.personalInfo.givenName || ''} ${app.personalInfo.familyName || ''}`.trim() || '—' : '—'}</td>
                    <td dir="ltr">{app.personalInfo?.nationalId || '—'}</td>
                    <td>
                      {app.deliveryMethod ? (
                        <span className="wm-delivery-badge" title={DELIVERY_METHOD_MAP[app.deliveryMethod]?.label}>
                          {DELIVERY_METHOD_MAP[app.deliveryMethod]?.icon} {DELIVERY_METHOD_MAP[app.deliveryMethod]?.label}
                        </span>
                      ) : '—'}
                    </td>
                    <td>{app.totalPrice ? `${app.totalPrice} ${content.internationalLicense?.currency ?? 'ريال'}` : '—'}</td>
                    <td>{formatDate(app.createdAt)}</td>
                    <td>
                      <span
                        className="wm-visa-badge"
                        style={{
                          color: LICENSE_STATUS_MAP[app.status]?.color,
                          background: LICENSE_STATUS_MAP[app.status]?.bg
                        }}
                      >
                        {LICENSE_STATUS_MAP[app.status]?.label || app.status}
                      </span>
                    </td>
                    <td>
                      <div className="wm-visa-actions">
                        <button
                          className="wm-visa-view-btn"
                          onClick={() => navigate(`/control/license-applications/${app._id}`)}
                          title="عرض التفاصيل"
                        >
                          👁️
                        </button>
                        <select
                          value={app.status}
                          onChange={e => handleLicenseStatusChange(app._id, e.target.value)}
                          className="wm-license-status-select"
                        >
                          <option value="draft">مسودة</option>
                          <option value="submitted">جديد</option>
                          <option value="under_review">قيد المراجعة</option>
                          <option value="approved">مقبول</option>
                          <option value="completed">مكتمل</option>
                          <option value="received">مستلم</option>
                          <option value="rejected">مرفوض</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {licensePagination.pages > 1 && (
            <div className="wm-visa-pagination">
              <button
                disabled={licensePage <= 1}
                onClick={() => setLicensePage(p => p - 1)}
              >
                السابق
              </button>
              <span>صفحة {licensePage} من {licensePagination.pages}</span>
              <button
                disabled={licensePage >= licensePagination.pages}
                onClick={() => setLicensePage(p => p + 1)}
              >
                التالي
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );

  // === Email Settings ===
  const toggleEmailSection = (key) => {
    setEmailOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const EMAIL_TEMPLATES = [
    {
      key: 'welcome',
      title: '👋 رسالة الترحيب',
      desc: 'تُرسل عند تسجيل عميل جديد',
      fields: [
        { name: 'subject', label: 'عنوان البريد', placeholder: 'أهلاً بك في شركة ألوان المسافر!' },
        { name: 'greeting', label: 'نص الترحيب', placeholder: 'مرحباً بك' },
        { name: 'bodyText', label: 'نص الرسالة', placeholder: 'يسعدنا انضمامك إلى ألوان المسافر...', multiline: true },
        { name: 'ctaText', label: 'نص الزر', placeholder: 'الذهاب للوحة التحكم' }
      ]
    },
    {
      key: 'passwordReset',
      title: '🔐 استعادة كلمة المرور',
      desc: 'تُرسل عند طلب استعادة كلمة المرور',
      fields: [
        { name: 'subject', label: 'عنوان البريد', placeholder: 'استعادة كلمة المرور — ألوان المسافر' },
        { name: 'bodyText', label: 'نص الرسالة', placeholder: 'تلقّينا طلباً لإعادة تعيين كلمة المرور...', multiline: true },
        { name: 'warningText', label: 'نص التحذير', placeholder: 'هذا الرابط صالح لمدة 30 دقيقة فقط...' },
        { name: 'ctaText', label: 'نص الزر', placeholder: 'إعادة تعيين كلمة المرور' }
      ]
    },
    {
      key: 'passwordChanged',
      title: '✅ تأكيد تغيير كلمة المرور',
      desc: 'تُرسل بعد تغيير كلمة المرور بنجاح',
      fields: [
        { name: 'subject', label: 'عنوان البريد', placeholder: 'تم تغيير كلمة المرور — ألوان المسافر' },
        { name: 'bodyText', label: 'نص الرسالة', placeholder: 'نودّ إعلامك بأن كلمة مرور حسابك قد تم تغييرها...', multiline: true },
        { name: 'warningText', label: 'نص التحذير', placeholder: 'إذا لم تقم بهذا التغيير، يرجى التواصل معنا فوراً...' }
      ]
    },
    {
      key: 'applicationSubmitted',
      title: '📩 تأكيد استلام الطلب',
      desc: 'تُرسل عند تقديم طلب رخصة أو تأشيرة',
      fields: [
        { name: 'subject', label: 'عنوان البريد', placeholder: 'تم استلام طلبك — الرخصة الدولية' },
        { name: 'bodyText', label: 'نص الرسالة', placeholder: 'شكراً لاختيارك ألوان المسافر. تم استلام طلبك...', multiline: true },
        { name: 'ctaText', label: 'نص الزر', placeholder: 'متابعة الطلب' }
      ]
    },
    {
      key: 'statusUpdate',
      title: '📋 تحديث حالة الطلب',
      desc: 'تُرسل عند تغيير حالة الطلب من لوحة التحكم',
      fields: [
        { name: 'subject', label: 'عنوان البريد', placeholder: 'تحديث على طلبك — قيد المراجعة' },
        { name: 'bodyText', label: 'نص الرسالة', placeholder: 'تم تحديث حالة طلبك لدى ألوان المسافر...', multiline: true },
        { name: 'ctaText', label: 'نص الزر', placeholder: 'عرض تفاصيل الطلب' }
      ]
    }
  ];

  const renderEmailTab = () => (
    <div className="wm-form-section">
      <p className="wm-email-tab-desc">تخصيص نصوص رسائل البريد الإلكتروني المُرسلة للعملاء. اترك أي حقل فارغاً لاستخدام النص الافتراضي.</p>

      {EMAIL_TEMPLATES.map(template => {
        const isOpen = emailOpenSections[template.key] !== false;
        const settings = content?.emailSettings?.[template.key] || {};
        const hasCustom = template.fields.some(f => settings[f.name]?.trim());

        return (
          <div key={template.key} className={`wm-email-section ${isOpen ? 'open' : ''}`}>
            <div className="wm-email-section-header" onClick={() => toggleEmailSection(template.key)}>
              <div className="wm-email-section-title">
                <span className="wm-email-section-name">{template.title}</span>
                <span className="wm-email-section-desc">{template.desc}</span>
              </div>
              <div className="wm-email-section-badges">
                {hasCustom && <span className="wm-email-custom-badge">مخصص</span>}
                <span className={`wm-email-arrow ${isOpen ? 'open' : ''}`}>▾</span>
              </div>
            </div>

            {isOpen && (
              <div className="wm-email-section-body">
                {template.fields.map(field => (
                  <div key={field.name} className="wm-form-group">
                    <label>{field.label}</label>
                    {field.multiline ? (
                      <textarea
                        value={settings[field.name] ?? ''}
                        onChange={e => updateField(`emailSettings.${template.key}.${field.name}`, e.target.value)}
                        placeholder={field.placeholder}
                        rows={3}
                      />
                    ) : (
                      <input
                        type="text"
                        value={settings[field.name] ?? ''}
                        onChange={e => updateField(`emailSettings.${template.key}.${field.name}`, e.target.value)}
                        placeholder={field.placeholder}
                      />
                    )}
                  </div>
                ))}
                {hasCustom && (
                  <button
                    className="wm-email-reset-btn"
                    onClick={() => {
                      const resetObj = {};
                      template.fields.forEach(f => { resetObj[f.name] = ''; });
                      updateField(`emailSettings.${template.key}`, resetObj);
                    }}
                  >
                    ↩️ إعادة للنص الافتراضي
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'hero': return renderHeroTab();
      case 'services': return renderServicesTab();
      case 'about': return renderAboutTab();
      case 'faq': return renderFaqTab();
      case 'testimonials': return renderTestimonialsTab();
      case 'contact': return renderContactTab();
      case 'general': return renderGeneralTab();
      case 'americanVisa': return renderAmericanVisaTab();
      case 'licenseSettings': return renderLicenseSettingsTab();
      case 'licenseApps': return renderLicenseAppsTab();
      case 'clients': return renderClientsTab();
      case 'email': return renderEmailTab();
      case 'visaCatalog': return <VisaCatalogTab />;
      default: return null;
    }
  };

  return (
    <div className="wm-page">
      <div className="wm-header">
        <div>
          <h1>إدارة الموقع</h1>
          <p>تعديل محتوى موقع العملاء</p>
        </div>
        <div className="wm-header-actions">
          <a href="/" target="_blank" rel="noopener noreferrer" className="wm-btn-preview">معاينة الموقع</a>
          <button className="wm-btn-save" onClick={handleSave} disabled={saving}>
            {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
          </button>
        </div>
      </div>

      {message.text && (
        <div className={`wm-message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="wm-layout">
        <div className="wm-tabs">
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`wm-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="wm-tab-icon">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
        <div className="wm-content">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default WebsiteManagement;
