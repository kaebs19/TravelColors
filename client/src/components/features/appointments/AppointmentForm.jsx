import { useState, useEffect, useRef } from 'react';
import './AppointmentForm.css';

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

// دالة للتحقق من أن اليوم ليس جمعة أو سبت
const isWeekend = (date) => {
  const day = new Date(date).getDay();
  return day === 5 || day === 6; // الجمعة = 5، السبت = 6
};

// دالة لتنسيق التاريخ بالعربي
const formatDateArabic = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

  return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
};

// توليد ساعات العمل من 8 صباحاً إلى 2 ظهراً
const generateHourSlots = () => {
  const slots = [];
  for (let hour = 8; hour <= 14; hour++) {
    const h = hour.toString().padStart(2, '0');
    const period = hour < 12 ? 'ص' : 'م';
    const displayHour = hour > 12 ? hour - 12 : hour;
    slots.push({
      value: `${h}:00`,
      label: `${displayHour} ${period}`
    });
  }
  return slots;
};

// خيارات الدقائق (المدة)
const durationOptions = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

const hourSlots = generateHourSlots();

const STORAGE_KEY = 'appointmentFormDraft';

const AppointmentForm = ({ appointment, appointmentType, departments, customers, onSubmit, onCancel }) => {
  const fileInputRef = useRef(null);

  // استعادة البيانات المحفوظة
  const getSavedData = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && !appointment) {
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
    // للموعد المؤكد
    appointmentDate: savedData?.appointmentDate || '',
    appointmentTime: savedData?.appointmentTime || '08:00',
    duration: savedData?.duration || 5,
    // للموعد غير المؤكد
    dateFrom: savedData?.dateFrom || '',
    dateTo: savedData?.dateTo || '',
    // للمسودة
    reminderDate: savedData?.reminderDate || '',
    reminderTime: savedData?.reminderTime || '08:00',
    // مشترك
    department: savedData?.department || '',
    city: savedData?.city || 'الرياض',
    notes: savedData?.notes || ''
  });
  const [loading, setLoading] = useState(false);
  const [availableCities, setAvailableCities] = useState(['الرياض']);
  const [customerInputMode, setCustomerInputMode] = useState(savedData?.customerInputMode || 'manual');
  const [attachments, setAttachments] = useState([]);
  const [dateError, setDateError] = useState('');

  // حفظ البيانات تلقائياً عند التغيير
  useEffect(() => {
    if (!appointment) {
      const dataToSave = {
        ...formData,
        customerInputMode
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    }
  }, [formData, customerInputMode, appointment]);

  // تحديث النوع عند تغييره من الخارج
  useEffect(() => {
    if (appointmentType && !appointment) {
      setFormData(prev => ({ ...prev, type: appointmentType }));
    }
  }, [appointmentType, appointment]);

  // تحديث المدن عند تغيير القسم
  useEffect(() => {
    if (formData.department) {
      const selectedDept = departments.find(d => d._id === formData.department);
      if (selectedDept && selectedDept.cities && selectedDept.cities.length > 0) {
        // استخراج أسماء المدن (قد تكون objects أو strings)
        const cityNames = selectedDept.cities.map(c => typeof c === 'object' ? c.name : c);
        setAvailableCities(cityNames);
        // إذا المدينة الحالية غير موجودة في القسم الجديد، اختر الأولى
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

  useEffect(() => {
    if (appointment) {
      const getDateStr = (date) => date ? new Date(date).toISOString().split('T')[0] : '';

      setFormData({
        type: appointment.type || 'confirmed',
        customerName: appointment.customerName || '',
        customer: appointment.customer?._id || '',
        phone: appointment.phone || '',
        personsCount: appointment.personsCount || 1,
        isSubmission: appointment.isSubmission || false,
        appointmentDate: getDateStr(appointment.appointmentDate),
        appointmentTime: appointment.appointmentTime || '08:00',
        duration: appointment.duration || 5,
        dateFrom: getDateStr(appointment.dateFrom),
        dateTo: getDateStr(appointment.dateTo),
        reminderDate: getDateStr(appointment.reminderDate),
        reminderTime: appointment.reminderTime || '08:00',
        department: appointment.department?._id || '',
        city: appointment.city || 'الرياض',
        notes: appointment.notes || ''
      });

      if (appointment.customer) {
        setCustomerInputMode('select');
      }

      if (appointment.attachments) {
        setAttachments(appointment.attachments);
      }
    }
  }, [appointment]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let newValue = type === 'checkbox' ? checked : value;

    // تحويل الأرقام العربية للإنجليزية في حقل الهاتف
    if (name === 'phone') {
      newValue = convertArabicToEnglish(newValue);
    }

    setFormData(prev => ({ ...prev, [name]: newValue }));

    // التحقق من التاريخ (ليس جمعة أو سبت)
    if (name === 'appointmentDate' || name === 'dateFrom' || name === 'dateTo' || name === 'reminderDate') {
      if (newValue && isWeekend(newValue)) {
        setDateError('لا يمكن اختيار يوم الجمعة أو السبت (إجازة)');
      } else {
        setDateError('');
      }
    }

    // إذا اختار عميل من القائمة
    if (name === 'customer' && value) {
      const selectedCustomer = customers.find(c => c._id === value);
      if (selectedCustomer) {
        setFormData(prev => ({
          ...prev,
          customerName: selectedCustomer.name,
          phone: convertArabicToEnglish(selectedCustomer.phone || '')
        }));
      }
    }
  };

  const handleTypeChange = (newType) => {
    setFormData(prev => ({ ...prev, type: newType }));
    setDateError('');
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
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB max
      return isValidType && isValidSize;
    });

    if (validFiles.length !== files.length) {
      alert('بعض الملفات غير مدعومة أو تتجاوز الحجم المسموح (5MB). المسموح: صور و PDF فقط');
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    // التحقق من البيانات المطلوبة
    if (!formData.customerName.trim()) {
      alert('اسم العميل مطلوب');
      return;
    }

    // التحقق حسب نوع الموعد
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
      if (!formData.appointmentTime) {
        alert('وقت الموعد مطلوب');
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
      if (!formData.reminderDate || !formData.reminderTime) {
        alert('يجب تحديد تاريخ ووقت التذكير');
        return;
      }
    }

    setLoading(true);
    try {
      const dataToSubmit = {
        ...formData,
        personsCount: parseInt(formData.personsCount) || 1,
        duration: parseInt(formData.duration) || 5
      };

      if (!dataToSubmit.customer) {
        delete dataToSubmit.customer;
      }

      // إضافة المرفقات الجديدة
      const newFiles = attachments.filter(a => a.isNew).map(a => a.file);
      const existingAttachments = attachments.filter(a => !a.isNew);

      dataToSubmit.existingAttachments = existingAttachments;
      dataToSubmit.newFiles = newFiles;

      await onSubmit(dataToSubmit);
      // حذف البيانات المحفوظة بعد الإرسال الناجح
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // الحصول على تاريخ الغد كحد أدنى
  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  return (
    <form className="appointment-form" onSubmit={handleSubmit}>
      {/* شريط نوع الموعد - للعرض فقط في حالة التعديل أو للتغيير */}
      {appointment && (
        <div className="type-selector">
          <button
            type="button"
            className={`type-option ${formData.type === 'confirmed' ? 'active' : ''}`}
            onClick={() => handleTypeChange('confirmed')}
          >
            <span className="type-icon">✓</span>
            <span className="type-label">موعد مؤكد</span>
          </button>
          <button
            type="button"
            className={`type-option ${formData.type === 'unconfirmed' ? 'active' : ''}`}
            onClick={() => handleTypeChange('unconfirmed')}
          >
            <span className="type-icon">○</span>
            <span className="type-label">موعد غير مؤكد</span>
          </button>
          <button
            type="button"
            className={`type-option ${formData.type === 'draft' ? 'active' : ''}`}
            onClick={() => handleTypeChange('draft')}
          >
            <span className="type-icon">📝</span>
            <span className="type-label">مسودة</span>
          </button>
        </div>
      )}

      {/* المحتوى حسب نوع الموعد */}
      <div className="form-content">
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
                        {customer.name} {customer.phone ? `(${customer.phone})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

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
                    readOnly={customerInputMode === 'select' && formData.customer}
                  />
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
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="05xxxxxxxx"
                    className="form-input"
                    dir="ltr"
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

              <div className="form-grid three-cols">
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
                <div className="form-group">
                  <label>وقت الموعد <span className="required">*</span></label>
                  <select
                    name="appointmentTime"
                    value={formData.appointmentTime}
                    onChange={handleChange}
                    className="form-select"
                  >
                    {hourSlots.map(slot => (
                      <option key={slot.value} value={slot.value}>{slot.label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>المدة (دقيقة)</label>
                  <select
                    name="duration"
                    value={formData.duration}
                    onChange={handleChange}
                    className="form-select"
                  >
                    {durationOptions.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* الأقسام / السفارات والمدينة */}
            <div className="form-section">
              <div className="section-title">
                <span className="section-icon">🏢</span>
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
                        {customer.name} {customer.phone ? `(${customer.phone})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

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
                    readOnly={customerInputMode === 'select' && formData.customer}
                  />
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
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="05xxxxxxxx"
                    className="form-input"
                    dir="ltr"
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
                <span className="section-icon">🏢</span>
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
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="05xxxxxxxx"
                    className="form-input"
                    dir="ltr"
                  />
                </div>
              </div>
            </div>

            {/* التذكير */}
            <div className="form-section">
              <div className="section-title">
                <span className="section-icon">⏰</span>
                <h4>التذكير</h4>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>تاريخ التذكير <span className="required">*</span></label>
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
                  <label>وقت التذكير <span className="required">*</span></label>
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

      {/* Actions */}
      <div className="form-actions">
        <button type="button" className="cancel-btn" onClick={onCancel}>
          إلغاء
        </button>
        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? 'جاري الحفظ...' : (appointment ? 'حفظ التعديلات' : '+ إضافة الموعد')}
        </button>
      </div>
    </form>
  );
};

export default AppointmentForm;
