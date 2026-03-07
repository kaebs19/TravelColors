import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Portal.css';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('يرجى إدخال البريد الإلكتروني');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await axios.post(`${API_BASE}/client/auth/forgot-password`, { email: email.trim() });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || 'حدث خطأ، حاول مرة أخرى');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="portal-page" dir="rtl">
      <div className="portal-auth-container">
        <div className="portal-auth-card">
          <div className="portal-auth-header">
            <h1 className="portal-auth-brand">
              <span className="portal-nav-name-ar">ألوان المسافر</span>
              <span className="portal-nav-name-en">Travel Colors</span>
            </h1>
          </div>

          {sent ? (
            <div className="portal-auth-success">
              <div className="portal-auth-success-icon">📧</div>
              <h2>تم إرسال رابط الاستعادة</h2>
              <p>
                إذا كان البريد <strong>{email}</strong> مسجلاً لدينا، سيصلك رابط لإعادة تعيين كلمة المرور.
                يرجى التحقق من صندوق البريد الوارد (والبريد المزعج).
              </p>
              <p className="portal-auth-note">الرابط صالح لمدة 30 دقيقة.</p>
              <button
                className="portal-btn-primary portal-btn-full"
                onClick={() => navigate('/portal/login')}
              >
                العودة لتسجيل الدخول
              </button>
            </div>
          ) : (
            <>
              <h2 className="portal-auth-title">نسيت كلمة المرور؟</h2>
              <p className="portal-auth-subtitle">
                أدخل بريدك الإلكتروني وسنرسل لك رابطاً لإعادة تعيين كلمة المرور
              </p>

              {error && <div className="portal-auth-error">{error}</div>}

              <form onSubmit={handleSubmit} className="portal-auth-form">
                <div className="portal-form-group">
                  <label className="portal-form-label">البريد الإلكتروني</label>
                  <input
                    type="email"
                    className="portal-form-input"
                    placeholder="example@email.com"
                    dir="ltr"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  className="portal-btn-primary portal-btn-full"
                  disabled={loading}
                >
                  {loading ? 'جاري الإرسال...' : 'إرسال رابط الاستعادة'}
                </button>
              </form>

              <div className="portal-auth-footer">
                <button
                  className="portal-auth-link"
                  onClick={() => navigate('/portal/login')}
                >
                  ← العودة لتسجيل الدخول
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
