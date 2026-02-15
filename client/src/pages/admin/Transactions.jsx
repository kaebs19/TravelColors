import { useState, useEffect } from 'react';
import { transactionsApi, customersApi } from '../../api';
import { Card, Button, Loader, Modal, NumberInput } from '../../components/common';
import './Transactions.css';

const Transactions = () => {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState({});
  const [balanceSummary, setBalanceSummary] = useState({});
  const [customers, setCustomers] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [submitting, setSubmitting] = useState(false);

  const [filters, setFilters] = useState({
    type: '',
    category: '',
    paymentMethod: '',
    source: '',
    search: '',
    startDate: '',
    endDate: ''
  });

  const [transactionForm, setTransactionForm] = useState({
    type: 'income',
    amount: 0,
    description: '',
    category: 'other',
    paymentMethod: 'cash',
    customer: '',
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [transactionsRes, balanceRes, customersRes] = await Promise.all([
        transactionsApi.getTransactions({ ...filters, limit: 100 }),
        transactionsApi.getBalanceSummary(),
        customersApi.getCustomers({ limit: 100 })
      ]);

      const transactionsData = transactionsRes.data?.data || transactionsRes.data || {};
      setTransactions(transactionsData.transactions || []);
      setStats(transactionsData.stats || {});

      const balanceData = balanceRes.data?.data || balanceRes.data || {};
      setBalanceSummary(balanceData);

      const customersList = customersRes.customers || customersRes.data?.customers || [];
      setCustomers(customersList);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    try {
      setLoading(true);
      const res = await transactionsApi.getTransactions(filters);
      const data = res.data?.data || res.data || {};
      setTransactions(data.transactions || []);
      setStats(data.stats || {});
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTransaction = async (e) => {
    e.preventDefault();

    if (!transactionForm.description || !transactionForm.amount || transactionForm.amount <= 0) {
      alert('يرجى إدخال الوصف والمبلغ');
      return;
    }

    try {
      setSubmitting(true);
      const res = await transactionsApi.createTransaction(transactionForm);
      if (res.data?.success) {
        alert('تم إنشاء المعاملة بنجاح');
        setShowCreateModal(false);
        resetForm();
        fetchData();
      }
    } catch (error) {
      console.error('Error creating transaction:', error);
      alert(error.response?.data?.message || 'حدث خطأ أثناء إنشاء المعاملة');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelTransaction = async (transaction) => {
    if (!window.confirm('هل أنت متأكد من إلغاء هذه المعاملة؟')) return;

    try {
      const reason = prompt('سبب الإلغاء:');
      if (!reason) return;

      const res = await transactionsApi.cancelTransaction(transaction._id, { reason });
      if (res.data?.success) {
        alert('تم إلغاء المعاملة بنجاح');
        fetchData();
      }
    } catch (error) {
      console.error('Error cancelling transaction:', error);
      alert(error.response?.data?.message || 'حدث خطأ أثناء الإلغاء');
    }
  };

  const viewTransaction = (transaction) => {
    setSelectedTransaction(transaction);
    setShowViewModal(true);
  };

  const resetForm = () => {
    setTransactionForm({
      type: 'income',
      amount: 0,
      description: '',
      category: 'other',
      paymentMethod: 'cash',
      customer: '',
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

  const getTypeBadge = (type) => {
    if (type === 'income') {
      return <span className="badge income">إيراد</span>;
    }
    return <span className="badge expense">مصروف</span>;
  };

  const getCategoryLabel = (category) => {
    const categories = {
      appointment_payment: 'دفعة موعد',
      invoice_payment: 'دفعة فاتورة',
      expense: 'مصروف',
      salary: 'راتب',
      commission: 'عمولة',
      refund: 'استرداد',
      deposit: 'إيداع',
      withdrawal: 'سحب',
      other: 'أخرى'
    };
    return categories[category] || category;
  };

  const getPaymentMethodLabel = (method) => {
    const methods = {
      cash: 'نقدي',
      card: 'شبكة',
      transfer: 'تحويل'
    };
    return methods[method] || method;
  };

  const getSourceLabel = (source) => {
    return source === 'automatic' ? 'تلقائي' : 'يدوي';
  };

  const filteredTransactions = transactions.filter(tx => {
    if (activeTab === 'income') return tx.type === 'income';
    if (activeTab === 'expense') return tx.type === 'expense';
    if (activeTab === 'manual') return tx.source === 'manual';
    if (activeTab === 'automatic') return tx.source === 'automatic';
    return true;
  });

  if (loading) return <Loader />;

  return (
    <div className="transactions-page">
      <div className="page-header">
        <h1>السجل المالي</h1>
        <Button onClick={() => setShowCreateModal(true)}>إضافة معاملة</Button>
      </div>

      {/* ملخص الرصيد */}
      <div className="balance-cards">
        <Card className="balance-card total">
          <div className="balance-icon">
            <i className="fas fa-wallet"></i>
          </div>
          <div className="balance-info">
            <span className="balance-label">الرصيد الإجمالي</span>
            <span className="balance-value">{formatMoney(balanceSummary.currentBalance?.total)}</span>
          </div>
        </Card>
        <Card className="balance-card cash">
          <div className="balance-icon">
            <i className="fas fa-money-bill-wave"></i>
          </div>
          <div className="balance-info">
            <span className="balance-label">النقدي</span>
            <span className="balance-value">{formatMoney(balanceSummary.currentBalance?.cash)}</span>
          </div>
        </Card>
        <Card className="balance-card card">
          <div className="balance-icon">
            <i className="fas fa-credit-card"></i>
          </div>
          <div className="balance-info">
            <span className="balance-label">الشبكة</span>
            <span className="balance-value">{formatMoney(balanceSummary.currentBalance?.card)}</span>
          </div>
        </Card>
        <Card className="balance-card transfer">
          <div className="balance-icon">
            <i className="fas fa-exchange-alt"></i>
          </div>
          <div className="balance-info">
            <span className="balance-label">التحويلات</span>
            <span className="balance-value">{formatMoney(balanceSummary.currentBalance?.transfer)}</span>
          </div>
        </Card>
      </div>

      {/* إحصائيات اليوم والشهر */}
      <div className="period-stats">
        <Card className="period-card">
          <h3>اليوم</h3>
          <div className="period-numbers">
            <div className="period-item income">
              <span className="label">الإيرادات</span>
              <span className="value">{formatMoney(balanceSummary.today?.totalIncome)}</span>
            </div>
            <div className="period-item expense">
              <span className="label">المصروفات</span>
              <span className="value">{formatMoney(balanceSummary.today?.totalExpense)}</span>
            </div>
            <div className="period-item net">
              <span className="label">الصافي</span>
              <span className="value">{formatMoney(balanceSummary.today?.netAmount)}</span>
            </div>
          </div>
        </Card>
        <Card className="period-card">
          <h3>الشهر الحالي</h3>
          <div className="period-numbers">
            <div className="period-item income">
              <span className="label">الإيرادات</span>
              <span className="value">{formatMoney(balanceSummary.month?.totalIncome)}</span>
            </div>
            <div className="period-item expense">
              <span className="label">المصروفات</span>
              <span className="value">{formatMoney(balanceSummary.month?.totalExpense)}</span>
            </div>
            <div className="period-item net">
              <span className="label">الصافي</span>
              <span className="value">{formatMoney(balanceSummary.month?.netAmount)}</span>
            </div>
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
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
          >
            <option value="">كل الأنواع</option>
            <option value="income">إيراد</option>
            <option value="expense">مصروف</option>
          </select>
          <select
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
          >
            <option value="">كل التصنيفات</option>
            <option value="appointment_payment">دفعة موعد</option>
            <option value="invoice_payment">دفعة فاتورة</option>
            <option value="expense">مصروف</option>
            <option value="salary">راتب</option>
            <option value="commission">عمولة</option>
            <option value="refund">استرداد</option>
            <option value="other">أخرى</option>
          </select>
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
          الكل ({transactions.length})
        </button>
        <button
          className={`tab ${activeTab === 'income' ? 'active' : ''}`}
          onClick={() => setActiveTab('income')}
        >
          إيرادات ({transactions.filter(t => t.type === 'income').length})
        </button>
        <button
          className={`tab ${activeTab === 'expense' ? 'active' : ''}`}
          onClick={() => setActiveTab('expense')}
        >
          مصروفات ({transactions.filter(t => t.type === 'expense').length})
        </button>
        <button
          className={`tab ${activeTab === 'manual' ? 'active' : ''}`}
          onClick={() => setActiveTab('manual')}
        >
          يدوي ({transactions.filter(t => t.source === 'manual').length})
        </button>
        <button
          className={`tab ${activeTab === 'automatic' ? 'active' : ''}`}
          onClick={() => setActiveTab('automatic')}
        >
          تلقائي ({transactions.filter(t => t.source === 'automatic').length})
        </button>
      </div>

      {/* قائمة المعاملات */}
      <Card className="transactions-list">
        {filteredTransactions.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-exchange-alt"></i>
            <p>لا توجد معاملات</p>
          </div>
        ) : (
          <table className="transactions-table">
            <thead>
              <tr>
                <th>الرقم</th>
                <th>النوع</th>
                <th>المبلغ</th>
                <th>الوصف</th>
                <th>التصنيف</th>
                <th>طريقة الدفع</th>
                <th>المصدر</th>
                <th>الرصيد بعد</th>
                <th>التاريخ</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((tx) => (
                <tr key={tx._id} className={!tx.isActive ? 'cancelled' : ''}>
                  <td>
                    <button className="tx-link-btn" onClick={() => viewTransaction(tx)}>
                      {tx.transactionNumber}
                    </button>
                  </td>
                  <td>{getTypeBadge(tx.type)}</td>
                  <td className={`amount ${tx.type}`}>
                    {tx.type === 'income' ? '+' : '-'}{formatMoney(tx.amount)}
                  </td>
                  <td className="description">{tx.description}</td>
                  <td>{getCategoryLabel(tx.category)}</td>
                  <td>{getPaymentMethodLabel(tx.paymentMethod)}</td>
                  <td>
                    <span className={`source-badge ${tx.source}`}>
                      {getSourceLabel(tx.source)}
                    </span>
                  </td>
                  <td className="balance">{formatMoney(tx.balanceAfter)}</td>
                  <td>{formatDate(tx.createdAt)}</td>
                  <td>
                    <div className="actions">
                      <button className="btn-icon" onClick={() => viewTransaction(tx)} title="عرض">
                        <i className="fas fa-eye"></i>
                      </button>
                      {tx.isActive && tx.source === 'manual' && (
                        <button
                          className="btn-icon delete"
                          onClick={() => handleCancelTransaction(tx)}
                          title="إلغاء"
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {/* نافذة إنشاء معاملة */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}
        title="إضافة معاملة جديدة"
      >
        <form onSubmit={handleCreateTransaction} className="transaction-form">
          <div className="form-row">
            <div className="form-group">
              <label>النوع *</label>
              <select
                value={transactionForm.type}
                onChange={(e) => setTransactionForm({ ...transactionForm, type: e.target.value })}
              >
                <option value="income">إيراد</option>
                <option value="expense">مصروف</option>
              </select>
            </div>
            <div className="form-group">
              <label>التصنيف *</label>
              <select
                value={transactionForm.category}
                onChange={(e) => setTransactionForm({ ...transactionForm, category: e.target.value })}
              >
                {transactionForm.type === 'income' ? (
                  <>
                    <option value="deposit">إيداع</option>
                    <option value="other">أخرى</option>
                  </>
                ) : (
                  <>
                    <option value="expense">مصروف عام</option>
                    <option value="salary">راتب</option>
                    <option value="commission">عمولة</option>
                    <option value="withdrawal">سحب</option>
                    <option value="other">أخرى</option>
                  </>
                )}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>المبلغ *</label>
              <NumberInput
                value={transactionForm.amount}
                onChange={(e) => setTransactionForm({ ...transactionForm, amount: e.target.value })}
                min={0}
                suffix="SAR"
                required
              />
            </div>
            <div className="form-group">
              <label>طريقة الدفع</label>
              <select
                value={transactionForm.paymentMethod}
                onChange={(e) => setTransactionForm({ ...transactionForm, paymentMethod: e.target.value })}
              >
                <option value="cash">نقدي</option>
                <option value="card">شبكة</option>
                <option value="transfer">تحويل</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>الوصف *</label>
            <input
              type="text"
              value={transactionForm.description}
              onChange={(e) => setTransactionForm({ ...transactionForm, description: e.target.value })}
              placeholder="وصف المعاملة..."
              required
            />
          </div>

          <div className="form-group">
            <label>العميل (اختياري)</label>
            <select
              value={transactionForm.customer}
              onChange={(e) => setTransactionForm({ ...transactionForm, customer: e.target.value })}
            >
              <option value="">بدون عميل</option>
              {customers.map((customer) => (
                <option key={customer._id} value={customer._id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>ملاحظات</label>
            <textarea
              value={transactionForm.notes}
              onChange={(e) => setTransactionForm({ ...transactionForm, notes: e.target.value })}
              rows={3}
              placeholder="ملاحظات إضافية..."
            />
          </div>

          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={() => setShowCreateModal(false)}>
              إلغاء
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'جاري الإنشاء...' : 'إضافة المعاملة'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* نافذة عرض المعاملة */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedTransaction(null);
        }}
        title={`معاملة رقم ${selectedTransaction?.transactionNumber || ''}`}
      >
        {selectedTransaction && (
          <div className="transaction-view">
            <div className="view-header">
              {getTypeBadge(selectedTransaction.type)}
              <span className={`source-badge ${selectedTransaction.source}`}>
                {getSourceLabel(selectedTransaction.source)}
              </span>
              {!selectedTransaction.isActive && (
                <span className="badge cancelled">ملغاة</span>
              )}
            </div>

            <div className="view-body">
              <div className="view-row">
                <span className="label">المبلغ:</span>
                <span className={`value amount ${selectedTransaction.type}`}>
                  {selectedTransaction.type === 'income' ? '+' : '-'}{formatMoney(selectedTransaction.amount)}
                </span>
              </div>

              <div className="view-row">
                <span className="label">الوصف:</span>
                <span className="value">{selectedTransaction.description}</span>
              </div>

              <div className="view-row">
                <span className="label">التصنيف:</span>
                <span className="value">{getCategoryLabel(selectedTransaction.category)}</span>
              </div>

              <div className="view-row">
                <span className="label">طريقة الدفع:</span>
                <span className="value">{getPaymentMethodLabel(selectedTransaction.paymentMethod)}</span>
              </div>

              <div className="view-row">
                <span className="label">الرصيد قبل:</span>
                <span className="value">{formatMoney(selectedTransaction.balanceBefore)}</span>
              </div>

              <div className="view-row">
                <span className="label">الرصيد بعد:</span>
                <span className="value">{formatMoney(selectedTransaction.balanceAfter)}</span>
              </div>

              {selectedTransaction.customer && (
                <div className="view-row">
                  <span className="label">العميل:</span>
                  <span className="value">{selectedTransaction.customer.name}</span>
                </div>
              )}

              {selectedTransaction.receipt && (
                <div className="view-row">
                  <span className="label">الإيصال:</span>
                  <span className="value">{selectedTransaction.receipt.receiptNumber}</span>
                </div>
              )}

              {selectedTransaction.invoice && (
                <div className="view-row">
                  <span className="label">الفاتورة:</span>
                  <span className="value">{selectedTransaction.invoice.invoiceNumber}</span>
                </div>
              )}

              {selectedTransaction.notes && (
                <div className="view-row">
                  <span className="label">ملاحظات:</span>
                  <span className="value">{selectedTransaction.notes}</span>
                </div>
              )}

              <div className="view-row">
                <span className="label">التاريخ:</span>
                <span className="value">{formatDate(selectedTransaction.createdAt)}</span>
              </div>

              <div className="view-row">
                <span className="label">أنشئت بواسطة:</span>
                <span className="value">{selectedTransaction.createdBy?.name}</span>
              </div>

              {!selectedTransaction.isActive && (
                <>
                  <div className="cancelled-info">
                    <h4>معلومات الإلغاء</h4>
                    <p><strong>تاريخ الإلغاء:</strong> {formatDate(selectedTransaction.cancelledAt)}</p>
                    <p><strong>السبب:</strong> {selectedTransaction.cancellationReason}</p>
                    {selectedTransaction.cancelledBy && (
                      <p><strong>ألغيت بواسطة:</strong> {selectedTransaction.cancelledBy.name}</p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Transactions;
