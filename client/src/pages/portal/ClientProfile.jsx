import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClientAuth } from '../../context/ClientAuthContext';
import clientApi from '../../api/clientApi';
import './Portal.css';

const ClientProfile = () => {
  const navigate = useNavigate();
  const { client, logout, updateClient } = useClientAuth();

  // Profile form
  const [name, setName] = useState(client?.name || '');
  const [phone, setPhone] = useState(client?.phone || '');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passLoading, setPassLoading] = useState(false);
  const [passMsg, setPassMsg] = useState({ type: '', text: '' });

  // Active section
  const [activeSection, setActiveSection] = useState('profile');

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileMsg({ type: '', text: '' });

    if (!name.trim()) {
      setProfileMsg({ type: 'error', text: 'الاسم مطلوب' });
      return;
    }

    setProfileLoading(true);
    try {
      const res = await clientApi.updateProfile({ name: name.trim(), phone: phone.trim() });
      if (res.success) {
        setProfileMsg({ type: 'success', text: 'تم تحديث البيانات بنجاح' });
        // Update client context
        if (updateClient) {
          updateClient(res.data.client);
        } else {
          // Fallback: update localStorage
          localStorage.setItem('clientUser', JSON.stringify(res.data.client));
        }
      }
    } catch (err) {
      setProfileMsg({ type: 'error', text: err.response?.data?.message || 'حدث خطأ' });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPassMsg({ type: '', text: '' });

    if (!currentPassword || !newPassword) {
      setPassMsg({ type: 'error', text: 'يرجى ملء جميع الحقول' });
      return;
    }

    if (newPassword.length < 6) {
      setPassMsg({ type: 'error', text: 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPassMsg({ type: 'error', text: 'كلمة المرور الجديدة غير متطابقة' });
      return;
    }

    setPassLoading(true);
    try {
      const res = await clientApi.changePassword({ currentPassword, newPassword });
      if (res.success) {
        setPassMsg({ type: 'success', text: 'تم تغيير كلمة المرور بنجاح' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      setPassMsg({ type: 'error', text: err.response?.data?.message || 'حدث خطأ' });
    } finally {
      setPassLoading(false);
    }
  };

  return (
    <div className="portal-page" dir="rtl">
      {/* Navbar */}
      <nav className="portal-nav">
        <div className="portal-nav-content">
          <div className="portal-nav-brand" onClick={() => navigate('/')}>
            <span className="portal-nav-name">
              <span className="portal-nav-name-ar">ألوان المسافر</span>
              <span className="portal-nav-name-en">Travel Colors</span>
            </span>
          </div>
          <div className="portal-nav-right">
            <span className="portal-nav-user">{client?.name}</span>
            <button className="portal-nav-logout" onClick={logout}>خروج</button>
          </div>
        </div>
      </nav>

      <main className="portal-main">
        {/* Back */}
        <div className="portal-view-top">
          <button className="portal-btn-back" onClick={() => navigate('/portal/dashboard')}>
            ← العودة للوحة التحكم
          </button>
        </div>

        {/* Profile Header */}
        <div className="portal-profile-header">
          <div className="portal-profile-avatar">
            {client?.name?.charAt(0) || '👤'}
          </div>
          <div className="portal-profile-info">
            <h1>{client?.name}</h1>
            <p>{client?.email}</p>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="portal-profile-tabs">
          <button
            className={`portal-profile-tab ${activeSection === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveSection('profile')}
          >
            👤 البيانات الشخصية
          </button>
          <button
            className={`portal-profile-tab ${activeSection === 'password' ? 'active' : ''}`}
            onClick={() => setActiveSection('password')}
          >
            🔒 تغيير كلمة المرور
          </button>
        </div>

        {/* Profile Edit */}
        {activeSection === 'profile' && (
          <div className="portal-profile-card">
            <h2 className="portal-profile-card-title">تعديل البيانات الشخصية</h2>

            {profileMsg.text && (
              <div className={`portal-profile-msg ${profileMsg.type}`}>
                {profileMsg.type === 'success' ? '✅' : '⚠️'} {profileMsg.text}
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="portal-profile-form">
              <div className="portal-profile-field">
                <label>الاسم الكامل <span className="portal-required">*</span></label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="الاسم الكامل"
                />
              </div>

              <div className="portal-profile-field">
                <label>البريد الإلكتروني</label>
                <input
                  type="email"
                  value={client?.email || ''}
                  disabled
                  className="portal-profile-disabled"
                />
                <span className="portal-profile-hint">لا يمكن تغيير البريد الإلكتروني</span>
              </div>

              <div className="portal-profile-field">
                <label>رقم الجوال</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="05XXXXXXXX"
                  dir="ltr"
                />
              </div>

              <button
                type="submit"
                className="portal-btn-primary"
                disabled={profileLoading}
              >
                {profileLoading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
              </button>
            </form>
          </div>
        )}

        {/* Change Password */}
        {activeSection === 'password' && (
          <div className="portal-profile-card">
            <h2 className="portal-profile-card-title">تغيير كلمة المرور</h2>

            {passMsg.text && (
              <div className={`portal-profile-msg ${passMsg.type}`}>
                {passMsg.type === 'success' ? '✅' : '⚠️'} {passMsg.text}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="portal-profile-form">
              <div className="portal-profile-field">
                <label>كلمة المرور الحالية <span className="portal-required">*</span></label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="أدخل كلمة المرور الحالية"
                />
              </div>

              <div className="portal-profile-field">
                <label>كلمة المرور الجديدة <span className="portal-required">*</span></label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="6 أحرف على الأقل"
                />
              </div>

              <div className="portal-profile-field">
                <label>تأكيد كلمة المرور الجديدة <span className="portal-required">*</span></label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="أعد كتابة كلمة المرور الجديدة"
                />
              </div>

              <button
                type="submit"
                className="portal-btn-primary"
                disabled={passLoading}
              >
                {passLoading ? 'جاري التغيير...' : 'تغيير كلمة المرور'}
              </button>
            </form>
          </div>
        )}
      </main>

      <footer className="portal-footer">
        <p>&copy; {new Date().getFullYear()} Travel Colors - ألوان المسافر</p>
      </footer>
    </div>
  );
};

export default ClientProfile;
