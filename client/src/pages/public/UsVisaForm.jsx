import { getIconSvg } from '../../utils/icons';
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import clientApi from '../../api/clientApi';
import './UsVisaForm.css';

const STEPS = [
  { id: 1,  title: 'صورة الجواز وبياناته' },
  { id: 2,  title: 'البيانات الشخصية' },
  { id: 3,  title: 'معلومات الاتصال' },
  { id: 4,  title: 'السفر والإقامة' },
  { id: 5,  title: 'السفر السابق لأمريكا' },
  { id: 6,  title: 'العائلة والزوج/ة' },
  { id: 7,  title: 'العمل والتعليم' },
  { id: 8,  title: 'السفر والخدمة العسكرية' },
  { id: 9,  title: 'المقابلة والتواصل' },
  { id: 10, title: 'الصورة الشخصية' },
  { id: 11, title: 'المراجعة والإقرار' },
];

const MARITAL_OPTIONS = [
  { value: 'single', label: 'أعزب/عزباء' },
  { value: 'married', label: 'متزوج/ة' },
  { value: 'divorced', label: 'مطلق/ة' },
  { value: 'widowed', label: 'أرمل/ة' }
];

const PURPOSE_OPTIONS = [
  { value: 'tourism', label: 'سياحة' },
  { value: 'study', label: 'دراسة' },
  { value: 'medical', label: 'علاج' },
  { value: 'official', label: 'مهمة رسمية' },
  { value: 'other', label: 'غير ذلك' }
];

const VISA_TYPE_OPTIONS = [
  { value: 'tourism', label: 'سياحية' },
  { value: 'medical', label: 'علاج' },
  { value: 'study', label: 'دراسة' }
];

const INTERVIEW_LANG_OPTIONS = [
  { value: 'arabic', label: 'العربية' },
  { value: 'english', label: 'الإنجليزية' },
  { value: 'french', label: 'الفرنسية' },
  { value: 'other', label: 'أخرى' }
];

const STAY_DURATION_TYPES = [
  { value: 'days', label: 'يوم' },
  { value: 'weeks', label: 'أسبوع' },
  { value: 'months', label: 'شهر' }
];

const US_STATES = [
  { value: 'AL', label: 'Alabama' }, { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' }, { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' }, { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' }, { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' }, { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' }, { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' }, { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' }, { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' }, { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' }, { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' }, { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' }, { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' }, { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' }, { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' }, { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' }, { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' }, { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' }, { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' }, { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' }, { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' }, { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' }, { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' }, { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' }, { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' }, { value: 'WY', label: 'Wyoming' },
  { value: 'DC', label: 'Washington, D.C.' }
];

