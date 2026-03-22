import { useState, useEffect } from 'react';
import { useAuth, useToast } from '../../context';
import settingsApi from '../../api/settingsApi';
import { Card, Loader } from '../../components/common';
import './Settings.css';

const Settings = () => {
  const { user, hasPermission } = useAuth();
  const { showToast } = useToast();
  const isAdmin = hasPermission('settings.edit');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState(null);
  const [activeTab, setActiveTab] = useState('general');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // نافذة إضافة طريقة دفع
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [newPayment, setNewPayment] = useState({ id: '', label: '', icon: '💰' });

  // نافذة إضافة حالة
  const [showAddStatus, setShowAddStatus] = useState(false);
  const [newStatus, setNewStatus] = useState({ id: '', label: '', icon: '📌', color: '#6b7280' });

  // نافذة إضافة مدينة
  const [showAddCity, setShowAddCity] = useState(false);
  const [newCity, setNewCity] = useState({ id: '', name: '' });

  // نافذة إضافة منتج
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', defaultPrice: 0 });

  // Google Sheets
  const [testingConnection, setTestingConnection] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [sheetsStatus, setSheetsStatus] = useState(null);

  // أسماء الأيام بالعربية
  const weekDays = [
    { id: 0, name: 'الأحد' },
    { id: 1, name: 'الإثنين' },
    { id: 2, name: 'الثلاثاء' },
    { id: 3, name: 'الأربعاء' },
    { id: 4, name: 'الخميس' },
    { id: 5, name: 'الجمعة' },
    { id: 6, name: 'السبت' }
  ];

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await settingsApi.getSettings();
      setSettings(response.data.data);
    } catch (error) {
      console.error('Error fetching settings:', error);
      setError('فشل في تحميل الإعدادات');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await settingsApi.updateSettings(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      showToast('فشل في حفظ الإعدادات', 'error');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'general', label: 'عام', icon: '⚙️' },
    { id: 'invoice', label: 'الفواتير', icon: '🧾' },
    { id: 'workHours', label: 'ساعات العمل', icon: '🕐' },
    { id: 'cities', label: 'المدن', icon: '🏙️' },
    { id: 'messages', label: 'الرسائل', icon: '💬' },
    { id: 'payments', label: 'طرق الدفع', icon: '💳' },
    { id: 'statuses', label: 'حالات المواعيد', icon: '📊' },
    { id: 'notifications', label: 'الإشعارات', icon: '🔔' },
    { id: 'usVisa', label: 'التأشيرة الأمريكية', icon: '🇺🇸' },
    ...(isAdmin ? [{ id: 'googleSheets', label: 'Google Sheets', icon: '📊' }] : []),
    ...(isAdmin ? [{ id: 'system', label: 'النظام', icon: '🔧' }] : []),
    { id: 'profile', label: 'الملف الشخصي', icon: '👤' },
  ];

  const handlePaymentTypeToggle = (id) => {
    setSettings(prev => ({
      ...prev,
      paymentTypes: prev.paymentTypes.map(pt =>
        pt.id === id ? { ...pt, enabled: !pt.enabled } : pt
      )
    }));
    setSaved(false);
  };

  const handleStatusToggle = (id) => {
    setSettings(prev => ({
      ...prev,
      appointmentStatuses: prev.appointmentStatuses.map(st =>
        st.id === id ? { ...st, enabled: !st.enabled } : st
      )
    }));
    setSaved(false);
  };

  const handleStatusLabelChange = (id, newLabel) => {
    setSettings(prev => ({
      ...prev,
      appointmentStatuses: prev.appointmentStatuses.map(st =>
        st.id === id ? { ...st, label: newLabel } : st
      )
    }));
    setSaved(false);
  };

  const handleAddPaymentType = async () => {
    if (!newPayment.id || !newPayment.label) {
      showToast('يرجى إدخال المعرف والاسم', 'warning');
      return;
    }

    try {
      const response = await settingsApi.addPaymentType(newPayment);
      setSettings(prev => ({
        ...prev,
        paymentTypes: response.data.data
      }));
      setShowAddPayment(false);
      setNewPayment({ id: '', label: '', icon: '💰' });
    } catch (error) {
      console.error('Error adding payment type:', error);
      showToast('فشل في إضافة طريقة الدفع', 'error');
    }
  };

  const handleDeletePaymentType = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف طريقة الدفع؟')) return;

    try {
      const response = await settingsApi.deletePaymentType(id);
      setSettings(prev => ({
        ...prev,
        paymentTypes: response.data.data
      }));
    } catch (error) {
      console.error('Error deleting payment type:', error);
      showToast('فشل في حذف طريقة الدفع', 'error');
    }
  };

  const handleAddStatus = async () => {
    if (!newStatus.id || !newStatus.label) {
      showToast('يرجى إدخال المعرف والاسم', 'warning');
      return;
    }

    try {
      const response = await settingsApi.addAppointmentStatus(newStatus);
      setSettings(prev => ({
        ...prev,
        appointmentStatuses: response.data.data
      }));
      setShowAddStatus(false);
      setNewStatus({ id: '', label: '', icon: '📌', color: '#6b7280' });
    } catch (error) {
      console.error('Error adding status:', error);
      showToast('فشل في إضافة الحالة', 'error');
    }
  };

  const handleDeleteStatus = async (id) => {
    if (['new', 'completed', 'cancelled'].includes(id)) {
      showToast('لا يمكن حذف الحالات الأساسية', 'warning');
      return;
    }

    if (!window.confirm('هل أنت متأكد من حذف هذه الحالة؟')) return;

    try {
      const response = await settingsApi.deleteAppointmentStatus(id);
      setSettings(prev => ({
        ...prev,
        appointmentStatuses: response.data.data
      }));
    } catch (error) {
      console.error('Error deleting status:', error);
      showToast('فشل في حذف الحالة', 'error');
    }
  };

  // دوال ساعات العمل
  const handleWorkingHoursChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      workingHours: {
        ...prev.workingHours,
        [field]: parseInt(value)
      }
    }));
    setSaved(false);
  };

  // دوال إعدادات المواعيد
  const handleAppointmentSettingsChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      appointmentSettings: {
        ...prev.appointmentSettings,
        [field]: parseInt(value)
      }
    }));
    setSaved(false);
  };

  const handleMinuteIntervalToggle = (minute) => {
    const currentIntervals = settings.appointmentSettings?.minuteIntervals || [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
    const newIntervals = currentIntervals.includes(minute)
      ? currentIntervals.filter(m => m !== minute)
      : [...currentIntervals, minute].sort((a, b) => a - b);

    setSettings(prev => ({
      ...prev,
      appointmentSettings: {
        ...prev.appointmentSettings,
        minuteIntervals: newIntervals
      }
    }));
    setSaved(false);
  };

  // دالة تبديل عمود في جدول المواعيد
  const handleColumnToggle = (columnId) => {
    const currentValue = settings.appointmentsTableColumns?.[columnId] !== false;
    setSettings(prev => ({
      ...prev,
      appointmentsTableColumns: {
        ...prev.appointmentsTableColumns,
        [columnId]: !currentValue
      }
    }));
    setSaved(false);
  };

  const handleWorkingDayToggle = (dayId) => {
    const currentDays = settings.workingHours?.workingDays || [];
    const newDays = currentDays.includes(dayId)
      ? currentDays.filter(d => d !== dayId)
      : [...currentDays, dayId].sort((a, b) => a - b);

    setSettings(prev => ({
      ...prev,
      workingHours: {
        ...prev.workingHours,
        workingDays: newDays
      }
    }));
    setSaved(false);
  };

  // دوال المدن
  const handleCityToggle = (id) => {
    setSettings(prev => ({
      ...prev,
      cities: prev.cities?.map(city =>
        city.id === id ? { ...city, enabled: !city.enabled } : city
      )
    }));
    setSaved(false);
  };

  const handleAddCity = async () => {
    if (!newCity.id || !newCity.name) {
      showToast('يرجى إدخال المعرف والاسم', 'warning');
      return;
    }

    try {
      const response = await settingsApi.addCity(newCity);
      setSettings(prev => ({
        ...prev,
        cities: response.data.data
      }));
      setShowAddCity(false);
      setNewCity({ id: '', name: '' });
    } catch (error) {
      console.error('Error adding city:', error);
      showToast('فشل في إضافة المدينة', 'error');
    }
  };

  const handleDeleteCity = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه المدينة؟')) return;

    try {
      const response = await settingsApi.deleteCity(id);
      setSettings(prev => ({
        ...prev,
        cities: response.data.data
      }));
    } catch (error) {
      console.error('Error deleting city:', error);
      showToast('فشل في حذف المدينة', 'error');
    }
  };

  // دوال التذكيرات
  const handleReminderChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      reminders: {
        ...prev.reminders,
        [field]: field === 'enabled' ? value : (field === 'daysBefore' ? parseInt(value) : value)
      }
    }));
    setSaved(false);
  };

  // دوال إعدادات الفواتير
  const handleTaxChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      tax: {
        ...prev.tax,
        [field]: field === 'rate' ? parseFloat(value) : value
      }
    }));
    setSaved(false);
  };

  const handlePrintSettingsChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      printSettings: {
        ...prev.printSettings,
        [field]: value
      }
    }));
    setSaved(false);
  };

  const handleAddProduct = () => {
    if (!newProduct.name) {
      showToast('يرجى إدخال اسم المنتج', 'warning');
      return;
    }

    const productId = Date.now().toString();
    setSettings(prev => ({
      ...prev,
      products: [...(prev.products || []), { id: productId, ...newProduct, enabled: true }]
    }));
    setShowAddProduct(false);
    setNewProduct({ name: '', defaultPrice: 0 });
    setSaved(false);
  };

  const handleDeleteProduct = (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;

    setSettings(prev => ({
      ...prev,
      products: prev.products?.filter(p => p.id !== id)
    }));
    setSaved(false);
  };

  const handleProductToggle = (id) => {
    setSettings(prev => ({
      ...prev,
      products: prev.products?.map(p =>
        p.id === id ? { ...p, enabled: !p.enabled } : p
      )
    }));
    setSaved(false);
  };

  // دوال Google Sheets
  const handleGoogleSheetsChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      googleSheets: {
        ...prev.googleSheets,
        [field]: value
      }
    }));
    setSaved(false);
  };

  const handleTestConnection = async () => {
    try {
      setTestingConnection(true);
      const response = await settingsApi.testGoogleSheetsConnection();
      setSheetsStatus(response.data.data);
      showToast('تم الاتصال بنجاح', 'success');
    } catch (error) {
      console.error('Error testing connection:', error);
      showToast(error.response?.data?.message || 'فشل في الاتصال', 'error');
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSyncGoogleSheets = async () => {
    if (!window.confirm('هل تريد مزامنة جميع المواعيد مع Google Sheets؟')) return;

    try {
      setSyncing(true);
      const response = await settingsApi.syncGoogleSheets();
      showToast(response.data.message, 'success');
      // تحديث حالة المزامنة
      handleGoogleSheetsChange('lastSyncAt', response.data.data.lastSyncAt);
      handleGoogleSheetsChange('totalSynced', response.data.data.totalSynced);
      handleGoogleSheetsChange('syncStatus', 'success');
    } catch (error) {
      console.error('Error syncing:', error);
      showToast(error.response?.data?.message || 'فشل في المزامنة', 'error');
    } finally {
      setSyncing(false);
    }
  };

  const formatSyncDate = (date) => {
    if (!date) return 'لم تتم المزامنة بعد';
    return new Date(date).toLocaleString('ar-SA');
  };

  if (loading) {
    return <Loader fullScreen />;
  }

  if (error || !settings) {
    return (
      <div className="settings-page">
        <div className="error-message">{error || 'فشل في تحميل الإعدادات'}</div>
      </div>
    );
  }

  return (
    <div className="settings-page">
      {/* Breadcrumb */}
      <div className="page-breadcrumb">
        <span>لوحة التحكم</span>
        <span className="separator">/</span>
        <span className="current">الإعدادات</span>
      </div>

      <div className="settings-container">
        {/* Sidebar Tabs */}
        <div className="settings-sidebar">
          <Card className="tabs-card">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="tab-icon">{tab.icon}</span>
                <span className="tab-label">{tab.label}</span>
              </button>
            ))}
          </Card>
        </div>

        {/* Content */}
        <div className="settings-content">
          {/* General Settings */}
          {activeTab === 'general' && (
            <Card className="settings-card">
              <div className="card-header">
                <h2>⚙️ الإعدادات العامة</h2>
                <p>إعدادات معلومات الشركة الأساسية</p>
              </div>
              <div className="settings-form">
                <div className="form-group">
                  <label>اسم الشركة (عربي)</label>
                  <input
                    type="text"
                    value={settings.companyName || ''}
                    onChange={(e) => handleChange('companyName', e.target.value)}
                    className="form-input"
                    disabled={!isAdmin}
                  />
                </div>
                <div className="form-group">
                  <label>اسم الشركة (إنجليزي)</label>
                  <input
                    type="text"
                    value={settings.companyNameEn || ''}
                    onChange={(e) => handleChange('companyNameEn', e.target.value)}
                    className="form-input"
                    dir="ltr"
                    disabled={!isAdmin}
                  />
                </div>
                <div className="form-group">
                  <label>البريد الإلكتروني</label>
                  <input
                    type="email"
                    value={settings.email || ''}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className="form-input"
                    dir="ltr"
                    disabled={!isAdmin}
                  />
                </div>
                <div className="form-group">
                  <label>رقم الهاتف</label>
                  <input
                    type="tel"
                    value={settings.phone || ''}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    className="form-input"
                    dir="ltr"
                    disabled={!isAdmin}
                  />
                </div>
                <div className="form-group">
                  <label>العنوان</label>
                  <textarea
                    value={settings.address || ''}
                    onChange={(e) => handleChange('address', e.target.value)}
                    className="form-textarea"
                    rows="3"
                    disabled={!isAdmin}
                  />
                </div>

                {/* قسم الشعار */}
                {isAdmin && (
                  <div className="logo-upload-section">
                    <h3 className="section-title">🖼️ شعار الشركة</h3>
                    <p className="section-desc">الشعار يظهر في الإيصالات والفواتير ولوحة التحكم</p>
                    <div className="logo-preview-wrapper">
                      <div className="logo-preview-box">
                        <img
                          src={settings.logo ? `${process.env.REACT_APP_API_URL || 'http://localhost:5002'}${settings.logo}` : '/favicon.svg'}
                          alt="شعار الشركة"
                          className="logo-preview-img"
                          onError={(e) => { e.target.src = '/favicon.svg'; }}
                        />
                      </div>
                      <div className="logo-actions">
                        <label className="btn-upload-logo">
                          📤 تغيير الشعار
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/jpg,image/webp"
                            style={{ display: 'none' }}
                            onChange={async (e) => {
                              const file = e.target.files[0];
                              if (!file) return;
                              if (file.size > 5 * 1024 * 1024) {
                                showToast('حجم الصورة يجب أن يكون أقل من 5MB', 'warning');
                                return;
                              }
                              const formData = new FormData();
                              formData.append('logo', file);
                              try {
                                const res = await settingsApi.uploadLogo(formData);
                                if (res.data.success) {
                                  setSettings(prev => ({ ...prev, logo: res.data.data.logo }));
                                  showToast('تم رفع الشعار بنجاح', 'success');
                                }
                              } catch (err) {
                                console.error('Error uploading logo:', err);
                                showToast('حدث خطأ في رفع الشعار', 'error');
                              }
                              e.target.value = '';
                            }}
                          />
                        </label>
                        {settings.logo && (
                          <button
                            className="btn-delete-logo"
                            onClick={async () => {
                              try {
                                await settingsApi.deleteLogo();
                                setSettings(prev => ({ ...prev, logo: '' }));
                                showToast('تم حذف الشعار', 'success');
                              } catch (err) {
                                console.error('Error deleting logo:', err);
                              }
                            }}
                          >
                            🗑️ حذف الشعار
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="logo-hint">يُنصح بصورة مربعة بحجم 512x512 بكسل (PNG أو JPG)</p>
                  </div>
                )}

                {!isAdmin && (
                  <div className="permission-notice">
                    <span>🔒</span>
                    <p>هذه الإعدادات للعرض فقط. تحتاج صلاحية مدير للتعديل.</p>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Invoice Settings */}
          {activeTab === 'invoice' && (
            <Card className="settings-card">
              <div className="card-header">
                <h2>🧾 إعدادات الفواتير</h2>
                <p>إعدادات الفواتير وعروض الأسعار والضريبة</p>
              </div>
              <div className="settings-form">
                {/* إعدادات الضريبة */}
                <h3>💵 إعدادات الضريبة</h3>
                <div className="toggle-group">
                  <div className="toggle-info">
                    <label>تفعيل الضريبة</label>
                    <span>إضافة ضريبة القيمة المضافة على الفواتير</span>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.tax?.enabled}
                      onChange={(e) => handleTaxChange('enabled', e.target.checked)}
                      disabled={!isAdmin}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                {settings.tax?.enabled && (
                  <div className="form-row-grid">
                    <div className="form-group">
                      <label>نسبة الضريبة (%)</label>
                      <input
                        type="number"
                        value={settings.tax?.rate || 15}
                        onChange={(e) => handleTaxChange('rate', e.target.value)}
                        className="form-input"
                        min="0"
                        max="100"
                        step="0.5"
                        disabled={!isAdmin}
                      />
                    </div>
                    <div className="form-group">
                      <label>الرقم الضريبي</label>
                      <input
                        type="text"
                        value={settings.tax?.number || ''}
                        onChange={(e) => handleTaxChange('number', e.target.value)}
                        className="form-input"
                        placeholder="مثال: 300000000000003"
                        disabled={!isAdmin}
                      />
                    </div>
                    <div className="form-group">
                      <label>اسم الضريبة</label>
                      <input
                        type="text"
                        value={settings.tax?.name || 'ضريبة القيمة المضافة'}
                        onChange={(e) => handleTaxChange('name', e.target.value)}
                        className="form-input"
                        disabled={!isAdmin}
                      />
                    </div>
                  </div>
                )}

                <div className="form-divider"></div>

                {/* إعدادات الطباعة */}
                <h3>🖨️ إعدادات الطباعة</h3>
                <div className="form-row-grid">
                  <div className="form-group">
                    <label>حجم الورق</label>
                    <select
                      value={settings.printSettings?.paperSize || 'A4'}
                      onChange={(e) => handlePrintSettingsChange('paperSize', e.target.value)}
                      className="form-input"
                      disabled={!isAdmin}
                    >
                      <option value="A4">A4</option>
                      <option value="A5">A5</option>
                      <option value="Letter">Letter</option>
                    </select>
                  </div>
                </div>
                <div className="toggle-group">
                  <div className="toggle-info">
                    <label>عرض الشعار</label>
                    <span>إظهار شعار الشركة في الفواتير</span>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.printSettings?.showLogo !== false}
                      onChange={(e) => handlePrintSettingsChange('showLogo', e.target.checked)}
                      disabled={!isAdmin}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                <div className="toggle-group">
                  <div className="toggle-info">
                    <label>عرض الشروط والأحكام</label>
                    <span>إظهار الشروط في أسفل الفاتورة</span>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.printSettings?.showTerms !== false}
                      onChange={(e) => handlePrintSettingsChange('showTerms', e.target.checked)}
                      disabled={!isAdmin}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                <div className="toggle-group">
                  <div className="toggle-info">
                    <label>عرض تفاصيل الضريبة</label>
                    <span>إظهار تفاصيل الضريبة في الفاتورة</span>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.printSettings?.showTax !== false}
                      onChange={(e) => handlePrintSettingsChange('showTax', e.target.checked)}
                      disabled={!isAdmin}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="form-divider"></div>

                {/* إعدادات الإيصال */}
                <h3>🧾 إعدادات الإيصال</h3>
                <p className="section-description">تحكم في محتوى إيصال الموعد</p>
                <div className="toggle-group">
                  <div className="toggle-info">
                    <label>عرض بيانات الشركة</label>
                    <span>إظهار اسم وعنوان الشركة في الإيصال</span>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.receiptSettings?.showCompanyInfo !== false}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        receiptSettings: { ...prev.receiptSettings, showCompanyInfo: e.target.checked }
                      }))}
                      disabled={!isAdmin}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                <div className="toggle-group">
                  <div className="toggle-info">
                    <label>عرض تفاصيل الدفع</label>
                    <span>إظهار المبلغ والمدفوع والمتبقي</span>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.receiptSettings?.showPaymentDetails !== false}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        receiptSettings: { ...prev.receiptSettings, showPaymentDetails: e.target.checked }
                      }))}
                      disabled={!isAdmin}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                <div className="toggle-group">
                  <div className="toggle-info">
                    <label>عرض اسم الموظف</label>
                    <span>إظهار اسم الموظف الذي أصدر الإيصال</span>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.receiptSettings?.showEmployeeName !== false}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        receiptSettings: { ...prev.receiptSettings, showEmployeeName: e.target.checked }
                      }))}
                      disabled={!isAdmin}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                <div className="toggle-group">
                  <div className="toggle-info">
                    <label>عرض شروط الإيصال</label>
                    <span>إظهار الشروط في أسفل الإيصال</span>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.receiptSettings?.showTerms !== false}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        receiptSettings: { ...prev.receiptSettings, showTerms: e.target.checked }
                      }))}
                      disabled={!isAdmin}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                {/* شروط الإيصال */}
                <h4>شروط الإيصال</h4>
                <div className="form-group">
                  <textarea
                    value={settings.receiptTerms || 'شكراً لاختياركم ألوان المسافر\nنتمنى لكم رحلة سعيدة'}
                    onChange={(e) => handleChange('receiptTerms', e.target.value)}
                    className="form-textarea"
                    rows="3"
                    disabled={!isAdmin}
                  />
                </div>

                <div className="form-divider"></div>

                {/* شروط عروض الأسعار */}
                <h3>📝 شروط عروض الأسعار</h3>
                <p className="section-description">هذه الشروط تظهر في عروض الأسعار المرسلة للعملاء</p>
                <div className="form-group">
                  <textarea
                    value={settings.quoteTerms || 'جميع التذاكر خاضعة لقوانين شركة الطيران\nالفنادق خاضعة لسياسة الشركة'}
                    onChange={(e) => handleChange('quoteTerms', e.target.value)}
                    className="form-textarea"
                    rows="4"
                    disabled={!isAdmin}
                  />
                </div>

                <div className="form-divider"></div>

                {/* شروط الفواتير */}
                <h3>📄 شروط الفواتير</h3>
                <p className="section-description">شروط وسياسات الإلغاء والاسترداد</p>
                <div className="form-group">
                  <textarea
                    value={settings.invoiceTerms || `سياسة الإلغاء:
- التذاكر: حسب شروط شركة الطيران
- الفنادق: حسب سياسة الفندق
- التأشيرات: غير قابلة للاسترداد بعد التقديم
- يتم رد المبالغ خلال 30 يوم عمل`}
                    onChange={(e) => handleChange('invoiceTerms', e.target.value)}
                    className="form-textarea"
                    rows="6"
                    disabled={!isAdmin}
                  />
                </div>

                <div className="form-divider"></div>

                {/* المنتجات */}
                <h3>📦 المنتجات والخدمات</h3>
                <p className="section-description">قائمة المنتجات المتاحة في الفواتير</p>
                {settings.products?.map(product => (
                  <div key={product.id} className="toggle-group">
                    <div className="toggle-info">
                      <label>📦 {product.name}</label>
                      <span>السعر الافتراضي: {product.defaultPrice || 0} SAR</span>
                    </div>
                    <div className="toggle-actions">
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={product.enabled !== false}
                          onChange={() => handleProductToggle(product.id)}
                          disabled={!isAdmin}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                      {isAdmin && (
                        <button
                          className="delete-btn-small"
                          onClick={() => handleDeleteProduct(product.id)}
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {isAdmin && (
                  <>
                    {showAddProduct ? (
                      <div className="add-item-form">
                        <div className="form-row">
                          <input
                            type="text"
                            placeholder="اسم المنتج/الخدمة"
                            value={newProduct.name}
                            onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                            className="form-input"
                          />
                          <input
                            type="number"
                            placeholder="السعر الافتراضي"
                            value={newProduct.defaultPrice}
                            onChange={(e) => setNewProduct(prev => ({ ...prev, defaultPrice: parseFloat(e.target.value) || 0 }))}
                            className="form-input"
                            min="0"
                          />
                        </div>
                        <div className="form-actions">
                          <button className="btn-primary" onClick={handleAddProduct}>إضافة</button>
                          <button className="btn-secondary" onClick={() => setShowAddProduct(false)}>إلغاء</button>
                        </div>
                      </div>
                    ) : (
                      <div className="add-item-section">
                        <button className="add-item-btn" onClick={() => setShowAddProduct(true)}>
                          + إضافة منتج/خدمة جديدة
                        </button>
                      </div>
                    )}
                  </>
                )}

                {!isAdmin && (
                  <div className="permission-notice">
                    <span>🔒</span>
                    <p>هذه الإعدادات للعرض فقط. تحتاج صلاحية مدير للتعديل.</p>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Working Hours Settings */}
          {activeTab === 'workHours' && (
            <Card className="settings-card">
              <div className="card-header">
                <h2>🕐 ساعات العمل</h2>
                <p>تحديد أوقات وأيام العمل</p>
              </div>
              <div className="settings-form">
                <h3>أوقات العمل</h3>
                <div className="hours-row">
                  <div className="form-group">
                    <label>ساعة البداية</label>
                    <select
                      value={settings.workingHours?.startHour || 8}
                      onChange={(e) => handleWorkingHoursChange('startHour', e.target.value)}
                      className="form-input"
                      disabled={!isAdmin}
                    >
                      {[...Array(24)].map((_, i) => (
                        <option key={i} value={i}>
                          {i < 12 ? `${i || 12} ص` : `${i === 12 ? 12 : i - 12} م`}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>ساعة النهاية</label>
                    <select
                      value={settings.workingHours?.endHour || 14}
                      onChange={(e) => handleWorkingHoursChange('endHour', e.target.value)}
                      className="form-input"
                      disabled={!isAdmin}
                    >
                      {[...Array(24)].map((_, i) => (
                        <option key={i} value={i}>
                          {i < 12 ? `${i || 12} ص` : `${i === 12 ? 12 : i - 12} م`}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-divider"></div>

                <h3>أيام العمل</h3>
                <div className="days-grid">
                  {weekDays.map(day => (
                    <div
                      key={day.id}
                      className={`day-card ${settings.workingHours?.workingDays?.includes(day.id) ? 'active' : ''}`}
                      onClick={() => isAdmin && handleWorkingDayToggle(day.id)}
                      style={{ cursor: isAdmin ? 'pointer' : 'default' }}
                    >
                      <span className="day-name">{day.name}</span>
                      <span className="day-status">
                        {settings.workingHours?.workingDays?.includes(day.id) ? '✓' : '✗'}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="form-divider"></div>

                {/* إعدادات المواعيد - للمدير فقط */}
                {isAdmin && (
                  <>
                    <h3>⏰ إعدادات المواعيد</h3>
                    <p className="section-description">تحكم في أوقات ومدد المواعيد المتاحة</p>

                    <div className="hours-row">
                      <div className="form-group">
                        <label>وقت بداية المواعيد</label>
                        <select
                          value={settings.appointmentSettings?.startHour || 8}
                          onChange={(e) => handleAppointmentSettingsChange('startHour', e.target.value)}
                          className="form-input"
                        >
                          {[...Array(24)].map((_, i) => (
                            <option key={i} value={i}>
                              {i < 12 ? `${i || 12}:00 ص` : `${i === 12 ? 12 : i - 12}:00 م`}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>وقت نهاية المواعيد</label>
                        <select
                          value={settings.appointmentSettings?.endHour || 14}
                          onChange={(e) => handleAppointmentSettingsChange('endHour', e.target.value)}
                          className="form-input"
                        >
                          {[...Array(24)].map((_, i) => (
                            <option key={i} value={i}>
                              {i < 12 ? `${i || 12}:00 ص` : `${i === 12 ? 12 : i - 12}:00 م`}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="form-group">
                      <label>الدقائق المتاحة</label>
                      <p className="field-hint">اختر الدقائق التي يمكن حجز المواعيد فيها</p>
                      <div className="minutes-grid">
                        {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map(minute => (
                          <div
                            key={minute}
                            className={`minute-card ${(settings.appointmentSettings?.minuteIntervals || [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]).includes(minute) ? 'active' : ''}`}
                            onClick={() => handleMinuteIntervalToggle(minute)}
                          >
                            <span>:{minute.toString().padStart(2, '0')}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="form-divider"></div>
                  </>
                )}

                {/* نوع التاريخ */}
                <h3>📅 نوع التاريخ</h3>
                <div className="calendar-type-options">
                  <label className={`calendar-option ${(settings.calendarType || 'gregorian') === 'gregorian' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="calendarType"
                      value="gregorian"
                      checked={(settings.calendarType || 'gregorian') === 'gregorian'}
                      onChange={(e) => handleChange('calendarType', e.target.value)}
                      disabled={!isAdmin}
                    />
                    <span className="option-content">
                      <span className="option-icon">📆</span>
                      <span className="option-label">ميلادي</span>
                      <span className="option-example">7 فبراير 2026</span>
                    </span>
                  </label>
                  <label className={`calendar-option ${settings.calendarType === 'hijri' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="calendarType"
                      value="hijri"
                      checked={settings.calendarType === 'hijri'}
                      onChange={(e) => handleChange('calendarType', e.target.value)}
                      disabled={!isAdmin}
                    />
                    <span className="option-content">
                      <span className="option-icon">🌙</span>
                      <span className="option-label">هجري</span>
                      <span className="option-example">8 شعبان 1447</span>
                    </span>
                  </label>
                </div>

                <div className="form-divider"></div>

                {/* الأعمدة الظاهرة في إدارة المواعيد - للمدير فقط */}
                {isAdmin && (
                  <>
                    <h3>📋 الأعمدة الظاهرة في إدارة المواعيد</h3>
                    <p className="section-description">اختر الأعمدة التي تريد إظهارها في جدول المواعيد</p>
                    <div className="columns-grid">
                      {[
                        { id: 'type', label: 'النوع', icon: '🏷️' },
                        { id: 'customerName', label: 'العميل', icon: '👤' },
                        { id: 'phone', label: 'رقم الجوال', icon: '📱' },
                        { id: 'personsCount', label: 'العدد', icon: '👥' },
                        { id: 'department', label: 'القسم', icon: '🏢' },
                        { id: 'city', label: 'المدينة', icon: '📍' },
                        { id: 'date', label: 'التاريخ', icon: '📅' },
                        { id: 'time', label: 'الوقت', icon: '⏰' },
                        { id: 'notes', label: 'ملاحظات', icon: '📝' },
                        { id: 'status', label: 'الحالة', icon: '🔄' },
                        { id: 'createdBy', label: 'مضاف بواسطة', icon: '👨‍💼' },
                        { id: 'isSubmission', label: 'تقديم', icon: '📤' }
                      ].map(column => (
                        <div
                          key={column.id}
                          className={`column-card ${settings.appointmentsTableColumns?.[column.id] !== false ? 'active' : ''}`}
                          onClick={() => handleColumnToggle(column.id)}
                        >
                          <span className="column-icon">{column.icon}</span>
                          <span className="column-label">{column.label}</span>
                          <span className="column-check">
                            {settings.appointmentsTableColumns?.[column.id] !== false ? '✓' : ''}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="form-divider"></div>
                  </>
                )}

                <h3>إعدادات التذكيرات</h3>
                <div className="toggle-group">
                  <div className="toggle-info">
                    <label>تفعيل التذكيرات</label>
                    <span>إرسال تذكيرات قبل المواعيد</span>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.reminders?.enabled}
                      onChange={(e) => handleReminderChange('enabled', e.target.checked)}
                      disabled={!isAdmin}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                {settings.reminders?.enabled && (
                  <>
                    <div className="form-group">
                      <label>التذكير قبل (أيام)</label>
                      <select
                        value={settings.reminders?.daysBefore || 1}
                        onChange={(e) => handleReminderChange('daysBefore', e.target.value)}
                        className="form-input"
                        disabled={!isAdmin}
                      >
                        <option value={1}>يوم واحد</option>
                        <option value={2}>يومان</option>
                        <option value={3}>3 أيام</option>
                        <option value={7}>أسبوع</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>وقت إرسال التذكير</label>
                      <input
                        type="time"
                        value={settings.reminders?.reminderTime || '09:00'}
                        onChange={(e) => handleReminderChange('reminderTime', e.target.value)}
                        className="form-input"
                        disabled={!isAdmin}
                      />
                    </div>
                  </>
                )}
              </div>
            </Card>
          )}

          {/* Cities Settings */}
          {activeTab === 'cities' && (
            <Card className="settings-card">
              <div className="card-header">
                <h2>🏙️ المدن</h2>
                <p>إدارة المدن المتاحة في النظام</p>
              </div>
              <div className="settings-form">
                {settings.cities?.map(city => (
                  <div key={city.id} className="toggle-group">
                    <div className="toggle-info">
                      <label>🏠 {city.name}</label>
                      <span>معرف: {city.id}</span>
                    </div>
                    <div className="toggle-actions">
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={city.enabled}
                          onChange={() => handleCityToggle(city.id)}
                          disabled={!isAdmin}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                      {isAdmin && (
                        <button
                          className="delete-btn-small"
                          onClick={() => handleDeleteCity(city.id)}
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {isAdmin && (
                  <>
                    {showAddCity ? (
                      <div className="add-item-form">
                        <div className="form-row">
                          <input
                            type="text"
                            placeholder="المعرف (إنجليزي)"
                            value={newCity.id}
                            onChange={(e) => setNewCity(prev => ({ ...prev, id: e.target.value }))}
                            className="form-input"
                            dir="ltr"
                          />
                          <input
                            type="text"
                            placeholder="اسم المدينة (عربي)"
                            value={newCity.name}
                            onChange={(e) => setNewCity(prev => ({ ...prev, name: e.target.value }))}
                            className="form-input"
                          />
                        </div>
                        <div className="form-actions">
                          <button className="btn-primary" onClick={handleAddCity}>إضافة</button>
                          <button className="btn-secondary" onClick={() => setShowAddCity(false)}>إلغاء</button>
                        </div>
                      </div>
                    ) : (
                      <div className="add-item-section">
                        <button className="add-item-btn" onClick={() => setShowAddCity(true)}>
                          + إضافة مدينة جديدة
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </Card>
          )}

          {/* Messages Settings */}
          {activeTab === 'messages' && (
            <Card className="settings-card">
              <div className="card-header">
                <h2>💬 رسائل المواعيد</h2>
                <p>تخصيص رسائل التأكيد للعملاء</p>
              </div>
              <div className="settings-form">
                <div className="message-section">
                  <div className="message-header">
                    <h3>✓ رسالة الموعد المؤكد</h3>
                    <p>تُرسل للعميل عند تأكيد موعده</p>
                  </div>
                  <div className="form-group">
                    <textarea
                      value={settings.confirmedMessage || ''}
                      onChange={(e) => handleChange('confirmedMessage', e.target.value)}
                      className="form-textarea message-textarea"
                      rows="15"
                      disabled={!isAdmin}
                    />
                  </div>
                  <div className="message-variables">
                    <span className="var-label">المتغيرات المتاحة:</span>
                    <code>{'{اسم_العميل}'}</code>
                    <code>{'{الجهة}'}</code>
                    <code>{'{التاريخ}'}</code>
                    <code>{'{الوقت}'}</code>
                    <code>{'{العدد}'}</code>
                    <code>{'{رابط_الموقع}'}</code>
                  </div>
                </div>

                <div className="form-divider"></div>

                <div className="message-section">
                  <div className="message-header">
                    <h3>📨 رسالة التقديم الإلكتروني</h3>
                    <p>تُرسل للعميل عند التقديم الإلكتروني نيابةً عنه (للسفارات ذات التقديم الإلكتروني)</p>
                  </div>
                  <div className="form-group">
                    <textarea
                      value={settings.electronicSubmissionMessage || ''}
                      onChange={(e) => handleChange('electronicSubmissionMessage', e.target.value)}
                      className="form-textarea message-textarea"
                      rows="15"
                      disabled={!isAdmin}
                    />
                  </div>
                  <div className="message-variables">
                    <span className="var-label">المتغيرات المتاحة:</span>
                    <code>{'{اسم_العميل}'}</code>
                    <code>{'{الجهة}'}</code>
                    <code>{'{التاريخ}'}</code>
                    <code>{'{العدد}'}</code>
                    <code>{'{مدة_المعالجة}'}</code>
                  </div>
                </div>

                <div className="form-divider"></div>

                <div className="message-section">
                  <div className="message-header">
                    <h3>○ رسالة الموعد غير المؤكد</h3>
                    <p>تُرسل للعميل عند حجز موعد قيد التأكيد</p>
                  </div>
                  <div className="form-group">
                    <textarea
                      value={settings.unconfirmedMessage || ''}
                      onChange={(e) => handleChange('unconfirmedMessage', e.target.value)}
                      className="form-textarea message-textarea"
                      rows="15"
                      disabled={!isAdmin}
                    />
                  </div>
                  <div className="message-variables">
                    <span className="var-label">المتغيرات المتاحة:</span>
                    <code>{'{اسم_العميل}'}</code>
                    <code>{'{الجهة}'}</code>
                    <code>{'{تاريخ_البداية}'}</code>
                    <code>{'{تاريخ_النهاية}'}</code>
                    <code>{'{العدد}'}</code>
                  </div>
                </div>

                <div className="form-divider"></div>
                <div className="quick-update-messages-header">
                  <h3>⚡ رسائل التحديث السريع</h3>
                  <p>تُستخدم هذه الرسائل مع أزرار التحديث السريع في التقديمات الإلكترونية</p>
                </div>

                <div className="message-section">
                  <div className="message-header">
                    <h3>🎉 رسالة تم القبول</h3>
                    <p>تُرسل للعميل عند قبول طلب التأشيرة</p>
                  </div>
                  <div className="form-group">
                    <textarea
                      value={settings.acceptedMessage || ''}
                      onChange={(e) => handleChange('acceptedMessage', e.target.value)}
                      className="form-textarea message-textarea"
                      rows="10"
                      disabled={!isAdmin}
                    />
                  </div>
                  <div className="message-variables">
                    <span className="var-label">المتغيرات المتاحة:</span>
                    <code>{'{اسم_العميل}'}</code>
                    <code>{'{الجهة}'}</code>
                    <code>{'{التاريخ}'}</code>
                    <code>{'{العدد}'}</code>
                  </div>
                </div>

                <div className="form-divider"></div>

                <div className="message-section">
                  <div className="message-header">
                    <h3>❌ رسالة تم الرفض</h3>
                    <p>تُرسل للعميل عند رفض طلب التأشيرة</p>
                  </div>
                  <div className="form-group">
                    <textarea
                      value={settings.rejectedMessage || ''}
                      onChange={(e) => handleChange('rejectedMessage', e.target.value)}
                      className="form-textarea message-textarea"
                      rows="10"
                      disabled={!isAdmin}
                    />
                  </div>
                  <div className="message-variables">
                    <span className="var-label">المتغيرات المتاحة:</span>
                    <code>{'{اسم_العميل}'}</code>
                    <code>{'{الجهة}'}</code>
                    <code>{'{التاريخ}'}</code>
                    <code>{'{العدد}'}</code>
                  </div>
                </div>

                <div className="form-divider"></div>

                <div className="message-section">
                  <div className="message-header">
                    <h3>📎 رسالة مستندات إضافية</h3>
                    <p>تُرسل للعميل عند طلب مستندات إضافية من السفارة</p>
                  </div>
                  <div className="form-group">
                    <textarea
                      value={settings.additionalDocsMessage || ''}
                      onChange={(e) => handleChange('additionalDocsMessage', e.target.value)}
                      className="form-textarea message-textarea"
                      rows="10"
                      disabled={!isAdmin}
                    />
                  </div>
                  <div className="message-variables">
                    <span className="var-label">المتغيرات المتاحة:</span>
                    <code>{'{اسم_العميل}'}</code>
                    <code>{'{الجهة}'}</code>
                    <code>{'{التاريخ}'}</code>
                    <code>{'{العدد}'}</code>
                  </div>
                </div>

                <div className="form-divider"></div>

                <div className="message-section">
                  <div className="message-header">
                    <h3>⏳ رسالة تأخر في المعالجة</h3>
                    <p>تُرسل للعميل عند تأخر معالجة طلبه</p>
                  </div>
                  <div className="form-group">
                    <textarea
                      value={settings.processingDelayMessage || ''}
                      onChange={(e) => handleChange('processingDelayMessage', e.target.value)}
                      className="form-textarea message-textarea"
                      rows="10"
                      disabled={!isAdmin}
                    />
                  </div>
                  <div className="message-variables">
                    <span className="var-label">المتغيرات المتاحة:</span>
                    <code>{'{اسم_العميل}'}</code>
                    <code>{'{الجهة}'}</code>
                    <code>{'{التاريخ}'}</code>
                    <code>{'{العدد}'}</code>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Payment Types Settings */}
          {activeTab === 'payments' && (
            <Card className="settings-card">
              <div className="card-header">
                <h2>💳 طرق الدفع</h2>
                <p>إدارة طرق الدفع المتاحة في النظام</p>
              </div>
              <div className="settings-form">
                {settings.paymentTypes?.map(pt => (
                  <div key={pt.id} className="toggle-group">
                    <div className="toggle-info">
                      <label>{pt.icon} {pt.label}</label>
                      <span>معرف: {pt.id}</span>
                    </div>
                    <div className="toggle-actions">
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={pt.enabled}
                          onChange={() => handlePaymentTypeToggle(pt.id)}
                          disabled={!isAdmin}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                      {isAdmin && !['cash', 'card', 'transfer'].includes(pt.id) && (
                        <button
                          className="delete-btn-small"
                          onClick={() => handleDeletePaymentType(pt.id)}
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {isAdmin && (
                  <>
                    {showAddPayment ? (
                      <div className="add-item-form">
                        <div className="form-row">
                          <input
                            type="text"
                            placeholder="المعرف (إنجليزي)"
                            value={newPayment.id}
                            onChange={(e) => setNewPayment(prev => ({ ...prev, id: e.target.value }))}
                            className="form-input"
                            dir="ltr"
                          />
                          <input
                            type="text"
                            placeholder="الاسم (عربي)"
                            value={newPayment.label}
                            onChange={(e) => setNewPayment(prev => ({ ...prev, label: e.target.value }))}
                            className="form-input"
                          />
                          <input
                            type="text"
                            placeholder="أيقونة"
                            value={newPayment.icon}
                            onChange={(e) => setNewPayment(prev => ({ ...prev, icon: e.target.value }))}
                            className="form-input icon-input"
                          />
                        </div>
                        <div className="form-actions">
                          <button className="btn-primary" onClick={handleAddPaymentType}>إضافة</button>
                          <button className="btn-secondary" onClick={() => setShowAddPayment(false)}>إلغاء</button>
                        </div>
                      </div>
                    ) : (
                      <div className="add-item-section">
                        <button className="add-item-btn" onClick={() => setShowAddPayment(true)}>
                          + إضافة طريقة دفع جديدة
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </Card>
          )}

          {/* Status Settings */}
          {activeTab === 'statuses' && (
            <Card className="settings-card">
              <div className="card-header">
                <h2>📊 حالات المواعيد</h2>
                <p>إدارة حالات المواعيد وتخصيصها</p>
              </div>
              <div className="settings-form">
                {settings.appointmentStatuses?.map(status => (
                  <div key={status.id} className="status-config-item">
                    <div className="status-preview">
                      <span
                        className="status-badge-preview"
                        style={{ backgroundColor: status.color, color: '#fff' }}
                      >
                        {status.icon} {status.label}
                      </span>
                    </div>
                    <div className="status-fields">
                      <div className="form-group inline">
                        <label>الاسم</label>
                        <input
                          type="text"
                          value={status.label}
                          onChange={(e) => handleStatusLabelChange(status.id, e.target.value)}
                          className="form-input small"
                          disabled={!isAdmin}
                        />
                      </div>
                      <div className="form-group inline">
                        <label>الأيقونة</label>
                        <input
                          type="text"
                          value={status.icon}
                          className="form-input small icon-input"
                          disabled
                        />
                      </div>
                    </div>
                    <div className="status-actions">
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={status.enabled}
                          onChange={() => handleStatusToggle(status.id)}
                          disabled={!isAdmin || status.id === 'new'}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                      {isAdmin && !['new', 'completed', 'cancelled'].includes(status.id) && (
                        <button
                          className="delete-btn-small"
                          onClick={() => handleDeleteStatus(status.id)}
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {isAdmin && (
                  <>
                    {showAddStatus ? (
                      <div className="add-item-form">
                        <div className="form-row">
                          <input
                            type="text"
                            placeholder="المعرف (إنجليزي)"
                            value={newStatus.id}
                            onChange={(e) => setNewStatus(prev => ({ ...prev, id: e.target.value }))}
                            className="form-input"
                            dir="ltr"
                          />
                          <input
                            type="text"
                            placeholder="الاسم (عربي)"
                            value={newStatus.label}
                            onChange={(e) => setNewStatus(prev => ({ ...prev, label: e.target.value }))}
                            className="form-input"
                          />
                          <input
                            type="text"
                            placeholder="أيقونة"
                            value={newStatus.icon}
                            onChange={(e) => setNewStatus(prev => ({ ...prev, icon: e.target.value }))}
                            className="form-input icon-input"
                          />
                          <input
                            type="color"
                            value={newStatus.color}
                            onChange={(e) => setNewStatus(prev => ({ ...prev, color: e.target.value }))}
                            className="form-input color-input"
                          />
                        </div>
                        <div className="form-actions">
                          <button className="btn-primary" onClick={handleAddStatus}>إضافة</button>
                          <button className="btn-secondary" onClick={() => setShowAddStatus(false)}>إلغاء</button>
                        </div>
                      </div>
                    ) : (
                      <div className="add-item-section">
                        <button className="add-item-btn" onClick={() => setShowAddStatus(true)}>
                          + إضافة حالة جديدة
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </Card>
          )}

          {/* Notifications Settings */}
          {activeTab === 'notifications' && (
            <Card className="settings-card">
              <div className="card-header">
                <h2>🔔 إعدادات الإشعارات</h2>
                <p>تحكم في طريقة استلام الإشعارات</p>
              </div>
              <div className="settings-form">
                <div className="toggle-group">
                  <div className="toggle-info">
                    <label>إشعارات البريد الإلكتروني</label>
                    <span>استلام الإشعارات عبر البريد الإلكتروني</span>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.emailNotifications}
                      onChange={(e) => handleChange('emailNotifications', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                <div className="toggle-group">
                  <div className="toggle-info">
                    <label>إشعارات الرسائل النصية</label>
                    <span>استلام الإشعارات عبر SMS</span>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.smsNotifications}
                      onChange={(e) => handleChange('smsNotifications', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
            </Card>
          )}

          {/* Google Sheets Settings (Admin Only) */}
          {activeTab === 'googleSheets' && isAdmin && (
            <Card className="settings-card">
              <div className="card-header">
                <h2>📊 Google Sheets</h2>
                <p>مزامنة المواعيد مع Google Sheets كنسخة احتياطية</p>
              </div>
              <div className="settings-form">
                {/* تفعيل المزامنة */}
                <div className="toggle-group">
                  <div className="toggle-info">
                    <label>تفعيل المزامنة مع Google Sheets</label>
                    <span>مزامنة المواعيد تلقائياً عند الإضافة أو التعديل أو الحذف</span>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.googleSheets?.enabled || false}
                      onChange={(e) => handleGoogleSheetsChange('enabled', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="form-divider"></div>

                {/* إعدادات الورقة */}
                <h3>📝 إعدادات الورقة</h3>
                <div className="form-group">
                  <label>Spreadsheet ID</label>
                  <input
                    type="text"
                    value={settings.googleSheets?.spreadsheetId || ''}
                    onChange={(e) => handleGoogleSheetsChange('spreadsheetId', e.target.value)}
                    className="form-input"
                    dir="ltr"
                    placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                  />
                  <p className="field-hint">
                    يمكنك الحصول على ID من رابط الورقة:
                    <code dir="ltr">https://docs.google.com/spreadsheets/d/[ID]/edit</code>
                  </p>
                </div>

                <div className="form-group">
                  <label>اسم الورقة (Sheet Name)</label>
                  <input
                    type="text"
                    value={settings.googleSheets?.sheetName || 'Appointments'}
                    onChange={(e) => handleGoogleSheetsChange('sheetName', e.target.value)}
                    className="form-input"
                    dir="ltr"
                    placeholder="Appointments"
                  />
                  <p className="field-hint">اسم التبويب داخل الملف (الافتراضي: Appointments)</p>
                </div>

                <div className="form-divider"></div>

                {/* أزرار الإجراءات */}
                <h3>🔧 الإجراءات</h3>
                <div className="sheets-actions">
                  <button
                    className="btn-secondary"
                    onClick={handleTestConnection}
                    disabled={testingConnection || !settings.googleSheets?.spreadsheetId}
                  >
                    {testingConnection ? '⏳ جاري الاختبار...' : '🔗 اختبار الاتصال'}
                  </button>
                  <button
                    className="btn-primary"
                    onClick={handleSyncGoogleSheets}
                    disabled={syncing || !settings.googleSheets?.enabled}
                  >
                    {syncing ? '⏳ جاري المزامنة...' : '🔄 مزامنة كاملة الآن'}
                  </button>
                </div>

                <div className="form-divider"></div>

                {/* حالة المزامنة */}
                <h3>📊 حالة المزامنة</h3>
                <div className="sync-status-card">
                  <div className="status-row">
                    <span className="status-label">الحالة:</span>
                    <span className={`status-value status-${settings.googleSheets?.syncStatus || 'idle'}`}>
                      {settings.googleSheets?.syncStatus === 'success' && '✅ متصل'}
                      {settings.googleSheets?.syncStatus === 'syncing' && '⏳ جاري المزامنة'}
                      {settings.googleSheets?.syncStatus === 'error' && '❌ خطأ'}
                      {(!settings.googleSheets?.syncStatus || settings.googleSheets?.syncStatus === 'idle') && '⚪ غير متصل'}
                    </span>
                  </div>
                  <div className="status-row">
                    <span className="status-label">آخر مزامنة:</span>
                    <span className="status-value">{formatSyncDate(settings.googleSheets?.lastSyncAt)}</span>
                  </div>
                  <div className="status-row">
                    <span className="status-label">عدد المواعيد المتزامنة:</span>
                    <span className="status-value">{settings.googleSheets?.totalSynced || 0}</span>
                  </div>
                  {settings.googleSheets?.lastError && (
                    <div className="status-row error">
                      <span className="status-label">آخر خطأ:</span>
                      <span className="status-value">{settings.googleSheets?.lastError}</span>
                    </div>
                  )}
                </div>

                <div className="form-divider"></div>

                {/* دليل الإعداد */}
                <h3>📖 دليل الإعداد</h3>
                <div className="setup-guide">
                  <div className="guide-step">
                    <span className="step-number">1</span>
                    <div className="step-content">
                      <strong>إنشاء مشروع في Google Cloud Console</strong>
                      <p>اذهب إلى console.cloud.google.com وأنشئ مشروعاً جديداً</p>
                    </div>
                  </div>
                  <div className="guide-step">
                    <span className="step-number">2</span>
                    <div className="step-content">
                      <strong>تفعيل Google Sheets API</strong>
                      <p>من APIs & Services → Library → ابحث عن Google Sheets API → Enable</p>
                    </div>
                  </div>
                  <div className="guide-step">
                    <span className="step-number">3</span>
                    <div className="step-content">
                      <strong>إنشاء Service Account</strong>
                      <p>من Credentials → Create Credentials → Service Account</p>
                    </div>
                  </div>
                  <div className="guide-step">
                    <span className="step-number">4</span>
                    <div className="step-content">
                      <strong>تحميل ملف المفتاح</strong>
                      <p>من Service Account → Keys → Add Key → JSON → أعد تسميته إلى google-credentials.json</p>
                    </div>
                  </div>
                  <div className="guide-step">
                    <span className="step-number">5</span>
                    <div className="step-content">
                      <strong>مشاركة الورقة</strong>
                      <p>شارك Google Sheet مع البريد الإلكتروني الموجود في ملف credentials (حقل client_email)</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* System Settings (Admin Only) */}
          {activeTab === 'usVisa' && (
            <Card className="settings-card">
              <div className="card-header">
                <h2>🇺🇸 إعدادات التأشيرة الأمريكية</h2>
                <p>إدارة محتوى وأسعار صفحة التأشيرة الأمريكية</p>
              </div>
              <div className="settings-form">
                <h3>إعدادات التواصل</h3>
                <div className="form-group">
                  <label>رقم واتساب التأشيرة الأمريكية</label>
                  <input
                    className="form-input"
                    value={settings.usVisa?.whatsappNumber || ''}
                    onChange={(e) => handleChange('usVisa', { ...settings.usVisa, whatsappNumber: e.target.value })}
                    placeholder="966559229597"
                    disabled={!isAdmin}
                    dir="ltr"
                  />
                  <span className="form-hint">اتركه فارغاً لاستخدام رقم الواتساب الافتراضي من إعدادات الموقع</span>
                </div>

                <div className="form-divider"></div>
                <h3>نصوص الصفحة</h3>
                <div className="form-group">
                  <label>عنوان البانر</label>
                  <input
                    className="form-input"
                    value={settings.usVisa?.bannerTitle || 'التأشيرة الأمريكية'}
                    onChange={(e) => handleChange('usVisa', { ...settings.usVisa, bannerTitle: e.target.value })}
                    disabled={!isAdmin}
                  />
                </div>
                <div className="form-group">
                  <label>وصف البانر</label>
                  <input
                    className="form-input"
                    value={settings.usVisa?.bannerSubtitle || ''}
                    onChange={(e) => handleChange('usVisa', { ...settings.usVisa, bannerSubtitle: e.target.value })}
                    disabled={!isAdmin}
                  />
                </div>
                <div className="form-group">
                  <label>مدة المعالجة المتوقعة</label>
                  <input
                    className="form-input"
                    value={settings.usVisa?.processingDays || ''}
                    onChange={(e) => handleChange('usVisa', { ...settings.usVisa, processingDays: e.target.value })}
                    disabled={!isAdmin}
                  />
                </div>
                <div className="form-group">
                  <label>العملة</label>
                  <input
                    className="form-input"
                    value={settings.usVisa?.currency || 'ريال'}
                    onChange={(e) => handleChange('usVisa', { ...settings.usVisa, currency: e.target.value })}
                    disabled={!isAdmin}
                  />
                </div>

                <div className="form-divider"></div>
                <h3>أسعار التأشيرات</h3>

                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                  <div>
                    <h4 style={{ marginBottom: '12px', color: '#0d9488' }}>تأشيرة سياحية</h4>
                    <div className="form-group">
                      <label>الاسم</label>
                      <input
                        className="form-input"
                        value={settings.usVisa?.touristLabel || 'تأشيرة سياحية'}
                        onChange={(e) => handleChange('usVisa', { ...settings.usVisa, touristLabel: e.target.value })}
                        disabled={!isAdmin}
                      />
                    </div>
                    <div className="form-group">
                      <label>الوصف</label>
                      <input
                        className="form-input"
                        value={settings.usVisa?.touristDesc || ''}
                        onChange={(e) => handleChange('usVisa', { ...settings.usVisa, touristDesc: e.target.value })}
                        disabled={!isAdmin}
                      />
                    </div>
                    <div className="form-group">
                      <label>السعر</label>
                      <input
                        className="form-input"
                        type="number"
                        value={settings.usVisa?.touristPrice || 950}
                        onChange={(e) => handleChange('usVisa', { ...settings.usVisa, touristPrice: Number(e.target.value) })}
                        disabled={!isAdmin}
                      />
                    </div>
                  </div>

                  <div>
                    <h4 style={{ marginBottom: '12px', color: '#0d9488' }}>تأشيرة علاج</h4>
                    <div className="form-group">
                      <label>الاسم</label>
                      <input
                        className="form-input"
                        value={settings.usVisa?.medicalLabel || 'تأشيرة علاج'}
                        onChange={(e) => handleChange('usVisa', { ...settings.usVisa, medicalLabel: e.target.value })}
                        disabled={!isAdmin}
                      />
                    </div>
                    <div className="form-group">
                      <label>الوصف</label>
                      <input
                        className="form-input"
                        value={settings.usVisa?.medicalDesc || ''}
                        onChange={(e) => handleChange('usVisa', { ...settings.usVisa, medicalDesc: e.target.value })}
                        disabled={!isAdmin}
                      />
                    </div>
                    <div className="form-group">
                      <label>السعر</label>
                      <input
                        className="form-input"
                        type="number"
                        value={settings.usVisa?.medicalPrice || 950}
                        onChange={(e) => handleChange('usVisa', { ...settings.usVisa, medicalPrice: Number(e.target.value) })}
                        disabled={!isAdmin}
                      />
                    </div>
                  </div>

                  <div>
                    <h4 style={{ marginBottom: '12px', color: '#0d9488' }}>تأشيرة دراسة</h4>
                    <div className="form-group">
                      <label>الاسم</label>
                      <input
                        className="form-input"
                        value={settings.usVisa?.studentLabel || 'تأشيرة دراسة'}
                        onChange={(e) => handleChange('usVisa', { ...settings.usVisa, studentLabel: e.target.value })}
                        disabled={!isAdmin}
                      />
                    </div>
                    <div className="form-group">
                      <label>الوصف</label>
                      <input
                        className="form-input"
                        value={settings.usVisa?.studentDesc || ''}
                        onChange={(e) => handleChange('usVisa', { ...settings.usVisa, studentDesc: e.target.value })}
                        disabled={!isAdmin}
                      />
                    </div>
                    <div className="form-group">
                      <label>السعر</label>
                      <input
                        className="form-input"
                        type="number"
                        value={settings.usVisa?.studentPrice || 1200}
                        onChange={(e) => handleChange('usVisa', { ...settings.usVisa, studentPrice: Number(e.target.value) })}
                        disabled={!isAdmin}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'system' && isAdmin && (
            <Card className="settings-card">
              <div className="card-header">
                <h2>🔧 إعدادات النظام</h2>
                <p>إعدادات متقدمة للنظام (للمدراء فقط)</p>
              </div>
              <div className="settings-form">
                <div className="toggle-group">
                  <div className="toggle-info">
                    <label>السماح بالتسجيل</label>
                    <span>السماح للمستخدمين الجدد بإنشاء حسابات</span>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.allowRegistration}
                      onChange={(e) => handleChange('allowRegistration', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                <div className="toggle-group">
                  <div className="toggle-info">
                    <label>التحقق من البريد الإلكتروني</label>
                    <span>طلب التحقق من البريد عند التسجيل</span>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.requireEmailVerification}
                      onChange={(e) => handleChange('requireEmailVerification', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                <div className="toggle-group warning">
                  <div className="toggle-info">
                    <label>وضع الصيانة</label>
                    <span>تعطيل الموقع مؤقتاً للصيانة</span>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.maintenanceMode}
                      onChange={(e) => handleChange('maintenanceMode', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="danger-zone">
                  <h3>⚠️ منطقة الخطر</h3>
                  <div className="danger-actions">
                    <div className="danger-item">
                      <div>
                        <strong>مسح ذاكرة التخزين المؤقت</strong>
                        <p>حذف جميع البيانات المؤقتة</p>
                      </div>
                      <button className="danger-btn">مسح</button>
                    </div>
                    <div className="danger-item">
                      <div>
                        <strong>إعادة تعيين الإعدادات</strong>
                        <p>استعادة الإعدادات الافتراضية</p>
                      </div>
                      <button className="danger-btn">إعادة تعيين</button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Profile Settings */}
          {activeTab === 'profile' && (
            <Card className="settings-card">
              <div className="card-header">
                <h2>👤 الملف الشخصي</h2>
                <p>إعدادات حسابك الشخصي</p>
              </div>
              <div className="settings-form">
                <div className="profile-section">
                  <div className="profile-avatar">
                    <img
                      src={user?.avatar || '/favicon.svg'}
                      alt={user?.name}
                      onError={(e) => { e.target.src = '/favicon.svg'; }}
                    />
                    <button className="change-avatar-btn">تغيير الصورة</button>
                  </div>
                  <div className="profile-info">
                    <div className="info-item">
                      <label>الاسم</label>
                      <span>{user?.name}</span>
                    </div>
                    <div className="info-item">
                      <label>البريد الإلكتروني</label>
                      <span>{user?.email}</span>
                    </div>
                    <div className="info-item">
                      <label>الصلاحية</label>
                      <span className={`role-badge role-${user?.role}`}>
                        {user?.role === 'admin' ? 'مدير' : 'موظف'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="form-divider"></div>

                <h3>تغيير كلمة المرور</h3>
                <div className="form-group">
                  <label>كلمة المرور الحالية</label>
                  <input type="password" className="form-input" placeholder="••••••••" />
                </div>
                <div className="form-group">
                  <label>كلمة المرور الجديدة</label>
                  <input type="password" className="form-input" placeholder="••••••••" />
                </div>
                <div className="form-group">
                  <label>تأكيد كلمة المرور</label>
                  <input type="password" className="form-input" placeholder="••••••••" />
                </div>
              </div>
            </Card>
          )}

          {/* Save Button */}
          <div className="settings-actions">
            {saved && (
              <span className="save-success">✅ تم حفظ الإعدادات بنجاح</span>
            )}
            <button className="save-btn" onClick={handleSave} disabled={saving}>
              {saving ? 'جاري الحفظ...' : '💾 حفظ التغييرات'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
