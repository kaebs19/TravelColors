import { useState, useEffect } from 'react';
import { auditApi } from '../../api';
import { useAuth } from '../../context';
import Card from '../../components/common/Card';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import './AuditLog.css';

const AuditLog = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    entityType: '',
    action: '',
    startDate: '',
    endDate: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 1
  });
  const [selectedLog, setSelectedLog] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // تسميات الإجراءات
  const actionLabels = {
    create: 'إنشاء',
    update: 'تعديل',
    delete: 'حذف',
    payment: 'دفعة',
    convert: 'تحويل',
    cancel: 'إلغاء',
    refund: 'استرداد',
    view: 'عرض',
    export: 'تصدير',
    print: 'طباعة'
  };

  // تسميات أنواع الكيانات
  const entityTypeLabels = {
    transaction: 'معاملة مالية',
    receipt: 'إيصال',
    invoice: 'فاتورة',
    appointment: 'موعد',
    customer: 'عميل',
    user: 'مستخدم',
    settings: 'إعدادات'
  };

  // ألوان الإجراءات
  const actionColors = {
    create: 'success',
    update: 'info',
    delete: 'danger',
    payment: 'success',
    convert: 'primary',
    cancel: 'danger',
    refund: 'warning',
    view: 'secondary',
    export: 'info',
    print: 'secondary'
  };

  useEffect(() => {
    fetchLogs();
  }, [filters, pagination.page]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      };

      // إزالة المعلمات الفارغة
      Object.keys(params).forEach(key => {
        if (!params[key]) delete params[key];
      });

      const response = await auditApi.getLogs(params);
      const data = response.data?.data || response.data || {};
      setLogs(data.logs || []);
      setPagination(prev => ({
        ...prev,
        total: data.pagination?.total || 0,
        pages: data.pagination?.pages || 1
      }));
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleViewDetails = (log) => {
    setSelectedLog(log);
    setShowDetailsModal(true);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderChanges = (changes) => {
    if (!changes || (!changes.before && !changes.after)) {
      return <p className="no-changes">لا توجد تغييرات مسجلة</p>;
    }

    const before = changes.before || {};
    const after = changes.after || {};
    const allKeys = [...new Set([...Object.keys(before), ...Object.keys(after)])];

    // تصفية الحقول غير المهمة
    const ignoredFields = ['_id', '__v', 'createdAt', 'updatedAt', 'password'];
    const filteredKeys = allKeys.filter(key => !ignoredFields.includes(key));

    if (filteredKeys.length === 0) {
      return <p className="no-changes">لا توجد تغييرات مهمة</p>;
    }

    return (
      <div className="changes-table">
        <table>
          <thead>
            <tr>
              <th>الحقل</th>
              <th>القيمة السابقة</th>
              <th>القيمة الجديدة</th>
            </tr>
          </thead>
          <tbody>
            {filteredKeys.map(key => {
              const beforeValue = before[key];
              const afterValue = after[key];
              const hasChanged = JSON.stringify(beforeValue) !== JSON.stringify(afterValue);

              return (
                <tr key={key} className={hasChanged ? 'changed' : ''}>
                  <td className="field-name">{key}</td>
                  <td className="before-value">
                    {beforeValue !== undefined ? formatValue(beforeValue) : '-'}
                  </td>
                  <td className="after-value">
                    {afterValue !== undefined ? formatValue(afterValue) : '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const formatValue = (value) => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'boolean') return value ? 'نعم' : 'لا';
    if (typeof value === 'object') {
      if (Array.isArray(value)) return `[${value.length} عناصر]`;
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  // التحقق من صلاحية المستخدم
  if (user?.role !== 'admin') {
    return (
      <div className="audit-log-page">
        <div className="access-denied">
          <i className="fas fa-lock"></i>
          <h2>غير مصرح</h2>
          <p>هذه الصفحة متاحة فقط للمدراء</p>
        </div>
      </div>
    );
  }

  return (
    <div className="audit-log-page">
      <div className="page-header">
        <h1>سجل التدقيق</h1>
      </div>

      {/* الفلاتر */}
      <Card className="filters-card">
        <div className="filters-row">
          <select
            name="entityType"
            value={filters.entityType}
            onChange={handleFilterChange}
          >
            <option value="">كل الكيانات</option>
            <option value="transaction">المعاملات</option>
            <option value="receipt">الإيصالات</option>
            <option value="invoice">الفواتير</option>
            <option value="appointment">المواعيد</option>
            <option value="customer">العملاء</option>
            <option value="user">المستخدمين</option>
            <option value="settings">الإعدادات</option>
          </select>

          <select
            name="action"
            value={filters.action}
            onChange={handleFilterChange}
          >
            <option value="">كل الإجراءات</option>
            <option value="create">إنشاء</option>
            <option value="update">تعديل</option>
            <option value="delete">حذف</option>
            <option value="payment">دفعة</option>
            <option value="convert">تحويل</option>
            <option value="cancel">إلغاء</option>
            <option value="refund">استرداد</option>
          </select>

          <input
            type="date"
            name="startDate"
            value={filters.startDate}
            onChange={handleFilterChange}
            placeholder="من تاريخ"
          />

          <input
            type="date"
            name="endDate"
            value={filters.endDate}
            onChange={handleFilterChange}
            placeholder="إلى تاريخ"
          />

          <Button
            variant="secondary"
            size="small"
            onClick={() => {
              setFilters({ entityType: '', action: '', startDate: '', endDate: '' });
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
          >
            مسح الفلاتر
          </Button>
        </div>
      </Card>

      {/* قائمة السجلات */}
      <Card className="logs-list">
        {loading ? (
          <div className="loading">جاري التحميل...</div>
        ) : logs.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-clipboard-list"></i>
            <p>لا توجد سجلات</p>
          </div>
        ) : (
          <>
            <table className="logs-table">
              <thead>
                <tr>
                  <th>التاريخ</th>
                  <th>المستخدم</th>
                  <th>الإجراء</th>
                  <th>نوع الكيان</th>
                  <th>رقم الكيان</th>
                  <th>الوصف</th>
                  <th>IP</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log._id}>
                    <td className="date-cell">{formatDate(log.createdAt)}</td>
                    <td>
                      <div className="user-info">
                        <span className="user-name">{log.userName}</span>
                        <span className="user-role">{log.userRole === 'admin' ? 'مدير' : 'موظف'}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`action-badge ${actionColors[log.action]}`}>
                        {actionLabels[log.action] || log.action}
                      </span>
                    </td>
                    <td>
                      <span className="entity-type">
                        {entityTypeLabels[log.entityType] || log.entityType}
                      </span>
                    </td>
                    <td className="entity-number">{log.entityNumber || '-'}</td>
                    <td className="description">{log.description || '-'}</td>
                    <td className="ip-address">{log.ipAddress || '-'}</td>
                    <td>
                      <button
                        className="btn-icon view"
                        onClick={() => handleViewDetails(log)}
                        title="عرض التفاصيل"
                      >
                        <i className="fas fa-eye"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="pagination">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                >
                  السابق
                </button>
                <span>
                  صفحة {pagination.page} من {pagination.pages}
                </span>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.pages}
                >
                  التالي
                </button>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Modal تفاصيل السجل */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="تفاصيل السجل"
        size="large"
      >
        {selectedLog && (
          <div className="log-details">
            <div className="details-header">
              <div className="header-row">
                <span className={`action-badge large ${actionColors[selectedLog.action]}`}>
                  {actionLabels[selectedLog.action]}
                </span>
                <span className="entity-type large">
                  {entityTypeLabels[selectedLog.entityType]}
                </span>
              </div>
              {selectedLog.entityNumber && (
                <div className="entity-number large">{selectedLog.entityNumber}</div>
              )}
            </div>

            <div className="details-section">
              <h4>معلومات الإجراء</h4>
              <div className="info-grid">
                <div className="info-item">
                  <span className="label">التاريخ والوقت:</span>
                  <span className="value">{formatDate(selectedLog.createdAt)}</span>
                </div>
                <div className="info-item">
                  <span className="label">المستخدم:</span>
                  <span className="value">{selectedLog.userName}</span>
                </div>
                <div className="info-item">
                  <span className="label">الدور:</span>
                  <span className="value">{selectedLog.userRole === 'admin' ? 'مدير' : 'موظف'}</span>
                </div>
                <div className="info-item">
                  <span className="label">IP:</span>
                  <span className="value ltr">{selectedLog.ipAddress || '-'}</span>
                </div>
              </div>
            </div>

            {selectedLog.description && (
              <div className="details-section">
                <h4>الوصف</h4>
                <p className="description-text">{selectedLog.description}</p>
              </div>
            )}

            <div className="details-section">
              <h4>التغييرات</h4>
              {renderChanges(selectedLog.changes)}
            </div>

            {selectedLog.userAgent && (
              <div className="details-section">
                <h4>معلومات المتصفح</h4>
                <p className="user-agent">{selectedLog.userAgent}</p>
              </div>
            )}

            {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
              <div className="details-section">
                <h4>بيانات إضافية</h4>
                <pre className="metadata-json">
                  {JSON.stringify(selectedLog.metadata, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AuditLog;
