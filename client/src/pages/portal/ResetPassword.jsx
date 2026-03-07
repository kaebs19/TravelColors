import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import './Portal.css';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!password || password.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    if (password !== confirmPassword) {
      setError('كلمتا المرور غير متطابقتين');
      return;
    }

    setLoading(true);

    try {
      await axios.post(`${API_BASE}/client/auth/reset-password/${token}`, { password });
      setSuccess(true);
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

          {success ? (
            <div className="portal-auth-success">
              <div className="portal-auth-success-icon">✅</div>
              <h2>تم تغيير كلمة المرور</h2>
              <p>تم تغيير كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.</p>
              <button
                className="portal-btn-primary portal-btn-full"
                onClick={() => navigate('/portal/login')}
              >
                تسجيل الدخول
              </button>
            </div>
          ) : (
            <>
              <h2 className="portal-auth-title">إعادة تعيين كلمة المرور</h2>
              <p className="portal-auth-subtitle">أدخل كلمة المرور الجديدة</p>

              {error && <div className="portal-auth-error">{error}</div>}

              <form onSubmit={handleSubmit} className="portal-auth-form">
                <div className="portal-form-group">
                  <label className="portal-form-label">كلمة المرور الجديدة</label>
                  <input
                    type="password"
                    className="portal-form-input"
                    placeholder="••••••••"
                    dir="ltr"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoFocus
                  />
                </div>

                <div className="portal-form-group">
                  <label className="portal-form-label">تأكيد كلمة المرور</label>
                  <input
                    type="password"
                    className="portal-form-input"
                    placeholder="••••••••"
                    dir="ltr"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  className="portal-btn-primary portal-btn-full"
                  disabled={loading}
                >
                  {loading ? 'جاري التحديث...' : 'تغيير كلمة المرور'}
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

export default ResetPassword;
