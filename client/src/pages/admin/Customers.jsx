import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { customersApi } from '../../api';
import { Button, Card, Loader, Modal, PhoneInput } from '../../components/common';
import { formatCurrency, formatDate } from '../../utils';
import { arabicToEnglishNumbers } from '../../utils/formatters';
import './Customers.css';

const Customers = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [filterVIP, setFilterVIP] = useState('');
  const [sortBy, setSortBy] = useState('latest');
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [copiedPhone, setCopiedPhone] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // grid, list
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    city: 'الرياض',
    notes: '',
    isVIP: false
  });
  const [saving, setSaving] = useState(false);

  // حساب الإحصائيات
  const stats = {
    total: customers.length,
    vip: customers.filter(c => c.isVIP).length,
    thisMonth: customers.filter(c => {
      const created = new Date(c.createdAt);
      const now = new Date();
      return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
    }).length,
    withAppointments: customers.filter(c => (c.totalBookings || 0) > 0).length
  };

  // استخراج قائمة المدن الفريدة
  const uniqueCities = [...new Set(customers.map(c => c.city).filter(Boolean))];

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await customersApi.getCustomers();
      // customersApi يرجع response.data مباشرة من axios
      // الـ API يرجع { success: true, customers: [...], data: { customers: [...] } }
      const customersList = response.customers || response.data?.customers || [];
      console.log('Customers loaded:', customersList.length, customersList);
      setCustomers(customersList);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (customer = null) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData({
        name: customer.name || '',
        phone: customer.phone || '',
        email: customer.email || '',
        city: customer.city || 'الرياض',
        notes: customer.notes || '',
        isVIP: customer.isVIP || false
      });
    } else {
      setEditingCustomer(null);
      setFormData({
        name: '',
        phone: '',
        email: '',
        city: 'الرياض',
        notes: '',
        isVIP: false
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCustomer(null);
    setFormData({
      name: '',
      phone: '',
      email: '',
      city: 'الرياض',
      notes: '',
      isVIP: false
    });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('الرجاء إدخال اسم العميل');
      return;
    }

    setSaving(true);
    try {
      if (editingCustomer) {
        await customersApi.updateCustomer(editingCustomer._id, formData);
      } else {
        await customersApi.createCustomer(formData);
      }
      handleCloseModal();
      fetchCustomers();
    } catch (error) {
      console.error('Error saving customer:', error);
      alert('حدث خطأ أثناء حفظ العميل');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (customerId) => {
    if (window.confirm('هل أنت متأكد من حذف هذا العميل؟')) {
      try {
        await customersApi.deleteCustomer(customerId);
        fetchCustomers();
      } catch (error) {
        console.error('Error deleting customer:', error);
        alert('حدث خطأ أثناء حذف العميل');
      }
    }
  };

  const handleToggleVIP = async (customer) => {
    try {
      await customersApi.updateCustomer(customer._id, { isVIP: !customer.isVIP });
      fetchCustomers();
    } catch (error) {
      console.error('Error updating VIP status:', error);
    }
  };

  // إرسال رسالة واتساب
  const handleSendWhatsApp = (customer) => {
    const phone = customer.phone?.replace(/[^0-9]/g, '');
    const phoneNumber = phone?.startsWith('0') ? '966' + phone.slice(1) : phone;
    const message = `مرحباً ${customer.name}،\n\nنشكرك على تواصلك مع ألوان المسافر للسفر والسياحة.\n\nكيف يمكننا مساعدتك؟`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = phoneNumber
      ? `https://wa.me/${phoneNumber}?text=${encodedMessage}`
      : `https://wa.me/?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  // نسخ رقم الهاتف
  const handleCopyPhone = async (customer) => {
    if (customer.phone) {
      try {
        await navigator.clipboard.writeText(customer.phone);
        setCopiedPhone(customer._id);
        setTimeout(() => setCopiedPhone(null), 2000);
      } catch (error) {
        console.error('Error copying phone:', error);
      }
    }
  };

  // فتح صفحة تفاصيل العميل
  const handleViewCustomer = (customer) => {
    navigate(`/control/customers/${customer._id}`);
  };

  // فتح/إغلاق قائمة الإجراءات
  const toggleMenu = (customerId, e) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === customerId ? null : customerId);
  };

  // إغلاق القائمة عند النقر خارجها
  const closeMenu = () => {
    setOpenMenuId(null);
  };

  // فلترة وترتيب العملاء
  let filteredCustomers = customers.filter(customer => {
    const matchesSearch = !search ||
      customer.name.toLowerCase().includes(search.toLowerCase()) ||
      customer.phone?.includes(search);
    const matchesCity = !filterCity || customer.city === filterCity;
    const matchesVIP = !filterVIP ||
      (filterVIP === 'vip' && customer.isVIP) ||
      (filterVIP === 'normal' && !customer.isVIP);

    return matchesSearch && matchesCity && matchesVIP;
  });

  // ترتيب العملاء
  if (sortBy === 'latest') {
    filteredCustomers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } else if (sortBy === 'name') {
    filteredCustomers.sort((a, b) => a.name.localeCompare(b.name, 'ar'));
  } else if (sortBy === 'bookings') {
    filteredCustomers.sort((a, b) => (b.totalBookings || 0) - (a.totalBookings || 0));
  } else if (sortBy === 'spent') {
    filteredCustomers.sort((a, b) => (b.totalSpent || 0) - (a.totalSpent || 0));
  }

  if (loading) {
    return <Loader fullScreen />;
  }

  return (
    <div className="customers-page">
      {/* Breadcrumb */}
      <div className="page-breadcrumb">
        <span>لوحة التحكم</span>
        <span className="separator">/</span>
        <span className="current">العملاء</span>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid stats-grid-4">
        <div className="stat-card stat-total">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">إجمالي العملاء</span>
          </div>
        </div>
        <div className="stat-card stat-vip">
          <div className="stat-icon">⭐</div>
          <div className="stat-info">
            <span className="stat-value">{stats.vip}</span>
            <span className="stat-label">عملاء VIP</span>
          </div>
        </div>
        <div className="stat-card stat-new">
          <div className="stat-icon">🆕</div>
          <div className="stat-info">
            <span className="stat-value">{stats.thisMonth}</span>
            <span className="stat-label">هذا الشهر</span>
          </div>
        </div>
        <div className="stat-card stat-active">
          <div className="stat-icon">📅</div>
          <div className="stat-info">
            <span className="stat-value">{stats.withAppointments}</span>
            <span className="stat-label">لديهم حجوزات</span>
          </div>
        </div>
      </div>

      {/* Header with Actions */}
      <div className="page-header">
        <div className="header-right">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="بحث بالاسم أو الهاتف..."
              value={search}
              onChange={(e) => setSearch(arabicToEnglishNumbers(e.target.value))}
            />
          </div>
          <Button onClick={() => handleOpenModal()}>+ إضافة عميل</Button>
        </div>
        <div className="header-left">
          <div className="view-toggle">
            <button
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="عرض شبكة"
            >
              ⊞
            </button>
            <button
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="عرض قائمة"
            >
              ☰
            </button>
          </div>
          <select
            className="filter-select"
            value={filterVIP}
            onChange={(e) => setFilterVIP(e.target.value)}
          >
            <option value="">جميع العملاء</option>
            <option value="vip">VIP فقط</option>
            <option value="normal">عادي فقط</option>
          </select>
          <select
            className="filter-select"
            value={filterCity}
            onChange={(e) => setFilterCity(e.target.value)}
          >
            <option value="">جميع المدن</option>
            {uniqueCities.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
          <select
            className="filter-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="latest">الأحدث</option>
            <option value="name">الاسم</option>
            <option value="bookings">الحجوزات</option>
          </select>
        </div>
      </div>

      {/* Results Count */}
      <div className="results-count">
        عرض {filteredCustomers.length} من {customers.length} عميل
      </div>

      {filteredCustomers.length === 0 ? (
        <Card className="empty-card">
          <div className="empty-state">
            <span className="empty-icon">👥</span>
            <h3>لا يوجد عملاء</h3>
            <p>قم بإضافة عميل جديد للبدء</p>
            <Button onClick={() => handleOpenModal()}>إضافة عميل</Button>
          </div>
        </Card>
      ) : (
        <div className={`customers-${viewMode}`} onClick={closeMenu}>
          {filteredCustomers.map(customer => (
            <Card
              key={customer._id}
              hoverable
              className={`customer-card ${viewMode === 'list' ? 'list-view' : ''}`}
            >
              <div className="customer-header">
                <div className="customer-menu-wrapper">
                  <button
                    className="menu-trigger-btn"
                    onClick={(e) => toggleMenu(customer._id, e)}
                    title="المزيد"
                  >
                    ⋮
                  </button>
                  {openMenuId === customer._id && (
                    <div className="customer-dropdown-menu">
                      <button onClick={() => { handleViewCustomer(customer); closeMenu(); }}>
                        <span>👁️</span> عرض التفاصيل
                      </button>
                      <button onClick={() => { handleOpenModal(customer); closeMenu(); }}>
                        <span>✏️</span> تعديل
                      </button>
                      <button onClick={() => { handleToggleVIP(customer); closeMenu(); }}>
                        <span>⭐</span> {customer.isVIP ? 'إزالة VIP' : 'تعيين VIP'}
                      </button>
                      {customer.phone && (
                        <>
                          <button onClick={() => { handleSendWhatsApp(customer); closeMenu(); }}>
                            <span>📱</span> واتساب
                          </button>
                          <button onClick={() => { handleCopyPhone(customer); closeMenu(); }}>
                            <span>📋</span> {copiedPhone === customer._id ? 'تم النسخ!' : 'نسخ الرقم'}
                          </button>
                        </>
                      )}
                      <div className="menu-divider"></div>
                      <button className="delete-btn" onClick={() => { handleDelete(customer._id); closeMenu(); }}>
                        <span>🗑️</span> حذف
                      </button>
                    </div>
                  )}
                </div>
                <div className="customer-info" onClick={() => handleViewCustomer(customer)}>
                  <h3>
                    {customer.isVIP && <span className="vip-star">⭐</span>}
                    {customer.name}
                  </h3>
                  <p className="customer-phone" dir="ltr">{customer.phone || '-'}</p>
                  {customer.city && <span className="customer-city">📍 {customer.city}</span>}
                </div>
                <div className="customer-avatar" onClick={() => handleViewCustomer(customer)}>
                  {customer.name.charAt(0)}
                </div>
              </div>

              <div className="customer-footer">
                <span className="bookings-count">{customer.totalBookings || 0} حجز</span>
                {customer.lastBookingDate && (
                  <span className="last-booking">آخر حجز: {formatDate(customer.lastBookingDate)}</span>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal إضافة/تعديل عميل */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingCustomer ? 'تعديل عميل' : 'إضافة عميل جديد'}
        size="medium"
      >
        <form onSubmit={handleSubmit} className="customer-form">
          <div className="form-group">
            <label>اسم العميل *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="أدخل اسم العميل"
              required
            />
          </div>

          <div className="form-group">
            <label>رقم الجوال</label>
            <PhoneInput
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="05XX XXX XXXX"
            />
          </div>

          <div className="form-group">
            <label>البريد الإلكتروني</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="email@example.com"
              dir="ltr"
            />
          </div>

          <div className="form-group">
            <label>المدينة</label>
            <select
              name="city"
              value={formData.city}
              onChange={handleChange}
            >
              <option value="الرياض">الرياض</option>
              <option value="جدة">جدة</option>
              <option value="مكة">مكة</option>
              <option value="المدينة">المدينة</option>
              <option value="الدمام">الدمام</option>
              <option value="الخبر">الخبر</option>
              <option value="أخرى">أخرى</option>
            </select>
          </div>

          <div className="form-group">
            <label>ملاحظات</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="أضف ملاحظات عن العميل..."
              rows={3}
            />
          </div>

          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="isVIP"
                checked={formData.isVIP}
                onChange={handleChange}
              />
              <span>عميل VIP</span>
            </label>
          </div>

          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={handleCloseModal}>
              إلغاء
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'جاري الحفظ...' : (editingCustomer ? 'حفظ التغييرات' : 'إضافة العميل')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Customers;
