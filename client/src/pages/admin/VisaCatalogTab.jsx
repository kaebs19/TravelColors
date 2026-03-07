import { useState, useEffect, useRef } from 'react';
import { visaCatalogApi } from '../../api';
import { departmentsApi } from '../../api';
import CouponManager from '../../components/admin/CouponManager';

const API_URL = (process.env.REACT_APP_API_URL || 'http://localhost:5002').replace(/\/api\/?$/, '');

// ============================================================
//  قائمة الدول الشائعة (عربي + إنجليزي)
// ============================================================
const COUNTRIES = [
  { ar: 'فرنسا', en: 'France' },
  { ar: 'بريطانيا', en: 'United Kingdom' },
  { ar: 'ألمانيا', en: 'Germany' },
  { ar: 'إسبانيا', en: 'Spain' },
  { ar: 'إيطاليا', en: 'Italy' },
  { ar: 'هولندا', en: 'Netherlands' },
  { ar: 'السويد', en: 'Sweden' },
  { ar: 'النرويج', en: 'Norway' },
  { ar: 'سويسرا', en: 'Switzerland' },
  { ar: 'النمسا', en: 'Austria' },
  { ar: 'بلجيكا', en: 'Belgium' },
  { ar: 'البرتغال', en: 'Portugal' },
  { ar: 'اليونان', en: 'Greece' },
  { ar: 'بولندا', en: 'Poland' },
  { ar: 'التشيك', en: 'Czech Republic' },
  { ar: 'أيرلندا', en: 'Ireland' },
  { ar: 'الدنمارك', en: 'Denmark' },
  { ar: 'فنلندا', en: 'Finland' },
  { ar: 'رومانيا', en: 'Romania' },
  { ar: 'كرواتيا', en: 'Croatia' },
  { ar: 'المجر', en: 'Hungary' },
  { ar: 'تركيا', en: 'Turkey' },
  { ar: 'مصر', en: 'Egypt' },
  { ar: 'المغرب', en: 'Morocco' },
  { ar: 'تونس', en: 'Tunisia' },
  { ar: 'الأردن', en: 'Jordan' },
  { ar: 'لبنان', en: 'Lebanon' },
  { ar: 'الهند', en: 'India' },
  { ar: 'الصين', en: 'China' },
  { ar: 'اليابان', en: 'Japan' },
  { ar: 'كوريا الجنوبية', en: 'South Korea' },
  { ar: 'تايلاند', en: 'Thailand' },
  { ar: 'ماليزيا', en: 'Malaysia' },
  { ar: 'إندونيسيا', en: 'Indonesia' },
  { ar: 'سنغافورة', en: 'Singapore' },
  { ar: 'فيتنام', en: 'Vietnam' },
  { ar: 'سريلانكا', en: 'Sri Lanka' },
  { ar: 'جورجيا', en: 'Georgia' },
  { ar: 'أذربيجان', en: 'Azerbaijan' },
  { ar: 'أرمينيا', en: 'Armenia' },
  { ar: 'أوزبكستان', en: 'Uzbekistan' },
  { ar: 'كازاخستان', en: 'Kazakhstan' },
  { ar: 'روسيا', en: 'Russia' },
  { ar: 'أوكرانيا', en: 'Ukraine' },
  { ar: 'كندا', en: 'Canada' },
  { ar: 'المكسيك', en: 'Mexico' },
  { ar: 'البرازيل', en: 'Brazil' },
  { ar: 'الأرجنتين', en: 'Argentina' },
  { ar: 'كولومبيا', en: 'Colombia' },
  { ar: 'أستراليا', en: 'Australia' },
  { ar: 'نيوزيلندا', en: 'New Zealand' },
  { ar: 'جنوب أفريقيا', en: 'South Africa' },
  { ar: 'كينيا', en: 'Kenya' },
  { ar: 'تنزانيا', en: 'Tanzania' },
  { ar: 'إثيوبيا', en: 'Ethiopia' },
  { ar: 'نيجيريا', en: 'Nigeria' },
  { ar: 'المالديف', en: 'Maldives' },
  { ar: 'موريشيوس', en: 'Mauritius' },
  { ar: 'سيشل', en: 'Seychelles' },
  { ar: 'قبرص', en: 'Cyprus' },
  { ar: 'مالطا', en: 'Malta' },
  { ar: 'أيسلندا', en: 'Iceland' },
  { ar: 'الفلبين', en: 'Philippines' },
  { ar: 'نيبال', en: 'Nepal' },
  { ar: 'كمبوديا', en: 'Cambodia' },
  { ar: 'ميانمار', en: 'Myanmar' },
  { ar: 'باكستان', en: 'Pakistan' },
  { ar: 'بنغلاديش', en: 'Bangladesh' },
  { ar: 'إيران', en: 'Iran' },
  { ar: 'أوغندا', en: 'Uganda' },
  { ar: 'رواندا', en: 'Rwanda' },
  { ar: 'غانا', en: 'Ghana' },
  { ar: 'السنغال', en: 'Senegal' },
  { ar: 'بيرو', en: 'Peru' },
  { ar: 'تشيلي', en: 'Chile' },
  { ar: 'كوبا', en: 'Cuba' },
  { ar: 'صربيا', en: 'Serbia' },
  { ar: 'ألبانيا', en: 'Albania' },
  { ar: 'الجبل الأسود', en: 'Montenegro' },
  { ar: 'البوسنة والهرسك', en: 'Bosnia and Herzegovina' },
  { ar: 'مقدونيا الشمالية', en: 'North Macedonia' },
];

const VISA_TYPE_OPTIONS = [
  { value: 'عادية', label: 'عادية' },
  { value: 'إلكترونية', label: 'إلكترونية' }
];

