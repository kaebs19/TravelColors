import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { customersApi, appointmentsApi, bookingsApi } from '../../api';
import { useToast } from '../../context';
import { Card, Loader, Button, Modal } from '../../components/common';
import { formatCurrency, formatDate } from '../../utils';
import './CustomerDetails.css';

const CustomerDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [customer, setCustomer] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [applications, setApplications] = useState({ visaApplications: [], licenseApplications: [], visaServiceApplications: [] });
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    city: '',
    notes: '',
    isVIP: false
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [customerRes, appointmentsRes, bookingsRes, applicationsRes] = await Promise.all([
        customersApi.getCustomer(id),
        appointmentsApi.getAppointments({ customer: id }),
        bookingsApi.getBookings({ customer: id }).catch(() => ({ data: { bookings: [] } })),
        customersApi.getCustomerApplications(id).catch(() => ({ data: { visaApplications: [], licenseApplications: [], visaServiceApplications: [] } }))
      ]);

      const customerData = customerRes.data?.customer || customerRes.data?.data?.customer || customerRes.data;
      setCustomer(customerData);
      setFormData({
        name: customerData.name || '',
        phone: customerData.phone || '',
        email: customerData.email || '',
        city: customerData.address?.city || customerData.city || '',
        notes: customerData.notes || '',
        isVIP: customerData.isVIP || false
      });

      const appts = appointmentsRes.data?.data?.appointments || appointmentsRes.data?.appointments || [];
      const customerAppointments = appts.filter(a => a.customer?._id === id || a.customer === id);
      setAppointments(customerAppointments);

      const bks = bookingsRes.data?.data?.bookings || bookingsRes.data?.bookings || [];
      setBookings(bks);

      const appsData = applicationsRes.data?.data || applicationsRes.data || {};
      setApplications({
        visaApplications: appsData.visaApplications || [],
        licenseApplications: appsData.licenseApplications || [],
        visaServiceApplications: appsData.visaServiceApplications || []
      });
    } catch (error) {
      console.error('Error fetching customer data:', error);
    } finally {
      setLoading(false);
    }
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
    setSaving(true);
    try {
      await customersApi.updateCustomer(id, formData);
      setShowEditModal(false);
      fetchData();
    } catch (error) {
      console.error('Error updating customer:', error);
      showToast('حدث خطأ أثناء تحديث بيانات العميل', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('هل أنت متأكد من حذف هذا العميل؟')) {
      try {
        await customersApi.deleteCustomer(id);
        navigate('/control/customers');
      } catch (error) {
        console.error('Error deleting customer:', error);
        showToast('حدث خطأ أثناء حذف العميل', 'error');
      }
    }
  };

  // إرسال رسالة واتساب
  const handleSendWhatsApp = () => {
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
  const handleCopyPhone = async () => {
    if (customer.phone) {
      try {
        await navigator.clipboard.writeText(customer.phone);
        setCopiedPhone(true);
        setTimeout(() => setCopiedPhone(false), 2000);
      } catch (error) {
        console.error('Error copying phone:', error);
      }
    }
  };

  // فتح إيصال الموعد
  const handleShowReceipt = (appointment) => {
    setSelectedAppointment(appointment);
    setShowReceiptModal(true);
  };

  // طباعة الإيصال
  const handlePrintReceipt = () => {
    const printContent = document.getElementById('receipt-content');
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <title>إيصال - ${customer.name}</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            padding: 20px;
            max-width: 800px;
            margin: 0 auto;
            direction: rtl;
          }
          .receipt-header {
            text-align: center;
            border-bottom: 2px solid #000;
            padding-bottom: 20px;
            margin-bottom: 20px;
          }
          .receipt-header h1 {
            margin: 0;
            font-size: 24px;
          }
          .receipt-header p {
            margin: 5px 0;
            color: #666;
          }
          .receipt-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
          }
          .receipt-details {
            margin-bottom: 20px;
          }
          .receipt-details table {
            width: 100%;
            border-collapse: collapse;
          }
          .receipt-details th,
          .receipt-details td {
            padding: 10px;
            text-align: right;
            border: 1px solid #ddd;
          }
          .receipt-details th {
            background: #f5f5f5;
          }
          .receipt-total {
            text-align: left;
            font-size: 18px;
            margin-top: 20px;
          }
          .receipt-footer {
            margin-top: 40px;
            text-align: center;
            color: #666;
            font-size: 12px;
          }
          @media print {
            body { print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        ${printContent.innerHTML}
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      new: { label: 'جديد', class: 'status-new', icon: '🆕' },
      in_progress: { label: 'قيد العمل', class: 'status-in-progress', icon: '🔄' },
      completed: { label: 'مكتمل', class: 'status-completed', icon: '✔️' },
      cancelled: { label: 'ملغي', class: 'status-cancelled', icon: '❌' }
    };
    return statusMap[status] || { label: status, class: '', icon: '' };
  };

  const getTypeBadge = (type) => {
    const typeMap = {
      confirmed: { label: 'مؤكد', class: 'type-confirmed' },
      unconfirmed: { label: 'غير مؤكد', class: 'type-unconfirmed' },
      draft: { label: 'مسودة', class: 'type-draft' }
    };
    return typeMap[type] || { label: type, class: '' };
  };

  const formatDateDisplay = (dateStr, includeYear = true) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    if (includeYear) {
      return `${days[date.getDay()]} ${day}/${month}/${year}`;
    }
    return `${days[date.getDay()]} ${day}/${month}`;
  };

  const formatTimeDisplay = (time) => {
    if (!time) return '-';
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const period = h < 12 ? 'ص' : 'م';
    const displayHour = h > 12 ? h - 12 : h;
    return `${displayHour}:${minutes} ${period}`;
  };

  if (loading) {
    return <Loader fullScreen />;
  }

  if (!customer) {
    return (
      <div className="customer-details-page">
        <div className="not-found">
          <h2>العميل غير موجود</h2>
          <Button onClick={() => navigate('/control/customers')}>
            العودة للعملاء
          </Button>
        </div>
      </div>
    );
  }

  // حساب الإجماليات
  const totalAmount = appointments.reduce((sum, a) => sum + (a.totalAmount || 0), 0) +
                      bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
  const totalPaid = appointments.reduce((sum, a) => sum + (a.paidAmount || 0), 0) +
                    bookings.reduce((sum, b) => sum + (b.paidAmount || 0), 0);
  const totalRemaining = totalAmount - totalPaid;
  const totalPersons = appointments.reduce((sum, a) => sum + (a.personsCount || 1), 0);

  const statusLabels = {
    draft: 'مسودة',
    submitted: 'مقدّم',
    under_review: 'قيد المراجعة',
    approved: 'مقبول',
    rejected: 'مرفوض',
    completed: 'مكتمل',
    received: 'مستلم'
  };

  const statusColors = {
    draft: '#6b7280',
    submitted: '#3b82f6',
    under_review: '#f59e0b',
    approved: '#10b981',
    rejected: '#ef4444',
    completed: '#059669',
    received: '#8b5cf6'
  };

  // ترتيب المواعيد حسب التاريخ (الأحدث أولاً)
  const sortedAppointments = [...appointments].sort((a, b) => {
    const dateA = new Date(a.appointmentDate || a.dateFrom || a.createdAt);
    const dateB = new Date(b.appointmentDate || b.dateFrom || b.createdAt);
    return dateB - dateA;
  });

  return (
    <div className="customer-details-page">
      {/* Breadcrumb */}
      <div className="page-breadcrumb">
        <span onClick={() => navigate('/control/dashboard')} className="clickable">لوحة التحكم</span>
        <span className="separator">/</span>
        <span onClick={() => navigate('/control/customers')} className="clickable">العملاء</span>
        <span className="separator">/</span>
        <span className="current">{customer.name}</span>
      </div>

      {/* Customer Header */}
      <div className="customer-header">
        <div className="customer-avatar">
          {customer.isVIP && <span className="vip-badge">VIP</span>}
          <span className="avatar-letter">{customer.name?.charAt(0)}</span>
        </div>
        <div className="customer-info">
          <h1>
            {customer.name}
            {customer.isVIP && <span className="vip-star">⭐</span>}
          </h1>
          <div className="customer-meta">
            {customer.phone && (
              <span className="meta-item">
                <span className="meta-icon">📱</span>
                <span dir="ltr">{customer.phone}</span>
              </span>
            )}
            {customer.email && (
              <span className="meta-item">
                <span className="meta-icon">📧</span>
                {customer.email}
              </span>
            )}
            {(customer.address?.city || customer.city) && (
              <span className="meta-item">
                <span className="meta-icon">📍</span>
                {customer.address?.city || customer.city}
              </span>
            )}
          </div>
        </div>
        <div className="customer-actions">
          {customer.phone && (
            <>
              <Button variant="outline" onClick={handleSendWhatsApp}>
                📱 واتساب
              </Button>
              <Button variant="outline" onClick={handleCopyPhone}>
                {copiedPhone ? '✓ تم النسخ' : '📋 نسخ الرقم'}
              </Button>
            </>
          )}
          <Button variant="outline" onClick={() => setShowEditModal(true)}>
            ✏️ تعديل
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            🗑️ حذف
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="customer-stats">
        <Card className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <span className="stat-value">{appointments.length}</span>
            <span className="stat-label">المواعيد</span>
          </div>
        </Card>
        <Card className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <span className="stat-value">{totalPersons}</span>
            <span className="stat-label">إجمالي الأشخاص</span>
          </div>
        </Card>
        <Card className="stat-card stat-total">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <span className="stat-value">{formatCurrency(totalAmount)}</span>
            <span className="stat-label">إجمالي المبلغ</span>
          </div>
        </Card>
        <Card className="stat-card stat-paid">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <span className="stat-value">{formatCurrency(totalPaid)}</span>
            <span className="stat-label">المدفوع</span>
          </div>
        </Card>
        <Card className="stat-card stat-remaining">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <span className={`stat-value ${totalRemaining > 0 ? 'remaining-warning' : ''}`}>
              {formatCurrency(totalRemaining)}
            </span>
            <span className="stat-label">المتبقي</span>
          </div>
        </Card>
      </div>

      {/* Notes Section */}
      {customer.notes && (
        <Card className="notes-card">
          <h3>📝 ملاحظات</h3>
          <p>{customer.notes}</p>
        </Card>
      )}

      {/* Appointments Section */}
      <Card className="section-card">
        <div className="section-header">
          <h3>📅 المواعيد</h3>
          <Button
            size="small"
            onClick={() => navigate(`/control/appointments/add?type=confirmed&customer=${id}`)}
          >
            + إضافة موعد
          </Button>
        </div>
        {sortedAppointments.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📅</span>
            <p>لا توجد مواعيد</p>
            <Button
              size="small"
              onClick={() => navigate(`/control/appointments/add?type=confirmed&customer=${id}`)}
            >
              إضافة موعد جديد
            </Button>
          </div>
        ) : (
          <div className="appointments-list">
            {sortedAppointments.map(appointment => (
              <div key={appointment._id} className="appointment-item">
                <div className="appointment-info">
                  <div className="appointment-badges">
                    <span className={`type-badge ${getTypeBadge(appointment.type).class}`}>
                      {getTypeBadge(appointment.type).label}
                    </span>
                    <span className={`status-badge ${getStatusBadge(appointment.status).class}`}>
                      {getStatusBadge(appointment.status).icon} {getStatusBadge(appointment.status).label}
                    </span>
                  </div>
                  <div className="appointment-details">
                    <div className="detail-row">
                      <span className="detail-label">📌 القسم:</span>
                      <span className="detail-value">{appointment.department?.title || '-'}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">📅 التاريخ:</span>
                      <span className="detail-value">
                        {appointment.type === 'confirmed'
                          ? formatDateDisplay(appointment.appointmentDate)
                          : appointment.type === 'unconfirmed'
                          ? `${formatDateDisplay(appointment.dateFrom, false)} - ${formatDateDisplay(appointment.dateTo, false)}`
                          : formatDateDisplay(appointment.reminderDate)
                        }
                      </span>
                    </div>
                    {appointment.type === 'confirmed' && appointment.appointmentTime && (
                      <div className="detail-row">
                        <span className="detail-label">🕐 الوقت:</span>
                        <span className="detail-value">{formatTimeDisplay(appointment.appointmentTime)}</span>
                      </div>
                    )}
                    <div className="detail-row">
                      <span className="detail-label">👥 الأشخاص:</span>
                      <span className="detail-value">{appointment.personsCount || 1}</span>
                    </div>
                  </div>
                  {appointment.totalAmount > 0 && (
                    <div className="appointment-payment">
                      <div className="payment-row">
                        <span>الإجمالي: {formatCurrency(appointment.totalAmount)}</span>
                        <span>المدفوع: {formatCurrency(appointment.paidAmount || 0)}</span>
                        <span className={appointment.remainingAmount > 0 ? 'remaining-warning' : ''}>
                          المتبقي: {formatCurrency(appointment.remainingAmount || 0)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="appointment-actions">
                  <button
                    className="action-btn view"
                    onClick={() => navigate('/control/appointments')}
                    title="عرض"
                  >
                    👁️
                  </button>
                  <button
                    className="action-btn edit"
                    onClick={() => navigate(`/control/appointments/add?type=${appointment.type}&edit=${appointment._id}`)}
                    title="تعديل"
                  >
                    ✏️
                  </button>
                  {appointment.totalAmount > 0 && (
                    <button
                      className="action-btn receipt"
                      onClick={() => handleShowReceipt(appointment)}
                      title="إيصال"
                    >
                      🧾
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* الطلبات المربوطة */}
      {(applications.visaApplications.length > 0 || applications.licenseApplications.length > 0 || applications.visaServiceApplications.length > 0) && (
        <div className="detail-card" style={{ marginTop: '20px' }}>
          <h3 style={{ marginBottom: '15px', fontSize: '1.1rem' }}>📄 الطلبات المربوطة</h3>

          {applications.visaApplications.length > 0 && (
            <div style={{ marginBottom: '15px' }}>
              <h4 style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>🇺🇸 تأشيرة أمريكية</h4>
              {applications.visaApplications.map(app => (
                <div key={app._id}
                  onClick={() => navigate(`/control/visa-applications/${app._id}`)}
                  style={{
                    padding: '10px 14px', borderRadius: '8px', marginBottom: '6px',
                    background: 'var(--hover-bg, #f9fafb)', cursor: 'pointer',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    border: '1px solid var(--border-color, #e5e7eb)',
                    transition: 'background 0.15s'
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 600, marginLeft: '10px' }}>{app.applicationNumber}</span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                      {app.personalInfo?.fullName || '-'}
                    </span>
                  </div>
                  <span style={{
                    padding: '3px 10px', borderRadius: '12px', fontSize: '0.8rem',
                    background: statusColors[app.status] + '20', color: statusColors[app.status],
                    fontWeight: 600
                  }}>
                    {statusLabels[app.status] || app.status}
                  </span>
                </div>
              ))}
            </div>
          )}

          {applications.licenseApplications.length > 0 && (
            <div style={{ marginBottom: '15px' }}>
              <h4 style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>🪪 رخصة دولية</h4>
              {applications.licenseApplications.map(app => (
                <div key={app._id}
                  onClick={() => navigate(`/control/license-applications/${app._id}`)}
                  style={{
                    padding: '10px 14px', borderRadius: '8px', marginBottom: '6px',
                    background: 'var(--hover-bg, #f9fafb)', cursor: 'pointer',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    border: '1px solid var(--border-color, #e5e7eb)',
                    transition: 'background 0.15s'
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 600, marginLeft: '10px' }}>{app.applicationNumber}</span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                      {app.personalInfo?.givenName && app.personalInfo?.familyName
                        ? `${app.personalInfo.givenName} ${app.personalInfo.familyName}`
                        : '-'}
                    </span>
                  </div>
                  <span style={{
                    padding: '3px 10px', borderRadius: '12px', fontSize: '0.8rem',
                    background: statusColors[app.status] + '20', color: statusColors[app.status],
                    fontWeight: 600
                  }}>
                    {statusLabels[app.status] || app.status}
                  </span>
                </div>
              ))}
            </div>
          )}

          {applications.visaServiceApplications.length > 0 && (
            <div style={{ marginBottom: '15px' }}>
              <h4 style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>🌍 تأشيرة إلكترونية</h4>
              {applications.visaServiceApplications.map(app => (
                <div key={app._id}
                  onClick={() => navigate(`/control/visa-service-applications/${app._id}`)}
                  style={{
                    padding: '10px 14px', borderRadius: '8px', marginBottom: '6px',
                    background: 'var(--hover-bg, #f9fafb)', cursor: 'pointer',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    border: '1px solid var(--border-color, #e5e7eb)',
                    transition: 'background 0.15s'
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 600, marginLeft: '10px' }}>{app.applicationNumber}</span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                      {app.personalInfo?.fullName || '-'}
                    </span>
                  </div>
                  <span style={{
                    padding: '3px 10px', borderRadius: '12px', fontSize: '0.8rem',
                    background: statusColors[app.status] + '20', color: statusColors[app.status],
                    fontWeight: 600
                  }}>
                    {statusLabels[app.status] || app.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="تعديل بيانات العميل"
      >
        <form onSubmit={handleSubmit} className="edit-form">
          <div className="form-group">
            <label>اسم العميل *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>رقم الجوال</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              dir="ltr"
            />
          </div>
          <div className="form-group">
            <label>البريد الإلكتروني</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              dir="ltr"
            />
          </div>
          <div className="form-group">
            <label>المدينة</label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>ملاحظات</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="3"
            />
          </div>
          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                name="isVIP"
                checked={formData.isVIP}
                onChange={handleChange}
              />
              عميل VIP
            </label>
          </div>
          <div className="form-actions">
            <Button type="button" variant="outline" onClick={() => setShowEditModal(false)}>
              إلغاء
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Receipt Modal */}
      <Modal
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        title="إيصال الموعد"
        size="medium"
      >
        {selectedAppointment && (
          <div className="receipt-modal">
            <div id="receipt-content" className="receipt-content">
              <div className="receipt-header">
                <h2>ألوان المسافر للسفر والسياحة</h2>
                <p>Travel Colors Tourism</p>
                <p>إيصال دفع</p>
              </div>

              <div className="receipt-info">
                <div>
                  <strong>رقم الإيصال:</strong> {selectedAppointment._id?.slice(-8).toUpperCase()}
                </div>
                <div>
                  <strong>التاريخ:</strong> {formatDateDisplay(new Date())}
                </div>
              </div>

              <div className="receipt-customer">
                <h4>بيانات العميل</h4>
                <p><strong>الاسم:</strong> {customer.name}</p>
                {customer.phone && <p><strong>الجوال:</strong> <span dir="ltr">{customer.phone}</span></p>}
              </div>

              <div className="receipt-details">
                <h4>تفاصيل الخدمة</h4>
                <table>
                  <tbody>
                    <tr>
                      <td>القسم / السفارة</td>
                      <td>{selectedAppointment.department?.title || '-'}</td>
                    </tr>
                    <tr>
                      <td>تاريخ الموعد</td>
                      <td>{formatDateDisplay(selectedAppointment.appointmentDate || selectedAppointment.dateFrom)}</td>
                    </tr>
                    <tr>
                      <td>عدد الأشخاص</td>
                      <td>{selectedAppointment.personsCount || 1}</td>
                    </tr>
                    <tr>
                      <td>نوع الموعد</td>
                      <td>{getTypeBadge(selectedAppointment.type).label}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="receipt-payment">
                <h4>تفاصيل الدفع</h4>
                <table>
                  <tbody>
                    <tr>
                      <td>المبلغ الإجمالي</td>
                      <td>{formatCurrency(selectedAppointment.totalAmount || 0)}</td>
                    </tr>
                    <tr>
                      <td>المبلغ المدفوع</td>
                      <td>{formatCurrency(selectedAppointment.paidAmount || 0)}</td>
                    </tr>
                    <tr className={selectedAppointment.remainingAmount > 0 ? 'remaining-row' : ''}>
                      <td>المبلغ المتبقي</td>
                      <td>{formatCurrency(selectedAppointment.remainingAmount || 0)}</td>
                    </tr>
                    {selectedAppointment.paymentType && (
                      <tr>
                        <td>طريقة الدفع</td>
                        <td>
                          {selectedAppointment.paymentType === 'cash' ? 'نقدي' :
                           selectedAppointment.paymentType === 'card' ? 'شبكة' :
                           selectedAppointment.paymentType === 'transfer' ? 'تحويل' : '-'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="receipt-footer">
                <p>شكراً لتعاملكم معنا</p>
                <p>ألوان المسافر للسفر والسياحة</p>
              </div>
            </div>

            <div className="receipt-actions">
              <Button variant="outline" onClick={() => setShowReceiptModal(false)}>
                إغلاق
              </Button>
              <Button onClick={handlePrintReceipt}>
                🖨️ طباعة الإيصال
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CustomerDetails;
