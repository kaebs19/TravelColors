import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { appointmentsApi, departmentsApi, customersApi, settingsApi } from '../../api';
import { Loader, NumberInput, PhoneInput } from '../../components/common';
import { generateAppointmentReceipt } from '../../utils/receiptGenerator';
// import { parseArabicNumber, arabicToEnglishNumbers } from '../../utils/formatters';
import './AddAppointment.css';

// دالة توليد رسالة الموعد المؤكد
const generateConfirmedMessage = (data, departmentTitle) => {
  const date = new Date(data.appointmentDate);
  const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const dayName = days[date.getDay()];
  const formattedDate = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;

  // تحويل الوقت للعرض
  const timeParts = data.appointmentTime.split(':');
  const hour = parseInt(timeParts[0]);
  const period = hour < 12 ? 'صباحاً' : 'مساءً';
  const displayHour = hour > 12 ? hour - 12 : hour;
  const timeDisplay = `${displayHour}:${timeParts[1]} ${period}`;

  return `السلام عليكم ورحمة الله وبركاته
عميلنا العزيز / ${data.customerName}
تم تأكيد موعدكم في ${departmentTitle}

📅 يوم ${dayName} الموافق ${formattedDate}
⏰ الساعة ${timeDisplay}

📍 الموقع:
https://maps.app.goo.gl/xxxxx

نتمنى لكم تجربة سعيدة
ألوان المسافر للخدمات`;
};

// دالة توليد رسالة الموعد غير المؤكد
const generateUnconfirmedMessage = (data, departmentTitle) => {
  const dateFrom = new Date(data.dateFrom);
  const dateTo = new Date(data.dateTo);
  const formattedFrom = `${dateFrom.getDate()}/${dateFrom.getMonth() + 1}/${dateFrom.getFullYear()}`;
  const formattedTo = `${dateTo.getDate()}/${dateTo.getMonth() + 1}/${dateTo.getFullYear()}`;

  return `السلام عليكم ورحمة الله وبركاته
عميلنا العزيز / ${data.customerName}
تم حجز موعدكم في ${departmentTitle}

📅 الموعد متوقع بين ${formattedFrom} و ${formattedTo}
سيتم إبلاغكم بالتاريخ المحدد قريباً

نتمنى لكم تجربة سعيدة
ألوان المسافر للخدمات`;
};

// دالة تحويل الأرقام العربية للإنجليزية
const convertArabicToEnglish = (str) => {
  if (!str) return str;
  const arabicNums = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  let result = str.toString();
  for (let i = 0; i < arabicNums.length; i++) {
    result = result.replace(new RegExp(arabicNums[i], 'g'), i.toString());
  }
  return result;
};

// دالة لتنظيف النص للـ PDF (إزالة الأحرف غير المدعومة)
const cleanTextForPDF = (text) => {
  if (!text) return 'N/A';
  // إذا كان النص يحتوي على عربي فقط، نعيده كما هو لأن jsPDF لا يدعمه
  // نحاول عرض النص بشكل عكسي للعربية أو نستخدم transliteration بسيطة
  return text;
};

// دالة للتحقق من أن اليوم ليس جمعة أو سبت
const isWeekend = (date) => {
  const day = new Date(date).getDay();
  return day === 5 || day === 6;
};

// دالة لتنسيق التاريخ بالعربي
const formatDateArabic = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
};

// توليد قائمة الساعات الديناميكية
const generateHourOptions = (startHour = 8, endHour = 14) => {
  const options = [];
  for (let hour = startHour; hour <= endHour; hour++) {
    const h = hour.toString().padStart(2, '0');
    const period = hour < 12 ? 'ص' : 'م';
    const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
    options.push({ value: h, label: `${displayHour} ${period}` });
  }
  return options;
};

// توليد قائمة الدقائق الديناميكية
const generateMinuteOptions = (minuteIntervals = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]) => {
  return minuteIntervals.map(minute => ({
    value: minute.toString().padStart(2, '0'),
    label: minute.toString().padStart(2, '0')
  }));
};

// توليد ساعات العمل الديناميكية (للتوافق مع وقت التذكير)
const generateHourSlots = (startHour = 8, endHour = 14, minuteIntervals = [0]) => {
  const slots = [];
  for (let hour = startHour; hour <= endHour; hour++) {
    for (const minute of minuteIntervals) {
      const h = hour.toString().padStart(2, '0');
      const m = minute.toString().padStart(2, '0');
      const period = hour < 12 ? 'ص' : 'م';
      const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
      slots.push({ value: `${h}:${m}`, label: `${displayHour}:${m} ${period}` });
    }
  }
  return slots;
};

// الإعدادات الافتراضية
const DEFAULT_HOUR_OPTIONS = generateHourOptions(8, 14);
const DEFAULT_MINUTE_OPTIONS = generateMinuteOptions([0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]);
const DEFAULT_HOUR_SLOTS = generateHourSlots(8, 14, [0]);
const STORAGE_KEY = 'appointmentFormDraft';

