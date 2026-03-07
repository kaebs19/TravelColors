import { useState, useEffect } from 'react';
import { useToast } from '../../../context';
import './EmployeeForm.css';

// تعريف وحدات الصلاحيات (نسخة من الباك)
const PERMISSION_MODULES = [
  {
    key: 'appointments',
    label: 'المواعيد',
    icon: '📅',
    permissions: [
      { key: 'appointments.view', label: 'عرض' },
      { key: 'appointments.add', label: 'إضافة' },
      { key: 'appointments.edit', label: 'تعديل' },
      { key: 'appointments.delete', label: 'حذف' },
    ]
  },
  {
    key: 'customers',
    label: 'العملاء',
    icon: '👥',
    permissions: [
      { key: 'customers.view', label: 'عرض' },
      { key: 'customers.add', label: 'إضافة' },
      { key: 'customers.edit', label: 'تعديل' },
      { key: 'customers.delete', label: 'حذف' },
    ]
  },
  {
    key: 'finance',
    label: 'المالية',
    icon: '💰',
    permissions: [
      { key: 'finance.cashRegister', label: 'الصندوق' },
      { key: 'finance.receipts', label: 'الإيصالات' },
      { key: 'finance.transactions', label: 'المعاملات' },
      { key: 'finance.invoices', label: 'الفواتير' },
      { key: 'finance.cancelTransaction', label: 'إلغاء المعاملات' },
      { key: 'finance.reports', label: 'التقارير المالية' },
    ]
  },
  {
    key: 'departments',
    label: 'الأقسام',
    icon: '🏢',
    permissions: [
      { key: 'departments.view', label: 'عرض' },
      { key: 'departments.add', label: 'إضافة' },
      { key: 'departments.edit', label: 'تعديل' },
      { key: 'departments.delete', label: 'حذف' },
    ]
  },
  {
    key: 'tasks',
    label: 'المهام',
    icon: '✅',
    permissions: [
      { key: 'tasks.view', label: 'عرض' },
      { key: 'tasks.add', label: 'إضافة' },
      { key: 'tasks.edit', label: 'تعديل' },
    ]
  },
  {
    key: 'reports',
    label: 'التقارير',
    icon: '📈',
    permissions: [
      { key: 'reports.view', label: 'عرض التقارير' },
    ]
  },
  {
    key: 'settings',
    label: 'الإعدادات',
    icon: '⚙️',
    permissions: [
      { key: 'settings.view', label: 'عرض' },
      { key: 'settings.edit', label: 'تعديل' },
    ]
  },
  {
    key: 'employees',
    label: 'الموظفين',
    icon: '🧑‍💼',
    permissions: [
      { key: 'employees.manage', label: 'إدارة الموظفين' },
    ]
  },
  {
    key: 'audit',
    label: 'سجل التدقيق',
    icon: '🔍',
    permissions: [
      { key: 'audit.view', label: 'عرض سجل التدقيق' },
    ]
  },
];

// الصلاحيات الافتراضية لكل دور
const ROLE_DEFAULTS = {
  employee: {
    'appointments.view': true, 'appointments.add': true, 'appointments.edit': true, 'appointments.delete': false,
    'customers.view': true, 'customers.add': true, 'customers.edit': true, 'customers.delete': false,
    'finance.cashRegister': false, 'finance.receipts': false, 'finance.transactions': false,
    'finance.invoices': true, 'finance.cancelTransaction': false, 'finance.reports': false,
    'departments.view': true, 'departments.add': true, 'departments.edit': true, 'departments.delete': false,
    'tasks.view': true, 'tasks.add': true, 'tasks.edit': true,
    'reports.view': false, 'settings.view': true, 'settings.edit': false,
    'employees.manage': false, 'audit.view': false,
  },
  accountant: {
    'appointments.view': true, 'appointments.add': false, 'appointments.edit': false, 'appointments.delete': false,
    'customers.view': true, 'customers.add': false, 'customers.edit': false, 'customers.delete': false,
    'finance.cashRegister': true, 'finance.receipts': true, 'finance.transactions': true,
    'finance.invoices': true, 'finance.cancelTransaction': true, 'finance.reports': true,
    'departments.view': true, 'departments.add': false, 'departments.edit': false, 'departments.delete': false,
    'tasks.view': true, 'tasks.add': false, 'tasks.edit': false,
    'reports.view': true, 'settings.view': true, 'settings.edit': false,
    'employees.manage': false, 'audit.view': true,
  }
};