const UsVisaForm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { id: urlAppId } = useParams();
  const fileInputRef = useRef(null);
  const photoInputRef = useRef(null);
  const initRef = useRef(false);

  const [currentStep, setCurrentStep] = useState(1);
  const [applicationId, setApplicationId] = useState(null);
  const [applicationNumber, setApplicationNumber] = useState('');
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState({ type: '', text: '' });
  const [passportPreview, setPassportPreview] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [ocrProcessing, setOcrProcessing] = useState(false);
  const [ocrDone, setOcrDone] = useState(false);

  const [formData, setFormData] = useState({
    visaType: searchParams.get('type') || 'tourism',
    passportImage: '',
    personalInfo: {
      fullName: '', maritalStatus: '', birthCity: '', dateOfBirth: '',
      country: '', nationality: '', nationalId: '',
      hasOtherNationality: false, otherNationalityDetails: '',
      hasResidencyOtherCountry: false, residencyDetails: ''
    },
    passportDetails: {
      passportLost: false, passportNumber: '', passportIssuePlace: '',
      passportIssueDate: '', passportExpiryDate: ''
    },
    contactInfo: {
      streetAddress: '', districtCity: '', email: '',
      workPhone: '', mobilePhone: '', previousPhonesEmails: '',
      emails: [''], phones: ['']
    },
    travelInfo: {
      expectedArrivalDate: '', travelPurpose: 'tourism',
      stayDuration: '', stayDurationNumber: '', stayDurationType: 'days',
      usAddress: '', usStreetAddress: '', usCity: '', usState: ''
    },
    financialInfo: {
      selfPaying: true, sponsorName: '', sponsorAddress: '', sponsorRelationship: '',
      sponsorPhone: '', sponsorEmail: ''
    },
    hostInfo: {
      hostName: '', hostAddress: '', hostPhone: '', hostEmail: ''
    },
    travelCompanions: {
      hasCompanions: null, companions: []
    },
    previousUSTravel: {
      beenToUS: null, lastUSArrival: '', previousVisaType: '', lastVisaIssueDate: '',
      visaNumber: '', sameVisaType: null, fingerprinted: null,
      visaLostStolen: null, visaCancelled: null,
      usDriversLicense: null, licenseNumberState: '', visaRefused: null
    },
    familyInfo: {
      fatherFullName: '', fatherFirstName: '', fatherLastName: '',
      fatherDOB: '',
      motherFullName: '', motherFirstName: '', motherLastName: '',
      motherDOB: '',
      hasImmediateRelativesUS: null, hasAnyRelativesUS: null,
      relativeName: '', relativeAddress: '', relativePhone: '', relativeRelationship: ''
    },
    spouseInfo: {
      spouseGender: '', spouseFullName: '', spouseDOB: '',
      spouseNationality: '', spouseBirthPlace: '', spouseAddress: ''
    },
    employmentInfo: {
      isEmployed: null,
      currentJobTitle: '', currentEmployer: '', employerAddress: '',
      monthlySalary: '', jobDescription: '', currentJobStartDate: '',
      hasPreviousJob: null, prevEmployerName: '', prevEmployerAddress: '',
      prevJobStartDate: '', prevJobEndDate: '', prevJobTitle: '', prevManagerName: ''
    },
    educationInfo: {
      hasEducation: null,
      universityName: '', universityCity: '', universityAddress: '',
      major: '', studyStartDate: '', graduationDate: ''
    },
    travelHistoryMilitary: {
      countriesVisited5Years: '', visitedCountries: [],
      militaryService: null,
      militaryRank: '', militarySpecialty: '', militaryStartDate: '', militaryEndDate: ''
    },
    studentAdditionalInfo: { references: [] },
    interviewSocialMedia: {
      interviewLanguage: '', socialFacebook: '', socialInstagram: '',
      socialTwitter: '', socialLinkedin: '', socialWhatsapp: '', socialOther: ''
    },
    personalPhoto: '',
    declaration: {
      declarationAccepted: false, declarantName: '', signature: '', declarationDate: ''
    }
  });

  // === Lifecycle ===
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    if (urlAppId) {
      // استئناف طلب موجود من الداشبورد
      loadExistingApplication(urlAppId);
    } else {
      // إنشاء طلب جديد
      createNewApplication();
    }
  }, []);

  const loadExistingApplication = async (id) => {
    try {
      const res = await clientApi.getApplication(id);
      if (res.success) {
        const app = res.data.application;
        setApplicationId(app._id);
        setCurrentStep(app.currentStep || 1);

        // تحميل البيانات المحفوظة
        const loaded = {};
        const fields = [
          'visaType', 'passportImage', 'personalInfo', 'passportDetails',
          'contactInfo', 'travelInfo', 'financialInfo', 'hostInfo',
          'travelCompanions', 'previousUSTravel', 'familyInfo', 'spouseInfo',
          'employmentInfo', 'educationInfo', 'travelHistoryMilitary',
          'studentAdditionalInfo', 'interviewSocialMedia', 'personalPhoto', 'declaration'
        ];
        fields.forEach(field => {
          if (app[field] !== undefined && app[field] !== null) {
            loaded[field] = app[field];
          }
        });

        setFormData(prev => {
          const merged = { ...prev };
          Object.entries(loaded).forEach(([key, value]) => {
            if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
              merged[key] = { ...prev[key], ...value };
            } else {
              merged[key] = value;
            }
          });
          return merged;
        });

        // تعيين معاينة الصور لو موجودة
        if (app.passportImage) setPassportPreview(app.passportImage);
        if (app.personalPhoto) setPhotoPreview(app.personalPhoto);
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'حدث خطأ في تحميل الطلب' });
      navigate('/portal/dashboard');
    }
  };

  const createNewApplication = async () => {
    try {
      const res = await clientApi.createApplication({ visaType: formData.visaType });
      if (res.success) setApplicationId(res.data.application._id);
    } catch (err) {
      setMessage({ type: 'error', text: 'حدث خطأ في إنشاء الطلب' });
    }
  };

  // === Auto-save ===
  const autoSave = async () => {
    if (!applicationId) return;
    try {
      setSaving(true);
      await clientApi.updateApplication(applicationId, { ...formData, currentStep });
    } catch (err) { /* silent */ }
    finally { setSaving(false); }
  };

  // === Field helpers ===
  const updateField = (section, field, value) => {
    setFormData(prev => ({ ...prev, [section]: { ...prev[section], [field]: value } }));
    if (errors[`${section}.${field}`]) {
      setErrors(prev => { const u = { ...prev }; delete u[`${section}.${field}`]; return u; });
    }
  };

  const updateSimpleField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // === Companion helpers ===
  const addCompanion = () => {
    if (formData.travelCompanions.companions.length >= 4) return;
    setFormData(prev => ({
      ...prev,
      travelCompanions: {
        ...prev.travelCompanions,
        companions: [...prev.travelCompanions.companions, { companionName: '', companionRelationship: '' }]
      }
    }));
  };

  const removeCompanion = (index) => {
    setFormData(prev => ({
      ...prev,
      travelCompanions: {
        ...prev.travelCompanions,
        companions: prev.travelCompanions.companions.filter((_, i) => i !== index)
      }
    }));
  };

  const updateCompanion = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      travelCompanions: {
        ...prev.travelCompanions,
        companions: prev.travelCompanions.companions.map((c, i) => i === index ? { ...c, [field]: value } : c)
      }
    }));
  };

  // === Reference helpers ===
  const addReference = () => {
    if (formData.studentAdditionalInfo.references.length >= 2) return;
    setFormData(prev => ({
      ...prev,
      studentAdditionalInfo: {
        ...prev.studentAdditionalInfo,
        references: [...prev.studentAdditionalInfo.references, { refName: '', refAddress: '', refPhone: '' }]
      }
    }));
  };

  const removeReference = (index) => {
    setFormData(prev => ({
      ...prev,
      studentAdditionalInfo: {
        ...prev.studentAdditionalInfo,
        references: prev.studentAdditionalInfo.references.filter((_, i) => i !== index)
      }
    }));
  };

  const updateReference = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      studentAdditionalInfo: {
        ...prev.studentAdditionalInfo,
        references: prev.studentAdditionalInfo.references.map((r, i) => i === index ? { ...r, [field]: value } : r)
      }
    }));
  };

  // === Email helpers ===
  const addEmail = () => {
    setFormData(prev => ({
      ...prev,
      contactInfo: { ...prev.contactInfo, emails: [...prev.contactInfo.emails, ''] }
    }));
  };
  const removeEmail = (index) => {
    if (index === 0) return;
    setFormData(prev => ({
      ...prev,
      contactInfo: { ...prev.contactInfo, emails: prev.contactInfo.emails.filter((_, i) => i !== index) }
    }));
  };
  const updateEmail = (index, value) => {
    setFormData(prev => ({
      ...prev,
      contactInfo: { ...prev.contactInfo, emails: prev.contactInfo.emails.map((e, i) => i === index ? value : e) }
    }));
  };

  // === Phone helpers ===
  const addPhone = () => {
    setFormData(prev => ({
      ...prev,
      contactInfo: { ...prev.contactInfo, phones: [...prev.contactInfo.phones, ''] }
    }));
  };
  const removePhone = (index) => {
    if (index === 0) return;
    setFormData(prev => ({
      ...prev,
      contactInfo: { ...prev.contactInfo, phones: prev.contactInfo.phones.filter((_, i) => i !== index) }
    }));
  };
  const updatePhone = (index, value) => {
    setFormData(prev => ({
      ...prev,
      contactInfo: { ...prev.contactInfo, phones: prev.contactInfo.phones.map((p, i) => i === index ? value : p) }
    }));
  };

  // === Visited country helpers ===
  const addVisitedCountry = () => {
    setFormData(prev => ({
      ...prev,
      travelHistoryMilitary: {
        ...prev.travelHistoryMilitary,
        visitedCountries: [...prev.travelHistoryMilitary.visitedCountries, '']
      }
    }));
  };
  const removeVisitedCountry = (index) => {
    setFormData(prev => ({
      ...prev,
      travelHistoryMilitary: {
        ...prev.travelHistoryMilitary,
        visitedCountries: prev.travelHistoryMilitary.visitedCountries.filter((_, i) => i !== index)
      }
    }));
  };
  const updateVisitedCountry = (index, value) => {
    setFormData(prev => ({
      ...prev,
      travelHistoryMilitary: {
        ...prev.travelHistoryMilitary,
        visitedCountries: prev.travelHistoryMilitary.visitedCountries.map((c, i) => i === index ? value : c)
      }
    }));
  };

  // === Validation ===
  const validateStep = (step) => {
    const newErrors = {};
    const today = new Date().toISOString().slice(0, 10);

    if (step === 1) {
      if (!formData.passportDetails.passportNumber) newErrors['passportDetails.passportNumber'] = 'رقم الجواز مطلوب';
      if (!formData.passportDetails.passportIssueDate) newErrors['passportDetails.passportIssueDate'] = 'تاريخ الإصدار مطلوب';
      if (!formData.passportDetails.passportExpiryDate) {
        newErrors['passportDetails.passportExpiryDate'] = 'تاريخ الانتهاء مطلوب';
      } else if (formData.passportDetails.passportExpiryDate < today) {
        newErrors['passportDetails.passportExpiryDate'] = 'جواز السفر منتهي الصلاحية';
      }
      if (formData.passportDetails.passportIssueDate && formData.passportDetails.passportExpiryDate &&
          formData.passportDetails.passportIssueDate >= formData.passportDetails.passportExpiryDate) {
        newErrors['passportDetails.passportIssueDate'] = 'تاريخ الإصدار يجب أن يكون قبل تاريخ الانتهاء';
      }
    }

    if (step === 2) {
      if (!formData.personalInfo.fullName) newErrors['personalInfo.fullName'] = 'الاسم مطلوب';
      if (!formData.personalInfo.maritalStatus) newErrors['personalInfo.maritalStatus'] = 'الحالة الاجتماعية مطلوبة';
      if (!formData.personalInfo.dateOfBirth) {
        newErrors['personalInfo.dateOfBirth'] = 'تاريخ الميلاد مطلوب';
      } else if (formData.personalInfo.dateOfBirth > today) {
        newErrors['personalInfo.dateOfBirth'] = 'تاريخ الميلاد لا يمكن أن يكون في المستقبل';
      }
      if (!formData.personalInfo.nationality) newErrors['personalInfo.nationality'] = 'الجنسية مطلوبة';
      if (!formData.personalInfo.nationalId) newErrors['personalInfo.nationalId'] = 'رقم الهوية مطلوب';
    }

    if (step === 3) {
      const primaryEmail = formData.contactInfo.emails[0];
      const primaryPhone = formData.contactInfo.phones[0];
      if (!primaryPhone) {
        newErrors['contactInfo.phones'] = 'رقم الجوال مطلوب';
      } else if (!/^[\d+\s()-]{7,15}$/.test(primaryPhone)) {
        newErrors['contactInfo.phones'] = 'صيغة رقم الجوال غير صحيحة';
      }
      if (!primaryEmail) {
        newErrors['contactInfo.emails'] = 'البريد الإلكتروني مطلوب';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(primaryEmail)) {
        newErrors['contactInfo.emails'] = 'صيغة البريد الإلكتروني غير صحيحة';
      }
    }

    if (step === 4) {
      if (!formData.travelInfo.expectedArrivalDate) {
        newErrors['travelInfo.expectedArrivalDate'] = 'تاريخ الوصول مطلوب';
      } else if (formData.travelInfo.expectedArrivalDate < today) {
        newErrors['travelInfo.expectedArrivalDate'] = 'تاريخ الوصول يجب أن يكون في المستقبل';
      }
      if (!formData.travelInfo.stayDurationNumber) newErrors['travelInfo.stayDurationNumber'] = 'فترة الإقامة مطلوبة';
      if (formData.travelCompanions.hasCompanions === null) {
        newErrors['travelCompanions.hasCompanions'] = 'يرجى الإجابة';
      }
      if (formData.travelCompanions.hasCompanions === true && formData.travelCompanions.companions.length === 0) {
        newErrors['travelCompanions.companions'] = 'أضف مرافق واحد على الأقل';
      }
    }

    if (step === 5) {
      if (formData.previousUSTravel.beenToUS === null) {
        newErrors['previousUSTravel.beenToUS'] = 'يرجى الإجابة';
      }
    }

    if (step === 6) {
      if (!formData.familyInfo.fatherFirstName) newErrors['familyInfo.fatherFirstName'] = 'الاسم الأول للأب مطلوب';
      if (!formData.familyInfo.fatherLastName) newErrors['familyInfo.fatherLastName'] = 'لقب الأب مطلوب';
      if (!formData.familyInfo.motherFirstName) newErrors['familyInfo.motherFirstName'] = 'الاسم الأول للأم مطلوب';
      if (!formData.familyInfo.motherLastName) newErrors['familyInfo.motherLastName'] = 'لقب الأم مطلوب';
      if (formData.personalInfo.maritalStatus === 'married') {
        if (!formData.spouseInfo.spouseFullName) newErrors['spouseInfo.spouseFullName'] = 'اسم الزوج/ة مطلوب';
        if (!formData.spouseInfo.spouseDOB) newErrors['spouseInfo.spouseDOB'] = 'تاريخ ميلاد الزوج/ة مطلوب';
        if (!formData.spouseInfo.spouseNationality) newErrors['spouseInfo.spouseNationality'] = 'جنسية الزوج/ة مطلوبة';
      }
    }

    if (step === 7) {
      if (formData.employmentInfo.isEmployed === true) {
        if (!formData.employmentInfo.currentJobTitle) newErrors['employmentInfo.currentJobTitle'] = 'المسمى الوظيفي مطلوب';
        if (!formData.employmentInfo.currentEmployer) newErrors['employmentInfo.currentEmployer'] = 'جهة العمل مطلوبة';
        if (!formData.employmentInfo.employerAddress) newErrors['employmentInfo.employerAddress'] = 'عنوان جهة العمل مطلوب';
        if (!formData.employmentInfo.monthlySalary) newErrors['employmentInfo.monthlySalary'] = 'الراتب الشهري مطلوب';
        if (!formData.employmentInfo.jobDescription) newErrors['employmentInfo.jobDescription'] = 'وصف العمل مطلوب';
        if (!formData.employmentInfo.currentJobStartDate) newErrors['employmentInfo.currentJobStartDate'] = 'تاريخ بدء العمل مطلوب';
      }
    }

    // Step 8: Travel History + Military — all optional now except militaryService toggle
    if (step === 8) {
      if (formData.travelHistoryMilitary.militaryService === null) newErrors['travelHistoryMilitary.militaryService'] = 'يرجى الإجابة';
    }

    if (step === 9) {
      if (!formData.interviewSocialMedia.interviewLanguage) newErrors['interviewSocialMedia.interviewLanguage'] = 'لغة المقابلة مطلوبة';
    }

    // Step 10: Photo — optional on step level
    // Step 11: Review + Declaration
    if (step === 11) {
      if (!formData.declaration.declarationAccepted) newErrors['declaration.declarationAccepted'] = 'يجب الموافقة على الإقرار';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // === Navigation ===
  const goNext = async () => {
    if (saving) return;
    if (!validateStep(currentStep)) return;
    await autoSave();
    setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
    window.scrollTo(0, 0);
  };

  const goPrev = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    window.scrollTo(0, 0);
  };

  // === Uploads ===
  const handlePassportUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type === 'application/pdf') {
      setPassportPreview('pdf');
    } else {
      const reader = new FileReader();
      reader.onload = (ev) => setPassportPreview(ev.target.result);
      reader.readAsDataURL(file);
    }
    try {
      setUploading(true);
      setOcrDone(false);
      const fd = new FormData();
      fd.append('passport', file);
      const res = await clientApi.uploadPassport(fd);
      if (res.success) {
        updateSimpleField('passportImage', res.data.path);
        setMessage({ type: 'success', text: 'تم رفع صورة الجواز بنجاح' });
        setTimeout(() => setMessage({ type: '', text: '' }), 2000);

        // === OCR: قراءة بيانات الجواز تلقائياً ===
        try {
          setOcrProcessing(true);
          setMessage({ type: 'info', text: '🔍 جاري قراءة بيانات الجواز تلقائياً...' });
          const ocrFd = new FormData();
          ocrFd.append('passport', file);
          const ocrRes = await clientApi.ocrPassport(ocrFd);
          if (ocrRes.success && ocrRes.data) {
            const { personalInfo: pi, passportDetails: pd } = ocrRes.data;
            // تعبئة بيانات الجواز
            if (pd.passportNumber) updateField('passportDetails', 'passportNumber', pd.passportNumber);
            if (pd.passportIssueDate) updateField('passportDetails', 'passportIssueDate', pd.passportIssueDate);
            if (pd.passportExpiryDate) updateField('passportDetails', 'passportExpiryDate', pd.passportExpiryDate);
            if (pd.passportIssuePlace) updateField('passportDetails', 'passportIssuePlace', pd.passportIssuePlace);
            // تعبئة البيانات الشخصية
            if (pi.fullName) updateField('personalInfo', 'fullName', pi.fullName);
            if (pi.dateOfBirth) updateField('personalInfo', 'dateOfBirth', pi.dateOfBirth);
            if (pi.nationality) updateField('personalInfo', 'nationality', pi.nationality);
            if (pi.gender) updateField('personalInfo', 'maritalStatus', formData.personalInfo.maritalStatus); // لا نغير الحالة الاجتماعية
            if (pi.birthPlace) updateField('personalInfo', 'birthCity', pi.birthPlace);
            if (pi.countryCode) updateField('personalInfo', 'country', pi.countryCode);
            setOcrDone(true);
            setMessage({ type: 'success', text: '✅ تم قراءة بيانات الجواز وتعبئتها تلقائياً! راجع البيانات للتأكد' });
            setTimeout(() => setMessage({ type: '', text: '' }), 5000);
          }
        } catch (ocrErr) {
          // OCR فشل — مقبول، المستخدم يدخل يدوياً
          console.log('OCR unavailable:', ocrErr.response?.data?.message || ocrErr.message);
          setMessage({ type: 'success', text: 'تم رفع صورة الجواز. أدخل بيانات الجواز يدوياً' });
          setTimeout(() => setMessage({ type: '', text: '' }), 4000);
        } finally {
          setOcrProcessing(false);
        }
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'حدث خطأ في رفع الصورة' });
    } finally { setUploading(false); }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target.result);
    reader.readAsDataURL(file);
    try {
      setUploading(true);
      const fd = new FormData();
      fd.append('photo', file);
      const res = await clientApi.uploadPersonalPhoto(fd);
      if (res.success) {
        updateSimpleField('personalPhoto', res.data.path);
        setMessage({ type: 'success', text: 'تم رفع الصورة الشخصية بنجاح' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'حدث خطأ في رفع الصورة' });
    } finally { setUploading(false); }
  };

  // === Submit ===
  const handleSubmit = async () => {
    if (!applicationId || submitting) return;
    try {
      setSubmitting(true);
      await autoSave();
      const res = await clientApi.submitApplication(applicationId);
      if (res.success) {
        setApplicationNumber(res.data.application.applicationNumber);
        setSubmitted(true);
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'حدث خطأ في تقديم الطلب' });
    } finally { setSubmitting(false); }
  };

  // === Label helpers ===
  const getMaritalLabel = (val) => MARITAL_OPTIONS.find(o => o.value === val)?.label || val;
  const getPurposeLabel = (val) => PURPOSE_OPTIONS.find(o => o.value === val)?.label || val;
  const getVisaTypeLabel = (val) => VISA_TYPE_OPTIONS.find(o => o.value === val)?.label || val;
  const getStateLabel = (val) => US_STATES.find(s => s.value === val)?.label || val;
  const getDurationTypeLabel = (val) => STAY_DURATION_TYPES.find(t => t.value === val)?.label || val;

  // === Reusable toggle renderer ===
  const renderToggle = (section, field, value) => (
    <div className="vf-toggle-group">
      <label className={`vf-toggle ${value === true ? 'active' : ''}`}>
        <input type="radio" checked={value === true} onChange={() => updateField(section, field, true)} />
        <span>نعم</span>
      </label>
      <label className={`vf-toggle ${value === false ? 'active' : ''}`}>
        <input type="radio" checked={value === false} onChange={() => updateField(section, field, false)} />
        <span>لا</span>
      </label>
    </div>
  );

  // ===================== RENDER STEPS =====================

  // إضافة فرد عائلة — نسخ بيانات مشتركة من الطلب الحالي
  const handleAddFamilyMember = async () => {
    try {
      setSubmitting(true);
      const res = await clientApi.createApplication({ copyFrom: applicationId });
      if (res.success) {
        navigate(`/portal/apply/${res.data.application._id}`);
        window.location.reload();
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'حدث خطأ' });
    } finally { setSubmitting(false); }
  };

  if (submitted) {
    return (
      <div className="vf-page" dir="rtl">
        <div className="vf-success-container">
          <div className="vf-success-icon">&#10003;</div>
          <h2>تم تقديم طلبك بنجاح!</h2>
          <p className="vf-success-app-num">رقم الطلب: <strong>{applicationNumber || applicationId}</strong></p>
          <p>سيتم مراجعة طلبك والتواصل معك قريبا</p>
          <div className="vf-success-actions">
            <button className="vf-btn-primary" onClick={() => navigate('/portal/dashboard')}>لوحة التحكم</button>
            <button className="vf-btn-secondary vf-btn-family" onClick={handleAddFamilyMember} disabled={submitting}>
              👨‍👩‍👧 أضف فرد عائلة
            </button>
          </div>
          <p className="vf-success-family-hint">
            البيانات المشتركة (العنوان، الوالدين، السفر) تتعبأ تلقائي
          </p>
        </div>
      </div>
    );
  }

  // Step 1: Passport Image + Passport Details
  const renderStep1 = () => (
    <div className="vf-step-content">
      <div className="vf-step-header">
        <h2>صورة الجواز وبياناته</h2>
        <p>ارفع صورة واضحة لصفحة بيانات الجواز وأدخل بيانات الجواز</p>
      </div>
      <div className="vf-form-group">
        <label>نوع التأشيرة</label>
        <div className="vf-radio-group">
          {VISA_TYPE_OPTIONS.map(opt => (
            <label key={opt.value} className={`vf-radio-card ${formData.visaType === opt.value ? 'active' : ''}`}>
              <input type="radio" name="visaType" value={opt.value} checked={formData.visaType === opt.value}
                onChange={() => updateSimpleField('visaType', opt.value)} />
              <span>{opt.label}</span>
            </label>
          ))}
        </div>
      </div>
      <div className="vf-upload-area" onClick={() => fileInputRef.current?.click()}>
        {passportPreview === 'pdf' ? (
          <div className="vf-upload-preview" style={{ flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '3rem' }}>&#128196;</span>
            <span>تم رفع ملف PDF</span>
            <span className="vf-upload-change">تغيير الملف</span>
          </div>
        ) : passportPreview || formData.passportImage ? (
          <div className="vf-upload-preview">
            <img src={passportPreview || formData.passportImage} alt="جواز السفر" />
            <span className="vf-upload-change">تغيير الصورة</span>
          </div>
        ) : (
          <div className="vf-upload-placeholder">
            <span className="vf-upload-icon">&#128247;</span>
            <span className="vf-upload-text">اضغط لرفع صورة الجواز</span>
            <span className="vf-upload-hint">JPG, PNG, PDF - حد أقصى 10MB</span>
          </div>
        )}
        {uploading && <div className="vf-upload-loading">جاري الرفع...</div>}
        {ocrProcessing && <div className="vf-upload-loading vf-ocr-loading">{getIconSvg('🔍', 16)} جاري قراءة البيانات تلقائياً...</div>}
        <input ref={fileInputRef} type="file" accept="image/*,.pdf" onChange={handlePassportUpload} style={{ display: 'none' }} />
      </div>

      {ocrDone && (
        <div className="vf-ocr-success-banner">
          <span>{getIconSvg('✅', 16)}</span> تم تعبئة البيانات تلقائياً من الجواز — يرجى مراجعتها والتأكد من صحتها
        </div>
      )}

      <div className="vf-section-title" style={{ marginTop: 24 }}>بيانات جواز السفر</div>
      <div className="vf-form-group">
        <label>هل سبق فقدت جواز سفرك؟</label>
        {renderToggle('passportDetails', 'passportLost', formData.passportDetails.passportLost)}
      </div>
      <div className="vf-form-row">
        <div className="vf-form-group">
          <label>رقم الجواز <span className="vf-required">*</span></label>
          <input type="text" value={formData.passportDetails.passportNumber}
            onChange={e => updateField('passportDetails', 'passportNumber', e.target.value)} placeholder="رقم الجواز"
            className={errors['passportDetails.passportNumber'] ? 'vf-error' : ''} />
          {errors['passportDetails.passportNumber'] && <span className="vf-error-text">{errors['passportDetails.passportNumber']}</span>}
        </div>
        <div className="vf-form-group">
          <label>مكان الإصدار</label>
          <input type="text" value={formData.passportDetails.passportIssuePlace}
            onChange={e => updateField('passportDetails', 'passportIssuePlace', e.target.value)} placeholder="مكان إصدار الجواز" />
        </div>
      </div>
      <div className="vf-form-row">
        <div className="vf-form-group">
          <label>تاريخ الإصدار <span className="vf-required">*</span></label>
          <input type="date" value={formData.passportDetails.passportIssueDate}
            onChange={e => updateField('passportDetails', 'passportIssueDate', e.target.value)}
            className={errors['passportDetails.passportIssueDate'] ? 'vf-error' : ''} />
          {errors['passportDetails.passportIssueDate'] && <span className="vf-error-text">{errors['passportDetails.passportIssueDate']}</span>}
        </div>
        <div className="vf-form-group">
          <label>تاريخ الانتهاء <span className="vf-required">*</span></label>
          <input type="date" value={formData.passportDetails.passportExpiryDate}
            onChange={e => updateField('passportDetails', 'passportExpiryDate', e.target.value)}
            className={errors['passportDetails.passportExpiryDate'] ? 'vf-error' : ''} />
          {errors['passportDetails.passportExpiryDate'] && <span className="vf-error-text">{errors['passportDetails.passportExpiryDate']}</span>}
        </div>
      </div>
      <div className="vf-info-box">
        <strong>تعليمات:</strong>
        <ul>
          <li>ارفع صورة واضحة لصفحة البيانات في الجواز أو ملف PDF</li>
          <li>تأكد من وضوح جميع البيانات والصورة الشخصية</li>
          <li>يمكنك المتابعة بدون رفع الصورة وإضافتها لاحقا</li>
        </ul>
      </div>
    </div>
  );

  // Step 2: Personal Info (unchanged)
  const renderStep2 = () => (
    <div className="vf-step-content">
      <div className="vf-step-header">
        <h2>البيانات الشخصية</h2>
        <p>أدخل بياناتك الشخصية كما هي في الجواز</p>
      </div>
      <div className="vf-form-group">
        <label>الاسم الرباعي حسب الجواز <span className="vf-required">*</span></label>
        <input type="text" value={formData.personalInfo.fullName}
          onChange={e => updateField('personalInfo', 'fullName', e.target.value)}
          placeholder="الاسم كما هو مكتوب في الجواز"
          className={errors['personalInfo.fullName'] ? 'vf-error' : ''} />
        {errors['personalInfo.fullName'] && <span className="vf-error-text">{errors['personalInfo.fullName']}</span>}
      </div>
      <div className="vf-form-row">
        <div className="vf-form-group">
          <label>الحالة الاجتماعية <span className="vf-required">*</span></label>
          <select value={formData.personalInfo.maritalStatus}
            onChange={e => updateField('personalInfo', 'maritalStatus', e.target.value)}
            className={errors['personalInfo.maritalStatus'] ? 'vf-error' : ''}>
            <option value="">اختر...</option>
            {MARITAL_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
          {errors['personalInfo.maritalStatus'] && <span className="vf-error-text">{errors['personalInfo.maritalStatus']}</span>}
        </div>
        <div className="vf-form-group">
          <label>مدينة الميلاد</label>
          <input type="text" value={formData.personalInfo.birthCity}
            onChange={e => updateField('personalInfo', 'birthCity', e.target.value)} placeholder="مدينة الميلاد" />
        </div>
      </div>
      <div className="vf-form-row">
        <div className="vf-form-group">
          <label>تاريخ الميلاد <span className="vf-required">*</span></label>
          <input type="date" value={formData.personalInfo.dateOfBirth}
            onChange={e => updateField('personalInfo', 'dateOfBirth', e.target.value)}
            className={errors['personalInfo.dateOfBirth'] ? 'vf-error' : ''} />
          {errors['personalInfo.dateOfBirth'] && <span className="vf-error-text">{errors['personalInfo.dateOfBirth']}</span>}
        </div>
        <div className="vf-form-group">
          <label>الدولة</label>
          <input type="text" value={formData.personalInfo.country}
            onChange={e => updateField('personalInfo', 'country', e.target.value)} placeholder="المملكة العربية السعودية" />
        </div>
      </div>
      <div className="vf-form-row">
        <div className="vf-form-group">
          <label>الجنسية <span className="vf-required">*</span></label>
          <input type="text" value={formData.personalInfo.nationality}
            onChange={e => updateField('personalInfo', 'nationality', e.target.value)} placeholder="سعودي"
            className={errors['personalInfo.nationality'] ? 'vf-error' : ''} />
          {errors['personalInfo.nationality'] && <span className="vf-error-text">{errors['personalInfo.nationality']}</span>}
        </div>
        <div className="vf-form-group">
          <label>رقم الهوية <span className="vf-required">*</span></label>
          <input type="text" value={formData.personalInfo.nationalId}
            onChange={e => updateField('personalInfo', 'nationalId', e.target.value)} placeholder="رقم الهوية الوطنية"
            className={errors['personalInfo.nationalId'] ? 'vf-error' : ''} />
          {errors['personalInfo.nationalId'] && <span className="vf-error-text">{errors['personalInfo.nationalId']}</span>}
        </div>
      </div>
      <div className="vf-form-group">
        <label>هل لديك جنسية أخرى؟</label>
        {renderToggle('personalInfo', 'hasOtherNationality', formData.personalInfo.hasOtherNationality)}
      </div>
      {formData.personalInfo.hasOtherNationality && (
        <div className="vf-form-group vf-conditional">
          <label>تفاصيل الجنسية الأخرى</label>
          <input type="text" value={formData.personalInfo.otherNationalityDetails}
            onChange={e => updateField('personalInfo', 'otherNationalityDetails', e.target.value)} placeholder="اذكر تفاصيل الجنسية الأخرى" />
        </div>
      )}
      <div className="vf-form-group">
        <label>هل لديك إقامة في دولة أخرى؟</label>
        {renderToggle('personalInfo', 'hasResidencyOtherCountry', formData.personalInfo.hasResidencyOtherCountry)}
      </div>
      {formData.personalInfo.hasResidencyOtherCountry && (
        <div className="vf-form-group vf-conditional">
          <label>تفاصيل الإقامة</label>
          <input type="text" value={formData.personalInfo.residencyDetails}
            onChange={e => updateField('personalInfo', 'residencyDetails', e.target.value)} placeholder="اذكر تفاصيل الإقامة في الدولة الأخرى" />
        </div>
      )}
    </div>
  );

  // Step 3: Contact Info (multiple emails/phones)
  const renderStep3 = () => (
    <div className="vf-step-content">
      <div className="vf-step-header"><h2>معلومات الاتصال</h2></div>
      <div className="vf-form-row">
        <div className="vf-form-group">
          <label>عنوان السكن - اسم الشارع</label>
          <input type="text" value={formData.contactInfo.streetAddress}
            onChange={e => updateField('contactInfo', 'streetAddress', e.target.value)} placeholder="اسم الشارع" />
        </div>
        <div className="vf-form-group">
          <label>الحي - المدينة</label>
          <input type="text" value={formData.contactInfo.districtCity}
            onChange={e => updateField('contactInfo', 'districtCity', e.target.value)} placeholder="الحي - المدينة" />
        </div>
      </div>

      <div className="vf-section-title" style={{ marginTop: 24 }}>البريد الإلكتروني</div>
      {formData.contactInfo.emails.map((email, idx) => (
        <div key={idx} className="vf-form-row" style={{ alignItems: 'flex-end' }}>
          <div className="vf-form-group" style={{ flex: 1 }}>
            <label>{idx === 0 ? <>بريد إلكتروني <span className="vf-required">*</span></> : `بريد إلكتروني ${idx + 1}`}</label>
            <input type="email" value={email} onChange={e => updateEmail(idx, e.target.value)}
              placeholder="example@email.com" dir="ltr"
              className={idx === 0 && errors['contactInfo.emails'] ? 'vf-error' : ''} />
          </div>
          {idx > 0 && (
            <button type="button" className="vf-repeatable-remove" style={{ marginBottom: 8 }} onClick={() => removeEmail(idx)}>حذف</button>
          )}
        </div>
      ))}
      {errors['contactInfo.emails'] && <span className="vf-error-text">{errors['contactInfo.emails']}</span>}
      <button type="button" className="vf-add-item-btn" onClick={addEmail}>+ إضافة بريد إلكتروني</button>

      <div className="vf-section-title" style={{ marginTop: 24 }}>أرقام الهاتف</div>
      {formData.contactInfo.phones.map((phone, idx) => (
        <div key={idx} className="vf-form-row" style={{ alignItems: 'flex-end' }}>
          <div className="vf-form-group" style={{ flex: 1 }}>
            <label>{idx === 0 ? <>رقم الجوال <span className="vf-required">*</span></> : `رقم هاتف ${idx + 1}`}</label>
            <input type="tel" value={phone} onChange={e => updatePhone(idx, e.target.value)}
              placeholder="05xxxxxxxx" dir="ltr"
              className={idx === 0 && errors['contactInfo.phones'] ? 'vf-error' : ''} />
          </div>
          {idx > 0 && (
            <button type="button" className="vf-repeatable-remove" style={{ marginBottom: 8 }} onClick={() => removePhone(idx)}>حذف</button>
          )}
        </div>
      ))}
      {errors['contactInfo.phones'] && <span className="vf-error-text">{errors['contactInfo.phones']}</span>}
      <button type="button" className="vf-add-item-btn" onClick={addPhone}>+ إضافة رقم هاتف</button>

      <div className="vf-form-row" style={{ marginTop: 16 }}>
        <div className="vf-form-group">
          <label>رقم هاتف العمل</label>
          <input type="tel" value={formData.contactInfo.workPhone}
            onChange={e => updateField('contactInfo', 'workPhone', e.target.value)} placeholder="اختياري" dir="ltr" />
        </div>
      </div>
      <div className="vf-form-group">
        <label>أرقام هاتف أو بريد إلكتروني سابقة (آخر 5 سنوات)</label>
        <textarea value={formData.contactInfo.previousPhonesEmails}
          onChange={e => updateField('contactInfo', 'previousPhonesEmails', e.target.value)}
          placeholder="اختياري - أرقام هاتف أو بريد إلكتروني سابقة خلال الخمس سنوات الماضية" rows={2} />
      </div>
    </div>
  );

  // Step 4: Travel + Financial + Host + Companions (merged)
  const renderStep4 = () => (
    <div className="vf-step-content">
      <div className="vf-step-header"><h2>السفر والإقامة</h2></div>

      {/* Travel Info */}
      <div className="vf-section-title">معلومات السفر</div>
      <div className="vf-form-row">
        <div className="vf-form-group">
          <label>تاريخ الوصول المتوقع <span className="vf-required">*</span></label>
          <input type="date" value={formData.travelInfo.expectedArrivalDate}
            onChange={e => updateField('travelInfo', 'expectedArrivalDate', e.target.value)}
            className={errors['travelInfo.expectedArrivalDate'] ? 'vf-error' : ''} />
          {errors['travelInfo.expectedArrivalDate'] && <span className="vf-error-text">{errors['travelInfo.expectedArrivalDate']}</span>}
        </div>
        <div className="vf-form-group">
          <label>الغرض من السفر</label>
          <select value={formData.travelInfo.travelPurpose}
            onChange={e => updateField('travelInfo', 'travelPurpose', e.target.value)}>
            {PURPOSE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>
      </div>
      <div className="vf-form-row">
        <div className="vf-form-group">
          <label>فترة الإقامة <span className="vf-required">*</span></label>
          <input type="number" min="1" value={formData.travelInfo.stayDurationNumber}
            onChange={e => updateField('travelInfo', 'stayDurationNumber', e.target.value)}
            placeholder="مثال: 14"
            className={errors['travelInfo.stayDurationNumber'] ? 'vf-error' : ''} />
          {errors['travelInfo.stayDurationNumber'] && <span className="vf-error-text">{errors['travelInfo.stayDurationNumber']}</span>}
        </div>
        <div className="vf-form-group">
          <label>النوع</label>
          <select value={formData.travelInfo.stayDurationType}
            onChange={e => updateField('travelInfo', 'stayDurationType', e.target.value)}>
            {STAY_DURATION_TYPES.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>
      </div>

      {/* US Address */}
      <div className="vf-section-title" style={{ marginTop: 24 }}>العنوان في الولايات المتحدة (اختياري)</div>
      <div className="vf-form-group">
        <label>العنوان - الشارع</label>
        <input type="text" value={formData.travelInfo.usStreetAddress}
          onChange={e => updateField('travelInfo', 'usStreetAddress', e.target.value)} placeholder="رقم وشارع" />
      </div>
      <div className="vf-form-row">
        <div className="vf-form-group">
          <label>المدينة</label>
          <input type="text" value={formData.travelInfo.usCity}
            onChange={e => updateField('travelInfo', 'usCity', e.target.value)} placeholder="المدينة" />
        </div>
        <div className="vf-form-group">
          <label>الولاية</label>
          <select value={formData.travelInfo.usState}
            onChange={e => updateField('travelInfo', 'usState', e.target.value)}>
            <option value="">اختر الولاية...</option>
            {US_STATES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      </div>

      {/* Financial Info */}
      <div className="vf-section-title" style={{ marginTop: 24 }}>المعلومات المالية</div>
      <div className="vf-form-group">
        <label>هل أنت المتكفل بدفع مصاريف السفر؟</label>
        {renderToggle('financialInfo', 'selfPaying', formData.financialInfo.selfPaying)}
      </div>
      {!formData.financialInfo.selfPaying && (
        <div className="vf-conditional">
          <div className="vf-form-row">
            <div className="vf-form-group">
              <label>اسم المتكفل بالدفع</label>
              <input type="text" value={formData.financialInfo.sponsorName}
                onChange={e => updateField('financialInfo', 'sponsorName', e.target.value)} placeholder="اسم الشخص المتكفل" />
            </div>
            <div className="vf-form-group">
              <label>صلة القرابة</label>
              <input type="text" value={formData.financialInfo.sponsorRelationship}
                onChange={e => updateField('financialInfo', 'sponsorRelationship', e.target.value)} placeholder="مثال: أب، أخ، زوج" />
            </div>
          </div>
          <div className="vf-form-group">
            <label>عنوان المتكفل</label>
            <input type="text" value={formData.financialInfo.sponsorAddress}
              onChange={e => updateField('financialInfo', 'sponsorAddress', e.target.value)} placeholder="عنوان المتكفل" />
          </div>
          <div className="vf-form-row">
            <div className="vf-form-group">
              <label>رقم هاتف المتكفل</label>
              <input type="tel" value={formData.financialInfo.sponsorPhone}
                onChange={e => updateField('financialInfo', 'sponsorPhone', e.target.value)} placeholder="رقم الهاتف" dir="ltr" />
            </div>
            <div className="vf-form-group">
              <label>بريد المتكفل الإلكتروني</label>
              <input type="email" value={formData.financialInfo.sponsorEmail}
                onChange={e => updateField('financialInfo', 'sponsorEmail', e.target.value)} placeholder="email@example.com" dir="ltr" />
            </div>
          </div>
        </div>
      )}

      {/* Host Info */}
      <div className="vf-section-title" style={{ marginTop: 24 }}>معلومات الاستضافة (اختياري)</div>
      <div className="vf-info-box" style={{ marginBottom: 16 }}>
        بيانات الشخص أو الجهة المستضيفة - يمكنك كتابة اسم الفندق وعنوانه
      </div>
      <div className="vf-form-group">
        <label>اسم المضيف (شخص / شركة / فندق)</label>
        <input type="text" value={formData.hostInfo.hostName}
          onChange={e => updateField('hostInfo', 'hostName', e.target.value)} placeholder="اسم المضيف أو الفندق" />
      </div>
      <div className="vf-form-group">
        <label>عنوان المضيف</label>
        <input type="text" value={formData.hostInfo.hostAddress}
          onChange={e => updateField('hostInfo', 'hostAddress', e.target.value)} placeholder="العنوان الكامل في أمريكا" />
      </div>
      <div className="vf-form-row">
        <div className="vf-form-group">
          <label>رقم هاتف المضيف</label>
          <input type="tel" value={formData.hostInfo.hostPhone}
            onChange={e => updateField('hostInfo', 'hostPhone', e.target.value)} placeholder="رقم الهاتف" dir="ltr" />
        </div>
        <div className="vf-form-group">
          <label>بريد المضيف الإلكتروني</label>
          <input type="email" value={formData.hostInfo.hostEmail}
            onChange={e => updateField('hostInfo', 'hostEmail', e.target.value)} placeholder="email@example.com" dir="ltr" />
        </div>
      </div>

      {/* Travel Companions */}
      <div className="vf-section-title" style={{ marginTop: 24 }}>مرافقو السفر</div>
      <div className="vf-form-group">
        <label>هل ستسافر مع أشخاص آخرين؟ <span className="vf-required">*</span></label>
        {renderToggle('travelCompanions', 'hasCompanions', formData.travelCompanions.hasCompanions)}
        {errors['travelCompanions.hasCompanions'] && <span className="vf-error-text">{errors['travelCompanions.hasCompanions']}</span>}
      </div>
      {formData.travelCompanions.hasCompanions === true && (
        <div className="vf-conditional">
          {formData.travelCompanions.companions.map((comp, idx) => (
            <div key={idx} className="vf-repeatable-item">
              <div className="vf-repeatable-item-header">
                <span className="vf-repeatable-item-title">المرافق {idx + 1}</span>
                <button type="button" className="vf-repeatable-remove" onClick={() => removeCompanion(idx)}>حذف</button>
              </div>
              <div className="vf-form-row">
                <div className="vf-form-group">
                  <label>الاسم</label>
                  <input type="text" value={comp.companionName}
                    onChange={e => updateCompanion(idx, 'companionName', e.target.value)} placeholder="اسم المرافق" />
                </div>
                <div className="vf-form-group">
                  <label>صلة القرابة</label>
                  <input type="text" value={comp.companionRelationship}
                    onChange={e => updateCompanion(idx, 'companionRelationship', e.target.value)} placeholder="مثال: زوجة، ابن" />
                </div>
              </div>
            </div>
          ))}
          {errors['travelCompanions.companions'] && <span className="vf-error-text">{errors['travelCompanions.companions']}</span>}
          <button type="button" className="vf-add-item-btn" onClick={addCompanion}
            disabled={formData.travelCompanions.companions.length >= 4}>
            + إضافة مرافق {formData.travelCompanions.companions.length >= 4 && '(الحد الأقصى 4)'}
          </button>
        </div>
      )}
    </div>
  );

  // Step 5: Previous US Travel
  const renderStep5 = () => (
    <div className="vf-step-content">
      <div className="vf-step-header">
        <h2>السفر السابق للولايات المتحدة</h2>
      </div>
      <div className="vf-form-group">
        <label>هل سبق لك السفر للولايات المتحدة؟ <span className="vf-required">*</span></label>
        {renderToggle('previousUSTravel', 'beenToUS', formData.previousUSTravel.beenToUS)}
        {errors['previousUSTravel.beenToUS'] && <span className="vf-error-text">{errors['previousUSTravel.beenToUS']}</span>}
      </div>
      {formData.previousUSTravel.beenToUS === true && (
        <div className="vf-conditional">
          <div className="vf-form-row">
            <div className="vf-form-group">
              <label>تاريخ آخر وصول لأمريكا</label>
              <input type="date" value={formData.previousUSTravel.lastUSArrival}
                onChange={e => updateField('previousUSTravel', 'lastUSArrival', e.target.value)} />
            </div>
            <div className="vf-form-group">
              <label>نوع التأشيرة السابقة</label>
              <input type="text" value={formData.previousUSTravel.previousVisaType}
                onChange={e => updateField('previousUSTravel', 'previousVisaType', e.target.value)} placeholder="B1/B2, F1, etc." dir="ltr" />
            </div>
          </div>
          <div className="vf-form-row">
            <div className="vf-form-group">
              <label>تاريخ إصدار آخر تأشيرة</label>
              <input type="date" value={formData.previousUSTravel.lastVisaIssueDate}
                onChange={e => updateField('previousUSTravel', 'lastVisaIssueDate', e.target.value)} />
            </div>
            <div className="vf-form-group">
              <label>رقم التأشيرة</label>
              <input type="text" value={formData.previousUSTravel.visaNumber}
                onChange={e => updateField('previousUSTravel', 'visaNumber', e.target.value)} placeholder="رقم التأشيرة" dir="ltr" />
            </div>
          </div>
          <div className="vf-form-group">
            <label>هل تقدم بنفس نوع التأشيرة؟</label>
            {renderToggle('previousUSTravel', 'sameVisaType', formData.previousUSTravel.sameVisaType)}
          </div>
          <div className="vf-form-group">
            <label>هل تم أخذ بصماتك؟</label>
            {renderToggle('previousUSTravel', 'fingerprinted', formData.previousUSTravel.fingerprinted)}
          </div>
        </div>
      )}
      <div className="vf-form-group" style={{ marginTop: 16 }}>
        <label>هل فقدت أو سرقت تأشيرتك الأمريكية؟</label>
        {renderToggle('previousUSTravel', 'visaLostStolen', formData.previousUSTravel.visaLostStolen)}
      </div>
      <div className="vf-form-group">
        <label>هل تم إلغاء تأشيرتك الأمريكية؟</label>
        {renderToggle('previousUSTravel', 'visaCancelled', formData.previousUSTravel.visaCancelled)}
      </div>
      <div className="vf-form-group">
        <label>هل لديك رخصة قيادة أمريكية؟</label>
        {renderToggle('previousUSTravel', 'usDriversLicense', formData.previousUSTravel.usDriversLicense)}
      </div>
      {formData.previousUSTravel.usDriversLicense === true && (
        <div className="vf-form-group vf-conditional">
          <label>رقم الرخصة والولاية</label>
          <input type="text" value={formData.previousUSTravel.licenseNumberState}
            onChange={e => updateField('previousUSTravel', 'licenseNumberState', e.target.value)} placeholder="رقم الرخصة - الولاية" />
        </div>
      )}
      <div className="vf-form-group">
        <label>هل سبق رفض طلب تأشيرة أمريكية لك؟</label>
        {renderToggle('previousUSTravel', 'visaRefused', formData.previousUSTravel.visaRefused)}
      </div>
    </div>
  );

  // Step 6: Family + Spouse (split names, optional DOB)
  const renderStep6 = () => (
    <div className="vf-step-content">
      <div className="vf-step-header"><h2>بيانات العائلة</h2></div>
      <div className="vf-section-title">بيانات الوالدين</div>
      <div className="vf-form-row">
        <div className="vf-form-group">
          <label>اسم الأب الأول <span className="vf-required">*</span></label>
          <input type="text" value={formData.familyInfo.fatherFirstName}
            onChange={e => updateField('familyInfo', 'fatherFirstName', e.target.value)} placeholder="الاسم الأول"
            className={errors['familyInfo.fatherFirstName'] ? 'vf-error' : ''} />
          {errors['familyInfo.fatherFirstName'] && <span className="vf-error-text">{errors['familyInfo.fatherFirstName']}</span>}
        </div>
        <div className="vf-form-group">
          <label>لقب الأب <span className="vf-required">*</span></label>
          <input type="text" value={formData.familyInfo.fatherLastName}
            onChange={e => updateField('familyInfo', 'fatherLastName', e.target.value)} placeholder="اسم العائلة"
            className={errors['familyInfo.fatherLastName'] ? 'vf-error' : ''} />
          {errors['familyInfo.fatherLastName'] && <span className="vf-error-text">{errors['familyInfo.fatherLastName']}</span>}
        </div>
      </div>
      <div className="vf-form-group">
        <label>تاريخ ميلاد الأب</label>
        <input type="date" value={formData.familyInfo.fatherDOB}
          onChange={e => updateField('familyInfo', 'fatherDOB', e.target.value)} />
      </div>
      <div className="vf-form-row">
        <div className="vf-form-group">
          <label>اسم الأم الأول <span className="vf-required">*</span></label>
          <input type="text" value={formData.familyInfo.motherFirstName}
            onChange={e => updateField('familyInfo', 'motherFirstName', e.target.value)} placeholder="الاسم الأول"
            className={errors['familyInfo.motherFirstName'] ? 'vf-error' : ''} />
          {errors['familyInfo.motherFirstName'] && <span className="vf-error-text">{errors['familyInfo.motherFirstName']}</span>}
        </div>
        <div className="vf-form-group">
          <label>لقب الأم <span className="vf-required">*</span></label>
          <input type="text" value={formData.familyInfo.motherLastName}
            onChange={e => updateField('familyInfo', 'motherLastName', e.target.value)} placeholder="اسم العائلة"
            className={errors['familyInfo.motherLastName'] ? 'vf-error' : ''} />
          {errors['familyInfo.motherLastName'] && <span className="vf-error-text">{errors['familyInfo.motherLastName']}</span>}
        </div>
      </div>
      <div className="vf-form-group">
        <label>تاريخ ميلاد الأم</label>
        <input type="date" value={formData.familyInfo.motherDOB}
          onChange={e => updateField('familyInfo', 'motherDOB', e.target.value)} />
      </div>
      <div className="vf-form-group">
        <label>هل لديك أقارب من الدرجة الأولى في أمريكا؟</label>
        {renderToggle('familyInfo', 'hasImmediateRelativesUS', formData.familyInfo.hasImmediateRelativesUS)}
      </div>
      <div className="vf-form-group">
        <label>هل لديك أي أقارب في أمريكا؟</label>
        {renderToggle('familyInfo', 'hasAnyRelativesUS', formData.familyInfo.hasAnyRelativesUS)}
      </div>
      {formData.familyInfo.hasAnyRelativesUS === true && (
        <div className="vf-conditional">
          <div className="vf-form-row">
            <div className="vf-form-group">
              <label>اسم القريب</label>
              <input type="text" value={formData.familyInfo.relativeName}
                onChange={e => updateField('familyInfo', 'relativeName', e.target.value)} placeholder="اسم القريب" />
            </div>
            <div className="vf-form-group">
              <label>صلة القرابة</label>
              <input type="text" value={formData.familyInfo.relativeRelationship}
                onChange={e => updateField('familyInfo', 'relativeRelationship', e.target.value)} placeholder="مثال: عم، خال" />
            </div>
          </div>
          <div className="vf-form-row">
            <div className="vf-form-group">
              <label>عنوان القريب</label>
              <input type="text" value={formData.familyInfo.relativeAddress}
                onChange={e => updateField('familyInfo', 'relativeAddress', e.target.value)} placeholder="العنوان" />
            </div>
            <div className="vf-form-group">
              <label>رقم هاتف القريب</label>
              <input type="tel" value={formData.familyInfo.relativePhone}
                onChange={e => updateField('familyInfo', 'relativePhone', e.target.value)} placeholder="رقم الهاتف" dir="ltr" />
            </div>
          </div>
        </div>
      )}

      {/* Spouse section — conditional */}
      {formData.personalInfo.maritalStatus === 'married' && (
        <>
          <div className="vf-section-title" style={{ marginTop: 32 }}>بيانات الزوج/ة</div>
          <div className="vf-form-group">
            <label>الجنس</label>
            <div className="vf-toggle-group">
              <label className={`vf-toggle ${formData.spouseInfo.spouseGender === 'male' ? 'active' : ''}`}>
                <input type="radio" checked={formData.spouseInfo.spouseGender === 'male'}
                  onChange={() => updateField('spouseInfo', 'spouseGender', 'male')} />
                <span>زوج</span>
              </label>
              <label className={`vf-toggle ${formData.spouseInfo.spouseGender === 'female' ? 'active' : ''}`}>
                <input type="radio" checked={formData.spouseInfo.spouseGender === 'female'}
                  onChange={() => updateField('spouseInfo', 'spouseGender', 'female')} />
                <span>زوجة</span>
              </label>
            </div>
          </div>
          <div className="vf-form-row">
            <div className="vf-form-group">
              <label>اسم الزوج/ة الكامل <span className="vf-required">*</span></label>
              <input type="text" value={formData.spouseInfo.spouseFullName}
                onChange={e => updateField('spouseInfo', 'spouseFullName', e.target.value)} placeholder="الاسم الكامل"
                className={errors['spouseInfo.spouseFullName'] ? 'vf-error' : ''} />
              {errors['spouseInfo.spouseFullName'] && <span className="vf-error-text">{errors['spouseInfo.spouseFullName']}</span>}
            </div>
            <div className="vf-form-group">
              <label>تاريخ الميلاد <span className="vf-required">*</span></label>
              <input type="date" value={formData.spouseInfo.spouseDOB}
                onChange={e => updateField('spouseInfo', 'spouseDOB', e.target.value)}
                className={errors['spouseInfo.spouseDOB'] ? 'vf-error' : ''} />
              {errors['spouseInfo.spouseDOB'] && <span className="vf-error-text">{errors['spouseInfo.spouseDOB']}</span>}
            </div>
          </div>
          <div className="vf-form-row">
            <div className="vf-form-group">
              <label>الجنسية <span className="vf-required">*</span></label>
              <input type="text" value={formData.spouseInfo.spouseNationality}
                onChange={e => updateField('spouseInfo', 'spouseNationality', e.target.value)} placeholder="جنسية الزوج/ة"
                className={errors['spouseInfo.spouseNationality'] ? 'vf-error' : ''} />
              {errors['spouseInfo.spouseNationality'] && <span className="vf-error-text">{errors['spouseInfo.spouseNationality']}</span>}
            </div>
            <div className="vf-form-group">
              <label>مكان الميلاد</label>
              <input type="text" value={formData.spouseInfo.spouseBirthPlace}
                onChange={e => updateField('spouseInfo', 'spouseBirthPlace', e.target.value)} placeholder="مدينة الميلاد" />
            </div>
          </div>
          <div className="vf-form-group">
            <label>عنوان الزوج/ة</label>
            <input type="text" value={formData.spouseInfo.spouseAddress}
              onChange={e => updateField('spouseInfo', 'spouseAddress', e.target.value)} placeholder="العنوان الحالي" />
          </div>
        </>
      )}
    </div>
  );

  // Step 7: Employment + Education (conditional)
  const renderStep7 = () => (
    <div className="vf-step-content">
      <div className="vf-step-header"><h2>العمل والتعليم</h2></div>

      <div className="vf-section-title">بيانات العمل</div>
      <div className="vf-form-group">
        <label>هل تعمل حاليا؟</label>
        {renderToggle('employmentInfo', 'isEmployed', formData.employmentInfo.isEmployed)}
      </div>
      {formData.employmentInfo.isEmployed === true && (
        <div className="vf-conditional">
          <div className="vf-form-row">
            <div className="vf-form-group">
              <label>المسمى الوظيفي <span className="vf-required">*</span></label>
              <input type="text" value={formData.employmentInfo.currentJobTitle}
                onChange={e => updateField('employmentInfo', 'currentJobTitle', e.target.value)} placeholder="المسمى الوظيفي"
                className={errors['employmentInfo.currentJobTitle'] ? 'vf-error' : ''} />
              {errors['employmentInfo.currentJobTitle'] && <span className="vf-error-text">{errors['employmentInfo.currentJobTitle']}</span>}
            </div>
            <div className="vf-form-group">
              <label>جهة العمل <span className="vf-required">*</span></label>
              <input type="text" value={formData.employmentInfo.currentEmployer}
                onChange={e => updateField('employmentInfo', 'currentEmployer', e.target.value)} placeholder="اسم الشركة أو المؤسسة"
                className={errors['employmentInfo.currentEmployer'] ? 'vf-error' : ''} />
              {errors['employmentInfo.currentEmployer'] && <span className="vf-error-text">{errors['employmentInfo.currentEmployer']}</span>}
            </div>
          </div>
          <div className="vf-form-group">
            <label>عنوان جهة العمل <span className="vf-required">*</span></label>
            <input type="text" value={formData.employmentInfo.employerAddress}
              onChange={e => updateField('employmentInfo', 'employerAddress', e.target.value)} placeholder="العنوان الكامل"
              className={errors['employmentInfo.employerAddress'] ? 'vf-error' : ''} />
            {errors['employmentInfo.employerAddress'] && <span className="vf-error-text">{errors['employmentInfo.employerAddress']}</span>}
          </div>
          <div className="vf-form-row">
            <div className="vf-form-group">
              <label>الراتب الشهري <span className="vf-required">*</span></label>
              <input type="text" value={formData.employmentInfo.monthlySalary}
                onChange={e => updateField('employmentInfo', 'monthlySalary', e.target.value)} placeholder="مثال: 15,000 ريال"
                className={errors['employmentInfo.monthlySalary'] ? 'vf-error' : ''} />
              {errors['employmentInfo.monthlySalary'] && <span className="vf-error-text">{errors['employmentInfo.monthlySalary']}</span>}
            </div>
            <div className="vf-form-group">
              <label>تاريخ بدء العمل <span className="vf-required">*</span></label>
              <input type="date" value={formData.employmentInfo.currentJobStartDate}
                onChange={e => updateField('employmentInfo', 'currentJobStartDate', e.target.value)}
                className={errors['employmentInfo.currentJobStartDate'] ? 'vf-error' : ''} />
              {errors['employmentInfo.currentJobStartDate'] && <span className="vf-error-text">{errors['employmentInfo.currentJobStartDate']}</span>}
            </div>
          </div>
          <div className="vf-form-group">
            <label>وصف العمل <span className="vf-required">*</span></label>
            <textarea value={formData.employmentInfo.jobDescription}
              onChange={e => updateField('employmentInfo', 'jobDescription', e.target.value)}
              placeholder="وصف مختصر للمهام الوظيفية" rows={3}
              className={errors['employmentInfo.jobDescription'] ? 'vf-error' : ''} />
            {errors['employmentInfo.jobDescription'] && <span className="vf-error-text">{errors['employmentInfo.jobDescription']}</span>}
          </div>
          <div className="vf-form-group">
            <label>هل لديك وظيفة سابقة؟</label>
            {renderToggle('employmentInfo', 'hasPreviousJob', formData.employmentInfo.hasPreviousJob)}
          </div>
          {formData.employmentInfo.hasPreviousJob === true && (
            <div className="vf-conditional">
              <div className="vf-form-row">
                <div className="vf-form-group">
                  <label>اسم جهة العمل السابقة</label>
                  <input type="text" value={formData.employmentInfo.prevEmployerName}
                    onChange={e => updateField('employmentInfo', 'prevEmployerName', e.target.value)} placeholder="اسم الجهة" />
                </div>
                <div className="vf-form-group">
                  <label>المسمى الوظيفي السابق</label>
                  <input type="text" value={formData.employmentInfo.prevJobTitle}
                    onChange={e => updateField('employmentInfo', 'prevJobTitle', e.target.value)} placeholder="المسمى" />
                </div>
              </div>
              <div className="vf-form-group">
                <label>عنوان جهة العمل السابقة</label>
                <input type="text" value={formData.employmentInfo.prevEmployerAddress}
                  onChange={e => updateField('employmentInfo', 'prevEmployerAddress', e.target.value)} placeholder="العنوان" />
              </div>
              <div className="vf-form-row">
                <div className="vf-form-group">
                  <label>تاريخ البدء</label>
                  <input type="date" value={formData.employmentInfo.prevJobStartDate}
                    onChange={e => updateField('employmentInfo', 'prevJobStartDate', e.target.value)} />
                </div>
                <div className="vf-form-group">
                  <label>تاريخ الانتهاء</label>
                  <input type="date" value={formData.employmentInfo.prevJobEndDate}
                    onChange={e => updateField('employmentInfo', 'prevJobEndDate', e.target.value)} />
                </div>
              </div>
              <div className="vf-form-group">
                <label>اسم المدير المباشر</label>
                <input type="text" value={formData.employmentInfo.prevManagerName}
                  onChange={e => updateField('employmentInfo', 'prevManagerName', e.target.value)} placeholder="اسم المدير" />
              </div>
            </div>
          )}
        </div>
      )}

      <div className="vf-section-title" style={{ marginTop: 32 }}>بيانات التعليم</div>
      <div className="vf-form-group">
        <label>هل لديك تحصيل جامعي / أكاديمي؟</label>
        {renderToggle('educationInfo', 'hasEducation', formData.educationInfo.hasEducation)}
      </div>
      {formData.educationInfo.hasEducation === true && (
        <div className="vf-conditional">
          <div className="vf-form-row">
            <div className="vf-form-group">
              <label>اسم الجامعة / الكلية</label>
              <input type="text" value={formData.educationInfo.universityName}
                onChange={e => updateField('educationInfo', 'universityName', e.target.value)} placeholder="اسم الجامعة" />
            </div>
            <div className="vf-form-group">
              <label>التخصص</label>
              <input type="text" value={formData.educationInfo.major}
                onChange={e => updateField('educationInfo', 'major', e.target.value)} placeholder="التخصص الدراسي" />
            </div>
          </div>
          <div className="vf-form-row">
            <div className="vf-form-group">
              <label>المدينة</label>
              <input type="text" value={formData.educationInfo.universityCity}
                onChange={e => updateField('educationInfo', 'universityCity', e.target.value)} placeholder="مدينة الجامعة" />
            </div>
            <div className="vf-form-group">
              <label>العنوان</label>
              <input type="text" value={formData.educationInfo.universityAddress}
                onChange={e => updateField('educationInfo', 'universityAddress', e.target.value)} placeholder="الحي - الشارع" />
            </div>
          </div>
          <div className="vf-form-row">
            <div className="vf-form-group">
              <label>تاريخ بدء الدراسة</label>
              <input type="date" value={formData.educationInfo.studyStartDate}
                onChange={e => updateField('educationInfo', 'studyStartDate', e.target.value)} />
            </div>
            <div className="vf-form-group">
              <label>تاريخ التخرج</label>
              <input type="date" value={formData.educationInfo.graduationDate}
                onChange={e => updateField('educationInfo', 'graduationDate', e.target.value)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Step 8: Travel History + Military
  const renderStep8 = () => (
    <div className="vf-step-content">
      <div className="vf-step-header"><h2>تاريخ السفر والخدمة العسكرية</h2></div>

      <div className="vf-section-title">الدول التي زرتها خلال آخر 5 سنوات (اختياري)</div>
      {formData.travelHistoryMilitary.visitedCountries.map((country, idx) => (
        <div key={idx} className="vf-form-row" style={{ alignItems: 'flex-end', marginBottom: 8 }}>
          <div className="vf-form-group" style={{ flex: 1 }}>
            <label>دولة {idx + 1}</label>
            <input type="text" value={country}
              onChange={e => updateVisitedCountry(idx, e.target.value)} placeholder="اسم الدولة" />
          </div>
          <button type="button" className="vf-repeatable-remove" style={{ marginBottom: 8 }} onClick={() => removeVisitedCountry(idx)}>حذف</button>
        </div>
      ))}
      <button type="button" className="vf-add-item-btn" onClick={addVisitedCountry}>+ إضافة دولة</button>

      <div className="vf-section-title" style={{ marginTop: 24 }}>الخدمة العسكرية</div>
      <div className="vf-form-group">
        <label>هل خدمت في الجيش أو أي جهة عسكرية؟ <span className="vf-required">*</span></label>
        {renderToggle('travelHistoryMilitary', 'militaryService', formData.travelHistoryMilitary.militaryService)}
        {errors['travelHistoryMilitary.militaryService'] && <span className="vf-error-text">{errors['travelHistoryMilitary.militaryService']}</span>}
      </div>
      {formData.travelHistoryMilitary.militaryService === true && (
        <div className="vf-conditional">
          <div className="vf-form-row">
            <div className="vf-form-group">
              <label>الرتبة</label>
              <input type="text" value={formData.travelHistoryMilitary.militaryRank}
                onChange={e => updateField('travelHistoryMilitary', 'militaryRank', e.target.value)} placeholder="الرتبة العسكرية" />
            </div>
            <div className="vf-form-group">
              <label>التخصص</label>
              <input type="text" value={formData.travelHistoryMilitary.militarySpecialty}
                onChange={e => updateField('travelHistoryMilitary', 'militarySpecialty', e.target.value)} placeholder="التخصص العسكري" />
            </div>
          </div>
          <div className="vf-form-row">
            <div className="vf-form-group">
              <label>تاريخ البدء</label>
              <input type="date" value={formData.travelHistoryMilitary.militaryStartDate}
                onChange={e => updateField('travelHistoryMilitary', 'militaryStartDate', e.target.value)} />
            </div>
            <div className="vf-form-group">
              <label>تاريخ الانتهاء</label>
              <input type="date" value={formData.travelHistoryMilitary.militaryEndDate}
                onChange={e => updateField('travelHistoryMilitary', 'militaryEndDate', e.target.value)} />
            </div>
          </div>
        </div>
      )}

      {/* Student additional — conditional */}
      {formData.travelInfo.travelPurpose === 'study' && (
        <>
          <div className="vf-section-title" style={{ marginTop: 32 }}>معلومات إضافية لتأشيرة الدراسة</div>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 16 }}>أضف مرجعين على الأقل</p>
          {formData.studentAdditionalInfo.references.map((ref, idx) => (
            <div key={idx} className="vf-repeatable-item">
              <div className="vf-repeatable-item-header">
                <span className="vf-repeatable-item-title">المرجع {idx + 1}</span>
                <button type="button" className="vf-repeatable-remove" onClick={() => removeReference(idx)}>حذف</button>
              </div>
              <div className="vf-form-row">
                <div className="vf-form-group">
                  <label>الاسم</label>
                  <input type="text" value={ref.refName}
                    onChange={e => updateReference(idx, 'refName', e.target.value)} placeholder="اسم المرجع" />
                </div>
                <div className="vf-form-group">
                  <label>رقم الهاتف</label>
                  <input type="tel" value={ref.refPhone}
                    onChange={e => updateReference(idx, 'refPhone', e.target.value)} placeholder="رقم الهاتف" dir="ltr" />
                </div>
              </div>
              <div className="vf-form-group">
                <label>العنوان</label>
                <input type="text" value={ref.refAddress}
                  onChange={e => updateReference(idx, 'refAddress', e.target.value)} placeholder="العنوان" />
              </div>
            </div>
          ))}
          <button type="button" className="vf-add-item-btn" onClick={addReference}
            disabled={formData.studentAdditionalInfo.references.length >= 2}>
            + إضافة مرجع {formData.studentAdditionalInfo.references.length >= 2 && '(الحد الأقصى 2)'}
          </button>
        </>
      )}
    </div>
  );

  // Step 9: Interview & Social Media
  const renderStep9 = () => (
    <div className="vf-step-content">
      <div className="vf-step-header">
        <h2>المقابلة والتواصل الاجتماعي</h2>
      </div>
      <div className="vf-form-group">
        <label>لغة المقابلة المفضلة <span className="vf-required">*</span></label>
        <select value={formData.interviewSocialMedia.interviewLanguage}
          onChange={e => updateField('interviewSocialMedia', 'interviewLanguage', e.target.value)}
          className={errors['interviewSocialMedia.interviewLanguage'] ? 'vf-error' : ''}>
          <option value="">اختر...</option>
          {INTERVIEW_LANG_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
        {errors['interviewSocialMedia.interviewLanguage'] && <span className="vf-error-text">{errors['interviewSocialMedia.interviewLanguage']}</span>}
      </div>
      <div className="vf-section-title" style={{ marginTop: 24 }}>حسابات التواصل الاجتماعي (اختياري)</div>
      <div className="vf-form-row">
        <div className="vf-form-group">
          <label>Facebook</label>
          <input type="text" value={formData.interviewSocialMedia.socialFacebook}
            onChange={e => updateField('interviewSocialMedia', 'socialFacebook', e.target.value)} placeholder="اسم المستخدم أو الرابط" dir="ltr" />
        </div>
        <div className="vf-form-group">
          <label>Instagram</label>
          <input type="text" value={formData.interviewSocialMedia.socialInstagram}
            onChange={e => updateField('interviewSocialMedia', 'socialInstagram', e.target.value)} placeholder="@username" dir="ltr" />
        </div>
      </div>
      <div className="vf-form-row">
        <div className="vf-form-group">
          <label>X (Twitter)</label>
          <input type="text" value={formData.interviewSocialMedia.socialTwitter}
            onChange={e => updateField('interviewSocialMedia', 'socialTwitter', e.target.value)} placeholder="@username" dir="ltr" />
        </div>
        <div className="vf-form-group">
          <label>LinkedIn</label>
          <input type="text" value={formData.interviewSocialMedia.socialLinkedin}
            onChange={e => updateField('interviewSocialMedia', 'socialLinkedin', e.target.value)} placeholder="رابط الملف الشخصي" dir="ltr" />
        </div>
      </div>
      <div className="vf-form-row">
        <div className="vf-form-group">
          <label>WhatsApp</label>
          <input type="text" value={formData.interviewSocialMedia.socialWhatsapp}
            onChange={e => updateField('interviewSocialMedia', 'socialWhatsapp', e.target.value)} placeholder="رقم الواتساب" dir="ltr" />
        </div>
        <div className="vf-form-group">
          <label>أخرى</label>
          <input type="text" value={formData.interviewSocialMedia.socialOther}
            onChange={e => updateField('interviewSocialMedia', 'socialOther', e.target.value)} placeholder="أي حسابات أخرى" />
        </div>
      </div>
    </div>
  );

  // Step 10: Personal Photo
  const renderStep10 = () => (
    <div className="vf-step-content">
      <div className="vf-step-header">
        <h2>الصورة الشخصية</h2>
        <p>ارفع صورة شخصية حسب متطلبات السفارة الأمريكية</p>
      </div>
      <div className="vf-upload-area" onClick={() => photoInputRef.current?.click()}>
        {photoPreview || formData.personalPhoto ? (
          <div className="vf-upload-preview">
            <img src={photoPreview || formData.personalPhoto} alt="الصورة الشخصية" />
            <span className="vf-upload-change">تغيير الصورة</span>
          </div>
        ) : (
          <div className="vf-upload-placeholder">
            <span className="vf-upload-icon">&#128444;</span>
            <span className="vf-upload-text">اضغط لرفع الصورة الشخصية</span>
            <span className="vf-upload-hint">JPG, PNG - حد أقصى 240KB</span>
          </div>
        )}
        {uploading && <div className="vf-upload-loading">جاري الرفع...</div>}
        <input ref={photoInputRef} type="file" accept="image/jpeg,image/png" onChange={handlePhotoUpload} style={{ display: 'none' }} />
      </div>
      <div className="vf-info-box">
        <strong>متطلبات الصورة:</strong>
        <ul>
          <li>خلفية بيضاء</li>
          <li>الوجه واضح بالكامل - بدون نظارات</li>
          <li>بدون غطاء رأس (إلا لأسباب دينية)</li>
          <li>حجم الصورة لا يتجاوز 240 كيلوبايت</li>
          <li>صيغة JPG أو PNG</li>
        </ul>
      </div>
    </div>
  );

  // Step 11: Full Review + Simple Declaration
  const renderStep11 = () => {
    const ReviewSection = ({ title, stepNum, children }) => (
      <div className="vf-review-section">
        <div className="vf-review-section-header">
          <h3>{title}</h3>
          <button type="button" className="vf-review-edit-btn" onClick={() => setCurrentStep(stepNum)}>تعديل</button>
        </div>
        <div className="vf-review-grid">{children}</div>
      </div>
    );

    const ReviewItem = ({ label, value }) => (
      <div className="vf-review-item">
        <span className="vf-review-label">{label}</span>
        <span className="vf-review-value">{value || '-'}</span>
      </div>
    );

    return (
      <div className="vf-step-content">
        <div className="vf-step-header">
          <h2>المراجعة والإقرار</h2>
          <p>راجع جميع بياناتك قبل التقديم</p>
        </div>

        <ReviewSection title="بيانات الجواز" stepNum={1}>
          <ReviewItem label="نوع التأشيرة" value={getVisaTypeLabel(formData.visaType)} />
          <ReviewItem label="رقم الجواز" value={formData.passportDetails.passportNumber} />
          <ReviewItem label="مكان الإصدار" value={formData.passportDetails.passportIssuePlace} />
          <ReviewItem label="تاريخ الإصدار" value={formData.passportDetails.passportIssueDate} />
          <ReviewItem label="تاريخ الانتهاء" value={formData.passportDetails.passportExpiryDate} />
        </ReviewSection>

        <ReviewSection title="البيانات الشخصية" stepNum={2}>
          <ReviewItem label="الاسم" value={formData.personalInfo.fullName} />
          <ReviewItem label="الحالة الاجتماعية" value={getMaritalLabel(formData.personalInfo.maritalStatus)} />
          <ReviewItem label="تاريخ الميلاد" value={formData.personalInfo.dateOfBirth} />
          <ReviewItem label="الجنسية" value={formData.personalInfo.nationality} />
          <ReviewItem label="رقم الهوية" value={formData.personalInfo.nationalId} />
        </ReviewSection>

        <ReviewSection title="معلومات الاتصال" stepNum={3}>
          <ReviewItem label="البريد الإلكتروني" value={formData.contactInfo.emails.filter(Boolean).join(' | ')} />
          <ReviewItem label="الجوال" value={formData.contactInfo.phones.filter(Boolean).join(' | ')} />
          <ReviewItem label="العنوان" value={[formData.contactInfo.streetAddress, formData.contactInfo.districtCity].filter(Boolean).join(' - ')} />
        </ReviewSection>

        <ReviewSection title="السفر والإقامة" stepNum={4}>
          <ReviewItem label="تاريخ الوصول" value={formData.travelInfo.expectedArrivalDate} />
          <ReviewItem label="الغرض" value={getPurposeLabel(formData.travelInfo.travelPurpose)} />
          <ReviewItem label="فترة الإقامة" value={formData.travelInfo.stayDurationNumber ? `${formData.travelInfo.stayDurationNumber} ${getDurationTypeLabel(formData.travelInfo.stayDurationType)}` : ''} />
          <ReviewItem label="العنوان في أمريكا" value={[formData.travelInfo.usStreetAddress, formData.travelInfo.usCity, getStateLabel(formData.travelInfo.usState)].filter(Boolean).join(', ')} />
          <ReviewItem label="المتكفل بالدفع" value={formData.financialInfo.selfPaying ? 'نفسي' : formData.financialInfo.sponsorName || 'شخص آخر'} />
          <ReviewItem label="المضيف" value={formData.hostInfo.hostName} />
          <ReviewItem label="مرافقون" value={formData.travelCompanions.hasCompanions ? formData.travelCompanions.companions.map(c => c.companionName).filter(Boolean).join(', ') : 'لا'} />
        </ReviewSection>

        <ReviewSection title="السفر السابق لأمريكا" stepNum={5}>
          <ReviewItem label="سبق السفر لأمريكا" value={formData.previousUSTravel.beenToUS === true ? 'نعم' : formData.previousUSTravel.beenToUS === false ? 'لا' : ''} />
          {formData.previousUSTravel.beenToUS && (
            <>
              <ReviewItem label="آخر وصول" value={formData.previousUSTravel.lastUSArrival} />
              <ReviewItem label="نوع التأشيرة السابقة" value={formData.previousUSTravel.previousVisaType} />
            </>
          )}
        </ReviewSection>

        <ReviewSection title="العائلة" stepNum={6}>
          <ReviewItem label="اسم الأب" value={[formData.familyInfo.fatherFirstName, formData.familyInfo.fatherLastName].filter(Boolean).join(' ')} />
          <ReviewItem label="اسم الأم" value={[formData.familyInfo.motherFirstName, formData.familyInfo.motherLastName].filter(Boolean).join(' ')} />
          {formData.personalInfo.maritalStatus === 'married' && (
            <>
              <ReviewItem label="اسم الزوج/ة" value={formData.spouseInfo.spouseFullName} />
              <ReviewItem label="جنسية الزوج/ة" value={formData.spouseInfo.spouseNationality} />
            </>
          )}
        </ReviewSection>

        <ReviewSection title="العمل والتعليم" stepNum={7}>
          <ReviewItem label="يعمل حاليا" value={formData.employmentInfo.isEmployed === true ? 'نعم' : formData.employmentInfo.isEmployed === false ? 'لا' : ''} />
          {formData.employmentInfo.isEmployed && (
            <>
              <ReviewItem label="المسمى الوظيفي" value={formData.employmentInfo.currentJobTitle} />
              <ReviewItem label="جهة العمل" value={formData.employmentInfo.currentEmployer} />
              <ReviewItem label="الراتب" value={formData.employmentInfo.monthlySalary} />
            </>
          )}
          {formData.educationInfo.hasEducation && (
            <>
              <ReviewItem label="الجامعة" value={formData.educationInfo.universityName} />
              <ReviewItem label="التخصص" value={formData.educationInfo.major} />
            </>
          )}
        </ReviewSection>

        <ReviewSection title="السفر والخدمة العسكرية" stepNum={8}>
          <ReviewItem label="الدول المزارة" value={formData.travelHistoryMilitary.visitedCountries.filter(Boolean).join(', ')} />
          <ReviewItem label="خدمة عسكرية" value={formData.travelHistoryMilitary.militaryService === true ? 'نعم' : formData.travelHistoryMilitary.militaryService === false ? 'لا' : ''} />
        </ReviewSection>

        <ReviewSection title="المقابلة والتواصل" stepNum={9}>
          <ReviewItem label="لغة المقابلة" value={INTERVIEW_LANG_OPTIONS.find(o => o.value === formData.interviewSocialMedia.interviewLanguage)?.label} />
        </ReviewSection>

        {/* Declaration */}
        <div className="vf-section-title" style={{ marginTop: 24 }}>الإقرار</div>
        <div className="vf-warning-box" style={{ marginTop: 0, marginBottom: 16 }}>
          أقر بأن جميع المعلومات المدخلة أعلاه صحيحة ومطابقة للمستندات الرسمية، وأتحمل المسؤولية الكاملة عن أي معلومات غير صحيحة.
        </div>
        <div className="vf-form-group">
          <label className="vf-checkbox-label">
            <input type="checkbox" checked={formData.declaration.declarationAccepted}
              onChange={e => updateField('declaration', 'declarationAccepted', e.target.checked)} />
            <span>أوافق على الإقرار أعلاه <span className="vf-required">*</span></span>
          </label>
          {errors['declaration.declarationAccepted'] && <span className="vf-error-text">{errors['declaration.declarationAccepted']}</span>}
        </div>
      </div>
    );
  };

  // === Switch ===
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      case 5: return renderStep5();
      case 6: return renderStep6();
      case 7: return renderStep7();
      case 8: return renderStep8();
      case 9: return renderStep9();
      case 10: return renderStep10();
      case 11: return renderStep11();
      default: return null;
    }
  };

  // ===================== MAIN RENDER =====================
  return (
    <div className="vf-page" dir="rtl">
      {/* Header */}
      <div className="vf-header">
        <div className="vf-header-container">
          <button className="vf-back-btn" onClick={() => navigate('/us-visa')}>العودة</button>
          <div className="vf-header-title"><h1>طلب تأشيرة أمريكية</h1></div>
          {saving && <span className="vf-saving-badge">جاري الحفظ...</span>}
        </div>
      </div>

      {/* Segmented Progress Bar */}
      <div className="vf-segmented-bar-container">
        <div className="vf-segmented-bar-info">
          <span className="vf-segmented-percentage">
            {Math.round(((currentStep - 1) / (STEPS.length - 1)) * 100)}%
          </span>
          <span className="vf-segmented-step-name">
            {currentStep > 1 && <span className="vf-segmented-check">&#10003;</span>}
            {STEPS[currentStep - 1].title}
          </span>
        </div>
        <div className="vf-segmented-track">
          {STEPS.map((step) => (
            <div
              key={step.id}
              className={`vf-segment ${step.id < currentStep ? 'completed' : ''} ${step.id === currentStep ? 'active' : ''}`}
              onClick={() => { if (step.id < currentStep) setCurrentStep(step.id); }}
              title={step.title}
            />
          ))}
        </div>
      </div>

      {/* Message */}
      {message.text && (
        <div className={`vf-message ${message.type}`}>{message.text}</div>
      )}

      {/* Form Content */}
      <div className="vf-form-container">
        {renderCurrentStep()}

        {/* Navigation Buttons */}
        <div className="vf-nav-buttons">
          {currentStep > 1 && (
            <button className="vf-btn-secondary" onClick={goPrev}>السابق</button>
          )}
          <div className="vf-nav-spacer" />
          {currentStep < STEPS.length ? (
            <button className="vf-btn-primary" onClick={goNext}>التالي</button>
          ) : (
            <button className="vf-btn-submit" onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'جاري التقديم...' : 'تقديم الطلب'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default UsVisaForm;
