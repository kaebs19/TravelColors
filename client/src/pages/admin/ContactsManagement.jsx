import { useState, useEffect } from 'react';
import { websiteApi } from '../../api';
import { useToast } from '../../context/ToastContext';
import './ContactsManagement.css';

const ICON_OPTIONS = ['📞', '📋', '✈️', '🏨', '🛂', '✉️', '📍', '🌍', '🛡️', '🪪', '⭐', '💰', '💬', '📅'];

const TYPE_OPTIONS = [
  { value: 'whatsapp', label: 'واتساب' },
  { value: 'email', label: 'بريد' },
  { value: 'location', label: 'موقع' }
];

const TYPE_LABELS = {
  whatsapp: 'واتساب',
  email: 'بريد',
  location: 'موقع'
};

const emptyDepartment = {
  name: '',
  phone: '',
  whatsapp: '',
  icon: '📞',
  type: 'whatsapp',
  isActive: true
};

// أرقام جاهزة للتعبئة السريعة
const DEFAULT_DEPARTMENTS = [
  { name: 'استفسارات عامة', phone: '055 874 1741', whatsapp: '966558741741', icon: '📞', type: 'whatsapp', order: 0, isActive: true },
  { name: 'تأشيرات - فنادق', phone: '055 715 5472', whatsapp: '966557155472', icon: '🛂', type: 'whatsapp', order: 1, isActive: true },
  { name: 'مختص تأشيرات', phone: '055 279 1800', whatsapp: '966552791800', icon: '📋', type: 'whatsapp', order: 2, isActive: true },
  { name: 'تأشيرات', phone: '055 922 9597', whatsapp: '966559229597', icon: '✈️', type: 'whatsapp', order: 3, isActive: true },
  { name: 'حجوزات فنادق - باكجات', phone: '055 834 6483', whatsapp: '966558346483', icon: '🏨', type: 'whatsapp', order: 4, isActive: true },
  { name: 'البريد الإلكتروني', phone: 'info@trcolors.com', whatsapp: '', icon: '✉️', type: 'email', order: 5, isActive: true },
  { name: 'موقعنا', phone: 'الرياض - الصحافة', whatsapp: '', icon: '📍', type: 'location', order: 6, isActive: true }
];

