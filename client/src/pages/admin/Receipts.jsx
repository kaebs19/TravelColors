import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { receiptsApi, customersApi, appointmentsApi, settingsApi } from '../../api';
import { Card, Button, Loader, Modal, NumberInput } from '../../components/common';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { printContent, formatReceiptForPrint } from '../../utils/printUtils';
import './Receipts.css';

const Receipts = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [receipts, setReceipts] = useState([]);
  const [stats, setStats] = useState({});
  const [customers, setCustomers] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [settings, setSettings] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [submitting, setSubmitting] = useState(false);

  const [filters, setFilters] = useState({
    status: '',
    paymentMethod: '',
    search: '',
    startDate: '',
    endDate: ''
  });

  const [receiptForm, setReceiptForm] = useState({
    appointment: '',
    customer: '',
    customerName: '',
    customerPhone: '',
    amount: 0,
    paymentMethod: 'cash',
    description: '',
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, [filters.status, filters.paymentMethod]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [receiptsRes, customersRes, appointmentsRes, settingsRes] = await Promise.all([
        receiptsApi.getReceipts({ ...filters, limit: 50 }),
        customersApi.getCustomers({ limit: 100 }),
        appointmentsApi.getAppointments({ status: 'new', limit: 50 }),
        settingsApi.getSettings()
      ]);

      const receiptsData = receiptsRes.data?.data || receiptsRes.data || {};
      setReceipts(receiptsData.receipts || []);
      setStats(receiptsData.stats || {});

      const customersList = customersRes.customers || customersRes.data?.customers || [];
      setCustomers(customersList);

      const appointmentsList = appointmentsRes.data?.data?.appointments || appointmentsRes.data?.appointments || [];
      setAppointments(appointmentsList);

      setSettings(settingsRes.data?.data || settingsRes.data || settingsRes);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    try {
      setLoading(true);
      const res = await receiptsApi.getReceipts(filters);
      const data = res.data?.data || res.data || {};
      setReceipts(data.receipts || []);
      setStats(data.stats || {});
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerSelect = (customerId) => {
    if (!customerId) {
      setReceiptForm({
        ...receiptForm,
        customer: '',
        customerName: '',
        customerPhone: ''
      });
      return;
    }
    const customer = customers.find(c => c._id === customerId);
    if (customer) {
      setReceiptForm({
        ...receiptForm,
        customer: customerId,
        customerName: customer.name || '',
        customerPhone: customer.phone || ''
      });
    }
  };

  const handleAppointmentSelect = (appointmentId) => {
    if (!appointmentId) {
      setReceiptForm({
        ...receiptForm,
        appointment: '',
        customerName: '',
        customerPhone: '',
        amount: 0
      });
      return;
    }
    const appointment = appointments.find(a => a._id === appointmentId);
    if (appointment) {
      const remaining = (appointment.totalAmount || 0) - (appointment.paidAmount || 0);
      setReceiptForm({
        ...receiptForm,
        appointment: appointmentId,
        customer: appointment.customer?._id || '',
        customerName: appointment.customerName || '',
        customerPhone: appointment.phone || '',
        amount: remaining > 0 ? remaining : 0,
        description: `دفعة لموعد ${appointment.customerName}`
      });
    }
  };

  const handleCreateReceipt = async (e) => {
    e.preventDefault();

    if (!receiptForm.customerName || !receiptForm.amount || receiptForm.amount <= 0) {
      alert('يرجى إدخال اسم العميل والمبلغ');
      return;
    }

    try {
      setSubmitting(true);
      const res = await receiptsApi.createReceipt(receiptForm);
      if (res.data?.success) {
        alert('تم إنشاء الإيصال بنجاح');
        setShowCreateModal(false);
        resetForm();
        fetchData();
      }
    } catch (error) {
      console.error('Error creating receipt:', error);
      alert(error.response?.data?.message || 'حدث خطأ أثناء إنشاء الإيصال');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConvertToInvoice = async () => {
    if (!selectedReceipt) return;

    try {
      setSubmitting(true);
      const res = await receiptsApi.convertToInvoice(selectedReceipt._id, {});
      if (res.data?.success) {
        alert('تم تحويل الإيصال إلى فاتورة بنجاح');
        setShowConvertModal(false);
        setSelectedReceipt(null);
        fetchData();
        // الانتقال للفاتورة الجديدة
        if (res.data.data?.invoice?._id) {
          navigate(`/control/invoices?view=${res.data.data.invoice._id}`);
        }
      }
    } catch (error) {
      console.error('Error converting receipt:', error);
      alert(error.response?.data?.message || 'حدث خطأ أثناء التحويل');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelReceipt = async (receipt) => {
    if (!window.confirm('هل أنت متأكد من إلغاء هذا الإيصال؟')) return;

    try {
      const reason = prompt('سبب الإلغاء:');
      if (!reason) return;

      const res = await receiptsApi.cancelReceipt(receipt._id, { reason });
      if (res.data?.success) {
        alert('تم إلغاء الإيصال بنجاح');
        fetchData();
      }
    } catch (error) {
      console.error('Error cancelling receipt:', error);
      alert(error.response?.data?.message || 'حدث خطأ أثناء الإلغاء');
    }
  };

  const viewReceipt = (receipt) => {
    setSelectedReceipt(receipt);
    setShowViewModal(true);
  };

  const resetForm = () => {
    setReceiptForm({
      appointment: '',
      customer: '',
      customerName: '',
      customerPhone: '',
      amount: 0,
      paymentMethod: 'cash',
      description: '',
      notes: ''
    });
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('ar-u-nu-latn', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('en-SA', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount || 0) + ' SAR';
  };

  const getStatusBadge = (status) => {
    const styles = {
      active: { bg: '#e8f5e9', color: '#2e7d32', label: 'نشط' },
      converted: { bg: '#e3f2fd', color: '#1565c0', label: 'محول لفاتورة' },
      cancelled: { bg: '#ffebee', color: '#c62828', label: 'ملغي' }
    };
    const style = styles[status] || styles.active;
    return (
      <span style={{
        backgroundColor: style.bg,
        color: style.color,
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '500'
      }}>
        {style.label}
      </span>
    );
  };

  const getPaymentMethodLabel = (method) => {
    const methods = {
      cash: 'نقدي',
      card: 'شبكة',
      transfer: 'تحويل'
    };
    return methods[method] || method;
  };

  const filteredReceipts = receipts.filter(receipt => {
    if (activeTab === 'active') return receipt.status === 'active';
    if (activeTab === 'converted') return receipt.status === 'converted';
    if (activeTab === 'cancelled') return receipt.status === 'cancelled';
    return true;
  });

  const printReceipt = (receipt) => {
    const content = formatReceiptForPrint(receipt, settings);
    printContent(content, `إيصال - ${receipt.receiptNumber}`);
  };

  if (loading) return <Loader />;

  return (
    <div className="receipts-page">
      <div className="page-header">
        <h1>الإيصالات</h1>
        <Button onClick={() => setShowCreateModal(true)}>إنشاء إيصال</Button>
      </div>

      {/* إحصائيات */}
      <div className="stats-cards">
        <Card className="stat-card">
          <div className="stat-icon income">
            <i className="fas fa-receipt"></i>
          </div>
          <div className="stat-info">
            <span className="stat-label">إجمالي الإيصالات</span>
            <span className="stat-value">{stats.count || 0}</span>
          </div>
        </Card>
        <Card className="stat-card">
          <div className="stat-icon success">
            <i className="fas fa-money-bill-wave"></i>
          </div>
          <div className="stat-info">
            <span className="stat-label">إجمالي المبالغ</span>
            <span className="stat-value">{formatMoney(stats.totalAmount)}</span>
          </div>
        </Card>
        <Card className="stat-card">
          <div className="stat-icon primary">
            <i className="fas fa-check-circle"></i>
          </div>
          <div className="stat-info">
            <span className="stat-label">النشطة</span>
            <span className="stat-value">{stats.activeCount || 0}</span>
          </div>
        </Card>
        <Card className="stat-card">
          <div className="stat-icon info">
            <i className="fas fa-exchange-alt"></i>
          </div>
          <div className="stat-info">
            <span className="stat-label">المحولة لفواتير</span>
            <span className="stat-value">{stats.convertedCount || 0}</span>
          </div>
        </Card>
      </div>

      {/* الفلاتر */}
      <Card className="filters-card">
        <div className="filters-row">
          <input
            type="text"
            placeholder="بحث..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <select
            value={filters.paymentMethod}
            onChange={(e) => setFilters({ ...filters, paymentMethod: e.target.value })}
          >
            <option value="">كل طرق الدفع</option>
            <option value="cash">نقدي</option>
            <option value="card">شبكة</option>
            <option value="transfer">تحويل</option>
          </select>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
          />
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
          />
          <Button onClick={handleSearch}>بحث</Button>
        </div>
      </Card>

      {/* التبويبات */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          الكل ({receipts.length})
        </button>
        <button
          className={`tab ${activeTab === 'active' ? 'active' : ''}`}
          onClick={() => setActiveTab('active')}
        >
          نشط ({receipts.filter(r => r.status === 'active').length})
        </button>
        <button
          className={`tab ${activeTab === 'converted' ? 'active' : ''}`}
          onClick={() => setActiveTab('converted')}
        >
          محول ({receipts.filter(r => r.status === 'converted').length})
        </button>
        <button
          className={`tab ${activeTab === 'cancelled' ? 'active' : ''}`}
          onClick={() => setActiveTab('cancelled')}
        >
          ملغي ({receipts.filter(r => r.status === 'cancelled').length})
        </button>
      </div>

      {/* قائمة الإيصالات */}
      <Card className="receipts-list">
        {filteredReceipts.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-receipt"></i>
            <p>لا توجد إيصالات</p>
          </div>
        ) : (
          <table className="receipts-table">
            <thead>
              <tr>
                <th>رقم الإيصال</th>
                <th>العميل</th>
                <th>المبلغ</th>
                <th>طريقة الدفع</th>
                <th>الحالة</th>
                <th>التاريخ</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredReceipts.map((receipt) => (
                <tr key={receipt._id}>
                  <td>
                    <button className="receipt-link-btn" onClick={() => viewReceipt(receipt)}>
                      {receipt.receiptNumber}
                    </button>
                  </td>
                  <td>
                    <div className="customer-info">
                      <span className="name">{receipt.customerName}</span>
                      {receipt.customerPhone && (
                        <span className="phone">{receipt.customerPhone}</span>
                      )}
                    </div>
                  </td>
                  <td className="amount">{formatMoney(receipt.amount)}</td>
                  <td>{getPaymentMethodLabel(receipt.paymentMethod)}</td>
                  <td>{getStatusBadge(receipt.status)}</td>
                  <td>{formatDate(receipt.createdAt)}</td>
                  <td>
                    <div className="actions">
                      <button className="btn-icon" onClick={() => viewReceipt(receipt)} title="عرض">
                        <i className="fas fa-eye"></i>
                      </button>
                      {receipt.status === 'active' && (
                        <>
                          <button
                            className="btn-icon convert"
                            onClick={() => {
                              setSelectedReceipt(receipt);
                              setShowConvertModal(true);
                            }}
                            title="تحويل لفاتورة"
                          >
                            <i className="fas fa-file-invoice"></i>
                          </button>
                          <button
                            className="btn-icon delete"
                            onClick={() => handleCancelReceipt(receipt)}
                            title="إلغاء"
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {/* نافذة إنشاء إيصال */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}
        title="إنشاء إيصال جديد"
      >
        <form onSubmit={handleCreateReceipt} className="receipt-form">
          <div className="form-group">
            <label>اختر من موعد (اختياري)</label>
            <select
              value={receiptForm.appointment}
              onChange={(e) => handleAppointmentSelect(e.target.value)}
            >
              <option value="">بدون موعد</option>
              {appointments.map((apt) => (
                <option key={apt._id} value={apt._id}>
                  {apt.customerName} - {formatDate(apt.appointmentDate)}
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>اسم العميل *</label>
              <input
                type="text"
                value={receiptForm.customerName}
                onChange={(e) => setReceiptForm({ ...receiptForm, customerName: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>رقم الهاتف</label>
              <input
                type="text"
                value={receiptForm.customerPhone}
                onChange={(e) => setReceiptForm({ ...receiptForm, customerPhone: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>المبلغ *</label>
              <NumberInput
                value={receiptForm.amount}
                onChange={(e) => setReceiptForm({ ...receiptForm, amount: e.target.value })}
                min={0}
                suffix="SAR"
                required
              />
            </div>
            <div className="form-group">
              <label>طريقة الدفع</label>
              <select
                value={receiptForm.paymentMethod}
                onChange={(e) => setReceiptForm({ ...receiptForm, paymentMethod: e.target.value })}
              >
                <option value="cash">نقدي</option>
                <option value="card">شبكة</option>
                <option value="transfer">تحويل</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>الوصف</label>
            <input
              type="text"
              value={receiptForm.description}
              onChange={(e) => setReceiptForm({ ...receiptForm, description: e.target.value })}
              placeholder="وصف الإيصال..."
            />
          </div>

          <div className="form-group">
            <label>ملاحظات</label>
            <textarea
              value={receiptForm.notes}
              onChange={(e) => setReceiptForm({ ...receiptForm, notes: e.target.value })}
              rows={3}
              placeholder="ملاحظات إضافية..."
            />
          </div>

          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={() => setShowCreateModal(false)}>
              إلغاء
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'جاري الإنشاء...' : 'إنشاء الإيصال'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* نافذة عرض الإيصال */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedReceipt(null);
        }}
        title={`إيصال رقم ${selectedReceipt?.receiptNumber || ''}`}
      >
        {selectedReceipt && (
          <div className="receipt-view">
            <div className="receipt-header">
              <div className="company-info">
                {selectedReceipt.companyInfo?.logo && (
                  <img src={selectedReceipt.companyInfo.logo} alt="Logo" className="company-logo" />
                )}
                <h3>{selectedReceipt.companyInfo?.name}</h3>
                {selectedReceipt.companyInfo?.nameEn && (
                  <p className="name-en">{selectedReceipt.companyInfo.nameEn}</p>
                )}
              </div>
              <div className="receipt-info">
                <p><strong>رقم الإيصال:</strong> {selectedReceipt.receiptNumber}</p>
                <p><strong>التاريخ:</strong> {formatDate(selectedReceipt.createdAt)}</p>
                <p><strong>الحالة:</strong> {getStatusBadge(selectedReceipt.status)}</p>
              </div>
            </div>

            <div className="receipt-body">
              <div className="customer-section">
                <h4>بيانات العميل</h4>
                <p><strong>الاسم:</strong> {selectedReceipt.customerName}</p>
                {selectedReceipt.customerPhone && (
                  <p><strong>الهاتف:</strong> {selectedReceipt.customerPhone}</p>
                )}
              </div>

              <div className="payment-section">
                <h4>تفاصيل الدفع</h4>
                <p><strong>المبلغ:</strong> {formatMoney(selectedReceipt.amount)}</p>
                <p><strong>طريقة الدفع:</strong> {getPaymentMethodLabel(selectedReceipt.paymentMethod)}</p>
                {selectedReceipt.description && (
                  <p><strong>الوصف:</strong> {selectedReceipt.description}</p>
                )}
                {selectedReceipt.notes && (
                  <p><strong>ملاحظات:</strong> {selectedReceipt.notes}</p>
                )}
              </div>

              {selectedReceipt.transaction && (
                <div className="transaction-section">
                  <h4>المعاملة المالية</h4>
                  <p><strong>رقم المعاملة:</strong> {selectedReceipt.transaction.transactionNumber}</p>
                </div>
              )}

              {selectedReceipt.convertedToInvoice && (
                <div className="converted-section">
                  <h4>تم التحويل لفاتورة</h4>
                  <p>
                    <strong>رقم الفاتورة:</strong>{' '}
                    <button
                      className="link-btn"
                      onClick={() => {
                        setShowViewModal(false);
                        navigate(`/control/invoices?view=${selectedReceipt.convertedToInvoice._id}`);
                      }}
                    >
                      {selectedReceipt.convertedToInvoice.invoiceNumber}
                    </button>
                  </p>
                  <p><strong>تاريخ التحويل:</strong> {formatDate(selectedReceipt.convertedAt)}</p>
                </div>
              )}

              <div className="created-by">
                <p><strong>أنشئ بواسطة:</strong> {selectedReceipt.createdBy?.name}</p>
              </div>
            </div>

            <div className="receipt-actions">
              {selectedReceipt.status === 'active' && (
                <Button
                  onClick={() => {
                    setShowViewModal(false);
                    setShowConvertModal(true);
                  }}
                >
                  تحويل لفاتورة
                </Button>
              )}
              <Button variant="secondary" onClick={() => printReceipt(selectedReceipt)}>
                طباعة
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* نافذة تأكيد التحويل */}
      <Modal
        isOpen={showConvertModal}
        onClose={() => {
          setShowConvertModal(false);
          setSelectedReceipt(null);
        }}
        title="تحويل إيصال إلى فاتورة"
      >
        {selectedReceipt && (
          <div className="convert-confirm">
            <p>هل تريد تحويل الإيصال رقم <strong>{selectedReceipt.receiptNumber}</strong> إلى فاتورة؟</p>
            <p>المبلغ: <strong>{formatMoney(selectedReceipt.amount)}</strong></p>
            <p>العميل: <strong>{selectedReceipt.customerName}</strong></p>

            <div className="convert-note">
              <i className="fas fa-info-circle"></i>
              <span>سيتم إنشاء فاتورة جديدة بنفس المبلغ وبيانات العميل، وسيتم تغيير حالة الإيصال إلى "محول".</span>
            </div>

            <div className="form-actions">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowConvertModal(false);
                  setSelectedReceipt(null);
                }}
              >
                إلغاء
              </Button>
              <Button onClick={handleConvertToInvoice} disabled={submitting}>
                {submitting ? 'جاري التحويل...' : 'تأكيد التحويل'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Receipts;
