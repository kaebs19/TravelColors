import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { invoicesApi, customersApi, settingsApi } from '../../api';
import { Card, Button, Loader, Modal, NumberInput, PhoneInput } from '../../components/common';
import { parseArabicNumber, arabicToEnglishNumbers } from '../../utils/formatters';
import { printContent, formatInvoiceForPrint } from '../../utils/printUtils';
import './Invoices.css';

// دالة لتنسيق العنوان والمدينة بشكل صحيح
const formatAddress = (address, city) => {
  // إذا كان العنوان object
  if (typeof address === 'object' && address !== null) {
    const parts = [];
    if (address.street) parts.push(address.street);
    if (address.area) parts.push(address.area);
    if (address.building) parts.push(address.building);
    const cityName = address.city || city || '';
    if (cityName) parts.push(cityName);
    return parts.join(', ');
  }
  // إذا كان العنوان string
  if (typeof address === 'string' && address) {
    // تحقق إذا كان يحتوي على { city: }
    if (address.includes('{') && address.includes('city')) {
      try {
        const parsed = JSON.parse(address.replace(/'/g, '"'));
        return parsed.city || city || '';
      } catch (e) {
        // إذا فشل التحليل، نعيد المدينة فقط
        return city || '';
      }
    }
    return city ? `${address} - ${city}` : address;
  }
  // إذا كانت المدينة object
  if (typeof city === 'object' && city !== null) {
    return city.city || city.name || '';
  }
  return city || '';
};

const Invoices = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState([]);
  const [stats, setStats] = useState({});
  const [customers, setCustomers] = useState([]);
  const [settings, setSettings] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [activeTab, setActiveTab] = useState('all');

  const [filters, setFilters] = useState({
    type: '',
    status: '',
    search: '',
    startDate: '',
    endDate: ''
  });

  const [invoiceForm, setInvoiceForm] = useState({
    type: 'invoice',
    customer: '',
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    customerCity: '',
    items: [{ product: '', description: '', quantity: 1, persons: 1, unitPrice: 0 }],
    discount: 0,
    paymentMethod: 'cash',
    paidAmount: 0,
    notes: '',
    dueDate: '',
    validUntil: ''
  });

  const [paymentForm, setPaymentForm] = useState({
    amount: 0,
    paymentMethod: 'cash',
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, [filters.type, filters.status]);

  // التعامل مع view parameter من URL
  useEffect(() => {
    const viewId = searchParams.get('view');
    if (viewId && invoices.length > 0) {
      const invoiceToView = invoices.find(inv => inv._id === viewId);
      if (invoiceToView) {
        viewInvoice(invoiceToView);
        // إزالة parameter من URL
        setSearchParams({});
      }
    }
  }, [searchParams, invoices]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [invoicesRes, customersRes, settingsRes] = await Promise.all([
        invoicesApi.getInvoices({ ...filters, limit: 50 }),
        customersApi.getCustomers({ limit: 100 }),
        settingsApi.getSettings()
      ]);

      // invoicesApi يرجع axios response مباشرة (response.data.data)
      const invoicesData = invoicesRes.data?.data || invoicesRes.data || {};
      setInvoices(invoicesData.invoices || []);
      setStats(invoicesData.stats || {});

      // customersApi يرجع response.data مباشرة من axios
      // الـ API يرجع { success: true, customers: [...], data: { customers: [...] } }
      const customersList = customersRes.customers || customersRes.data?.customers || [];
      console.log('Customers loaded:', customersList.length, customersList);
      setCustomers(customersList);

      // settingsApi
      setSettings(settingsRes.data?.data || settingsRes.data || settingsRes);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    try {
      const res = await invoicesApi.getInvoices(filters);
      setInvoices(res.data.data.invoices || []);
      setStats(res.data.data.stats || {});
    } catch (error) {
      console.error('Error searching:', error);
    }
  };

  const handleCustomerSelect = (customerId) => {
    if (!customerId) {
      // إعادة تعيين البيانات عند إلغاء التحديد
      setInvoiceForm({
        ...invoiceForm,
        customer: '',
        customerName: '',
        customerPhone: '',
        customerAddress: '',
        customerCity: ''
      });
      return;
    }
    const customer = customers.find(c => c._id === customerId);
    if (customer) {
      // العنوان قد يكون object أو string
      const addressStr = typeof customer.address === 'object'
        ? [customer.address?.street, customer.address?.area, customer.address?.building].filter(Boolean).join(', ')
        : (customer.address || '');
      const cityStr = typeof customer.address === 'object'
        ? (customer.address?.city || customer.city || '')
        : (customer.city || '');

      setInvoiceForm({
        ...invoiceForm,
        customer: customerId,
        customerName: customer.name || '',
        customerPhone: customer.phone || '',
        customerAddress: addressStr,
        customerCity: cityStr
      });
    }
  };

  const addItem = () => {
    setInvoiceForm({
      ...invoiceForm,
      items: [...invoiceForm.items, { product: '', description: '', quantity: 1, persons: 1, unitPrice: 0 }]
    });
  };

  const removeItem = (index) => {
    const newItems = invoiceForm.items.filter((_, i) => i !== index);
    setInvoiceForm({ ...invoiceForm, items: newItems });
  };

  const updateItem = (index, field, value) => {
    const newItems = [...invoiceForm.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setInvoiceForm({ ...invoiceForm, items: newItems });
  };

  const calculateTotals = () => {
    const subtotal = invoiceForm.items.reduce((sum, item) =>
      sum + (item.quantity * item.unitPrice), 0);
    const taxRate = settings?.tax?.enabled ? settings.tax.rate : 0;
    const taxAmount = (subtotal * taxRate) / 100;
    const total = subtotal + taxAmount - (invoiceForm.discount || 0);
    return { subtotal, taxRate, taxAmount, total };
  };

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    try {
      const { subtotal, taxRate, taxAmount, total } = calculateTotals();

      await invoicesApi.createInvoice({
        ...invoiceForm,
        subtotal,
        taxRate,
        taxAmount,
        total
      });

      setShowCreateModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error creating invoice:', error);
      alert(error.response?.data?.message || 'حدث خطأ');
    }
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    try {
      await invoicesApi.addPayment(selectedInvoice._id, paymentForm);
      setShowPaymentModal(false);
      setPaymentForm({ amount: 0, paymentMethod: 'cash', notes: '' });
      fetchData();
      // تحديث الفاتورة المعروضة
      const res = await invoicesApi.getInvoice(selectedInvoice._id);
      setSelectedInvoice(res.data.data.invoice);
    } catch (error) {
      console.error('Error adding payment:', error);
      alert(error.response?.data?.message || 'حدث خطأ');
    }
  };

  const handleConvertToInvoice = async (quoteId) => {
    try {
      await invoicesApi.convertToInvoice(quoteId);
      fetchData();
    } catch (error) {
      console.error('Error converting:', error);
      alert(error.response?.data?.message || 'حدث خطأ');
    }
  };

  const resetForm = () => {
    setInvoiceForm({
      type: 'invoice',
      customer: '',
      customerName: '',
      customerPhone: '',
      customerAddress: '',
      customerCity: '',
      items: [{ product: '', description: '', quantity: 1, persons: 1, unitPrice: 0 }],
      discount: 0,
      paymentMethod: 'cash',
      paidAmount: 0,
      notes: '',
      dueDate: '',
      validUntil: ''
    });
  };

  const viewInvoice = async (invoice) => {
    try {
      const res = await invoicesApi.getInvoice(invoice._id);
      setSelectedInvoice(res.data.data.invoice);
      setShowViewModal(true);
    } catch (error) {
      console.error('Error fetching invoice:', error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-SA', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount || 0) + ' SAR';
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('ar-u-nu-latn', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTypeLabel = (type) => {
    const labels = { invoice: 'فاتورة', quote: 'عرض سعر', receipt: 'إيصال' };
    return labels[type] || type;
  };

  const getStatusLabel = (status) => {
    const labels = {
      draft: 'مسودة',
      sent: 'مرسل',
      paid: 'مدفوع',
      partial: 'مدفوع جزئياً',
      cancelled: 'ملغي',
      expired: 'منتهي'
    };
    return labels[status] || status;
  };

  const filteredInvoices = invoices.filter(inv => {
    if (activeTab === 'invoices') return inv.type === 'invoice';
    if (activeTab === 'quotes') return inv.type === 'quote';
    if (activeTab === 'receipts') return inv.type === 'receipt';
    return true;
  });

  if (loading) {
    return <Loader />;
  }

  const { subtotal, taxRate, taxAmount, total } = calculateTotals();

  return (
    <div className="invoices-page">
      {/* Breadcrumb */}
      <div className="page-breadcrumb">
        <span>لوحة التحكم</span>
        <span className="separator">/</span>
        <span className="current">الفواتير</span>
      </div>

      {/* Page Header */}
      <div className="page-header">
        <h1>الفواتير وعروض الأسعار</h1>
      </div>
      <div className="header-actions-row">
        <Button variant="outline" onClick={() => { setInvoiceForm({...invoiceForm, type: 'quote'}); setShowCreateModal(true); }}>
          📝 عرض سعر جديد
        </Button>
        <Button onClick={() => { setInvoiceForm({...invoiceForm, type: 'invoice'}); setShowCreateModal(true); }}>
          ➕ فاتورة جديدة
        </Button>
      </div>

      {/* الإحصائيات */}
      <div className="stats-grid">
        <Card className="stat-card">
          <div className="stat-icon">📄</div>
          <div className="stat-info">
            <span className="stat-value">{stats.count || 0}</span>
            <span className="stat-label">إجمالي الفواتير</span>
          </div>
        </Card>
        <Card className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-info">
            <span className="stat-value">{formatCurrency(stats.totalAmount)}</span>
            <span className="stat-label">إجمالي المبالغ</span>
          </div>
        </Card>
        <Card className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <span className="stat-value">{formatCurrency(stats.paidAmount)}</span>
            <span className="stat-label">المدفوع</span>
          </div>
        </Card>
        <Card className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-info">
            <span className="stat-value">{formatCurrency(stats.remainingAmount)}</span>
            <span className="stat-label">المتبقي</span>
          </div>
        </Card>
      </div>

      {/* التبويبات */}
      <div className="invoice-tabs">
        <button
          className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          الكل
        </button>
        <button
          className={`tab-btn ${activeTab === 'invoices' ? 'active' : ''}`}
          onClick={() => setActiveTab('invoices')}
        >
          الفواتير
        </button>
        <button
          className={`tab-btn ${activeTab === 'quotes' ? 'active' : ''}`}
          onClick={() => setActiveTab('quotes')}
        >
          عروض الأسعار
        </button>
        <button
          className={`tab-btn ${activeTab === 'receipts' ? 'active' : ''}`}
          onClick={() => setActiveTab('receipts')}
        >
          الإيصالات
        </button>
      </div>

      {/* الفلاتر */}
      <Card className="filters-card">
        <div className="filters-bar">
          <input
            type="text"
            placeholder="بحث برقم الفاتورة أو اسم العميل..."
            value={filters.search}
            onChange={(e) => setFilters({...filters, search: arabicToEnglishNumbers(e.target.value)})}
          />
          <select
            value={filters.status}
            onChange={(e) => setFilters({...filters, status: e.target.value})}
          >
            <option value="">كل الحالات</option>
            <option value="draft">مسودة</option>
            <option value="paid">مدفوع</option>
            <option value="partial">مدفوع جزئياً</option>
            <option value="cancelled">ملغي</option>
          </select>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters({...filters, startDate: e.target.value})}
          />
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => setFilters({...filters, endDate: e.target.value})}
          />
          <Button variant="outline" onClick={handleSearch}>بحث</Button>
        </div>
      </Card>

      {/* جدول الفواتير */}
      <Card>
        <table className="invoices-table">
          <thead>
            <tr>
              <th>رقم الفاتورة</th>
              <th>النوع</th>
              <th>العميل</th>
              <th>التاريخ</th>
              <th>الإجمالي</th>
              <th>المدفوع</th>
              <th>المتبقي</th>
              <th>الحالة</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvoices.map((inv) => (
              <tr key={inv._id}>
                <td className="invoice-number">
                  <button
                    className="invoice-link-btn"
                    onClick={() => viewInvoice(inv)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--primary-color)',
                      cursor: 'pointer',
                      fontWeight: 600,
                      padding: 0,
                      textDecoration: 'none'
                    }}
                  >
                    {inv.invoiceNumber}
                  </button>
                </td>
                <td>
                  <span className={`type-badge type-${inv.type}`}>
                    {getTypeLabel(inv.type)}
                  </span>
                </td>
                <td>{inv.customerName}</td>
                <td>{formatDate(inv.issueDate)}</td>
                <td>{formatCurrency(inv.total)}</td>
                <td className="positive">{formatCurrency(inv.paidAmount)}</td>
                <td className="negative">{formatCurrency(inv.remainingAmount)}</td>
                <td>
                  <span className={`status-badge status-${inv.status}`}>
                    {getStatusLabel(inv.status)}
                  </span>
                </td>
                <td>
                  <div className="actions-cell">
                    <button className="action-btn" onClick={() => viewInvoice(inv)} title="عرض">
                      👁️
                    </button>
                    {inv.type === 'quote' && inv.status !== 'sent' && (
                      <button className="action-btn" onClick={() => handleConvertToInvoice(inv._id)} title="تحويل لفاتورة">
                        🔄
                      </button>
                    )}
                    {inv.status !== 'paid' && inv.status !== 'cancelled' && inv.type !== 'quote' && (
                      <button
                        className="action-btn"
                        onClick={() => {
                          setSelectedInvoice(inv);
                          setPaymentForm({...paymentForm, amount: inv.remainingAmount});
                          setShowPaymentModal(true);
                        }}
                        title="تسجيل دفعة"
                      >
                        💵
                      </button>
                    )}
                    <button className="action-btn" onClick={() => {
                      const content = formatInvoiceForPrint(inv, settings);
                      const typeLabels = { invoice: 'فاتورة', quote: 'عرض سعر', receipt: 'إيصال' };
                      printContent(content, `${typeLabels[inv.type] || 'فاتورة'} - ${inv.invoiceNumber}`);
                    }} title="طباعة">
                      🖨️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Modal إنشاء فاتورة */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => { setShowCreateModal(false); resetForm(); }}
        title={invoiceForm.type === 'quote' ? 'عرض سعر جديد' : 'فاتورة جديدة'}
        size="large"
      >
        <form onSubmit={handleCreateInvoice} className="invoice-form">
          {/* نوع الوثيقة */}
          <div className="form-section">
            <h4>نوع الوثيقة</h4>
            <div className="type-selector">
              <label className={invoiceForm.type === 'invoice' ? 'selected' : ''}>
                <input
                  type="radio"
                  name="type"
                  value="invoice"
                  checked={invoiceForm.type === 'invoice'}
                  onChange={(e) => setInvoiceForm({...invoiceForm, type: e.target.value})}
                />
                فاتورة
              </label>
              <label className={invoiceForm.type === 'quote' ? 'selected' : ''}>
                <input
                  type="radio"
                  name="type"
                  value="quote"
                  checked={invoiceForm.type === 'quote'}
                  onChange={(e) => setInvoiceForm({...invoiceForm, type: e.target.value})}
                />
                عرض سعر
              </label>
            </div>
          </div>

          {/* بيانات العميل */}
          <div className="form-section">
            <h4>بيانات العميل</h4>
            <div className="form-row">
              <div className="form-group">
                <label>اختر عميل موجود</label>
                <select
                  value={invoiceForm.customer}
                  onChange={(e) => handleCustomerSelect(e.target.value)}
                >
                  <option value="">-- اختر عميل --</option>
                  {customers.map(c => (
                    <option key={c._id} value={c._id}>{c.name} - {c.phone}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>اسم العميل *</label>
                <input
                  type="text"
                  value={invoiceForm.customerName}
                  onChange={(e) => setInvoiceForm({...invoiceForm, customerName: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>الهاتف</label>
                <PhoneInput
                  value={invoiceForm.customerPhone}
                  onChange={(e) => setInvoiceForm({...invoiceForm, customerPhone: e.target.value})}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>العنوان</label>
                <input
                  type="text"
                  value={invoiceForm.customerAddress}
                  onChange={(e) => setInvoiceForm({...invoiceForm, customerAddress: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>المدينة</label>
                <input
                  type="text"
                  value={invoiceForm.customerCity}
                  onChange={(e) => setInvoiceForm({...invoiceForm, customerCity: e.target.value})}
                />
              </div>
            </div>
          </div>

          {/* عناصر الفاتورة */}
          <div className="form-section">
            <h4>عناصر {invoiceForm.type === 'quote' ? 'العرض' : 'الفاتورة'}</h4>
            <table className="items-table">
              <thead>
                <tr>
                  <th>المنتج</th>
                  <th>الوصف</th>
                  <th>الكمية</th>
                  <th>الأشخاص</th>
                  <th>السعر</th>
                  <th>المبلغ</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {invoiceForm.items.map((item, index) => (
                  <tr key={index}>
                    <td>
                      <select
                        value={item.product}
                        onChange={(e) => updateItem(index, 'product', e.target.value)}
                        required
                      >
                        <option value="">اختر</option>
                        {settings?.products?.map(p => (
                          <option key={p.id} value={p.name}>{p.name}</option>
                        ))}
                        <option value="other">أخرى</option>
                      </select>
                    </td>
                    <td>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                        placeholder="الوصف"
                      />
                    </td>
                    <td>
                      <NumberInput
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', parseArabicNumber(e.target.value) || 1)}
                        min={1}
                        allowDecimal={false}
                        style={{width: '60px'}}
                      />
                    </td>
                    <td>
                      <NumberInput
                        value={item.persons}
                        onChange={(e) => updateItem(index, 'persons', parseArabicNumber(e.target.value) || 1)}
                        min={1}
                        allowDecimal={false}
                        style={{width: '60px'}}
                      />
                    </td>
                    <td>
                      <NumberInput
                        value={item.unitPrice}
                        onChange={(e) => updateItem(index, 'unitPrice', parseArabicNumber(e.target.value) || 0)}
                        min={0}
                        allowDecimal={true}
                        style={{width: '100px'}}
                      />
                    </td>
                    <td className="item-total">
                      {formatCurrency(item.quantity * item.unitPrice)}
                    </td>
                    <td>
                      {invoiceForm.items.length > 1 && (
                        <button type="button" className="remove-btn" onClick={() => removeItem(index)}>
                          ✕
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Button type="button" variant="outline" size="small" onClick={addItem}>
              + إضافة عنصر
            </Button>
          </div>

          {/* المجاميع */}
          <div className="form-section totals-section">
            <div className="totals-grid">
              <div className="total-row">
                <span>المجموع الجزئي:</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {settings?.tax?.enabled && (
                <div className="total-row">
                  <span>الضريبة ({taxRate}%):</span>
                  <span>{formatCurrency(taxAmount)}</span>
                </div>
              )}
              <div className="total-row">
                <span>الخصم:</span>
                <NumberInput
                  value={invoiceForm.discount}
                  onChange={(e) => setInvoiceForm({...invoiceForm, discount: parseArabicNumber(e.target.value) || 0})}
                  min={0}
                  allowDecimal={true}
                  style={{width: '100px'}}
                />
              </div>
              <div className="total-row grand-total">
                <span>الإجمالي:</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          </div>

          {/* الدفع */}
          {invoiceForm.type !== 'quote' && (
            <div className="form-section">
              <h4>الدفع</h4>
              <div className="form-row">
                <div className="form-group">
                  <label>طريقة الدفع</label>
                  <select
                    value={invoiceForm.paymentMethod}
                    onChange={(e) => setInvoiceForm({...invoiceForm, paymentMethod: e.target.value})}
                  >
                    <option value="cash">نقدي</option>
                    <option value="card">شبكة</option>
                    <option value="transfer">تحويل</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>المبلغ المدفوع</label>
                  <NumberInput
                    value={invoiceForm.paidAmount}
                    onChange={(e) => setInvoiceForm({...invoiceForm, paidAmount: parseArabicNumber(e.target.value) || 0})}
                    min={0}
                    max={total}
                    allowDecimal={true}
                    suffix="SAR"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ملاحظات */}
          <div className="form-section">
            <div className="form-group">
              <label>ملاحظات</label>
              <textarea
                value={invoiceForm.notes}
                onChange={(e) => setInvoiceForm({...invoiceForm, notes: e.target.value})}
                rows="2"
              />
            </div>
          </div>

          <div className="form-actions">
            <Button type="button" variant="outline" onClick={() => { setShowCreateModal(false); resetForm(); }}>
              إلغاء
            </Button>
            <Button type="submit">
              {invoiceForm.type === 'quote' ? 'إنشاء عرض السعر' : 'إنشاء الفاتورة'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal عرض الفاتورة */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title={`${getTypeLabel(selectedInvoice?.type)} ${selectedInvoice?.invoiceNumber}`}
        size="large"
      >
        {selectedInvoice && (
          <div className="invoice-preview">
            <div className="invoice-header-preview">
              <div className="company-info">
                <h2>{selectedInvoice.companyInfo?.name}</h2>
                <p>{selectedInvoice.companyInfo?.address}</p>
                <p>هاتف: {selectedInvoice.companyInfo?.phone}</p>
                <p>البريد: {selectedInvoice.companyInfo?.email}</p>
              </div>
              <div className="invoice-meta">
                <p><strong>رقم {getTypeLabel(selectedInvoice.type)}:</strong> {selectedInvoice.invoiceNumber}</p>
                <p><strong>التاريخ:</strong> {formatDate(selectedInvoice.issueDate)}</p>
                {selectedInvoice.dueDate && (
                  <p><strong>تاريخ الاستحقاق:</strong> {formatDate(selectedInvoice.dueDate)}</p>
                )}
              </div>
            </div>

            <div className="customer-info-preview">
              <h4>العميل:</h4>
              <p>{selectedInvoice.customerName}</p>
              <p>{selectedInvoice.customerPhone}</p>
              <p>{formatAddress(selectedInvoice.customerAddress, selectedInvoice.customerCity)}</p>
            </div>

            <table className="invoice-items-preview">
              <thead>
                <tr>
                  <th>المنتج</th>
                  <th>الوصف</th>
                  <th>الكمية</th>
                  <th>السعر</th>
                  <th>المبلغ</th>
                </tr>
              </thead>
              <tbody>
                {selectedInvoice.items?.map((item, index) => (
                  <tr key={index}>
                    <td>{item.product}</td>
                    <td>{item.description}</td>
                    <td>{item.quantity}</td>
                    <td>{formatCurrency(item.unitPrice)}</td>
                    <td>{formatCurrency(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="invoice-totals-preview">
              <div className="total-line">
                <span>المجموع الجزئي:</span>
                <span>{formatCurrency(selectedInvoice.subtotal)}</span>
              </div>
              {selectedInvoice.taxAmount > 0 && (
                <div className="total-line">
                  <span>الضريبة ({selectedInvoice.taxRate}%):</span>
                  <span>{formatCurrency(selectedInvoice.taxAmount)}</span>
                </div>
              )}
              {selectedInvoice.discount > 0 && (
                <div className="total-line">
                  <span>الخصم:</span>
                  <span>-{formatCurrency(selectedInvoice.discount)}</span>
                </div>
              )}
              <div className="total-line grand">
                <span>الإجمالي:</span>
                <span>{formatCurrency(selectedInvoice.total)}</span>
              </div>
              {selectedInvoice.type !== 'quote' && (
                <>
                  <div className="total-line">
                    <span>المدفوع:</span>
                    <span className="positive">{formatCurrency(selectedInvoice.paidAmount)}</span>
                  </div>
                  <div className="total-line">
                    <span>المتبقي:</span>
                    <span className="negative">{formatCurrency(selectedInvoice.remainingAmount)}</span>
                  </div>
                </>
              )}
            </div>

            {selectedInvoice.terms && (
              <div className="invoice-terms-preview">
                <h4>الشروط والأحكام:</h4>
                <p style={{whiteSpace: 'pre-wrap'}}>{selectedInvoice.terms}</p>
              </div>
            )}

            <div className="preview-actions">
              <Button variant="outline" onClick={() => {
                const content = formatInvoiceForPrint(selectedInvoice, settings);
                const typeLabels = { invoice: 'فاتورة', quote: 'عرض سعر', receipt: 'إيصال' };
                printContent(content, `${typeLabels[selectedInvoice.type] || 'فاتورة'} - ${selectedInvoice.invoiceNumber}`);
              }}>
                طباعة
              </Button>
              {selectedInvoice.status !== 'paid' && selectedInvoice.type !== 'quote' && (
                <Button onClick={() => {
                  setShowViewModal(false);
                  setPaymentForm({...paymentForm, amount: selectedInvoice.remainingAmount});
                  setShowPaymentModal(true);
                }}>
                  💵 تسجيل دفعة
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Modal تسجيل دفعة */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="تسجيل دفعة"
      >
        <form onSubmit={handleAddPayment} className="payment-form">
          <p className="payment-info">
            الفاتورة: <strong>{selectedInvoice?.invoiceNumber}</strong>
            <br />
            المتبقي: <strong className="negative">{formatCurrency(selectedInvoice?.remainingAmount)}</strong>
          </p>

          <div className="form-group">
            <label>المبلغ</label>
            <NumberInput
              value={paymentForm.amount}
              onChange={(e) => setPaymentForm({...paymentForm, amount: parseArabicNumber(e.target.value) || 0})}
              max={selectedInvoice?.remainingAmount}
              min={0}
              allowDecimal={true}
              suffix="SAR"
              required
            />
          </div>

          <div className="form-group">
            <label>طريقة الدفع</label>
            <select
              value={paymentForm.paymentMethod}
              onChange={(e) => setPaymentForm({...paymentForm, paymentMethod: e.target.value})}
            >
              <option value="cash">نقدي</option>
              <option value="card">شبكة</option>
              <option value="transfer">تحويل</option>
            </select>
          </div>

          <div className="form-group">
            <label>ملاحظات</label>
            <textarea
              value={paymentForm.notes}
              onChange={(e) => setPaymentForm({...paymentForm, notes: e.target.value})}
              rows="2"
            />
          </div>

          <div className="form-actions">
            <Button type="button" variant="outline" onClick={() => setShowPaymentModal(false)}>
              إلغاء
            </Button>
            <Button type="submit">تسجيل الدفعة</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Invoices;