// ============================================================
//  أيقونات SVG للمتطلبات
// ============================================================
const REQUIREMENT_ICONS = {
  passport: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
      <path d="M6 2h12a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"/>
      <circle cx="12" cy="10" r="3"/>
      <path d="M8 17h8"/>
    </svg>
  ),
  medical: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
      <path d="M8 2v4M16 2v4M3 10h18"/>
      <rect x="3" y="4" width="18" height="18" rx="2"/>
      <path d="M12 14v4M10 16h4"/>
    </svg>
  ),
  translate: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
      <path d="M5 8l6 6M4 14l6-6 2-3M2 5h12M7 2h1"/>
      <path d="M22 22l-5-10-5 10M14 18h6"/>
    </svg>
  ),
  bank: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
      <rect x="2" y="6" width="20" height="14" rx="2"/>
      <path d="M2 10h20M6 14h.01M10 14h4"/>
    </svg>
  ),
  photo: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <circle cx="8.5" cy="8.5" r="1.5"/>
      <path d="M21 15l-5-5L5 21"/>
    </svg>
  ),
  salary: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <path d="M14 2v6h6M9 15h6M9 11h6"/>
    </svg>
  ),
  info: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 16v-4M12 8h.01"/>
    </svg>
  ),
  clock: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 6v6l4 2"/>
    </svg>
  ),
  document: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <path d="M14 2v6h6"/>
    </svg>
  ),
  check: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <path d="M22 4L12 14.01l-3-3"/>
    </svg>
  )
};

const ICON_OPTIONS = [
  { key: 'passport', label: 'جواز سفر' },
  { key: 'medical', label: 'طبي' },
  { key: 'translate', label: 'ترجمة' },
  { key: 'bank', label: 'بنكي' },
  { key: 'photo', label: 'صورة' },
  { key: 'salary', label: 'شهادة' },
  { key: 'info', label: 'معلومات' },
  { key: 'clock', label: 'وقت' },
  { key: 'document', label: 'مستند' },
  { key: 'check', label: 'تحقق' }
];

// ============================================================
//  قوالب المتطلبات الجاهزة
// ============================================================
const PREDEFINED_REQUIREMENTS = [
  {
    title: 'صورة من جواز السفر',
    icon: 'passport',
    isRequired: true,
    details: 'جواز سفر ساري المفعول لمدة لا تقل عن 6 أشهر من تاريخ السفر، ويحتوي على صفحتين فارغتين على الأقل. يجب أن تكون صورة الجواز واضحة وملونة وتشمل صفحة البيانات الشخصية كاملة.'
  },
  {
    title: 'التأمين الطبي',
    icon: 'medical',
    isRequired: true,
    details: 'وثيقة تأمين طبي سارية تغطي فترة السفر بالكامل، بحد أدنى تغطية 30,000 يورو. يجب أن يشمل التأمين تكاليف العلاج الطبي الطارئ والإعادة إلى الوطن.'
  },
  {
    title: 'الترجمة',
    icon: 'translate',
    isRequired: true,
    details: 'ترجمة جميع المستندات المطلوبة إلى اللغة الإنجليزية أو لغة البلد المقصود من قبل مترجم معتمد. يجب أن تكون الترجمة مصدقة ومختومة من مكتب ترجمة رسمي.'
  },
  {
    title: 'كشف حساب بنكي',
    icon: 'bank',
    isRequired: true,
    details: 'كشف حساب بنكي لآخر 3 إلى 6 أشهر يوضح الحركات المالية والرصيد الحالي. يجب أن يكون مختوماً من البنك ويُظهر قدرة مالية كافية لتغطية تكاليف السفر والإقامة.'
  },
  {
    title: 'صورتان شخصيتان حديثتان',
    icon: 'photo',
    isRequired: true,
    details: 'صور بخلفية بيضاء بمقاس 4×6 سم، حديثة لا تزيد عن 6 أشهر. يجب أن يكون الوجه واضحاً بالكامل بدون نظارات شمسية أو أغطية رأس (ما لم تكن لأسباب دينية).'
  },
  {
    title: 'شهادة تعريف الراتب',
    icon: 'salary',
    isRequired: true,
    details: 'خطاب معتمد من جهة العمل يوضح المسمى الوظيفي وتاريخ التعيين والراتب الشهري ومدة الإجازة الممنوحة. يجب أن يكون مختوماً وموقعاً من المسؤول المختص وحديثاً لا يتجاوز 30 يوماً.'
  },
  {
    title: 'لأننا نهتم برحلتك',
    icon: 'info',
    isRequired: false,
    details: 'لا تقم بحجز تذاكر طيران أو فنادق قبل الحصول على التأشيرة. ننصح بالانتظار حتى صدور التأشيرة لتجنب أي خسائر مالية في حال الرفض. نحن هنا لمساعدتك في كل خطوة.'
  },
  {
    title: 'مدة إصدار التأشيرة المتوقعة',
    icon: 'clock',
    isRequired: false,
    details: 'المدة المتوقعة لإصدار التأشيرة تتراوح بين 5 إلى 15 يوم عمل من تاريخ تقديم الطلب المكتمل. قد تختلف المدة حسب السفارة والموسم. ننصح بالتقديم قبل موعد السفر بوقت كافٍ.'
  }
];

// ============================================================
//  المستندات المطلوبة الجاهزة (للتأشيرات الإلكترونية)
// ============================================================
const PRESET_DOCUMENTS = [
  {
    key: 'personal_photo',
    label: 'صورة شخصية',
    instructions: 'صورة شخصية مكشوفة الرأس، خلفية بيضاء، بدون شماغ، النساء منبت الشعر باين',
    isRequired: true,
    acceptedTypes: 'image',
    sortOrder: 0
  },
  {
    key: 'passport_image',
    label: 'صورة جواز السفر',
    instructions: 'صورة الجواز الأصل — صفحة البيانات واضحة وملونة',
    isRequired: true,
    acceptedTypes: 'both',
    sortOrder: 1
  },
  {
    key: 'salary_certificate',
    label: 'تعريف بالراتب',
    instructions: 'خطاب معتمد من جهة العمل يوضح المسمى الوظيفي والراتب — مختوم وموقع',
    isRequired: true,
    acceptedTypes: 'both',
    sortOrder: 2
  },
  {
    key: 'bank_statement',
    label: 'كشف حساب بنكي',
    instructions: 'كشف حساب بنكي لآخر 3 أشهر — مختوم من البنك',
    isRequired: true,
    acceptedTypes: 'both',
    sortOrder: 3
  }
];

