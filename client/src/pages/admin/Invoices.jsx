import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { invoicesApi, settingsApi } from '../../api';
import { Card, Button, Loader, Modal, NumberInput, PhoneInput } from '../../components/common';
import { CustomerSearch } from '../../components/admin';
import { parseArabicNumber, arabicToEnglishNumbers } from '../../utils/formatters';
import { printContent, formatInvoiceForPrint } from '../../utils/printUtils';
import { shareInvoiceToWhatsApp, generateInvoicePdf } from '../../utils/invoicePdf';
import { useToast } from '../../context';
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

// مفتاح حفظ مسودة النموذج محلياً (حتى لا تضيع البيانات عند الخروج)
const DRAFT_KEY = 'trcolors_invoice_form_draft';

// هل تحتوي المسودة على بيانات تستحق الاسترجاع؟
const draftHasData = (form) => {
  if (!form) return false;
  if (form.customerName?.trim() || form.customerPhone?.trim() || form.notes?.trim()) return true;
  return (form.items || []).some(it => it.product || it.description || it.unitPrice > 0);
};

const Invoices = () => {
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState([]);
  const [stats, setStats] = useState({});
  const [settings, setSettings] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [saving, setSaving] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);
  const [createdInvoice, setCreatedInvoice] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

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
    items: [{ product: '', description: '', quantity: 1, persons: 1, unitType: 'persons', unitPrice: 0 }],
    discount: 0,
    discountType: 'fixed', // 'fixed' أو 'percent'
    paymentMethod: 'cash',
    // حالة الفاتورة: مدفوعة بالكامل (الافتراضي) / مدفوعة جزئياً / مسودة
    paymentStatus: 'paid',
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

  // حفظ تلقائي للمسودة أثناء الكتابة — حتى لو أُغلقت النافذة أو الصفحة لا تضيع البيانات
  useEffect(() => {
    if (!showCreateModal) return;
    const timer = setTimeout(() => {
      try {
        if (draftHasData(invoiceForm)) {
          localStorage.setItem(DRAFT_KEY, JSON.stringify(invoiceForm));
        } else {
          localStorage.removeItem(DRAFT_KEY);
        }
      } catch (e) { /* تجاهل امتلاء التخزين */ }
    }, 400);
    return () => clearTimeout(timer);
  }, [invoiceForm, showCreateModal]);

  const clearDraft = () => {
    try { localStorage.removeItem(DRAFT_KEY); } catch (e) { /* تجاهل */ }
    setDraftRestored(false);
  };

  // فتح نافذة الإنشاء مع استرجاع المسودة المحفوظة إن وُجدت
  const openCreateModal = (type) => {
    let restored = false;
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (draftHasData(parsed)) {
          setInvoiceForm({ ...parsed, type });
          restored = true;
        }
      }
    } catch (e) { /* مسودة تالفة — نتجاهلها */ }

    if (!restored) resetForm(type);
    setDraftRestored(restored);
    setShowCreateModal(true);
  };

  // إغلاق النافذة مع الإبقاء على المسودة المحفوظة
  const closeCreateModal = () => {
    setShowCreateModal(false);
    setDraftRestored(false);
    if (draftHasData(invoiceForm)) {
      showToast('تم حفظ البيانات كمسودة — ستُسترجع عند فتح النموذج مجدداً', 'success');
    }
  };

  // تجاهل المسودة المسترجعة والبدء من نموذج فارغ
  const discardDraft = () => {
    clearDraft();
    resetForm(invoiceForm.type);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [invoicesRes, settingsRes] = await Promise.all([
        invoicesApi.getInvoices({ ...filters, limit: 50 }),
        settingsApi.getSettings()
      ]);

      // invoicesApi يرجع axios response مباشرة (response.data.data)
      const invoicesData = invoicesRes.data?.data || invoicesRes.data || {};
      setInvoices(invoicesData.invoices || []);
      setStats(invoicesData.stats || {});

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

  // اختيار عميل من قائمة العملاء (بحث بالاسم أو الرقم)
  const handleCustomerSelect = (customer) => {
    if (!customer) {
      // إلغاء الربط بالعميل المختار وإعادة تعيين البيانات
      setInvoiceForm({
        ...invoiceForm,
        customer: '',
        customerName: '',
        customerPhone: '',
        customerAddress: settings?.address || '',
        customerCity: 'الرياض'
      });
      return;
    }

    // العنوان قد يكون object أو string
    const addressStr = typeof customer.address === 'object'
      ? [customer.address?.street, customer.address?.area, customer.address?.building].filter(Boolean).join(', ')
      : (customer.address || '');
    const cityStr = typeof customer.address === 'object'
      ? (customer.address?.city || customer.city || '')
      : (customer.city || '');

    setInvoiceForm({
      ...invoiceForm,
      customer: customer._id,
      customerName: customer.name || '',
      customerPhone: customer.phone || '',
      customerAddress: addressStr || settings?.address || '',
      customerCity: cityStr || 'الرياض'
    });
  };

  const addItem = () => {
    setInvoiceForm({
      ...invoiceForm,
      items: [...invoiceForm.items, { product: '', description: '', quantity: 1, persons: 1, unitType: 'persons', unitPrice: 0 }]
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

  // عمود «العدد» الموحّد: يحدّث الكمية والأشخاص معاً (الحساب على يحدد المسمّى فقط)
  const updateItemCount = (index, value) => {
    const newItems = [...invoiceForm.items];
    newItems[index] = { ...newItems[index], quantity: value, persons: value };
    setInvoiceForm({ ...invoiceForm, items: newItems });
  };

  // مبلغ العنصر = (الأشخاص أو الكمية حسب الاختيار) × السعر — الافتراضي الأشخاص
  const getItemAmount = (item) => {
    const basis = item.unitType === 'quantity' ? (item.quantity || 1) : (item.persons || 1);
    return basis * (item.unitPrice || 0);
  };

  const calculateTotals = () => {
    const subtotal = invoiceForm.items.reduce((sum, item) =>
      sum + getItemAmount(item), 0);
    const taxRate = settings?.tax?.enabled ? settings.tax.rate : 0;
    const taxAmount = (subtotal * taxRate) / 100;
    // حساب الخصم حسب النوع (ثابت أو نسبة مئوية)
    const discountValue = invoiceForm.discountType === 'percent'
      ? ((subtotal + taxAmount) * (invoiceForm.discount || 0)) / 100
      : (invoiceForm.discount || 0);
    const total = subtotal + taxAmount - discountValue;
    return { subtotal, taxRate, taxAmount, discountValue, total };
  };

  // المبلغ المدفوع الفعلي حسب حالة الفاتورة المختارة
  const resolvePaidAmount = (total) => {
    if (invoiceForm.type === 'quote') return 0;
    if (invoiceForm.paymentStatus === 'paid') return total;
    if (invoiceForm.paymentStatus === 'partial') return Math.min(invoiceForm.paidAmount || 0, total);
    return 0; // مسودة / غير مدفوعة
  };

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    if (saving) return;
    try {
      setSaving(true);
      const { subtotal, taxRate, taxAmount, discountValue, total } = calculateTotals();

      const res = await invoicesApi.createInvoice({
        ...invoiceForm,
        paidAmount: resolvePaidAmount(total),
        discount: discountValue,
        subtotal,
        taxRate,
        taxAmount,
        total
      });

      const newInvoice = res.data?.data?.invoice || null;

      setShowCreateModal(false);
      clearDraft();
      resetForm();
      fetchData();

      // نافذة ما بعد الإنشاء: إرسال للعميل / PDF / طباعة
      if (newInvoice) {
        setCreatedInvoice(newInvoice);
        setShowSuccessModal(true);
      } else {
        showToast('تم الإنشاء بنجاح', 'success');
      }
    } catch (error) {
      console.error('Error creating invoice:', error);
      showToast(error.response?.data?.message || 'حدث خطأ', 'error');
    } finally {
      setSaving(false);
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
      showToast(error.response?.data?.message || 'حدث خطأ', 'error');
    }
  };

  const [sendingWa, setSendingWa] = useState(null);

  const handleSendWhatsApp = async (inv) => {
    try {
      setSendingWa(inv._id);
      // جلب الفاتورة كاملة لضمان توفر كل البيانات
      const res = await invoicesApi.getInvoice(inv._id);
      const fullInvoice = res.data?.data?.invoice || inv;
      const result = await shareInvoiceToWhatsApp(fullInvoice, settings);
      if (result.method === 'download_and_whatsapp') {
        showToast('تم تنزيل ملف PDF — أرفقه في محادثة واتساب', 'success');
      }
    } catch (error) {
      console.error('Error sending invoice to WhatsApp:', error);
      showToast('تعذّر إرسال الفاتورة عبر واتساب', 'error');
    } finally {
      setSendingWa(null);
    }
  };

  const handleDownloadPdf = async (inv) => {
    try {
      const res = await invoicesApi.getInvoice(inv._id);
      const fullInvoice = res.data?.data?.invoice || inv;
      await generateInvoicePdf(fullInvoice, settings);
    } catch (error) {
      console.error('Error generating PDF:', error);
      showToast('تعذّر إنشاء ملف PDF', 'error');
    }
  };

  const handlePrintInvoice = (inv) => {
    const content = formatInvoiceForPrint(inv, settings);
    const typeLabels = { invoice: 'فاتورة', quote: 'عرض سعر', receipt: 'إيصال' };
    printContent(content, `${typeLabels[inv.type] || 'فاتورة'} - ${inv.invoiceNumber}`);
  };

  const handleConvertToInvoice = async (quoteId) => {
    try {
      await invoicesApi.convertToInvoice(quoteId);
      fetchData();
    } catch (error) {
      console.error('Error converting:', error);
      showToast(error.response?.data?.message || 'حدث خطأ', 'error');
    }
  };

  const resetForm = (type = 'invoice') => {
    setInvoiceForm({
      type,
      customer: '',
      customerName: '',
      customerPhone: '',
      customerAddress: settings?.address || '',
      customerCity: 'الرياض',
      items: [{ product: '', description: '', quantity: 1, persons: 1, unitType: 'persons', unitPrice: 0 }],
      discount: 0,
      discountType: 'fixed',
      paymentMethod: 'cash',
      paymentStatus: 'paid',
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

  const { subtotal, taxRate, taxAmount, discountValue, total } = calculateTotals();

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
        <Button variant="outline" onClick={() => openCreateModal('quote')}>
          📝 عرض سعر جديد
        </Button>
        <Button variant="success" onClick={() => openCreateModal('invoice')}>
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
                    <button className="action-btn act-view" onClick={() => viewInvoice(inv)} title="عرض">
                      👁️
                    </button>
                    <button
                      className="action-btn act-whatsapp"
                      onClick={() => handleSendWhatsApp(inv)}
                      disabled={sendingWa === inv._id}
                      title="إرسال عبر واتساب (PDF)"
                    >
                      {sendingWa === inv._id ? '⏳' : '💬'}
                    </button>
                    <button className="action-btn act-pdf" onClick={() => handleDownloadPdf(inv)} title="تحميل PDF">
                      📄
                    </button>
                    {inv.type === 'quote' && inv.status !== 'sent' && (
                      <button className="action-btn act-convert" onClick={() => handleConvertToInvoice(inv._id)} title="تحويل لفاتورة">
                        🔄
                      </button>
                    )}
                    {inv.status !== 'paid' && inv.status !== 'cancelled' && inv.type !== 'quote' && (
                      <button
                        className="action-btn act-pay"
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
                    <button className="action-btn act-print" onClick={() => handlePrintInvoice(inv)} title="طباعة">
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
        onClose={closeCreateModal}
        title={invoiceForm.type === 'quote' ? 'عرض سعر جديد' : 'فاتورة جديدة'}
        size="large"
        className="invoice-create-modal"
      >
        <form onSubmit={handleCreateInvoice} className="invoice-form">
          {/* منطقة التمرير — الفوتر يبقى ثابتاً أسفلها */}
          <div className="invoice-form-scroll">
            {/* تنبيه استرجاع المسودة المحفوظة */}
            {draftRestored && (
              <div className="draft-banner">
                <span className="draft-banner-icon">💾</span>
                <span className="draft-banner-text">تم استرجاع مسودة محفوظة من آخر مرة</span>
                <button type="button" className="draft-banner-btn" onClick={discardDraft}>
                  بدء نموذج فارغ
                </button>
              </div>
            )}

            {/* نوع الوثيقة */}
            <div className="fsection">
              <div className="fsection-head">
                <span className="fsection-icon">🧾</span>
                <h4>نوع الوثيقة</h4>
              </div>
              <div className="type-selector">
                <button
                  type="button"
                  className={`type-option ${invoiceForm.type === 'invoice' ? 'selected' : ''}`}
                  onClick={() => setInvoiceForm({ ...invoiceForm, type: 'invoice' })}
                >
                  <span className="type-option-icon">📄</span>
                  <span className="type-option-body">
                    <span className="type-option-title">فاتورة</span>
                    <span className="type-option-hint">مستند بيع نهائي</span>
                  </span>
                </button>
                <button
                  type="button"
                  className={`type-option ${invoiceForm.type === 'quote' ? 'selected' : ''}`}
                  onClick={() => setInvoiceForm({ ...invoiceForm, type: 'quote' })}
                >
                  <span className="type-option-icon">📝</span>
                  <span className="type-option-body">
                    <span className="type-option-title">عرض سعر</span>
                    <span className="type-option-hint">قابل للتحويل لفاتورة</span>
                  </span>
                </button>
              </div>
            </div>

            {/* بيانات العميل */}
            <div className="fsection">
              <div className="fsection-head">
                <span className="fsection-icon">👤</span>
                <h4>بيانات العميل</h4>
              </div>
              <div className="form-group">
                <label>اختر عميل موجود (بحث بالاسم أو رقم الهاتف)</label>
                <CustomerSearch
                  currentCustomer={invoiceForm.customer ? {
                    _id: invoiceForm.customer,
                    name: invoiceForm.customerName,
                    phone: invoiceForm.customerPhone
                  } : null}
                  onSelect={(_id, customer) => handleCustomerSelect(customer)}
                  onUnlink={() => handleCustomerSelect(null)}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>اسم العميل {invoiceForm.type === 'invoice' ? <span className="req">*</span> : ''}</label>
                  <input
                    type="text"
                    value={invoiceForm.customerName}
                    onChange={(e) => setInvoiceForm({...invoiceForm, customerName: e.target.value})}
                    required={invoiceForm.type === 'invoice'}
                    placeholder={invoiceForm.type === 'quote' ? 'اختياري - يمكن إضافته لاحقاً' : 'اسم العميل'}
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
            <div className="fsection">
              <div className="fsection-head">
                <span className="fsection-icon">📦</span>
                <h4>عناصر {invoiceForm.type === 'quote' ? 'العرض' : 'الفاتورة'}</h4>
                <span className="fsection-count">{invoiceForm.items.length}</span>
              </div>
              <div className="items-table-wrap">
                <table className="items-table">
                  <thead>
                    <tr>
                      <th>المنتج</th>
                      <th>الوصف</th>
                      <th>العدد</th>
                      <th>الحساب على</th>
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
                            value={item.unitType === 'quantity' ? item.quantity : item.persons}
                            onChange={(e) => updateItemCount(index, parseArabicNumber(e.target.value) || 1)}
                            min={1}
                            allowDecimal={false}
                            style={{width: '70px'}}
                          />
                        </td>
                        <td>
                          <select
                            value={item.unitType || 'persons'}
                            onChange={(e) => updateItem(index, 'unitType', e.target.value)}
                            style={{width: '90px'}}
                          >
                            <option value="persons">الأشخاص</option>
                            <option value="quantity">الكمية</option>
                          </select>
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
                          {formatCurrency(getItemAmount(item))}
                        </td>
                        <td>
                          {invoiceForm.items.length > 1 && (
                            <button type="button" className="remove-btn" onClick={() => removeItem(index)} title="حذف العنصر">
                              ✕
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button type="button" className="add-item-btn" onClick={addItem}>
                + إضافة عنصر
              </button>
            </div>

            {/* المجاميع */}
            <div className="fsection totals-section">
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
                <div className="total-row discount-row">
                  <span>الخصم:</span>
                  <div className="discount-input-group">
                    <NumberInput
                      value={invoiceForm.discount}
                      onChange={(e) => setInvoiceForm({...invoiceForm, discount: parseArabicNumber(e.target.value) || 0})}
                      min={0}
                      max={invoiceForm.discountType === 'percent' ? 100 : undefined}
                      allowDecimal={true}
                      style={{width: '80px'}}
                    />
                    <div className="discount-type-toggle">
                      <button
                        type="button"
                        className={`discount-type-btn ${invoiceForm.discountType === 'fixed' ? 'active' : ''}`}
                        onClick={() => setInvoiceForm({...invoiceForm, discountType: 'fixed', discount: 0})}
                      >
                        ر.س
                      </button>
                      <button
                        type="button"
                        className={`discount-type-btn ${invoiceForm.discountType === 'percent' ? 'active' : ''}`}
                        onClick={() => setInvoiceForm({...invoiceForm, discountType: 'percent', discount: 0})}
                      >
                        %
                      </button>
                    </div>
                    {invoiceForm.discountType === 'percent' && invoiceForm.discount > 0 && (
                      <span className="discount-amount-preview">= {formatCurrency(discountValue)}</span>
                    )}
                  </div>
                </div>
                <div className="total-row grand-total">
                  <span>الإجمالي:</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>
            </div>

            {/* حالة الدفع */}
            {invoiceForm.type !== 'quote' && (
              <div className="fsection">
                <div className="fsection-head">
                  <span className="fsection-icon">💳</span>
                  <h4>حالة الدفع</h4>
                </div>
                <div className="status-selector">
                  {[
                    { value: 'paid', icon: '✅', label: 'مدفوعة', hint: 'استُلم المبلغ كاملاً' },
                    { value: 'partial', icon: '🟡', label: 'مدفوعة جزئياً', hint: 'حدّد المبلغ المستلم' },
                    { value: 'draft', icon: '📝', label: 'مسودة', hint: 'غير مدفوعة — تُحصَّل لاحقاً' }
                  ].map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      className={`status-option status-option-${opt.value} ${invoiceForm.paymentStatus === opt.value ? 'selected' : ''}`}
                      onClick={() => setInvoiceForm({
                        ...invoiceForm,
                        paymentStatus: opt.value,
                        paidAmount: opt.value === 'paid' ? total : (opt.value === 'draft' ? 0 : invoiceForm.paidAmount)
                      })}
                    >
                      <span className="status-option-icon">{opt.icon}</span>
                      <span className="status-option-title">{opt.label}</span>
                      <span className="status-option-hint">{opt.hint}</span>
                    </button>
                  ))}
                </div>

                <div className="form-row" style={{ marginTop: '1rem' }}>
                  <div className="form-group">
                    <label>طريقة الدفع</label>
                    <select
                      value={invoiceForm.paymentMethod}
                      onChange={(e) => setInvoiceForm({...invoiceForm, paymentMethod: e.target.value})}
                      disabled={invoiceForm.paymentStatus === 'draft'}
                    >
                      <option value="cash">نقدي</option>
                      <option value="card">شبكة</option>
                      <option value="transfer">تحويل</option>
                    </select>
                  </div>
                  {invoiceForm.paymentStatus === 'partial' && (
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
                  )}
                </div>
              </div>
            )}

            {/* ملاحظات */}
            <div className="fsection">
              <div className="fsection-head">
                <span className="fsection-icon">🗒️</span>
                <h4>ملاحظات</h4>
              </div>
              <div className="form-group">
                <textarea
                  value={invoiceForm.notes}
                  onChange={(e) => setInvoiceForm({...invoiceForm, notes: e.target.value})}
                  rows="2"
                  placeholder="ملاحظات تظهر في الفاتورة (اختياري)"
                />
              </div>
            </div>
          </div>

          {/* شريط ثابت أسفل النموذج — زر الإنشاء ظاهر دائماً بدون تمرير */}
          <div className="invoice-form-footer">
            <div className="footer-total">
              <span className="footer-total-label">الإجمالي</span>
              <span className="footer-total-value">{formatCurrency(total)}</span>
            </div>
            <div className="footer-buttons">
              <Button type="button" variant="outline" onClick={closeCreateModal}>
                إلغاء
              </Button>
              <Button type="submit" variant="success" loading={saving}>
                {invoiceForm.type === 'quote' ? 'إنشاء عرض السعر' : 'إنشاء الفاتورة'}
              </Button>
            </div>
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
                <p>مرخص من هيئة السياحة رقم: 73104877</p>
                <p>فئة الترخيص: وكالة سفر وسياحة</p>
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
              <Button variant="outline" onClick={() => handlePrintInvoice(selectedInvoice)}>
                🖨️ طباعة
              </Button>
              <Button variant="outline" onClick={() => handleSendWhatsApp(selectedInvoice)}>
                💬 إرسال واتساب
              </Button>
              <Button variant="outline" onClick={() => handleDownloadPdf(selectedInvoice)}>
                📄 تحميل PDF
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

      {/* Modal ما بعد الإنشاء — إرسال / PDF / طباعة */}
      <Modal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="تم الإنشاء بنجاح"
        size="small"
      >
        {createdInvoice && (
          <div className="created-panel">
            <div className="created-check">✓</div>
            <p className="created-title">
              تم إنشاء {getTypeLabel(createdInvoice.type)} رقم <strong>{createdInvoice.invoiceNumber}</strong>
            </p>
            <p className="created-sub">
              {createdInvoice.customerName || 'بدون عميل'} · {formatCurrency(createdInvoice.total)}
            </p>

            <div className="created-actions">
              <button
                type="button"
                className="created-action created-action-wa"
                onClick={() => handleSendWhatsApp(createdInvoice)}
                disabled={sendingWa === createdInvoice._id}
              >
                <span className="created-action-icon">{sendingWa === createdInvoice._id ? '⏳' : '💬'}</span>
                <span className="created-action-body">
                  <span className="created-action-title">إرسال للعميل عبر واتساب</span>
                  <span className="created-action-hint">
                    {createdInvoice.customerPhone || 'لم يُسجَّل رقم — سيُفتح واتساب لاختيار المستلم'}
                  </span>
                </span>
              </button>

              <button
                type="button"
                className="created-action created-action-pdf"
                onClick={() => handleDownloadPdf(createdInvoice)}
              >
                <span className="created-action-icon">📄</span>
                <span className="created-action-body">
                  <span className="created-action-title">حفظ كملف PDF</span>
                  <span className="created-action-hint">تنزيل نسخة على الجهاز</span>
                </span>
              </button>

              <button
                type="button"
                className="created-action created-action-print"
                onClick={() => handlePrintInvoice(createdInvoice)}
              >
                <span className="created-action-icon">🖨️</span>
                <span className="created-action-body">
                  <span className="created-action-title">طباعة</span>
                  <span className="created-action-hint">فتح نافذة الطباعة</span>
                </span>
              </button>
            </div>

            <div className="created-footer">
              <Button variant="outline" onClick={() => setShowSuccessModal(false)}>إغلاق</Button>
              <Button onClick={() => { setShowSuccessModal(false); viewInvoice(createdInvoice); }}>
                عرض الفاتورة
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Invoices;