const getDefaultPermissions = (role) => ({ ...(ROLE_DEFAULTS[role] || {}) });

const EmployeeForm = ({ employee, onSubmit, onCancel }) => {
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    jobTitle: '',
    role: 'employee',
    avatar: ''
  });
  const [permissions, setPermissions] = useState(getDefaultPermissions('employee'));
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [previewAvatar, setPreviewAvatar] = useState('');

  useEffect(() => {
    if (employee) {
      setFormData({
        name: employee.name || '',
        email: employee.email || '',
        password: '',
        phone: employee.phone || '',
        jobTitle: employee.jobTitle || '',
        role: employee.role || 'employee',
        avatar: employee.avatar || ''
      });
      setPreviewAvatar(employee.avatar || '/favicon.svg');

      // تحميل صلاحيات الموظف أو الافتراضية
      if (employee.permissions && Object.keys(employee.permissions).length > 0) {
        // دمج مع الافتراضي لضمان وجود كل المفاتيح
        const defaults = getDefaultPermissions(employee.role || 'employee');
        setPermissions({ ...defaults, ...employee.permissions });
      } else {
        setPermissions(getDefaultPermissions(employee.role || 'employee'));
      }
    } else {
      setPreviewAvatar('/favicon.svg');
      setPermissions(getDefaultPermissions('employee'));
    }
  }, [employee]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // عند تغيير الدور، تحميل الصلاحيات الافتراضية
    if (name === 'role' && value !== 'admin') {
      setPermissions(getDefaultPermissions(value));
    }
  };

  const handlePermissionChange = (key) => {
    setPermissions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleModuleSelectAll = (moduleKey) => {
    const module = PERMISSION_MODULES.find(m => m.key === moduleKey);
    if (!module) return;
    const allChecked = module.permissions.every(p => permissions[p.key]);
    const updated = { ...permissions };
    module.permissions.forEach(p => { updated[p.key] = !allChecked; });
    setPermissions(updated);
  };

  const handleResetDefaults = () => {
    setPermissions(getDefaultPermissions(formData.role));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewAvatar(reader.result);
        setFormData(prev => ({ ...prev, avatar: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      showToast('الاسم مطلوب', 'warning');
      return;
    }

    if (!formData.email.trim()) {
      showToast('البريد الإلكتروني مطلوب', 'warning');
      return;
    }

    if (!employee && !formData.password) {
      showToast('كلمة المرور مطلوبة', 'warning');
      return;
    }

    if (formData.password && formData.password.length < 6) {
      showToast('كلمة المرور يجب أن تكون 6 أحرف على الأقل', 'warning');
      return;
    }

    setLoading(true);
    try {
      const dataToSubmit = { ...formData };

      // إذا لم يتم إدخال كلمة مرور في التعديل، نحذفها
      if (employee && !dataToSubmit.password) {
        delete dataToSubmit.password;
      }

      // إذا لم يتم اختيار صورة، نستخدم الشعار الافتراضي
      if (!dataToSubmit.avatar) {
        dataToSubmit.avatar = '/favicon.svg';
      }

      // إرسال الصلاحيات لغير المدير
      if (dataToSubmit.role !== 'admin') {
        dataToSubmit.permissions = permissions;
      }

      await onSubmit(dataToSubmit);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleHint = (role) => {
    switch (role) {
      case 'admin': return 'صلاحية كاملة للنظام - لا يمكن تخصيص الصلاحيات';
      case 'accountant': return 'مالية كاملة + قراءة فقط - يمكن تخصيص الصلاحيات';
      case 'employee': return 'صلاحيات محدودة - يمكن تخصيص الصلاحيات';
      default: return '';
    }
  };

  return (
    <form className="employee-form" onSubmit={handleSubmit}>
      <div className="form-header">
        <span className="form-icon">👤</span>
        <h3>بيانات الموظف</h3>
      </div>

      {/* صورة الموظف */}
      <div className="avatar-section">
        <div className="avatar-preview">
          <img
            src={previewAvatar || '/favicon.svg'}
            alt="صورة الموظف"
            onError={(e) => { e.target.src = '/favicon.svg'; }}
          />
        </div>
        <div className="avatar-upload">
          <label htmlFor="avatar-input" className="upload-btn">
            📷 اختر صورة
          </label>
          <input
            id="avatar-input"
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            style={{ display: 'none' }}
          />
          <span className="avatar-hint">اختياري - في حالة عدم اختيار صورة سيتم استخدام الشعار</span>
        </div>
      </div>

      {/* الاسم الكامل */}
      <div className="form-group">
        <label>الاسم الكامل <span className="required">*</span></label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="أدخل الاسم الكامل"
          className="form-input"
        />
      </div>

      {/* البريد الإلكتروني */}
      <div className="form-group">
        <label>البريد الإلكتروني <span className="required">*</span></label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="example@email.com"
          className="form-input"
          dir="ltr"
        />
      </div>

      {/* رقم الهاتف */}
      <div className="form-group">
        <label>رقم الهاتف</label>
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

      {/* الوظيفة */}
      <div className="form-group">
        <label>الوظيفة</label>
        <input
          type="text"
          name="jobTitle"
          value={formData.jobTitle}
          onChange={handleChange}
          placeholder="مثال: مدير المبيعات"
          className="form-input"
        />
      </div>

      {/* نوع الحساب (الصلاحية) */}
      <div className="form-group">
        <label>نوع الحساب <span className="required">*</span></label>
        <select
          name="role"
          value={formData.role}
          onChange={handleChange}
          className="form-select"
        >
          <option value="employee">موظف</option>
          <option value="accountant">محاسب</option>
          <option value="admin">مدير</option>
        </select>
        <span className="field-hint">
          {getRoleHint(formData.role)}
        </span>
      </div>

      {/* كلمة المرور */}
      <div className="form-group">
        <label>
          كلمة المرور {!employee && <span className="required">*</span>}
          {employee && <span className="optional">(اتركها فارغة إذا لم ترد التغيير)</span>}
        </label>
        <div className="password-input">
          <input
            type={showPassword ? 'text' : 'password'}
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder={employee ? '••••••••' : 'أدخل كلمة المرور'}
            className="form-input"
            dir="ltr"
          />
          <button
            type="button"
            className="toggle-password"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? '🙈' : '👁️'}
          </button>
        </div>
      </div>

      {/* قسم الصلاحيات المخصصة - يظهر فقط لغير المدير */}
      {formData.role !== 'admin' && (
        <div className="permissions-section">
          <div className="permissions-header">
            <h3>🔐 الصلاحيات المخصصة</h3>
            <button type="button" className="reset-perms-btn" onClick={handleResetDefaults}>
              إعادة تعيين للافتراضي
            </button>
          </div>

          <div className="permissions-grid">
            {PERMISSION_MODULES.map(module => {
              const allChecked = module.permissions.every(p => permissions[p.key]);
              const someChecked = module.permissions.some(p => permissions[p.key]);
              return (
                <div key={module.key} className="permission-module">
                  <div className="module-header" onClick={() => handleModuleSelectAll(module.key)}>
                    <span className="module-icon">{module.icon}</span>
                    <span className="module-label">{module.label}</span>
                    <input
                      type="checkbox"
                      checked={allChecked}
                      ref={el => { if (el) el.indeterminate = someChecked && !allChecked; }}
                      onChange={() => handleModuleSelectAll(module.key)}
                      className="module-checkbox"
                    />
                  </div>
                  <div className="module-permissions">
                    {module.permissions.map(perm => (
                      <label key={perm.key} className="permission-item">
                        <input
                          type="checkbox"
                          checked={!!permissions[perm.key]}
                          onChange={() => handlePermissionChange(perm.key)}
                        />
                        <span>{perm.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="form-actions">
        <button type="button" className="cancel-btn" onClick={onCancel}>
          إلغاء
        </button>
        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? 'جاري الحفظ...' : (employee ? 'حفظ التعديلات' : '+ إضافة موظف')}
        </button>
      </div>
    </form>
  );
};

export default EmployeeForm;
