import { useState, useEffect } from 'react';
import './EmployeeForm.css';

const EmployeeForm = ({ employee, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    jobTitle: '',
    role: 'employee',
    avatar: ''
  });
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
    } else {
      setPreviewAvatar('/favicon.svg');
    }
  }, [employee]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
      alert('الاسم مطلوب');
      return;
    }

    if (!formData.email.trim()) {
      alert('البريد الإلكتروني مطلوب');
      return;
    }

    if (!employee && !formData.password) {
      alert('كلمة المرور مطلوبة');
      return;
    }

    if (formData.password && formData.password.length < 6) {
      alert('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
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

      await onSubmit(dataToSubmit);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
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
          <option value="admin">مدير</option>
        </select>
        <span className="field-hint">
          {formData.role === 'admin' ? 'صلاحية كاملة للنظام' : 'صلاحيات محدودة'}
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