const AddAppointment = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const appointmentType = searchParams.get('type') || 'confirmed';
  const editId = searchParams.get('edit');

  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [editingAppointment, setEditingAppointment] = useState(null);

  // حالات نافذة النجاح
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [savedAppointmentData, setSavedAppointmentData] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);

  // استعادة البيانات المحفوظة
  const getSavedData = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && !editId) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Error reading saved form data:', e);
    }
    return null;
  };

  const savedData = getSavedData();

  const [formData, setFormData] = useState({
    type: appointmentType || savedData?.type || 'confirmed',
    customerName: savedData?.customerName || '',
    customer: savedData?.customer || '',
    phone: savedData?.phone || '',
    personsCount: savedData?.personsCount || 1,
    isSubmission: savedData?.isSubmission || false,
    isVIP: savedData?.isVIP || false,
    visibility: savedData?.visibility || 'private',
    appointmentDate: savedData?.appointmentDate || '',
    appointmentHour: savedData?.appointmentHour || '08',
    appointmentMinute: savedData?.appointmentMinute || '00',
    appointmentTime: savedData?.appointmentTime || '08:00',
    dateFrom: savedData?.dateFrom || '',
    dateTo: savedData?.dateTo || '',
    reminderEnabled: savedData?.reminderEnabled ?? true,
    reminderDate: savedData?.reminderDate || '',
    reminderTime: savedData?.reminderTime || '08:00',
    department: savedData?.department || '',
    city: savedData?.city || 'الرياض',
    notes: savedData?.notes || '',
    // بيانات الدفع
    paymentType: savedData?.paymentType || '',
    totalAmount: savedData?.totalAmount || '',
    paidAmount: savedData?.paidAmount || ''
  });

  const [availableCities, setAvailableCities] = useState(['الرياض']);
  const [customerInputMode, setCustomerInputMode] = useState(savedData?.customerInputMode || 'manual');
  const [attachments, setAttachments] = useState([]);
  const [dateError, setDateError] = useState('');

  // إعدادات المواعيد الديناميكية
  const [appointmentSettings, setAppointmentSettings] = useState({
    startHour: 8,
    endHour: 14,
    minuteIntervals: [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]
  });
  const [hourOptions, setHourOptions] = useState(DEFAULT_HOUR_OPTIONS);
  const [minuteOptions, setMinuteOptions] = useState(DEFAULT_MINUTE_OPTIONS);
  const [hourSlots, setHourSlots] = useState(DEFAULT_HOUR_SLOTS);

  // حساب نسبة اكتمال النموذج
  const calculateProgress = () => {
    let total = 0;
    let filled = 0;

    // الحقول المشتركة
    total += 2; // اسم العميل + رقم الجوال
    if (formData.customerName) filled++;
    if (formData.phone) filled++;

    if (formData.type === 'confirmed') {
      total += 4; // تاريخ + وقت + قسم + مدينة
      if (formData.appointmentDate) filled++;
      if (formData.appointmentTime) filled++;
      if (formData.department) filled++;
      if (formData.city) filled++;
    } else if (formData.type === 'unconfirmed') {
      total += 4; // من + إلى + قسم + مدينة
      if (formData.dateFrom) filled++;
      if (formData.dateTo) filled++;
      if (formData.department) filled++;
      if (formData.city) filled++;
    } else if (formData.type === 'draft') {
      if (formData.reminderEnabled) {
        total += 2;
        if (formData.reminderDate) filled++;
        if (formData.reminderTime) filled++;
      }
    }

    return Math.round((filled / total) * 100);
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setFormData(prev => ({ ...prev, type: appointmentType }));
  }, [appointmentType]);

  // حفظ البيانات تلقائياً
  useEffect(() => {
    if (!editId) {
      const dataToSave = { ...formData, customerInputMode };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    }
  }, [formData, customerInputMode, editId]);

  // تحديث المدن عند تغيير القسم
  useEffect(() => {
    if (formData.department) {
      const selectedDept = departments.find(d => d._id === formData.department);
      if (selectedDept && selectedDept.cities && selectedDept.cities.length > 0) {
        const cityNames = selectedDept.cities.map(c => typeof c === 'object' ? c.name : c);
        setAvailableCities(cityNames);
        if (!cityNames.includes(formData.city)) {
          setFormData(prev => ({ ...prev, city: cityNames[0] }));
        }
      } else {
        setAvailableCities(['الرياض']);
      }
    } else {
      setAvailableCities(['الرياض']);
    }
  }, [formData.department, departments]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [departmentsRes, customersRes, settingsRes] = await Promise.all([
        departmentsApi.getDepartments(),
        customersApi.getCustomers(),
        settingsApi.getSettings()
      ]);

      const depts = departmentsRes.data?.data?.departments || departmentsRes.data?.departments || [];
      const custs = customersRes.data?.data?.customers || customersRes.data?.customers || [];

      // تحميل إعدادات المواعيد
      const settings = settingsRes.data?.data || {};
      if (settings.appointmentSettings) {
        const apptSettings = settings.appointmentSettings;
        setAppointmentSettings(apptSettings);

        // توليد قائمة الساعات الديناميكية
        const newHourOptions = generateHourOptions(
          apptSettings.startHour || 8,
          apptSettings.endHour || 14
        );
        setHourOptions(newHourOptions);

        // توليد قائمة الدقائق الديناميكية
        const newMinuteOptions = generateMinuteOptions(
          apptSettings.minuteIntervals || [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]
        );
        setMinuteOptions(newMinuteOptions);

        // توليد ساعات العمل الديناميكية (للتوافق مع وقت التذكير)
        const newHourSlots = generateHourSlots(
          apptSettings.startHour || 8,
          apptSettings.endHour || 14,
          apptSettings.minuteIntervals || [0]
        );
        setHourSlots(newHourSlots);
      }

      setDepartments(depts);
      setCustomers(custs);

      // إذا كان تعديل، جلب بيانات الموعد
      if (editId) {
        const appointmentRes = await appointmentsApi.getAppointment(editId);
        const appointment = appointmentRes.data?.data?.appointment || appointmentRes.data?.appointment;
        if (appointment) {
          setEditingAppointment(appointment);
          const getDateStr = (date) => date ? new Date(date).toISOString().split('T')[0] : '';

          // فصل الوقت إلى ساعة ودقائق
          const timeParts = (appointment.appointmentTime || '08:00').split(':');
          const apptHour = timeParts[0] || '08';
          const apptMinute = timeParts[1] || '00';

          setFormData({
            type: appointment.type || 'confirmed',
            customerName: appointment.customerName || '',
            customer: appointment.customer?._id || '',
            phone: appointment.phone || '',
            personsCount: appointment.personsCount || 1,
            isSubmission: appointment.isSubmission || false,
            isVIP: appointment.isVIP || false,
            visibility: appointment.visibility || 'private',
            appointmentDate: getDateStr(appointment.appointmentDate),
            appointmentHour: apptHour,
            appointmentMinute: apptMinute,
            appointmentTime: appointment.appointmentTime || '08:00',
            dateFrom: getDateStr(appointment.dateFrom),
            dateTo: getDateStr(appointment.dateTo),
            reminderEnabled: appointment.reminderEnabled ?? true,
            reminderDate: getDateStr(appointment.reminderDate),
            reminderTime: appointment.reminderTime || '08:00',
            department: appointment.department?._id || '',
            city: appointment.city || 'الرياض',
            notes: appointment.notes || '',
            paymentType: appointment.paymentType || '',
            totalAmount: appointment.totalAmount || '',
            paidAmount: appointment.paidAmount || ''
          });

          if (appointment.customer) {
            setCustomerInputMode('select');
          }

          if (appointment.attachments) {
            setAttachments(appointment.attachments);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let newValue = type === 'checkbox' ? checked : value;

    if (name === 'phone') {
      newValue = convertArabicToEnglish(newValue);
    }

    // تحديث appointmentTime عند تغيير الساعة أو الدقائق
    if (name === 'appointmentHour') {
      setFormData(prev => ({
        ...prev,
        appointmentHour: newValue,
        appointmentTime: `${newValue}:${prev.appointmentMinute}`
      }));
      return;
    }

    if (name === 'appointmentMinute') {
      setFormData(prev => ({
        ...prev,
        appointmentMinute: newValue,
        appointmentTime: `${prev.appointmentHour}:${newValue}`
      }));
      return;
    }

    setFormData(prev => ({ ...prev, [name]: newValue }));

    if (name === 'appointmentDate' || name === 'dateFrom' || name === 'dateTo' || name === 'reminderDate') {
      if (newValue && isWeekend(newValue)) {
        setDateError('لا يمكن اختيار يوم الجمعة أو السبت (إجازة)');
      } else {
        setDateError('');
      }
    }

    if (name === 'customer' && value) {
      const selectedCustomer = customers.find(c => c._id === value);
      if (selectedCustomer) {
        setFormData(prev => ({
          ...prev,
          customerName: selectedCustomer.name,
          phone: convertArabicToEnglish(selectedCustomer.phone || ''),
          isVIP: selectedCustomer.isVIP || false
        }));
      }
    }
  };

  const handleCustomerModeChange = (mode) => {
    setCustomerInputMode(mode);
    if (mode === 'manual') {
      setFormData(prev => ({ ...prev, customer: '' }));
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => {
      const isValidType = file.type.startsWith('image/') || file.type === 'application/pdf';
      const isValidSize = file.size <= 5 * 1024 * 1024;
      return isValidType && isValidSize;
    });

    if (validFiles.length !== files.length) {
      alert('بعض الملفات غير مدعومة أو تتجاوز الحجم المسموح (5MB)');
    }

    const newAttachments = validFiles.map(file => ({
      file,
      filename: URL.createObjectURL(file),
      originalName: file.name,
      mimetype: file.type,
      size: file.size,
      isNew: true
    }));

    setAttachments(prev => [...prev, ...newAttachments]);
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveDraft = async () => {
    // حفظ كمسودة
    try {
      setSaving(true);
      const draftData = {
        ...formData,
        type: 'draft',
        status: 'new'
      };

      if (editingAppointment) {
        await appointmentsApi.updateAppointment(editingAppointment._id, draftData);
      } else {
        await appointmentsApi.createAppointment(draftData);
      }

      localStorage.removeItem(STORAGE_KEY);
      navigate('/control/appointments');
    } catch (error) {
      console.error('Error saving draft:', error);
      alert(error.response?.data?.message || 'حدث خطأ أثناء الحفظ');
    } finally {
      setSaving(false);
    }
  };

  // دالة نسخ الرسالة
  const handleCopyMessage = async () => {
    if (!savedAppointmentData) return;
    const dept = departments.find(d => d._id === savedAppointmentData.department);
    const deptTitle = dept?.title || '';
    const message = savedAppointmentData.type === 'confirmed'
      ? generateConfirmedMessage(savedAppointmentData, deptTitle)
      : generateUnconfirmedMessage(savedAppointmentData, deptTitle);

    try {
      await navigator.clipboard.writeText(message);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // دالة إرسال واتساب
  const handleSendWhatsApp = () => {
    if (!savedAppointmentData) return;
    const dept = departments.find(d => d._id === savedAppointmentData.department);
    const deptTitle = dept?.title || '';
    const message = savedAppointmentData.type === 'confirmed'
      ? generateConfirmedMessage(savedAppointmentData, deptTitle)
      : generateUnconfirmedMessage(savedAppointmentData, deptTitle);

    const phone = savedAppointmentData.phone?.replace(/[^0-9]/g, '');
    const phoneNumber = phone?.startsWith('0') ? '966' + phone.slice(1) : phone;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = phoneNumber
      ? `https://wa.me/${phoneNumber}?text=${encodedMessage}`
      : `https://wa.me/?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  // دالة تحميل PDF مع دعم العربية
  const handleDownloadPDF = async () => {
    if (!savedAppointmentData) return;

    try {
      const dept = departments.find(d => d._id === savedAppointmentData.department);
      await generateAppointmentReceipt(savedAppointmentData, {
        departmentTitle: dept?.title || 'غير محدد',
        employeeName: 'موظف النظام'
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('حدث خطأ أثناء إنشاء ملف PDF');
    }
  };

  // دالة إغلاق نافذة النجاح والعودة للمواعيد
  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    setSavedAppointmentData(null);
    navigate('/control/appointments');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.customerName.trim()) {
      alert('اسم العميل مطلوب');
      return;
    }

    if (formData.type === 'confirmed') {
      if (!formData.department) {
        alert('القسم مطلوب');
        return;
      }
      if (!formData.appointmentDate) {
        alert('تاريخ الموعد مطلوب');
        return;
      }
      if (isWeekend(formData.appointmentDate)) {
        alert('لا يمكن اختيار يوم الجمعة أو السبت');
        return;
      }
    } else if (formData.type === 'unconfirmed') {
      if (!formData.department) {
        alert('القسم مطلوب');
        return;
      }
      if (!formData.dateFrom || !formData.dateTo) {
        alert('يجب تحديد تاريخ البداية والنهاية');
        return;
      }
      if (new Date(formData.dateFrom) > new Date(formData.dateTo)) {
        alert('تاريخ البداية يجب أن يكون قبل تاريخ النهاية');
        return;
      }
    } else if (formData.type === 'draft') {
      if (formData.reminderEnabled && (!formData.reminderDate || !formData.reminderTime)) {
        alert('يجب تحديد تاريخ ووقت التذكير');
        return;
      }
    }

    setSaving(true);
    try {
      const dataToSubmit = {
        ...formData,
        personsCount: parseInt(formData.personsCount) || 1,
        totalAmount: parseFloat(formData.totalAmount) || 0,
        paidAmount: parseFloat(formData.paidAmount) || 0
      };

      if (!dataToSubmit.customer) {
        delete dataToSubmit.customer;
      }

      const newFiles = attachments.filter(a => a.isNew).map(a => a.file);
      const existingAttachments = attachments.filter(a => !a.isNew);

      dataToSubmit.existingAttachments = existingAttachments;
      dataToSubmit.newFiles = newFiles;

      if (editingAppointment) {
        await appointmentsApi.updateAppointment(editingAppointment._id, dataToSubmit);
        localStorage.removeItem(STORAGE_KEY);
        navigate('/control/appointments');
      } else {
        await appointmentsApi.createAppointment(dataToSubmit);
        localStorage.removeItem(STORAGE_KEY);
        // عرض نافذة النجاح بدلاً من الانتقال مباشرة
        if (formData.type !== 'draft') {
          setSavedAppointmentData(dataToSubmit);
          setShowSuccessModal(true);
        } else {
          navigate('/control/appointments');
        }
      }
    } catch (error) {
      console.error('Error saving appointment:', error);
      alert(error.response?.data?.message || 'حدث خطأ أثناء الحفظ');
    } finally {
      setSaving(false);
    }
  };

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const getTitle = () => {
    if (editingAppointment) return 'تعديل الموعد';
    const titles = {
      confirmed: 'إضافة موعد مؤكد',
      unconfirmed: 'إضافة موعد غير مؤكد',
      draft: 'إضافة مسودة'
    };
    return titles[appointmentType] || 'إضافة موعد جديد';
  };

  const progress = calculateProgress();

  if (loading) {
    return <Loader fullScreen />;
  }

  return (
    <div className="add-appointment-page">
      {/* Header */}
      <div className="page-header-bar">
        <button className="back-btn" onClick={() => navigate('/control/appointments')}>
          <span>←</span>
          عودة
        </button>
        <h1 className="page-title">{getTitle()}</h1>
        <div className="header-spacer"></div>
      </div>

      <form className="appointment-form-page" onSubmit={handleSubmit}>
        <div className="form-content-wrapper">
          {/* ========== موعد مؤكد ========== */}
          {formData.type === 'confirmed' && (
            <>
              {/* بيانات العميل */}
              <div className="form-section">
                <div className="section-title">
                  <span className="section-icon">👤</span>
                  <h4>بيانات العميل</h4>
                </div>

                <div className="customer-mode-toggle">
                  <button
                    type="button"
                    className={`mode-btn ${customerInputMode === 'manual' ? 'active' : ''}`}
                    onClick={() => handleCustomerModeChange('manual')}
                  >
                    إدخال يدوي
                  </button>
                  <button
                    type="button"
                    className={`mode-btn ${customerInputMode === 'select' ? 'active' : ''}`}
                    onClick={() => handleCustomerModeChange('select')}
                  >
                    اختيار من العملاء
                  </button>
                </div>

                {customerInputMode === 'select' && (
                  <div className="form-group full-width">
                    <label>اختر العميل</label>
                    <select
                      name="customer"
                      value={formData.customer}
                      onChange={handleChange}
                      className="form-select"
                    >
                      <option value="">-- اختر عميل --</option>
                      {customers.map(customer => (
                        <option key={customer._id} value={customer._id}>
                          {customer.isVIP && '⭐ '}{customer.name} {customer.phone ? `(${customer.phone})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="form-grid">
                  <div className="form-group">
                    <label>اسم العميل <span className="required">*</span></label>
                    <div className="input-with-badge">
                      <input
                        type="text"
                        name="customerName"
                        value={formData.customerName}
                        onChange={handleChange}
                        placeholder="أدخل اسم العميل"
                        className="form-input"
                        readOnly={customerInputMode === 'select' && formData.customer}
                      />
                      {formData.isVIP && <span className="vip-badge">⭐ VIP</span>}
                    </div>
                  </div>
                  <div className="form-group">
                    <label>عدد الأشخاص</label>
                    <select
                      name="personsCount"
                      value={formData.personsCount}
                      onChange={handleChange}
                      className="form-select"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>رقم الجوال</label>
                    <PhoneInput
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="05XX XXX XXXX"
                    />
                  </div>
                  <div className="form-group checkbox-inline">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="isSubmission"
                        checked={formData.isSubmission}
                        onChange={handleChange}
                      />
                      <span className="checkbox-text">تقديم</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* تاريخ ووقت الموعد */}
              <div className="form-section">
                <div className="section-title">
                  <span className="section-icon">📅</span>
                  <h4>تاريخ ووقت الموعد</h4>
                </div>

                <div className="form-group">
                  <label>تاريخ الموعد <span className="required">*</span></label>
                  <input
                    type="date"
                    name="appointmentDate"
                    value={formData.appointmentDate}
                    onChange={handleChange}
                    min={getMinDate()}
                    className={`form-input ${dateError ? 'error' : ''}`}
                  />
                  {formData.appointmentDate && !dateError && (
                    <span className="date-preview">{formatDateArabic(formData.appointmentDate)}</span>
                  )}
                  {dateError && <span className="error-text">{dateError}</span>}
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>الساعة <span className="required">*</span></label>
                    <select
                      name="appointmentHour"
                      value={formData.appointmentHour}
                      onChange={handleChange}
                      className="form-select"
                    >
                      {hourOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>الدقائق <span className="required">*</span></label>
                    <select
                      name="appointmentMinute"
                      value={formData.appointmentMinute}
                      onChange={handleChange}
                      className="form-select"
                    >
                      {minuteOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* الأقسام / السفارات والمدينة */}
              <div className="form-section">
                <div className="section-title">
                  <span className="section-icon">🏬</span>
                  <h4>الأقسام / السفارات والمدينة</h4>
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label>الأقسام / السفارات <span className="required">*</span></label>
                    <select
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      className="form-select"
                    >
                      <option value="">-- اختر القسم / السفارة --</option>
                      {departments.map(dept => (
                        <option key={dept._id} value={dept._id}>{dept.title}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>اختر المدينة</label>
                    <select
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className="form-select"
                      disabled={!formData.department}
                    >
                      {availableCities.map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* المرفقات */}
              <div className="form-section">
                <div className="section-title">
                  <span className="section-icon">📎</span>
                  <h4>المرفقات (اختياري)</h4>
                </div>
                <div className="attachments-area">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*,.pdf"
                    multiple
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    className="upload-btn"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <span>📤</span> رفع ملفات (صور / PDF)
                  </button>
                  {attachments.length > 0 && (
                    <div className="attachments-list">
                      {attachments.map((file, index) => (
                        <div key={index} className="attachment-item">
                          <span className="attachment-icon">
                            {file.mimetype?.includes('image') ? '🖼️' : '📄'}
                          </span>
                          <span className="attachment-name">{file.originalName || file.filename}</span>
                          <button
                            type="button"
                            className="remove-attachment"
                            onClick={() => removeAttachment(index)}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* ملاحظات */}
              <div className="form-section">
                <div className="section-title">
                  <span className="section-icon">📝</span>
                  <h4>ملاحظات</h4>
                </div>
                <div className="form-group">
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="أضف ملاحظات إضافية..."
                    className="form-textarea"
                    rows="3"
                  />
                </div>
              </div>

              {/* بيانات الدفع */}
              <div className="form-section">
                <div className="section-title">
                  <span className="section-icon">💳</span>
                  <h4>بيانات الدفع (اختياري)</h4>
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label>طريقة الدفع</label>
                    <select
                      name="paymentType"
                      value={formData.paymentType}
                      onChange={handleChange}
                      className="form-select"
                    >
                      <option value="">-- اختر طريقة الدفع --</option>
                      <option value="cash">نقدي</option>
                      <option value="card">شبكة</option>
                      <option value="transfer">تحويل</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>المبلغ الإجمالي (ريال)</label>
                    <NumberInput
                      name="totalAmount"
                      value={formData.totalAmount}
                      onChange={handleChange}
                      placeholder="0"
                      className="form-input"
                      min={0}
                      allowDecimal={true}
                      suffix="SAR"
                    />
                  </div>
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label>المبلغ المدفوع (ريال)</label>
                    <NumberInput
                      name="paidAmount"
                      value={formData.paidAmount}
                      onChange={handleChange}
                      placeholder="0"
                      className="form-input"
                      min={0}
                      allowDecimal={true}
                      suffix="SAR"
                    />
                  </div>
                  <div className="form-group">
                    <label>المبلغ المتبقي (ريال)</label>
                    <div className={`remaining-amount ${(parseFloat(formData.totalAmount) || 0) - (parseFloat(formData.paidAmount) || 0) > 0 ? 'has-remaining' : ''}`}>
                      {((parseFloat(formData.totalAmount) || 0) - (parseFloat(formData.paidAmount) || 0)).toFixed(2)} ريال
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ========== موعد غير مؤكد ========== */}
          {formData.type === 'unconfirmed' && (
            <>
              {/* بيانات العميل */}
              <div className="form-section">
                <div className="section-title">
                  <span className="section-icon">👤</span>
                  <h4>بيانات العميل</h4>
                </div>

                <div className="customer-mode-toggle">
                  <button
                    type="button"
                    className={`mode-btn ${customerInputMode === 'manual' ? 'active' : ''}`}
                    onClick={() => handleCustomerModeChange('manual')}
                  >
                    إدخال يدوي
                  </button>
                  <button
                    type="button"
                    className={`mode-btn ${customerInputMode === 'select' ? 'active' : ''}`}
                    onClick={() => handleCustomerModeChange('select')}
                  >
                    اختيار من العملاء
                  </button>
                </div>

                {customerInputMode === 'select' && (
                  <div className="form-group full-width">
                    <label>اختر العميل</label>
                    <select
                      name="customer"
                      value={formData.customer}
                      onChange={handleChange}
                      className="form-select"
                    >
                      <option value="">-- اختر عميل --</option>
                      {customers.map(customer => (
                        <option key={customer._id} value={customer._id}>
                          {customer.isVIP && '⭐ '}{customer.name} {customer.phone ? `(${customer.phone})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="form-grid">
                  <div className="form-group">
                    <label>اسم العميل <span className="required">*</span></label>
                    <div className="input-with-badge">
                      <input
                        type="text"
                        name="customerName"
                        value={formData.customerName}
                        onChange={handleChange}
                        placeholder="أدخل اسم العميل"
                        className="form-input"
                        readOnly={customerInputMode === 'select' && formData.customer}
                      />
                      {formData.isVIP && <span className="vip-badge">⭐ VIP</span>}
                    </div>
                  </div>
                  <div className="form-group">
                    <label>عدد الأشخاص</label>
                    <select
                      name="personsCount"
                      value={formData.personsCount}
                      onChange={handleChange}
                      className="form-select"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>رقم الجوال</label>
                    <PhoneInput
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="05XX XXX XXXX"
                    />
                  </div>
                  <div className="form-group checkbox-inline">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="isSubmission"
                        checked={formData.isSubmission}
                        onChange={handleChange}
                      />
                      <span className="checkbox-text">تقديم</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* نطاق التاريخ */}
              <div className="form-section">
                <div className="section-title">
                  <span className="section-icon">📅</span>
                  <h4>نطاق التاريخ المتوقع</h4>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>من تاريخ <span className="required">*</span></label>
                    <input
                      type="date"
                      name="dateFrom"
                      value={formData.dateFrom}
                      onChange={handleChange}
                      min={getMinDate()}
                      className="form-input"
                    />
                    {formData.dateFrom && (
                      <span className="date-preview">{formatDateArabic(formData.dateFrom)}</span>
                    )}
                  </div>
                  <div className="form-group">
                    <label>إلى تاريخ <span className="required">*</span></label>
                    <input
                      type="date"
                      name="dateTo"
                      value={formData.dateTo}
                      onChange={handleChange}
                      min={formData.dateFrom || getMinDate()}
                      className="form-input"
                    />
                    {formData.dateTo && (
                      <span className="date-preview">{formatDateArabic(formData.dateTo)}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* الأقسام / السفارات والمدينة */}
              <div className="form-section">
                <div className="section-title">
                  <span className="section-icon">🏬</span>
                  <h4>الأقسام / السفارات والمدينة</h4>
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label>الأقسام / السفارات <span className="required">*</span></label>
                    <select
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      className="form-select"
                    >
                      <option value="">-- اختر القسم / السفارة --</option>
                      {departments.map(dept => (
                        <option key={dept._id} value={dept._id}>{dept.title}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>اختر المدينة</label>
                    <select
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className="form-select"
                      disabled={!formData.department}
                    >
                      {availableCities.map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* المرفقات */}
              <div className="form-section">
                <div className="section-title">
                  <span className="section-icon">📎</span>
                  <h4>المرفقات (اختياري)</h4>
                </div>
                <div className="attachments-area">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*,.pdf"
                    multiple
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    className="upload-btn"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <span>📤</span> رفع ملفات (صور / PDF)
                  </button>
                  {attachments.length > 0 && (
                    <div className="attachments-list">
                      {attachments.map((file, index) => (
                        <div key={index} className="attachment-item">
                          <span className="attachment-icon">
                            {file.mimetype?.includes('image') ? '🖼️' : '📄'}
                          </span>
                          <span className="attachment-name">{file.originalName || file.filename}</span>
                          <button
                            type="button"
                            className="remove-attachment"
                            onClick={() => removeAttachment(index)}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* ملاحظات */}
              <div className="form-section">
                <div className="section-title">
                  <span className="section-icon">📝</span>
                  <h4>ملاحظات</h4>
                </div>
                <div className="form-group">
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="أضف ملاحظات إضافية..."
                    className="form-textarea"
                    rows="3"
                  />
                </div>
              </div>

              {/* بيانات الدفع */}
              <div className="form-section">
                <div className="section-title">
                  <span className="section-icon">💳</span>
                  <h4>بيانات الدفع (اختياري)</h4>
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label>طريقة الدفع</label>
                    <select
                      name="paymentType"
                      value={formData.paymentType}
                      onChange={handleChange}
                      className="form-select"
                    >
                      <option value="">-- اختر طريقة الدفع --</option>
                      <option value="cash">نقدي</option>
                      <option value="card">شبكة</option>
                      <option value="transfer">تحويل</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>المبلغ الإجمالي (ريال)</label>
                    <NumberInput
                      name="totalAmount"
                      value={formData.totalAmount}
                      onChange={handleChange}
                      placeholder="0"
                      className="form-input"
                      min={0}
                      allowDecimal={true}
                      suffix="SAR"
                    />
                  </div>
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label>المبلغ المدفوع (ريال)</label>
                    <NumberInput
                      name="paidAmount"
                      value={formData.paidAmount}
                      onChange={handleChange}
                      placeholder="0"
                      className="form-input"
                      min={0}
                      allowDecimal={true}
                      suffix="SAR"
                    />
                  </div>
                  <div className="form-group">
                    <label>المبلغ المتبقي (ريال)</label>
                    <div className={`remaining-amount ${(parseFloat(formData.totalAmount) || 0) - (parseFloat(formData.paidAmount) || 0) > 0 ? 'has-remaining' : ''}`}>
                      {((parseFloat(formData.totalAmount) || 0) - (parseFloat(formData.paidAmount) || 0)).toFixed(2)} ريال
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ========== مسودة ========== */}
          {formData.type === 'draft' && (
            <>
              {/* بيانات العميل */}
              <div className="form-section">
                <div className="section-title">
                  <span className="section-icon">👤</span>
                  <h4>بيانات العميل</h4>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>اسم العميل <span className="required">*</span></label>
                    <input
                      type="text"
                      name="customerName"
                      value={formData.customerName}
                      onChange={handleChange}
                      placeholder="أدخل اسم العميل"
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>رقم الجوال</label>
                    <PhoneInput
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="05XX XXX XXXX"
                    />
                  </div>
                </div>
              </div>

              {/* الخصوصية */}
              <div className="form-section">
                <div className="section-title">
                  <span className="section-icon">🔒</span>
                  <h4>الخصوصية</h4>
                </div>
                <div className="visibility-toggle">
                  <button
                    type="button"
                    className={`visibility-btn ${formData.visibility === 'private' ? 'active' : ''}`}
                    onClick={() => setFormData(prev => ({ ...prev, visibility: 'private' }))}
                  >
                    <span>🔒</span>
                    خاص
                  </button>
                  <button
                    type="button"
                    className={`visibility-btn ${formData.visibility === 'public' ? 'active' : ''}`}
                    onClick={() => setFormData(prev => ({ ...prev, visibility: 'public' }))}
                  >
                    <span>🌐</span>
                    عام
                  </button>
                </div>
                <p className="visibility-hint">
                  {formData.visibility === 'private'
                    ? 'هذه المسودة مرئية لك فقط'
                    : 'هذه المسودة مرئية لجميع الموظفين'}
                </p>
              </div>

              {/* التذكير */}
              <div className="form-section">
                <div className="section-title">
                  <span className="section-icon">⏰</span>
                  <h4>التذكير (اختياري)</h4>
                </div>

                <div className="reminder-toggle">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="reminderEnabled"
                      checked={formData.reminderEnabled}
                      onChange={handleChange}
                    />
                    <span className="checkbox-text">تفعيل التذكير</span>
                  </label>
                </div>

                {formData.reminderEnabled && (
                  <div className="form-grid">
                    <div className="form-group">
                      <label>تاريخ التذكير</label>
                      <input
                        type="date"
                        name="reminderDate"
                        value={formData.reminderDate}
                        onChange={handleChange}
                        className="form-input"
                      />
                      {formData.reminderDate && (
                        <span className="date-preview">{formatDateArabic(formData.reminderDate)}</span>
                      )}
                    </div>
                    <div className="form-group">
                      <label>وقت التذكير</label>
                      <select
                        name="reminderTime"
                        value={formData.reminderTime}
                        onChange={handleChange}
                        className="form-select"
                      >
                        {hourSlots.map(slot => (
                          <option key={slot.value} value={slot.value}>{slot.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* ملاحظات */}
              <div className="form-section">
                <div className="section-title">
                  <span className="section-icon">📝</span>
                  <h4>ملاحظات</h4>
                </div>
                <div className="form-group">
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="أضف ملاحظات إضافية..."
                    className="form-textarea"
                    rows="4"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* شريط التقدم وأزرار الإجراءات */}
        <div className="form-footer">
          <div className="progress-section">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }}></div>
            </div>
            <span className="progress-text">{progress}% مكتمل</span>
          </div>

          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={() => navigate('/control/appointments')}>
              إلغاء
            </button>
            {formData.type !== 'draft' && (
              <button type="button" className="draft-btn" onClick={handleSaveDraft} disabled={saving}>
                <span>💾</span>
                حفظ كمسودة
              </button>
            )}
            <button type="submit" className="submit-btn" disabled={saving}>
              {saving ? 'جاري الحفظ...' : (editingAppointment ? 'حفظ التعديلات' : '+ إضافة الموعد')}
            </button>
          </div>
        </div>
      </form>

      {/* نافذة النجاح */}
      {showSuccessModal && (
        <div className="success-modal-overlay">
          <div className="success-modal">
            <div className="success-modal-header">
              <div className="success-icon">✓</div>
              <h3>تم حفظ الموعد بنجاح!</h3>
              <p>يمكنك الآن إرسال تفاصيل الموعد للعميل</p>
            </div>

            <div className="success-modal-content">
              <div className="message-preview">
                <pre>
                  {savedAppointmentData && (
                    savedAppointmentData.type === 'confirmed'
                      ? generateConfirmedMessage(savedAppointmentData, departments.find(d => d._id === savedAppointmentData.department)?.title || '')
                      : generateUnconfirmedMessage(savedAppointmentData, departments.find(d => d._id === savedAppointmentData.department)?.title || '')
                  )}
                </pre>
              </div>
            </div>

            <div className="success-modal-actions">
              <button
                type="button"
                className={`modal-action-btn copy-btn ${copySuccess ? 'success' : ''}`}
                onClick={handleCopyMessage}
              >
                <span>{copySuccess ? '✓' : '📋'}</span>
                {copySuccess ? 'تم النسخ!' : 'نسخ الرسالة'}
              </button>

              <button
                type="button"
                className="modal-action-btn whatsapp-btn"
                onClick={handleSendWhatsApp}
              >
                <span>📱</span>
                إرسال واتساب
              </button>

              <button
                type="button"
                className="modal-action-btn pdf-btn"
                onClick={handleDownloadPDF}
              >
                <span>📄</span>
                تحميل PDF
              </button>
            </div>

            <button
              type="button"
              className="modal-close-btn"
              onClick={handleCloseSuccessModal}
            >
              إغلاق والعودة للمواعيد
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddAppointment;
