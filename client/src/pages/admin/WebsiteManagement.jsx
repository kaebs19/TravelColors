import { useState, useEffect } from 'react';
import { websiteApi } from '../../api';
import './WebsiteManagement.css';

const TABS = [
  { id: 'hero', label: 'البانر الرئيسي', icon: '🖼️' },
  { id: 'services', label: 'الخدمات', icon: '🛎️' },
  { id: 'about', label: 'من نحن', icon: '🏢' },
  { id: 'faq', label: 'الأسئلة الشائعة', icon: '❓' },
  { id: 'contact', label: 'التواصل', icon: '📞' },
  { id: 'general', label: 'عام', icon: '⚙️' }
];

const WebsiteManagement = () => {
  const [activeTab, setActiveTab] = useState('hero');
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      setLoading(true);
      const res = await websiteApi.getContent();
      if (res.success) {
        setContent(res.data);
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'حدث خطأ في تحميل المحتوى' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await websiteApi.updateContent(content);
      if (res.success) {
        setMessage({ type: 'success', text: 'تم حفظ التغييرات بنجاح' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'حدث خطأ في الحفظ' });
    } finally {
      setSaving(false);
    }
  };

  const updateField = (path, value) => {
    setContent(prev => {
      const updated = { ...prev };
      const keys = path.split('.');
      let obj = updated;
      for (let i = 0; i < keys.length - 1; i++) {
        if (obj[keys[i]] === undefined) obj[keys[i]] = {};
        obj[keys[i]] = { ...obj[keys[i]] };
        obj = obj[keys[i]];
      }
      obj[keys[keys.length - 1]] = value;
      return updated;
    });
  };

  const updateArrayItem = (arrayPath, index, field, value) => {
    setContent(prev => {
      const updated = { ...prev };
      const arr = [...(arrayPath.split('.').reduce((o, k) => o?.[k], updated) || [])];
      arr[index] = { ...arr[index], [field]: value };
      const keys = arrayPath.split('.');
      let obj = updated;
      for (let i = 0; i < keys.length - 1; i++) {
        obj[keys[i]] = { ...obj[keys[i]] };
        obj = obj[keys[i]];
      }
      obj[keys[keys.length - 1]] = arr;
      return updated;
    });
  };

  const addArrayItem = (arrayPath, defaultItem) => {
    setContent(prev => {
      const updated = { ...prev };
      const keys = arrayPath.split('.');
      let obj = updated;
      for (let i = 0; i < keys.length - 1; i++) {
        obj[keys[i]] = { ...obj[keys[i]] };
        obj = obj[keys[i]];
      }
      const arr = [...(obj[keys[keys.length - 1]] || [])];
      arr.push(defaultItem);
      obj[keys[keys.length - 1]] = arr;
      return updated;
    });
  };

  const removeArrayItem = (arrayPath, index) => {
    setContent(prev => {
      const updated = { ...prev };
      const keys = arrayPath.split('.');
      let obj = updated;
      for (let i = 0; i < keys.length - 1; i++) {
        obj[keys[i]] = { ...obj[keys[i]] };
        obj = obj[keys[i]];
      }
      const arr = [...(obj[keys[keys.length - 1]] || [])];
      arr.splice(index, 1);
      obj[keys[keys.length - 1]] = arr;
      return updated;
    });
  };

  const handleImageUpload = async (e, field) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('field', field);
      const res = await websiteApi.uploadImage(formData);
      if (res.success) {
        updateField(field, res.data.path);
        setMessage({ type: 'success', text: 'تم رفع الصورة بنجاح' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'حدث خطأ في رفع الصورة' });
    }
  };

  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';
  const baseUrl = apiUrl.replace('/api', '');
  const getImageUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${baseUrl}${path}`;
  };

  if (loading) {
    return (
      <div className="wm-page">
        <div className="wm-loading">جاري تحميل محتوى الموقع...</div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="wm-page">
        <div className="wm-error">لم يتم تحميل المحتوى. <button onClick={loadContent}>إعادة المحاولة</button></div>
      </div>
    );
  }

  const renderHeroTab = () => (
    <div className="wm-form-section">
      <h3>البانر الرئيسي</h3>
      <div className="wm-form-group">
        <label>العنوان الرئيسي</label>
        <input type="text" value={content.hero?.title || ''} onChange={e => updateField('hero.title', e.target.value)} />
      </div>
      <div className="wm-form-group">
        <label>العنوان الفرعي</label>
        <input type="text" value={content.hero?.subtitle || ''} onChange={e => updateField('hero.subtitle', e.target.value)} />
      </div>
      <div className="wm-form-group">
        <label>الوصف</label>
        <textarea rows={3} value={content.hero?.description || ''} onChange={e => updateField('hero.description', e.target.value)} />
      </div>
      <div className="wm-form-group">
        <label>صورة الخلفية</label>
        <input type="file" accept="image/*" onChange={e => handleImageUpload(e, 'hero.backgroundImage')} />
        {content.hero?.backgroundImage && (
          <div className="wm-image-preview">
            <img src={getImageUrl(content.hero.backgroundImage)} alt="Hero" />
          </div>
        )}
      </div>
    </div>
  );

  const renderServicesTab = () => (
    <div className="wm-form-section">
      <div className="wm-section-header">
        <h3>الخدمات ({content.services?.length || 0})</h3>
        <button className="wm-btn-add" onClick={() => addArrayItem('services', { title: '', description: '', icon: '⭐' })}>
          + إضافة خدمة
        </button>
      </div>
      {(content.services || []).map((service, i) => (
        <div className="wm-array-item" key={i}>
          <div className="wm-array-item-header">
            <span>خدمة {i + 1}</span>
            <button className="wm-btn-remove" onClick={() => removeArrayItem('services', i)}>حذف</button>
          </div>
          <div className="wm-form-row">
            <div className="wm-form-group" style={{ flex: '0 0 80px' }}>
              <label>أيقونة</label>
              <input type="text" value={service.icon || ''} onChange={e => updateArrayItem('services', i, 'icon', e.target.value)} style={{ textAlign: 'center', fontSize: '1.5rem' }} />
            </div>
            <div className="wm-form-group" style={{ flex: 1 }}>
              <label>العنوان</label>
              <input type="text" value={service.title || ''} onChange={e => updateArrayItem('services', i, 'title', e.target.value)} />
            </div>
          </div>
          <div className="wm-form-group">
            <label>الوصف</label>
            <input type="text" value={service.description || ''} onChange={e => updateArrayItem('services', i, 'description', e.target.value)} />
          </div>
        </div>
      ))}
    </div>
  );

  const renderAboutTab = () => (
    <div className="wm-form-section">
      <h3>من نحن</h3>
      <div className="wm-form-group">
        <label>العنوان</label>
        <input type="text" value={content.aboutUs?.title || ''} onChange={e => updateField('aboutUs.title', e.target.value)} />
      </div>
      <div className="wm-form-group">
        <label>الوصف</label>
        <textarea rows={4} value={content.aboutUs?.description || ''} onChange={e => updateField('aboutUs.description', e.target.value)} />
      </div>

      <div className="wm-section-header" style={{ marginTop: '24px' }}>
        <h4>المميزات ({content.aboutUs?.features?.length || 0})</h4>
        <button className="wm-btn-add" onClick={() => addArrayItem('aboutUs.features', { title: '', description: '', icon: '⭐' })}>
          + إضافة ميزة
        </button>
      </div>
      {(content.aboutUs?.features || []).map((feature, i) => (
        <div className="wm-array-item" key={i}>
          <div className="wm-array-item-header">
            <span>ميزة {i + 1}</span>
            <button className="wm-btn-remove" onClick={() => removeArrayItem('aboutUs.features', i)}>حذف</button>
          </div>
          <div className="wm-form-row">
            <div className="wm-form-group" style={{ flex: '0 0 80px' }}>
              <label>أيقونة</label>
              <input type="text" value={feature.icon || ''} onChange={e => updateArrayItem('aboutUs.features', i, 'icon', e.target.value)} style={{ textAlign: 'center', fontSize: '1.5rem' }} />
            </div>
            <div className="wm-form-group" style={{ flex: 1 }}>
              <label>العنوان</label>
              <input type="text" value={feature.title || ''} onChange={e => updateArrayItem('aboutUs.features', i, 'title', e.target.value)} />
            </div>
          </div>
          <div className="wm-form-group">
            <label>الوصف</label>
            <input type="text" value={feature.description || ''} onChange={e => updateArrayItem('aboutUs.features', i, 'description', e.target.value)} />
          </div>
        </div>
      ))}
    </div>
  );

  const renderFaqTab = () => (
    <div className="wm-form-section">
      <div className="wm-section-header">
        <h3>الأسئلة الشائعة ({content.faq?.length || 0})</h3>
        <button className="wm-btn-add" onClick={() => addArrayItem('faq', { question: '', answer: '' })}>
          + إضافة سؤال
        </button>
      </div>
      {(content.faq || []).map((item, i) => (
        <div className="wm-array-item" key={i}>
          <div className="wm-array-item-header">
            <span>سؤال {i + 1}</span>
            <button className="wm-btn-remove" onClick={() => removeArrayItem('faq', i)}>حذف</button>
          </div>
          <div className="wm-form-group">
            <label>السؤال</label>
            <input type="text" value={item.question || ''} onChange={e => updateArrayItem('faq', i, 'question', e.target.value)} />
          </div>
          <div className="wm-form-group">
            <label>الإجابة</label>
            <textarea rows={3} value={item.answer || ''} onChange={e => updateArrayItem('faq', i, 'answer', e.target.value)} />
          </div>
        </div>
      ))}
    </div>
  );

  const renderContactTab = () => (
    <div className="wm-form-section">
      <h3>معلومات التواصل</h3>
      <div className="wm-form-row">
        <div className="wm-form-group">
          <label>رقم الهاتف</label>
          <input type="text" value={content.contact?.phone || ''} onChange={e => updateField('contact.phone', e.target.value)} dir="ltr" />
        </div>
        <div className="wm-form-group">
          <label>رقم واتساب (بدون + أو 00)</label>
          <input type="text" value={content.contact?.whatsapp || ''} onChange={e => updateField('contact.whatsapp', e.target.value)} dir="ltr" placeholder="966559229597" />
        </div>
      </div>
      <div className="wm-form-row">
        <div className="wm-form-group">
          <label>البريد الإلكتروني</label>
          <input type="email" value={content.contact?.email || ''} onChange={e => updateField('contact.email', e.target.value)} dir="ltr" />
        </div>
        <div className="wm-form-group">
          <label>العنوان</label>
          <input type="text" value={content.contact?.address || ''} onChange={e => updateField('contact.address', e.target.value)} />
        </div>
      </div>
      <div className="wm-form-group">
        <label>رابط الخريطة (Google Maps)</label>
        <input type="text" value={content.contact?.mapLink || ''} onChange={e => updateField('contact.mapLink', e.target.value)} dir="ltr" placeholder="https://maps.google.com/..." />
      </div>

      <h3 style={{ marginTop: '32px' }}>وسائل التواصل الاجتماعي</h3>
      <div className="wm-form-row">
        <div className="wm-form-group">
          <label>Twitter / X</label>
          <input type="text" value={content.socialMedia?.twitter || ''} onChange={e => updateField('socialMedia.twitter', e.target.value)} dir="ltr" placeholder="https://twitter.com/..." />
        </div>
        <div className="wm-form-group">
          <label>Instagram</label>
          <input type="text" value={content.socialMedia?.instagram || ''} onChange={e => updateField('socialMedia.instagram', e.target.value)} dir="ltr" placeholder="https://instagram.com/..." />
        </div>
      </div>
      <div className="wm-form-row">
        <div className="wm-form-group">
          <label>Facebook</label>
          <input type="text" value={content.socialMedia?.facebook || ''} onChange={e => updateField('socialMedia.facebook', e.target.value)} dir="ltr" placeholder="https://facebook.com/..." />
        </div>
        <div className="wm-form-group">
          <label>Snapchat</label>
          <input type="text" value={content.socialMedia?.snapchat || ''} onChange={e => updateField('socialMedia.snapchat', e.target.value)} dir="ltr" placeholder="https://snapchat.com/..." />
        </div>
      </div>
    </div>
  );

  const renderGeneralTab = () => (
    <div className="wm-form-section">
      <h3>إعدادات عامة</h3>
      <div className="wm-form-row">
        <div className="wm-form-group">
          <label>اسم الموقع (عربي)</label>
          <input type="text" value={content.general?.siteName || ''} onChange={e => updateField('general.siteName', e.target.value)} />
        </div>
        <div className="wm-form-group">
          <label>اسم الموقع (إنجليزي)</label>
          <input type="text" value={content.general?.siteNameEn || ''} onChange={e => updateField('general.siteNameEn', e.target.value)} dir="ltr" />
        </div>
      </div>
      <div className="wm-form-group">
        <label>وصف الموقع</label>
        <textarea rows={2} value={content.general?.siteDescription || ''} onChange={e => updateField('general.siteDescription', e.target.value)} />
      </div>
      <div className="wm-form-group">
        <label>شعار الموقع</label>
        <input type="file" accept="image/*" onChange={e => handleImageUpload(e, 'general.logo')} />
        {content.general?.logo && (
          <div className="wm-image-preview small">
            <img src={getImageUrl(content.general.logo)} alt="Logo" />
          </div>
        )}
      </div>
      <div className="wm-form-group">
        <label>نص حقوق النشر (استخدم {'{year}'} للسنة الحالية)</label>
        <input type="text" value={content.footer?.copyrightText || ''} onChange={e => updateField('footer.copyrightText', e.target.value)} />
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'hero': return renderHeroTab();
      case 'services': return renderServicesTab();
      case 'about': return renderAboutTab();
      case 'faq': return renderFaqTab();
      case 'contact': return renderContactTab();
      case 'general': return renderGeneralTab();
      default: return null;
    }
  };

  return (
    <div className="wm-page">
      <div className="wm-header">
        <div>
          <h1>إدارة الموقع</h1>
          <p>تعديل محتوى موقع العملاء</p>
        </div>
        <div className="wm-header-actions">
          <a href="/" target="_blank" rel="noopener noreferrer" className="wm-btn-preview">معاينة الموقع</a>
          <button className="wm-btn-save" onClick={handleSave} disabled={saving}>
            {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
          </button>
        </div>
      </div>

      {message.text && (
        <div className={`wm-message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="wm-layout">
        <div className="wm-tabs">
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`wm-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="wm-tab-icon">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
        <div className="wm-content">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default WebsiteManagement;
