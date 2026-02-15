import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const { login, error, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  // إعادة التوجيه إذا كان المستخدم مسجل دخوله بالفعل
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/control/dashboard');
    }
  }, [isAuthenticated, navigate]);

  // مسح الخطأ المحلي عند تغيير البيانات
  useEffect(() => {
    if (localError) {
      setLocalError(null);
    }
  }, [formData]);

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // التحقق من البيانات
    if (!formData.email || !formData.password) {
      setLocalError('يرجى إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }

    setLoading(true);
    setLocalError(null);

    const result = await login(formData);

    if (result.success) {
      navigate('/control/dashboard');
    } else {
      setLocalError(result.message || 'حدث خطأ في تسجيل الدخول');
    }

    setLoading(false);
  };

  const displayError = localError || error;

  return (
    <div className="login-page">
      {/* الجانب الأيمن - نموذج تسجيل الدخول */}
      <div className="login-form-section">
        <div className="login-form-container">
          <h1 className="login-title">تسجيل الدخول</h1>
          <p className="login-subtitle">نظام إدارة شركة ألوان المسافر للسفر والسياحة</p>

          {displayError && (
            <div className="login-error">
              <span className="error-icon">⚠️</span>
              <span>{displayError}</span>
            </div>
          )}

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">البريد الإلكتروني</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="أدخل البريد الإلكتروني"
                className="login-input"
                autoComplete="email"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">كلمة المرور</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="أدخل كلمة المرور"
                className="login-input"
                autoComplete="current-password"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className="login-button"
              disabled={loading}
            >
              {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
            </button>
          </form>

          <div className="login-footer">
            <p>© 2026 Travel Colors - ألوان المسافر</p>
            <p className="footer-subtitle">جميع الحقوق محفوظة</p>
          </div>
        </div>
      </div>

      {/* الجانب الأيسر - الشعار */}
      <div className="login-branding-section">
        <div className="branding-content">
          <div className="logo-container">
            <img src="/favicon.svg" alt="Travel Colors Logo" className="main-logo" />
          </div>
          <h2 className="branding-title">لوحة تحكم ألوان المسافر</h2>
          <p className="branding-subtitle">نظام متكامل لإدارة المواعيد والحجوزات</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
