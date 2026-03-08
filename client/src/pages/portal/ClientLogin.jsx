import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useClientAuth } from '../../context/ClientAuthContext';
import { websiteApi } from '../../api';
import './Portal.css';

const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';
const baseUrl = apiUrl.replace('/api', '');

const EyeIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const ClientLogin = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, register } = useClientAuth();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') === 'register' ? 'register' : 'login');
  const [logo, setLogo] = useState(null);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({
    name: '', email: '', phone: '', password: '', confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [showRegPass, setShowRegPass] = useState(false);
  const [showRegConfirmPass, setShowRegConfirmPass] = useState(false);

  useEffect(() => {
    const loadContent = async () => {
      try {
        const res = await websiteApi.getPublicContent();
        if (res.success && res.data?.general?.logo) {
          setLogo(res.data.general.logo);
        }
      } catch (err) { /* ignore */ }
    };
    loadContent();
  }, []);

  const getImageUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${baseUrl}${path}`;
  };

  const handleLoginChange = (e) => {
    setLoginForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleRegisterChange = (e) => {
    setRegisterForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!loginForm.email || !loginForm.password) {
      setError('يرجى إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }
    setLoading(true);
    const result = await login(loginForm);
    setLoading(false);
    if (result.success) {
      navigate('/');
    } else {
      setError(result.message);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!registerForm.name || !registerForm.email || !registerForm.password) {
      setError('يرجى تعبئة جميع الحقول المطلوبة');
      return;
    }
    if (registerForm.password.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }
    if (registerForm.password !== registerForm.confirmPassword) {
      setError('كلمة المرور غير متطابقة');
      return;
    }
    setLoading(true);
    const result = await register({
      name: registerForm.name,
      email: registerForm.email,
      phone: registerForm.phone || undefined,
      password: registerForm.password
    });
    setLoading(false);
    if (result.success) {
      navigate('/');
    } else {
      setError(result.message);
    }
  };

  const switchTab = (tab) => {
    setActiveTab(tab);
    setError('');
  };

  return (
    <div className="auth-page" dir="rtl">
      {/* Navbar */}
      <nav className="auth-nav">
        <div className="auth-nav-content">
          <Link to="/" className="auth-nav-brand">
            {logo ? (
              <img src={getImageUrl(logo)} alt="ألوان المسافر" className="auth-nav-logo" />
            ) : (
              <div className="auth-nav-text">
                <span className="auth-nav-ar">ألوان المسافر</span>
                <span className="auth-nav-en">Travel Colors</span>
              </div>
            )}
          </Link>
          <Link to="/" className="auth-nav-back">العودة للرئيسية</Link>
        </div>
      </nav>

      {/* Main */}
      <div className="auth-main">
        <div className="auth-card">
          {/* Logo & Title */}
          <div className="auth-header">
            {logo && (
              <img src={getImageUrl(logo)} alt="ألوان المسافر" className="auth-logo" />
            )}
            <h1>ألوان المسافر</h1>
            <p className="auth-tagline">للسفر والسياحة</p>
          </div>

          {/* Tabs */}
          <div className="auth-tabs">
            <button
              className={`auth-tab ${activeTab === 'login' ? 'active' : ''}`}
              onClick={() => switchTab('login')}
            >
              تسجيل دخول
            </button>
            <button
              className={`auth-tab ${activeTab === 'register' ? 'active' : ''}`}
              onClick={() => switchTab('register')}
            >
              حساب جديد
            </button>
          </div>

          {error && <div className="auth-error">{error}</div>}

          {/* Login Form */}
          {activeTab === 'login' && (
            <form className="auth-form" onSubmit={handleLoginSubmit}>
              <div className="auth-field">
                <label>البريد الإلكتروني</label>
                <div className="auth-input-icon">
                  <svg className="auth-field-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  <input
                    type="email"
                    name="email"
                    value={loginForm.email}
                    onChange={handleLoginChange}
                    placeholder="example@email.com"
                    dir="ltr"
                    autoComplete="email"
                  />
                </div>
              </div>
              <div className="auth-field">
                <label>كلمة المرور</label>
                <div className="auth-input-icon">
                  <svg className="auth-field-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  <input
                    type={showLoginPass ? 'text' : 'password'}
                    name="password"
                    value={loginForm.password}
                    onChange={handleLoginChange}
                    placeholder="••••••"
                    dir="ltr"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="auth-toggle-pass"
                    onClick={() => setShowLoginPass(!showLoginPass)}
                    tabIndex={-1}
                    aria-label={showLoginPass ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                  >
                    {showLoginPass ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>
              <button type="submit" className="auth-submit" disabled={loading}>
                {loading ? 'جاري الدخول...' : 'تسجيل الدخول'}
              </button>
              <div className="auth-forgot-link">
                <Link to="/portal/forgot-password">نسيت كلمة المرور؟</Link>
              </div>
            </form>
          )}

          {/* Register Form */}
          {activeTab === 'register' && (
            <form className="auth-form" onSubmit={handleRegisterSubmit}>
              <div className="auth-field">
                <label>الاسم الكامل <span className="auth-required">*</span></label>
                <div className="auth-input-icon">
                  <svg className="auth-field-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  <input
                    type="text"
                    name="name"
                    value={registerForm.name}
                    onChange={handleRegisterChange}
                    placeholder="مثال: أحمد محمد"
                  />
                </div>
              </div>
              <div className="auth-field">
                <label>البريد الإلكتروني <span className="auth-required">*</span></label>
                <div className="auth-input-icon">
                  <svg className="auth-field-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  <input
                    type="email"
                    name="email"
                    value={registerForm.email}
                    onChange={handleRegisterChange}
                    placeholder="example@email.com"
                    dir="ltr"
                    autoComplete="email"
                  />
                </div>
              </div>
              <div className="auth-field">
                <label>رقم الجوال <span className="auth-optional">(اختياري)</span></label>
                <div className="auth-input-icon">
                  <svg className="auth-field-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
                  <input
                    type="tel"
                    name="phone"
                    value={registerForm.phone}
                    onChange={handleRegisterChange}
                    placeholder="05XXXXXXXX"
                    dir="ltr"
                  />
                </div>
              </div>
              <div className="auth-row">
                <div className="auth-field">
                  <label>كلمة المرور <span className="auth-required">*</span></label>
                  <div className="auth-input-icon">
                    <svg className="auth-field-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    <input
                      type={showRegPass ? 'text' : 'password'}
                      name="password"
                      value={registerForm.password}
                      onChange={handleRegisterChange}
                      placeholder="6 أحرف على الأقل"
                      dir="ltr"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="auth-toggle-pass"
                      onClick={() => setShowRegPass(!showRegPass)}
                      tabIndex={-1}
                    >
                      {showRegPass ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                </div>
                <div className="auth-field">
                  <label>تأكيد كلمة المرور <span className="auth-required">*</span></label>
                  <div className="auth-input-icon">
                    <svg className="auth-field-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    <input
                      type={showRegConfirmPass ? 'text' : 'password'}
                      name="confirmPassword"
                      value={registerForm.confirmPassword}
                      onChange={handleRegisterChange}
                      placeholder="أعد كتابة كلمة المرور"
                      dir="ltr"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="auth-toggle-pass"
                      onClick={() => setShowRegConfirmPass(!showRegConfirmPass)}
                      tabIndex={-1}
                    >
                      {showRegConfirmPass ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                </div>
              </div>

              {/* تنبيه الموافقة على الشروط */}
              <div className="auth-terms-notice">
                بالضغط على "إنشاء الحساب" فإنك توافق على{' '}
                <Link to="/privacy" target="_blank">سياسة الخصوصية</Link>
                {' '}و{' '}
                <Link to="/terms" target="_blank">الشروط والأحكام</Link>
              </div>

              <button type="submit" className="auth-submit" disabled={loading}>
                {loading ? 'جاري التسجيل...' : 'إنشاء الحساب'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientLogin;