const ContactsManagement = ({ embedded = false }) => {
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Section 1: Contact departments
  const [departments, setDepartments] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null); // null = not editing, -1 = adding new
  const [formData, setFormData] = useState({ ...emptyDepartment });

  // Section 2: Working hours
  const [workingHours, setWorkingHours] = useState({
    weekdays: '',
    weekdaysTime: '',
    friday: '',
    fridayIsOff: false
  });

  // Section 3: Map
  const [mapEmbed, setMapEmbed] = useState('');

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      setLoading(true);
      const res = await websiteApi.getContent();
      if (res.success) {
        const data = res.data;
        if (data.contactDepartments) {
          setDepartments(data.contactDepartments);
        }
        if (data.workingHours) {
          setWorkingHours({
            weekdays: data.workingHours.weekdays || '',
            weekdaysTime: data.workingHours.weekdaysTime || '',
            friday: data.workingHours.friday || '',
            fridayIsOff: data.workingHours.fridayIsOff || false
          });
        }
        if (data.mapEmbed !== undefined) {
          setMapEmbed(data.mapEmbed || '');
        }
      }
    } catch (err) {
      showToast('خطأ في تحميل البيانات', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (section, data) => {
    try {
      setSaving(true);
      const res = await websiteApi.updateContent({ [section]: data });
      if (res.success) {
        showToast('تم الحفظ بنجاح', 'success');
      } else {
        showToast('خطأ في الحفظ', 'error');
      }
    } catch (err) {
      showToast('خطأ في الحفظ', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ---------- Load Defaults ----------

  const loadDefaults = async () => {
    if (departments.length > 0) {
      if (!window.confirm('سيتم استبدال البيانات الحالية بالبيانات الافتراضية. هل تريد المتابعة؟')) return;
    }
    const updated = [...DEFAULT_DEPARTMENTS];
    setDepartments(updated);
    await handleSave('contactDepartments', updated);
    // أيضاً حفظ ساعات العمل والخريطة الافتراضية
    const defaultHours = { weekdays: 'من السبت إلى الخميس', weekdaysTime: '03:00 م - 11:00 م', friday: 'الجمعة: إجازة', fridayIsOff: true };
    setWorkingHours(defaultHours);
    await handleSave('workingHours', defaultHours);
    const defaultMap = 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3550.813903803563!2d46.646181899999995!3d24.810952199999996!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3e2f01b654ba264b%3A0x30a7fd8506bf489a!2z2KfZhNmI2KfZhiDYp9mE2YXYs9in2YHYsSDZhNmE2LPZgdixINmIINin2YTYs9mK2KfYrdip!5e1!3m2!1sar!2sus!4v1772396758449!5m2!1sar!2sus';
    setMapEmbed(defaultMap);
    await handleSave('mapEmbed', defaultMap);
  };

  // ---------- Department CRUD ----------

  const openAddForm = () => {
    setEditingIndex(-1);
    setFormData({ ...emptyDepartment });
  };

  const openEditForm = (index) => {
    setEditingIndex(index);
    setFormData({ ...departments[index] });
  };

  const cancelForm = () => {
    setEditingIndex(null);
    setFormData({ ...emptyDepartment });
  };

  const saveFormDepartment = async () => {
    if (!formData.name.trim()) {
      showToast('يرجى إدخال اسم القسم', 'error');
      return;
    }

    let updated;
    if (editingIndex === -1) {
      // Adding new
      const newDept = { ...formData, order: departments.length };
      updated = [...departments, newDept];
    } else {
      // Editing existing
      updated = departments.map((d, i) => (i === editingIndex ? { ...formData } : d));
    }

    setDepartments(updated);
    await handleSave('contactDepartments', updated);
    cancelForm();
  };

  const removeDepartment = async (index) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا القسم؟')) return;
    const updated = departments.filter((_, i) => i !== index).map((d, i) => ({ ...d, order: i }));
    setDepartments(updated);
    await handleSave('contactDepartments', updated);
  };

  const toggleDepartmentActive = async (index) => {
    const updated = departments.map((d, i) =>
      i === index ? { ...d, isActive: !d.isActive } : d
    );
    setDepartments(updated);
    await handleSave('contactDepartments', updated);
  };

  const moveDepartment = async (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= departments.length) return;

    const updated = [...departments];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    // Update order values
    const reordered = updated.map((d, i) => ({ ...d, order: i }));
    setDepartments(reordered);
    await handleSave('contactDepartments', reordered);
  };

  // ---------- Working Hours ----------

  const saveWorkingHours = () => {
    handleSave('workingHours', workingHours);
  };

  // ---------- Map ----------

  const saveMap = () => {
    handleSave('mapEmbed', mapEmbed);
  };

  // ---------- Render ----------

  if (loading) {
    return (
      <div className={embedded ? 'cm-embedded' : 'cm-page'}>
        <div className="cm-loading">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className={embedded ? 'cm-embedded' : 'cm-page'}>
      {/* Header — hide when embedded inside WebsiteManagement */}
      {!embedded && (
        <div className="cm-header">
          <div>
            <h1>إدارة جهات الاتصال</h1>
            <p>إدارة أقسام الاتصال وساعات العمل والخريطة</p>
          </div>
        </div>
      )}

      {/* Section 1: Contact Departments */}
      <div className="cm-section">
        <div className="cm-section-header">
          <h2>📞 جهات الاتصال</h2>
          <div className="cm-section-header-actions">
            {departments.length === 0 && (
              <button
                className="cm-btn cm-btn-success"
                onClick={loadDefaults}
                disabled={editingIndex !== null || saving}
              >
                ⚡ تعبئة بيانات جاهزة
              </button>
            )}
            <button
              className="cm-btn cm-btn-primary"
              onClick={openAddForm}
              disabled={editingIndex !== null}
            >
              + إضافة قسم جديد
            </button>
          </div>
        </div>

        {/* Add / Edit Form */}
        {editingIndex !== null && (
          <div className="cm-dept-form">
            <h3>{editingIndex === -1 ? 'إضافة قسم جديد' : 'تعديل القسم'}</h3>
            <div className="cm-form-grid">
              <div className="cm-form-group">
                <label>اسم القسم *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="مثال: قسم التأشيرات"
                />
              </div>
              <div className="cm-form-group">
                <label>رقم الهاتف</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+966 5x xxx xxxx"
                  dir="ltr"
                />
              </div>
              {formData.type === 'whatsapp' && (
                <div className="cm-form-group">
                  <label>رقم الواتساب</label>
                  <input
                    type="text"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    placeholder="+966 5x xxx xxxx"
                    dir="ltr"
                  />
                </div>
              )}
              <div className="cm-form-group">
                <label>الأيقونة</label>
                <select
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                >
                  {ICON_OPTIONS.map((icon) => (
                    <option key={icon} value={icon}>{icon}</option>
                  ))}
                </select>
              </div>
              <div className="cm-form-group">
                <label>النوع</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  {TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="cm-form-actions">
              <button className="cm-btn cm-btn-primary" onClick={saveFormDepartment} disabled={saving}>
                {saving ? 'جاري الحفظ...' : 'حفظ'}
              </button>
              <button className="cm-btn cm-btn-secondary" onClick={cancelForm}>
                إلغاء
              </button>
            </div>
          </div>
        )}

        {/* Departments List */}
        <div className="cm-dept-list">
          {departments.length === 0 && editingIndex === null && (
            <div className="cm-empty">لا توجد أقسام بعد. أضف قسم جديد للبدء.</div>
          )}
          {departments.map((dept, index) => (
            <div
              key={index}
              className={`cm-dept-item${!dept.isActive ? ' cm-dept-inactive' : ''}`}
            >
              <div className="cm-dept-info">
                <span className="cm-dept-icon">{dept.icon}</span>
                <div className="cm-dept-details">
                  <span className="cm-dept-name">{dept.name}</span>
                  {dept.phone && <span className="cm-dept-phone" dir="ltr">{dept.phone}</span>}
                </div>
                <span className={`cm-badge cm-badge-${dept.type}`}>
                  {TYPE_LABELS[dept.type] || dept.type}
                </span>
                {!dept.isActive && <span className="cm-badge cm-badge-inactive">غير نشط</span>}
              </div>
              <div className="cm-dept-actions">
                <button
                  className="cm-btn-icon"
                  onClick={() => moveDepartment(index, -1)}
                  disabled={index === 0}
                  title="تحريك للأعلى"
                >
                  ▲
                </button>
                <button
                  className="cm-btn-icon"
                  onClick={() => moveDepartment(index, 1)}
                  disabled={index === departments.length - 1}
                  title="تحريك للأسفل"
                >
                  ▼
                </button>
                <button
                  className="cm-btn-icon cm-btn-icon-edit"
                  onClick={() => openEditForm(index)}
                  disabled={editingIndex !== null}
                  title="تعديل"
                >
                  ✏️
                </button>
                <button
                  className="cm-btn-icon cm-btn-icon-toggle"
                  onClick={() => toggleDepartmentActive(index)}
                  title={dept.isActive ? 'تعطيل' : 'تفعيل'}
                >
                  {dept.isActive ? '👁️' : '🚫'}
                </button>
                <button
                  className="cm-btn-icon cm-btn-icon-danger"
                  onClick={() => removeDepartment(index)}
                  disabled={editingIndex !== null}
                  title="حذف"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 2: Working Hours */}
      <div className="cm-section">
        <div className="cm-section-header">
          <h2>🕐 ساعات العمل</h2>
        </div>
        <div className="cm-form-grid">
          <div className="cm-form-group">
            <label>أيام العمل</label>
            <input
              type="text"
              value={workingHours.weekdays}
              onChange={(e) => setWorkingHours({ ...workingHours, weekdays: e.target.value })}
              placeholder="مثال: السبت - الخميس"
            />
          </div>
          <div className="cm-form-group">
            <label>ساعات العمل</label>
            <input
              type="text"
              value={workingHours.weekdaysTime}
              onChange={(e) => setWorkingHours({ ...workingHours, weekdaysTime: e.target.value })}
              placeholder="مثال: 9:00 ص - 6:00 م"
            />
          </div>
          <div className="cm-form-group">
            <label>يوم الجمعة</label>
            <input
              type="text"
              value={workingHours.friday}
              onChange={(e) => setWorkingHours({ ...workingHours, friday: e.target.value })}
              placeholder="مثال: 2:00 م - 6:00 م"
              disabled={workingHours.fridayIsOff}
            />
          </div>
          <div className="cm-form-group cm-form-group-checkbox">
            <label className="cm-checkbox-label">
              <input
                type="checkbox"
                checked={workingHours.fridayIsOff}
                onChange={(e) => setWorkingHours({ ...workingHours, fridayIsOff: e.target.checked })}
              />
              <span>الجمعة إجازة</span>
            </label>
          </div>
        </div>
        <div className="cm-form-actions">
          <button className="cm-btn cm-btn-primary" onClick={saveWorkingHours} disabled={saving}>
            {saving ? 'جاري الحفظ...' : 'حفظ ساعات العمل'}
          </button>
        </div>
      </div>

      {/* Section 3: Map */}
      <div className="cm-section">
        <div className="cm-section-header">
          <h2>📍 الخريطة</h2>
        </div>
        <div className="cm-form-group">
          <label>رابط خريطة Google Maps (Embed URL)</label>
          <textarea
            value={mapEmbed}
            onChange={(e) => setMapEmbed(e.target.value)}
            placeholder='الصق رابط embed من Google Maps هنا...'
            rows={4}
            dir="ltr"
          />
        </div>
        {mapEmbed && (
          <div className="cm-map-preview">
            <h4>معاينة الخريطة</h4>
            <div className="cm-map-frame">
              <iframe
                src={mapEmbed}
                width="100%"
                height="350"
                style={{ border: 0, borderRadius: '8px' }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="خريطة الموقع"
              />
            </div>
          </div>
        )}
        <div className="cm-form-actions">
          <button className="cm-btn cm-btn-primary" onClick={saveMap} disabled={saving}>
            {saving ? 'جاري الحفظ...' : 'حفظ الخريطة'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContactsManagement;
