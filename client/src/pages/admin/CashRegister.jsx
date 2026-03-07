import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cashRegisterApi, invoicesApi } from '../../api';
import { Card, Button, Loader, Modal, NumberInput } from '../../components/common';
import { parseArabicNumber } from '../../utils/formatters';
import { useToast } from '../../context';
import './CashRegister.css';

const CashRegister = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [cashData, setCashData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [todaySummary, setTodaySummary] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [filters, setFilters] = useState({
    type: '',
    paymentMethod: '',
    startDate: '',
    endDate: ''
  });

  const [transactionForm, setTransactionForm] = useState({
    type: 'income',
    amount: '',
    description: '',
    category: 'other',
    paymentMethod: 'cash',
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [cashRes, todayRes, invoicesRes] = await Promise.all([
        cashRegisterApi.getCashRegister(),
        cashRegisterApi.getTodaySummary(),
        invoicesApi.getInvoices({ limit: 10 })
      ]);

      // استخراج البيانات بشكل صحيح
      const cashDataResult = cashRes.data?.data || cashRes.data || cashRes;
      setCashData(cashDataResult);
      setTransactions(cashDataResult?.transactions || []);

      const todayResult = todayRes.data?.data || todayRes.data || todayRes;
      setTodaySummary(todayResult);

      const invoicesResult = invoicesRes.data?.data?.invoices || invoicesRes.data?.invoices || [];
      setRecentInvoices(invoicesResult);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const res = await cashRegisterApi.getTransactions(filters);
      setTransactions(res.data?.data?.transactions || res.data?.transactions || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    try {
      await cashRegisterApi.addTransaction({
        ...transactionForm,
        amount: parseArabicNumber(transactionForm.amount)
      });
      setShowAddModal(false);
      setTransactionForm({
        type: 'income',
        amount: '',
        description: '',
        category: 'other',
        paymentMethod: 'cash',
        notes: ''
      });
      fetchData();
    } catch (error) {
      console.error('Error adding transaction:', error);
      showToast(error.response?.data?.message || 'حدث خطأ', 'error');
    }
  };

  const fetchReport = async () => {
    try {
      const res = await cashRegisterApi.getReport({
        startDate: filters.startDate || new Date(new Date().setDate(1)).toISOString(),
        endDate: filters.endDate || new Date().toISOString()
      });
      setReportData(res.data?.data || res.data || res);
      setShowReportModal(true);
    } catch (error) {
      console.error('Error fetching report:', error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-SA', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount || 0) + ' SAR';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('ar-u-nu-latn', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCategoryLabel = (category) => {
    const labels = {
      invoice_payment: 'دفعة فاتورة',
      deposit: 'إيداع',
      withdrawal: 'سحب',
      refund: 'استرداد',
      expense: 'مصروف',
      salary: 'راتب',
      commission: 'عمولة',
      other: 'أخرى'
    };
    return labels[category] || category;
  };

  const getPaymentMethodLabel = (method) => {
    const labels = {
      cash: 'نقدي',
      card: 'شبكة',
      transfer: 'تحويل'
    };
    return labels[method] || method;
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="cash-register-page">
      {/* Breadcrumb */}
      <div className="page-breadcrumb">
        <span>لوحة التحكم</span>
        <span className="separator">/</span>
        <span className="current">الصندوق</span>
      </div>

      {/* Page Header */}
      <div className="page-header">
        <h1>الصندوق</h1>
      </div>
      <div className="header-actions-row">
        <Button variant="outline" onClick={fetchReport}>
          📊 تقرير الصندوق
        </Button>
        <Button onClick={() => setShowAddModal(true)}>
          ➕ حركة مالية
        </Button>
      </div>

      {/* إحصائيات الرصيد */}
      <div className="balance-cards">
        <Card className="balance-card total">
          <div className="balance-icon">💰</div>
          <div className="balance-info">
            <span className="balance-label">الرصيد الإجمالي</span>
            <span className="balance-value">{formatCurrency(cashData?.balance?.total)}</span>
          </div>
        </Card>
        <Card className="balance-card cash">
          <div className="balance-icon">💵</div>
          <div className="balance-info">
            <span className="balance-label">النقدي</span>
            <span className="balance-value">{formatCurrency(cashData?.balance?.cash)}</span>
          </div>
        </Card>
        <Card className="balance-card card">
          <div className="balance-icon">💳</div>
          <div className="balance-info">
            <span className="balance-label">الشبكة</span>
            <span className="balance-value">{formatCurrency(cashData?.balance?.card)}</span>
          </div>
        </Card>
        <Card className="balance-card transfer">
          <div className="balance-icon">🏦</div>
          <div className="balance-info">
            <span className="balance-label">التحويلات</span>
            <span className="balance-value">{formatCurrency(cashData?.balance?.transfer)}</span>
          </div>
        </Card>
      </div>

      {/* ملخص اليوم */}
      <Card className="today-summary">
        <h3>📅 ملخص اليوم</h3>
        <div className="summary-grid">
          <div className="summary-item income">
            <span className="summary-label">الإيرادات</span>
            <span className="summary-value">{formatCurrency(todaySummary?.income)}</span>
          </div>
          <div className="summary-item expense">
            <span className="summary-label">المصروفات</span>
            <span className="summary-value">{formatCurrency(todaySummary?.expense)}</span>
          </div>
          <div className="summary-item net">
            <span className="summary-label">الصافي</span>
            <span className="summary-value">{formatCurrency(todaySummary?.netAmount)}</span>
          </div>
          <div className="summary-item count">
            <span className="summary-label">الحركات</span>
            <span className="summary-value">{todaySummary?.transactionCount || 0}</span>
          </div>
          <div className="summary-item invoices">
            <span className="summary-label">الفواتير</span>
            <span className="summary-value">{todaySummary?.invoiceCount || 0}</span>
          </div>
        </div>
      </Card>

      {/* التبويبات */}
      <div className="cash-tabs">
        <button
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          نظرة عامة
        </button>
        <button
          className={`tab-btn ${activeTab === 'transactions' ? 'active' : ''}`}
          onClick={() => setActiveTab('transactions')}
        >
          الحركات المالية
        </button>
        <button
          className={`tab-btn ${activeTab === 'invoices' ? 'active' : ''}`}
          onClick={() => setActiveTab('invoices')}
        >
          الفواتير الأخيرة
        </button>
      </div>

      {/* المحتوى حسب التبويب */}
      {activeTab === 'overview' && (
        <div className="overview-content">
          <div className="overview-grid">
            {/* آخر الحركات */}
            <Card className="recent-transactions">
              <h3>آخر الحركات المالية</h3>
              <div className="transactions-list">
                {transactions.slice(0, 10).map((t, index) => (
                  <div key={index} className={`transaction-item ${t.type}`}>
                    <div className="transaction-info">
                      <span className="transaction-desc">{t.description}</span>
                      <span className="transaction-meta">
                        {t.employeeName} • {getPaymentMethodLabel(t.paymentMethod)}
                      </span>
                    </div>
                    <div className="transaction-amount">
                      <span className={t.type === 'income' ? 'positive' : 'negative'}>
                        {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                      </span>
                      <span className="transaction-date">{formatDate(t.transactionDate)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* آخر الفواتير */}
            <Card className="recent-invoices">
              <h3>آخر الفواتير</h3>
              <div className="invoices-list">
                {recentInvoices.slice(0, 10).map((inv) => (
                  <div
                    key={inv._id}
                    className="invoice-item clickable"
                    onClick={() => navigate(`/control/invoices?view=${inv._id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="invoice-info">
                      <span className="invoice-number invoice-link">{inv.invoiceNumber}</span>
                      <span className="invoice-customer">{inv.customerName}</span>
                    </div>
                    <div className="invoice-amount">
                      <span className="total">{formatCurrency(inv.total)}</span>
                      <span className={`status status-${inv.status}`}>
                        {inv.status === 'paid' ? 'مدفوع' :
                         inv.status === 'partial' ? 'جزئي' :
                         inv.status === 'draft' ? 'مسودة' : inv.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'transactions' && (
        <Card className="transactions-section">
          {/* الفلاتر */}
          <div className="filters-bar">
            <select
              value={filters.type}
              onChange={(e) => setFilters({...filters, type: e.target.value})}
            >
              <option value="">كل الأنواع</option>
              <option value="income">إيراد</option>
              <option value="expense">مصروف</option>
            </select>
            <select
              value={filters.paymentMethod}
              onChange={(e) => setFilters({...filters, paymentMethod: e.target.value})}
            >
              <option value="">كل طرق الدفع</option>
              <option value="cash">نقدي</option>
              <option value="card">شبكة</option>
              <option value="transfer">تحويل</option>
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
            <Button variant="outline" onClick={fetchTransactions}>بحث</Button>
          </div>

          {/* جدول الحركات */}
          <table className="transactions-table">
            <thead>
              <tr>
                <th>التاريخ</th>
                <th>الوصف</th>
                <th>التصنيف</th>
                <th>طريقة الدفع</th>
                <th>الموظف</th>
                <th>المبلغ</th>
                <th>الرصيد</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t, index) => (
                <tr key={index} className={t.type}>
                  <td>{formatDate(t.transactionDate)}</td>
                  <td>{t.description}</td>
                  <td>{getCategoryLabel(t.category)}</td>
                  <td>{getPaymentMethodLabel(t.paymentMethod)}</td>
                  <td>{t.employeeName}</td>
                  <td className={t.type === 'income' ? 'positive' : 'negative'}>
                    {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                  </td>
                  <td>{formatCurrency(t.balanceAfter)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {activeTab === 'invoices' && (
        <Card className="invoices-section">
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
              </tr>
            </thead>
            <tbody>
              {recentInvoices.map((inv) => (
                <tr key={inv._id} className="clickable-row" onClick={() => navigate(`/control/invoices?view=${inv._id}`)} style={{ cursor: 'pointer' }}>
                  <td>
                    <span className="invoice-link">{inv.invoiceNumber}</span>
                  </td>
                  <td>
                    {inv.type === 'invoice' ? 'فاتورة' :
                     inv.type === 'quote' ? 'عرض سعر' : 'إيصال'}
                  </td>
                  <td>{inv.customerName}</td>
                  <td>{formatDate(inv.issueDate)}</td>
                  <td>{formatCurrency(inv.total)}</td>
                  <td className="positive">{formatCurrency(inv.paidAmount)}</td>
                  <td className="negative">{formatCurrency(inv.remainingAmount)}</td>
                  <td>
                    <span className={`badge badge-${inv.status}`}>
                      {inv.status === 'paid' ? 'مدفوع' :
                       inv.status === 'partial' ? 'جزئي' :
                       inv.status === 'draft' ? 'مسودة' :
                       inv.status === 'cancelled' ? 'ملغي' : inv.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* Modal إضافة حركة */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="إضافة حركة مالية"
      >
        <form onSubmit={handleAddTransaction} className="transaction-form">
          <div className="form-row">
            <div className="form-group">
              <label>نوع الحركة</label>
              <select
                value={transactionForm.type}
                onChange={(e) => setTransactionForm({...transactionForm, type: e.target.value})}
                required
              >
                <option value="income">إيراد</option>
                <option value="expense">مصروف</option>
              </select>
            </div>
            <div className="form-group">
              <label>المبلغ</label>
              <NumberInput
                value={transactionForm.amount}
                onChange={(e) => setTransactionForm({...transactionForm, amount: e.target.value})}
                placeholder="0.00"
                min={0}
                allowDecimal={true}
                suffix="SAR"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>الوصف</label>
            <input
              type="text"
              value={transactionForm.description}
              onChange={(e) => setTransactionForm({...transactionForm, description: e.target.value})}
              placeholder="وصف الحركة المالية"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>التصنيف</label>
              <select
                value={transactionForm.category}
                onChange={(e) => setTransactionForm({...transactionForm, category: e.target.value})}
              >
                <option value="other">أخرى</option>
                <option value="deposit">إيداع</option>
                <option value="withdrawal">سحب</option>
                <option value="expense">مصروف</option>
                <option value="salary">راتب</option>
                <option value="commission">عمولة</option>
                <option value="refund">استرداد</option>
              </select>
            </div>
            <div className="form-group">
              <label>طريقة الدفع</label>
              <select
                value={transactionForm.paymentMethod}
                onChange={(e) => setTransactionForm({...transactionForm, paymentMethod: e.target.value})}
              >
                <option value="cash">نقدي</option>
                <option value="card">شبكة</option>
                <option value="transfer">تحويل</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>ملاحظات</label>
            <textarea
              value={transactionForm.notes}
              onChange={(e) => setTransactionForm({...transactionForm, notes: e.target.value})}
              placeholder="ملاحظات إضافية (اختياري)"
              rows="2"
            />
          </div>

          <div className="form-actions">
            <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
              إلغاء
            </Button>
            <Button type="submit">
              {transactionForm.type === 'income' ? 'إضافة إيراد' : 'تسجيل مصروف'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal التقرير */}
      <Modal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        title="تقرير الصندوق"
        size="large"
      >
        {reportData && (
          <div className="report-content">
            <div className="report-summary">
              <div className="report-stat">
                <span className="label">إجمالي الإيرادات</span>
                <span className="value positive">{formatCurrency(reportData.summary?.totalIncome)}</span>
              </div>
              <div className="report-stat">
                <span className="label">إجمالي المصروفات</span>
                <span className="value negative">{formatCurrency(reportData.summary?.totalExpense)}</span>
              </div>
              <div className="report-stat">
                <span className="label">الصافي</span>
                <span className="value">{formatCurrency(reportData.summary?.netAmount)}</span>
              </div>
            </div>

            <h4>حسب الموظف</h4>
            <table className="report-table">
              <thead>
                <tr>
                  <th>الموظف</th>
                  <th>الإيرادات</th>
                  <th>المصروفات</th>
                  <th>الصافي</th>
                  <th>عدد الحركات</th>
                </tr>
              </thead>
              <tbody>
                {reportData.byEmployee?.map((emp, index) => (
                  <tr key={index}>
                    <td>{emp.employeeName}</td>
                    <td className="positive">{formatCurrency(emp.income)}</td>
                    <td className="negative">{formatCurrency(emp.expense)}</td>
                    <td>{formatCurrency(emp.netAmount)}</td>
                    <td>{emp.transactionCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h4>حسب طريقة الدفع</h4>
            <div className="payment-method-stats">
              {Object.entries(reportData.byPaymentMethod || {}).map(([method, stats]) => (
                <div key={method} className="payment-stat">
                  <span className="method">{getPaymentMethodLabel(method)}</span>
                  <span className="income">إيراد: {formatCurrency(stats.income)}</span>
                  <span className="expense">مصروف: {formatCurrency(stats.expense)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CashRegister;