const emptyVisa = {
  countryName: '',
  countryNameEn: '',
  slug: '',
  visaType: 'عادية',
  department: '',
  flagImage: '',
  coverImage: '',
  price: '0',
  currency: 'ريال',
  offerEnabled: false,
  offerPrice: '',
  rating: 5,
  description: '',
  contactNumber: '',
  processingDays: '',
  requirements: [],
  coupons: [],
  addons: [],
  requiredDocuments: [],
  isActive: true,
  sortOrder: 0,
  // SEO
  metaTitle: '',
  metaDescription: '',
  keywords: []
};

const VisaCatalogTab = () => {
  const [visas, setVisas] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showForm, setShowForm] = useState(false);
  const [editingVisa, setEditingVisa] = useState(null);
  const [form, setForm] = useState({ ...emptyVisa });
  const [typeFilter, setTypeFilter] = useState('all');
  const [uploading, setUploading] = useState({ flag: false, cover: false });

  // Country search
  const [countrySearch, setCountrySearch] = useState('');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const countryDropdownRef = useRef(null);

  // Active form section
  const [activeSection, setActiveSection] = useState('content');

  useEffect(() => {
    loadData();
  }, []);

  // Close country dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(e.target)) {
        setShowCountryDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [visaRes, deptRes] = await Promise.all([
        visaCatalogApi.getAllVisas().catch(() => ({ success: false })),
        departmentsApi.getDepartments().catch(() => ({ success: false }))
      ]);
      if (visaRes.success) setVisas(visaRes.data.visas || []);
      if (deptRes.success) setDepartments(deptRes.data?.departments || deptRes.data || []);
    } catch (err) {
      showMsg('error', 'حدث خطأ في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const showMsg = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleImageUpload = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;

    const key = field === 'flagImage' ? 'flag' : 'cover';
    setUploading(prev => ({ ...prev, [key]: true }));

    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await visaCatalogApi.uploadVisaImage(formData);
      if (res.success) {
        setForm(prev => ({ ...prev, [field]: res.data.url }));
      }
    } catch (err) {
      showMsg('error', 'فشل رفع الصورة');
    } finally {
      setUploading(prev => ({ ...prev, [key]: false }));
    }
  };

  // ---- Country selection ----
  const selectCountry = (country) => {
    setForm(prev => ({
      ...prev,
      countryName: `التأشيرة ${country.ar === country.ar ? country.ar + 'ية' : country.ar}`,
      countryNameEn: country.en
    }));
    setCountrySearch('');
    setShowCountryDropdown(false);
  };

  const filteredCountries = COUNTRIES.filter(c =>
    c.ar.includes(countrySearch) || c.en.toLowerCase().includes(countrySearch.toLowerCase())
  );

  // ---- Edit / Add / Cancel ----
  const handleEdit = (visa) => {
    setEditingVisa(visa._id);
    setForm({
      ...emptyVisa,
      ...visa,
      department: visa.department?._id || visa.department || '',
      keywords: visa.keywords || []
    });
    setShowForm(true);
    setActiveSection('content');
  };

  const handleAdd = () => {
    setEditingVisa(null);
    setForm({ ...emptyVisa });
    setShowForm(true);
    setActiveSection('content');
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingVisa(null);
    setForm({ ...emptyVisa });
  };

  const handleSave = async () => {
    if (!form.countryName.trim()) {
      showMsg('error', 'اسم الدولة مطلوب');
      return;
    }

    setSaving(true);
    try {
      let res;
      if (editingVisa) {
        res = await visaCatalogApi.updateVisa(editingVisa, form);
      } else {
        res = await visaCatalogApi.createVisa(form);
      }

      if (res.success) {
        showMsg('success', editingVisa ? 'تم تحديث التأشيرة بنجاح' : 'تم إنشاء التأشيرة بنجاح');
        handleCancel();
        loadData();
      }
    } catch (err) {
      showMsg('error', err.response?.data?.message || 'حدث خطأ');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه التأشيرة؟')) return;
    try {
      const res = await visaCatalogApi.deleteVisa(id);
      if (res.success) {
        showMsg('success', 'تم حذف التأشيرة');
        loadData();
      }
    } catch (err) {
      showMsg('error', 'حدث خطأ في الحذف');
    }
  };

  const handleToggle = async (id) => {
    try {
      const res = await visaCatalogApi.toggleVisa(id);
      if (res.success) {
        setVisas(prev => prev.map(v => v._id === id ? { ...v, isActive: !v.isActive } : v));
      }
    } catch (err) {
      showMsg('error', 'حدث خطأ');
    }
  };

  // ---- Requirement helpers ----
  const [showTemplates, setShowTemplates] = useState(false);

  const addRequirement = () => {
    setForm(prev => ({
      ...prev,
      requirements: [...prev.requirements, { title: '', details: '', isRequired: true, icon: 'document' }]
    }));
  };

  const addFromTemplate = (template) => {
    setForm(prev => ({
      ...prev,
      requirements: [...prev.requirements, { ...template }]
    }));
  };

  const addAllTemplates = () => {
    setForm(prev => ({
      ...prev,
      requirements: [...prev.requirements, ...PREDEFINED_REQUIREMENTS.map(t => ({ ...t }))]
    }));
    setShowTemplates(false);
  };

  const updateRequirement = (index, field, value) => {
    setForm(prev => {
      const reqs = [...prev.requirements];
      reqs[index] = { ...reqs[index], [field]: value };
      return { ...prev, requirements: reqs };
    });
  };

  const removeRequirement = (index) => {
    setForm(prev => {
      const reqs = [...prev.requirements];
      reqs.splice(index, 1);
      return { ...prev, requirements: reqs };
    });
  };

  // ---- Addon helpers ----
  const addAddon = () => {
    setForm(prev => ({
      ...prev,
      addons: [...prev.addons, { name: '', price: '0', enabled: true, description: '' }]
    }));
  };

  const updateAddon = (index, field, value) => {
    setForm(prev => {
      const addons = [...prev.addons];
      addons[index] = { ...addons[index], [field]: value };
      return { ...prev, addons };
    });
  };

  const removeAddon = (index) => {
    setForm(prev => {
      const addons = [...prev.addons];
      addons.splice(index, 1);
      return { ...prev, addons };
    });
  };

  // ---- Required Documents helpers ----
  const [showDocTemplates, setShowDocTemplates] = useState(false);

  const addRequiredDocument = () => {
    const customIndex = (form.requiredDocuments || []).filter(d => d.key.startsWith('custom_')).length + 1;
    setForm(prev => ({
      ...prev,
      requiredDocuments: [...(prev.requiredDocuments || []), {
        key: `custom_${customIndex}`,
        label: '',
        instructions: '',
        isRequired: true,
        acceptedTypes: 'both',
        sortOrder: (prev.requiredDocuments || []).length
      }]
    }));
  };

  const addDocFromPreset = (preset) => {
    if ((form.requiredDocuments || []).some(d => d.key === preset.key)) return;
    setForm(prev => ({
      ...prev,
      requiredDocuments: [...(prev.requiredDocuments || []), { ...preset, sortOrder: (prev.requiredDocuments || []).length }]
    }));
  };

  const addAllDocPresets = () => {
    const existing = (form.requiredDocuments || []).map(d => d.key);
    const newDocs = PRESET_DOCUMENTS.filter(p => !existing.includes(p.key));
    setForm(prev => ({
      ...prev,
      requiredDocuments: [...(prev.requiredDocuments || []), ...newDocs.map((d, i) => ({ ...d, sortOrder: (prev.requiredDocuments || []).length + i }))]
    }));
    setShowDocTemplates(false);
  };

  const updateRequiredDocument = (index, field, value) => {
    setForm(prev => {
      const docs = [...(prev.requiredDocuments || [])];
      docs[index] = { ...docs[index], [field]: value };
      return { ...prev, requiredDocuments: docs };
    });
  };

  const removeRequiredDocument = (index) => {
    setForm(prev => {
      const docs = [...(prev.requiredDocuments || [])];
      docs.splice(index, 1);
      return { ...prev, requiredDocuments: docs };
    });
  };

  // ---- Keywords helpers ----
  const [keywordInput, setKeywordInput] = useState('');
  const addKeyword = () => {
    const kw = keywordInput.trim();
    if (!kw) return;
    setForm(prev => ({
      ...prev,
      keywords: [...(prev.keywords || []), kw]
    }));
    setKeywordInput('');
  };

  const removeKeyword = (index) => {
    setForm(prev => {
      const kws = [...(prev.keywords || [])];
      kws.splice(index, 1);
      return { ...prev, keywords: kws };
    });
  };

  const autoGenerateKeywords = () => {
    const kws = new Set(['تأشيرة', 'فيزا', 'سفر']);
    if (form.countryName) kws.add(form.countryName);
    if (form.countryNameEn) kws.add(form.countryNameEn);
    if (form.visaType) kws.add(form.visaType);
    // استخراج اسم الدولة بدون "التأشيرة"
    const cleanName = form.countryName.replace(/التأشيرة\s*/g, '').replace(/ية$/g, '').trim();
    if (cleanName) kws.add(cleanName);
    if (cleanName) kws.add(`تأشيرة ${cleanName}`);
    if (cleanName) kws.add(`فيزا ${cleanName}`);
    if (form.countryNameEn) kws.add(`${form.countryNameEn} visa`);
    setForm(prev => ({ ...prev, keywords: [...kws] }));
  };

  const autoGenerateSEO = () => {
    const cleanName = form.countryName || 'التأشيرة';
    setForm(prev => ({
      ...prev,
      metaTitle: prev.metaTitle || `${cleanName} - ألوان المسافر`,
      metaDescription: prev.metaDescription || (prev.description
        ? prev.description.substring(0, 160)
        : `احصل على ${cleanName} بسهولة واحترافية مع ألوان المسافر. نوفر لك كل المتطلبات والإجراءات اللازمة.`)
    }));
    autoGenerateKeywords();
  };

  // ---- Filter visas ----
  const filteredVisas = typeFilter === 'all'
    ? visas
    : visas.filter(v => v.visaType === typeFilter);

  if (loading) {
    return <div className="wm-loading">جاري التحميل...</div>;
  }

  // ============================================================
  //  FORM SECTION TABS
  // ============================================================
  const FORM_SECTIONS = [
    { id: 'content', label: 'المحتوى', icon: '📝' },
    { id: 'settings', label: 'الإعدادات', icon: '⚙️' },
    { id: 'seo', label: 'الأرشفة', icon: '🔍' }
  ];

  // ============================================================
  //  Render: Visa List
  // ============================================================
  if (!showForm) {
    return (
      <div className="vc-tab">
        {message.text && (
          <div className={`wm-message ${message.type}`}>{message.text}</div>
        )}

        <div className="vc-header">
          <div className="vc-filter-row">
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
              <option value="all">كل الأنواع</option>
              <option value="عادية">عادية</option>
              <option value="إلكترونية">إلكترونية</option>
            </select>
            <span className="vc-count">{filteredVisas.length} تأشيرة</span>
          </div>
          <button className="wm-btn-add" onClick={handleAdd}>
            ➕ إضافة تأشيرة
          </button>
        </div>

        {filteredVisas.length === 0 ? (
          <div className="vc-empty">
            <p>🌍 لا توجد تأشيرات — اضغط "إضافة تأشيرة" لإنشاء واحدة</p>
          </div>
        ) : (
          <div className="vc-list">
            {filteredVisas.map(visa => (
              <div className={`vc-card ${!visa.isActive ? 'vc-card-disabled' : ''}`} key={visa._id}>
                <div className="vc-card-flag">
                  {visa.flagImage ? (
                    <img src={`${API_URL}${visa.flagImage}`} alt={visa.countryName} />
                  ) : (
                    <span className="vc-no-flag">🏳️</span>
                  )}
                </div>
                <div className="vc-card-info">
                  <h4>{visa.countryName}</h4>
                  {visa.countryNameEn && <span className="vc-card-en">{visa.countryNameEn}</span>}
                  <div className="vc-card-meta">
                    <span className={`vc-badge ${visa.visaType === 'إلكترونية' ? 'vc-badge-elec' : 'vc-badge-normal'}`}>
                      {visa.visaType}
                    </span>
                    <span className="vc-price">
                      {visa.offerEnabled && visa.offerPrice ? (
                        <>
                          <s>{visa.price}</s> {visa.offerPrice}
                        </>
                      ) : visa.price} {visa.currency || 'ريال'}
                    </span>
                  </div>
                  {visa.department?.title && (
                    <span className="vc-dept">🏛️ {visa.department.title}</span>
                  )}
                </div>
                <div className="vc-card-actions">
                  <label className="vc-toggle-label">
                    <input
                      type="checkbox"
                      checked={visa.isActive}
                      onChange={() => handleToggle(visa._id)}
                    />
                    <span>{visa.isActive ? 'مفعّل' : 'معطّل'}</span>
                  </label>
                  <button className="vc-btn-edit" onClick={() => handleEdit(visa)}>✏️ تعديل</button>
                  <button className="vc-btn-delete" onClick={() => handleDelete(visa._id)}>🗑️</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ============================================================
  //  Render: Visa Form (Add / Edit) — مع فصل المحتوى والإعدادات
  // ============================================================
  return (
    <div className="vc-tab">
      {message.text && (
        <div className={`wm-message ${message.type}`}>{message.text}</div>
      )}

      <div className="vc-form-header">
        <h3>{editingVisa ? '✏️ تعديل التأشيرة' : '➕ إضافة تأشيرة جديدة'}</h3>
        <button className="vc-btn-back" onClick={handleCancel}>→ العودة للقائمة</button>
      </div>

      {/* Form Section Tabs */}
      <div className="vc-section-tabs">
        {FORM_SECTIONS.map(sec => (
          <button
            key={sec.id}
            className={`vc-section-tab ${activeSection === sec.id ? 'active' : ''}`}
            onClick={() => setActiveSection(sec.id)}
          >
            <span>{sec.icon}</span>
            <span>{sec.label}</span>
          </button>
        ))}
      </div>

      <div className="vc-form">
        {/* ========== تاب المحتوى ========== */}
        {activeSection === 'content' && (
          <>
            {/* اختيار الدولة */}
            <div className="wm-card">
              <h4>🌍 اختيار الدولة</h4>

              {/* Country Search Dropdown */}
              <div className="vc-country-picker" ref={countryDropdownRef}>
                <label>ابحث واختر من القائمة أو اكتب يدوياً</label>
                <input
                  type="text"
                  value={countrySearch}
                  onChange={e => {
                    setCountrySearch(e.target.value);
                    setShowCountryDropdown(true);
                  }}
                  onFocus={() => setShowCountryDropdown(true)}
                  placeholder="اكتب اسم الدولة للبحث... (مثال: فرنسا أو France)"
                  className="vc-country-search"
                />
                {showCountryDropdown && countrySearch && (
                  <div className="vc-country-dropdown">
                    {filteredCountries.length === 0 ? (
                      <div className="vc-country-no-result">لا توجد نتائج</div>
                    ) : (
                      filteredCountries.slice(0, 15).map((c, i) => (
                        <div
                          key={i}
                          className="vc-country-option"
                          onClick={() => selectCountry(c)}
                        >
                          <span className="vc-country-ar">{c.ar}</span>
                          <span className="vc-country-en">{c.en}</span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              <div className="wm-form-row" style={{ marginTop: 12 }}>
                <div className="wm-form-group">
                  <label>اسم التأشيرة (عربي) *</label>
                  <input
                    type="text"
                    value={form.countryName}
                    onChange={e => setForm(prev => ({ ...prev, countryName: e.target.value }))}
                    placeholder="مثال: التأشيرة الفرنسية"
                  />
                </div>
                <div className="wm-form-group">
                  <label>اسم الدولة (إنجليزي)</label>
                  <input
                    type="text"
                    value={form.countryNameEn}
                    onChange={e => setForm(prev => ({ ...prev, countryNameEn: e.target.value }))}
                    placeholder="مثال: France"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="wm-form-row">
                <div className="wm-form-group">
                  <label>نوع التأشيرة *</label>
                  <select
                    value={form.visaType}
                    onChange={e => setForm(prev => ({ ...prev, visaType: e.target.value }))}
                  >
                    {VISA_TYPE_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div className="wm-form-group">
                  <label>السفارة / القسم</label>
                  <select
                    value={form.department}
                    onChange={e => setForm(prev => ({ ...prev, department: e.target.value }))}
                  >
                    <option value="">— بدون ربط —</option>
                    {departments.map(d => (
                      <option key={d._id} value={d._id}>{d.title}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* الوصف */}
            <div className="wm-card">
              <h4>📄 الوصف</h4>
              <div className="wm-form-group">
                <textarea
                  value={form.description}
                  onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="وصف مختصر عن التأشيرة ومتطلباتها..."
                  rows={4}
                />
              </div>
            </div>

            {/* الصور */}
            <div className="wm-card">
              <h4>📷 الصور</h4>
              <div className="wm-form-row">
                <div className="wm-form-group">
                  <label>صورة العلم</label>
                  <div className="vc-img-upload">
                    {form.flagImage && (
                      <img src={`${API_URL}${form.flagImage}`} alt="علم" className="vc-img-preview vc-img-flag" />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => handleImageUpload(e, 'flagImage')}
                      disabled={uploading.flag}
                    />
                    {uploading.flag && <span className="vc-uploading">جاري الرفع...</span>}
                  </div>
                </div>
                <div className="wm-form-group">
                  <label>صورة المعالم</label>
                  <div className="vc-img-upload">
                    {form.coverImage && (
                      <img src={`${API_URL}${form.coverImage}`} alt="معالم" className="vc-img-preview vc-img-cover" />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => handleImageUpload(e, 'coverImage')}
                      disabled={uploading.cover}
                    />
                    {uploading.cover && <span className="vc-uploading">جاري الرفع...</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* المتطلبات */}
            <div className="wm-card">
              <div className="wm-section-header">
                <h4>متطلبات التأشيرة</h4>
                <div className="vc-req-actions">
                  <button className="vc-btn-templates" onClick={() => setShowTemplates(!showTemplates)}>
                    {REQUIREMENT_ICONS.check}
                    <span>قوالب جاهزة</span>
                  </button>
                  <button className="wm-btn-add" onClick={addRequirement}>+ متطلب مخصص</button>
                </div>
              </div>

              {/* قوالب المتطلبات الجاهزة */}
              {showTemplates && (
                <div className="vc-templates-panel">
                  <div className="vc-templates-header">
                    <span>اختر من القوالب الجاهزة</span>
                    <button className="vc-btn-add-all" onClick={addAllTemplates}>إضافة الكل</button>
                  </div>
                  <div className="vc-templates-grid">
                    {PREDEFINED_REQUIREMENTS.map((tpl, i) => (
                      <div className="vc-template-item" key={i} onClick={() => { addFromTemplate(tpl); }}>
                        <span className="vc-template-icon">
                          {REQUIREMENT_ICONS[tpl.icon] || REQUIREMENT_ICONS.document}
                        </span>
                        <span className="vc-template-title">{tpl.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {form.requirements.length === 0 ? (
                <p className="wm-empty-hint">لا توجد متطلبات — اختر من القوالب الجاهزة أو أضف متطلباً مخصصاً</p>
              ) : (
                form.requirements.map((req, i) => (
                  <div className="vc-req-item-admin" key={i}>
                    <div className="vc-req-item-top">
                      <span className="vc-req-icon-display">
                        {REQUIREMENT_ICONS[req.icon] || REQUIREMENT_ICONS.document}
                      </span>
                      <div className="vc-req-item-controls">
                        <select
                          value={req.icon || 'document'}
                          onChange={e => updateRequirement(i, 'icon', e.target.value)}
                          className="vc-req-icon-select"
                        >
                          {ICON_OPTIONS.map(opt => (
                            <option key={opt.key} value={opt.key}>{opt.label}</option>
                          ))}
                        </select>
                        <label className="vc-req-toggle">
                          <input
                            type="checkbox"
                            checked={req.isRequired !== false}
                            onChange={e => updateRequirement(i, 'isRequired', e.target.checked)}
                          />
                          <span className={req.isRequired !== false ? 'vc-req-badge-req' : 'vc-req-badge-opt'}>
                            {req.isRequired !== false ? 'مطلوب' : 'اختياري'}
                          </span>
                        </label>
                        <button className="vc-req-btn-delete" onClick={() => removeRequirement(i)} title="حذف">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                            <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div className="wm-form-group" style={{ marginBottom: 8 }}>
                      <input
                        type="text"
                        value={req.title || ''}
                        onChange={e => updateRequirement(i, 'title', e.target.value)}
                        placeholder="عنوان المتطلب"
                        className="vc-req-title-input"
                      />
                    </div>
                    <div className="wm-form-group" style={{ marginBottom: 0 }}>
                      <textarea
                        value={req.details || ''}
                        onChange={e => updateRequirement(i, 'details', e.target.value)}
                        placeholder="تفاصيل المتطلب..."
                        rows={3}
                        className="vc-req-details-input"
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {/* ========== تاب الإعدادات ========== */}
        {activeSection === 'settings' && (
          <>
            {/* التسعير */}
            <div className="wm-card">
              <h4>💰 التسعير</h4>
              <div className="wm-form-row">
                <div className="wm-form-group">
                  <label>السعر</label>
                  <input
                    type="text"
                    value={form.price}
                    onChange={e => setForm(prev => ({ ...prev, price: e.target.value }))}
                    dir="ltr"
                  />
                </div>
                <div className="wm-form-group">
                  <label>العملة</label>
                  <input
                    type="text"
                    value={form.currency}
                    onChange={e => setForm(prev => ({ ...prev, currency: e.target.value }))}
                  />
                </div>
              </div>
              <div className="wm-form-row">
                <div className="wm-form-group">
                  <label className="wm-addon-toggle">
                    <input
                      type="checkbox"
                      checked={form.offerEnabled}
                      onChange={e => setForm(prev => ({ ...prev, offerEnabled: e.target.checked }))}
                    />
                    <span>تفعيل عرض خاص</span>
                  </label>
                </div>
                {form.offerEnabled && (
                  <div className="wm-form-group">
                    <label>سعر العرض</label>
                    <input
                      type="text"
                      value={form.offerPrice}
                      onChange={e => setForm(prev => ({ ...prev, offerPrice: e.target.value }))}
                      dir="ltr"
                      placeholder="السعر بعد الخصم"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* معلومات إضافية */}
            <div className="wm-card">
              <h4>⭐ معلومات إضافية</h4>
              <div className="wm-form-row">
                <div className="wm-form-group">
                  <label>التقييم (1-5)</label>
                  <input
                    type="number"
                    value={form.rating}
                    onChange={e => setForm(prev => ({ ...prev, rating: parseInt(e.target.value) || 5 }))}
                    min="1"
                    max="5"
                    dir="ltr"
                  />
                </div>
                <div className="wm-form-group">
                  <label>رقم التواصل</label>
                  <input
                    type="text"
                    value={form.contactNumber}
                    onChange={e => setForm(prev => ({ ...prev, contactNumber: e.target.value }))}
                    dir="ltr"
                    placeholder="+966 55 XXX XXXX"
                  />
                </div>
                <div className="wm-form-group">
                  <label>مدة المعالجة</label>
                  <input
                    type="text"
                    value={form.processingDays}
                    onChange={e => setForm(prev => ({ ...prev, processingDays: e.target.value }))}
                    placeholder="مثال: 5-15 يوم عمل"
                  />
                </div>
              </div>
              <div className="wm-form-row">
                <div className="wm-form-group">
                  <label>Slug (الرابط)</label>
                  <input
                    type="text"
                    value={form.slug || ''}
                    onChange={e => setForm(prev => ({ ...prev, slug: e.target.value }))}
                    placeholder="يتولد تلقائياً من الاسم الإنجليزي"
                    dir="ltr"
                  />
                </div>
                <div className="wm-form-group">
                  <label>ترتيب العرض</label>
                  <input
                    type="number"
                    value={form.sortOrder}
                    onChange={e => setForm(prev => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))}
                    min="0"
                    dir="ltr"
                  />
                </div>
              </div>
            </div>

            {/* الكوبونات */}
            <div className="wm-card">
              <CouponManager
                coupons={form.coupons}
                onUpdate={updated => setForm(prev => ({ ...prev, coupons: updated }))}
                currency={form.currency || 'ريال'}
              />
            </div>

            {/* الإضافات (للإلكترونية فقط) */}
            {form.visaType === 'إلكترونية' && (
              <div className="wm-card">
                <div className="wm-section-header">
                  <h4>🔧 الخدمات الإضافية</h4>
                  <button className="wm-btn-add" onClick={addAddon}>+ إضافة خدمة</button>
                </div>
                <p className="wm-section-desc">خدمات إضافية يمكن للعميل اختيارها عند التقديم</p>

                {form.addons.length === 0 ? (
                  <p className="wm-empty-hint">لا توجد خدمات إضافية — اضغط "إضافة خدمة"</p>
                ) : (
                  form.addons.map((addon, i) => (
                    <div className="wm-addon-item" key={i}>
                      <div className="wm-addon-item-header">
                        <label className="wm-addon-toggle">
                          <input
                            type="checkbox"
                            checked={addon.enabled !== false}
                            onChange={e => updateAddon(i, 'enabled', e.target.checked)}
                          />
                          <span>{addon.enabled !== false ? 'مفعّل' : 'معطّل'}</span>
                        </label>
                        <button className="wm-btn-remove" onClick={() => removeAddon(i)}>حذف</button>
                      </div>
                      <div className="wm-form-row">
                        <div className="wm-form-group" style={{ flex: 2 }}>
                          <label>اسم الخدمة</label>
                          <input
                            type="text"
                            value={addon.name || ''}
                            onChange={e => updateAddon(i, 'name', e.target.value)}
                            placeholder="مثال: تأمين سفر"
                          />
                        </div>
                        <div className="wm-form-group" style={{ flex: 1 }}>
                          <label>السعر ({form.currency || 'ريال'})</label>
                          <input
                            type="text"
                            value={addon.price || '0'}
                            onChange={e => updateAddon(i, 'price', e.target.value)}
                            dir="ltr"
                          />
                        </div>
                      </div>
                      <div className="wm-form-group">
                        <label>الوصف</label>
                        <input
                          type="text"
                          value={addon.description || ''}
                          onChange={e => updateAddon(i, 'description', e.target.value)}
                          placeholder="وصف مختصر..."
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* المستندات المطلوبة للتقديم (للإلكترونية فقط) */}
            {form.visaType === 'إلكترونية' && (
              <div className="wm-card" style={{ marginTop: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h4 style={{ margin: 0 }}>📎 المستندات المطلوبة للتقديم</h4>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button" className="wm-btn-add" style={{ fontSize: 12, padding: '4px 12px' }} onClick={() => setShowDocTemplates(!showDocTemplates)}>
                      قوالب جاهزة
                    </button>
                    <button type="button" className="wm-btn-add" onClick={addRequiredDocument}>+ مستند مخصص</button>
                  </div>
                </div>
                <p style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>حدد المستندات التي يجب على العميل رفعها عند التقديم الإلكتروني</p>

                {showDocTemplates && (
                  <div style={{ background: '#f8fafc', borderRadius: 10, padding: 14, marginBottom: 16, border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>اختر من المستندات الجاهزة</span>
                      <button type="button" onClick={addAllDocPresets} style={{ background: '#0d9488', color: 'white', border: 'none', borderRadius: 6, padding: '4px 12px', fontSize: 12, cursor: 'pointer' }}>
                        إضافة الكل
                      </button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {PRESET_DOCUMENTS.map((preset, i) => {
                        const exists = (form.requiredDocuments || []).some(d => d.key === preset.key);
                        return (
                          <button
                            type="button"
                            key={i}
                            onClick={() => !exists && addDocFromPreset(preset)}
                            disabled={exists}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
                              border: '1px solid #e2e8f0', borderRadius: 8, background: exists ? '#f1f5f9' : 'white',
                              cursor: exists ? 'default' : 'pointer', opacity: exists ? 0.5 : 1,
                              fontSize: 13, textAlign: 'right'
                            }}
                          >
                            <span>{preset.label}</span>
                            {exists && <span style={{ fontSize: 11, color: '#94a3b8' }}>✓ مضاف</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {(form.requiredDocuments || []).length === 0 ? (
                  <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, padding: 20 }}>
                    لا توجد مستندات — اختر من القوالب الجاهزة أو أضف مستنداً مخصصاً
                  </p>
                ) : (
                  (form.requiredDocuments || []).map((doc, i) => (
                    <div key={i} style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 14, marginBottom: 12, background: '#fafbfc' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                          <input
                            type="checkbox"
                            checked={doc.isRequired !== false}
                            onChange={e => updateRequiredDocument(i, 'isRequired', e.target.checked)}
                          />
                          <span>{doc.isRequired !== false ? 'مطلوب' : 'اختياري'}</span>
                        </label>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <select
                            value={doc.acceptedTypes || 'both'}
                            onChange={e => updateRequiredDocument(i, 'acceptedTypes', e.target.value)}
                            style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 12 }}
                          >
                            <option value="both">صور + PDF</option>
                            <option value="image">صور فقط</option>
                            <option value="pdf">PDF فقط</option>
                          </select>
                          <button type="button" onClick={() => removeRequiredDocument(i)} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer' }}>
                            حذف
                          </button>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 4 }}>المعرّف (key)</label>
                          <input
                            type="text"
                            value={doc.key || ''}
                            onChange={e => updateRequiredDocument(i, 'key', e.target.value.replace(/\s/g, '_').toLowerCase())}
                            placeholder="passport_image"
                            dir="ltr"
                            disabled={PRESET_DOCUMENTS.some(p => p.key === doc.key)}
                            style={{ width: '100%', padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 13 }}
                          />
                        </div>
                        <div style={{ flex: 2 }}>
                          <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 4 }}>اسم المستند</label>
                          <input
                            type="text"
                            value={doc.label || ''}
                            onChange={e => updateRequiredDocument(i, 'label', e.target.value)}
                            placeholder="مثال: صورة جواز السفر"
                            style={{ width: '100%', padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 13 }}
                          />
                        </div>
                      </div>
                      <div>
                        <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 4 }}>تعليمات للعميل</label>
                        <textarea
                          value={doc.instructions || ''}
                          onChange={e => updateRequiredDocument(i, 'instructions', e.target.value)}
                          placeholder="مثال: صورة شخصية مكشوفة الرأس، خلفية بيضاء..."
                          rows={2}
                          style={{ width: '100%', padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 13, resize: 'vertical' }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}

        {/* ========== تاب الأرشفة (SEO) ========== */}
        {activeSection === 'seo' && (
          <>
            <div className="wm-card">
              <div className="wm-section-header">
                <h4>🔍 تحسين الأرشفة (SEO)</h4>
                <button className="wm-btn-add" onClick={autoGenerateSEO}>🤖 توليد تلقائي</button>
              </div>
              <p className="wm-section-desc">هذه البيانات تساعد في ظهور التأشيرة في نتائج البحث. اضغط "توليد تلقائي" لملئها من المحتوى.</p>

              <div className="wm-form-group">
                <label>عنوان الصفحة (Meta Title)</label>
                <input
                  type="text"
                  value={form.metaTitle || ''}
                  onChange={e => setForm(prev => ({ ...prev, metaTitle: e.target.value }))}
                  placeholder="سيظهر في نتائج البحث — مثال: التأشيرة الفرنسية - ألوان المسافر"
                  maxLength={70}
                />
                <small style={{ color: '#94a3b8' }}>{(form.metaTitle || '').length}/70 حرف</small>
              </div>

              <div className="wm-form-group">
                <label>وصف الصفحة (Meta Description)</label>
                <textarea
                  value={form.metaDescription || ''}
                  onChange={e => setForm(prev => ({ ...prev, metaDescription: e.target.value }))}
                  placeholder="وصف مختصر يظهر أسفل العنوان في نتائج البحث..."
                  rows={3}
                  maxLength={160}
                />
                <small style={{ color: '#94a3b8' }}>{(form.metaDescription || '').length}/160 حرف</small>
              </div>

              <div className="wm-form-group">
                <div className="wm-section-header" style={{ marginBottom: 8 }}>
                  <label>الكلمات المفتاحية</label>
                  <button className="wm-btn-add" onClick={autoGenerateKeywords} style={{ fontSize: 12 }}>🤖 توليد تلقائي</button>
                </div>

                <div className="vc-keywords-input">
                  <input
                    type="text"
                    value={keywordInput}
                    onChange={e => setKeywordInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addKeyword(); } }}
                    placeholder="اكتب كلمة واضغط Enter"
                  />
                  <button type="button" onClick={addKeyword}>+</button>
                </div>

                <div className="vc-keywords-list">
                  {(form.keywords || []).map((kw, i) => (
                    <span className="vc-keyword-tag" key={i}>
                      {kw}
                      <button onClick={() => removeKeyword(i)}>×</button>
                    </span>
                  ))}
                  {(!form.keywords || form.keywords.length === 0) && (
                    <span style={{ color: '#94a3b8', fontSize: 13 }}>لا توجد كلمات مفتاحية — اضغط "توليد تلقائي" أو أضف يدوياً</span>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* أزرار الحفظ */}
        <div className="vc-form-actions">
          <button className="wm-save-btn" onClick={handleSave} disabled={saving}>
            {saving ? 'جاري الحفظ...' : editingVisa ? '💾 تحديث التأشيرة' : '💾 إنشاء التأشيرة'}
          </button>
          <button className="vc-btn-cancel" onClick={handleCancel}>إلغاء</button>
        </div>
      </div>
    </div>
  );
};

export default VisaCatalogTab;
