import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { visaApi } from '../../api';
import './VisaApplications.css';

const VISA_STATUS_MAP = {
  draft: { label: 'مسودة', color: '#64748b', bg: '#f1f5f9' },
  submitted: { label: 'قيد الانتظار', color: '#2563eb', bg: '#eff6ff' },
  under_review: { label: 'قيد المراجعة', color: '#d97706', bg: '#fffbeb' },
  approved: { label: 'مقبول', color: '#16a34a', bg: '#f0fdf4' },
  rejected: { label: 'مرفوض', color: '#dc2626', bg: '#fef2f2' }
};

const VISA_TYPE_MAP = { tourism: 'سياحية', medical: 'علاج', study: 'دراسة' };

const MARITAL_STATUS_MAP = {
  single: 'أعزب',
  married: 'متزوج',
  divorced: 'مطلق',
  widowed: 'أرمل'
};

const VisaApplications = () => {
  const navigate = useNavigate();

  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState({});
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page, limit: 15 };
      if (search.trim()) params.search = search.trim();
      if (statusFilter !== 'all') params.status = statusFilter;

      const res = await visaApi.getApplications(params);
      if (res.success) {
        setApplications(res.data.applications);
        setStats(res.data.stats || {});
        setPagination(res.data.pagination || {});
      }
    } catch (err) {
      console.error('Error fetching visa applications:', err);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchApplications();
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('هل أنت متأكد من حذف هذا الطلب؟')) return;
    try {
      const res = await visaApi.deleteApplication(id);
      if (res.success) {
        fetchApplications();
      }
    } catch (err) {
      console.error('Error deleting application:', err);
    }
  };

  const handleStatusFilterClick = (status) => {
    setStatusFilter(status);
    setPage(1);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleExport = (e, app) => {
    e.stopPropagation();
    // Open application detail in a new window for printing/export
    window.open(`/control/visa-applications/${app._id}`, '_blank');
  };

  const statsCards = [
    { key: 'all', label: 'الإجمالي', count: stats.total || 0, color: '#475569', bg: '#f8fafc', border: '#94a3b8' },
    { key: 'submitted', label: 'قيد الانتظار', count: stats.submitted || 0, color: '#2563eb', bg: '#eff6ff', border: '#2563eb' },
    { key: 'under_review', label: 'قيد المراجعة', count: stats.under_review || 0, color: '#d97706', bg: '#fffbeb', border: '#d97706' },
    { key: 'approved', label: 'مقبول', count: stats.approved || 0, color: '#16a34a', bg: '#f0fdf4', border: '#16a34a' },
    { key: 'rejected', label: 'مرفوض', count: stats.rejected || 0, color: '#dc2626', bg: '#fef2f2', border: '#dc2626' }
  ];

  const filterButtons = [
    { key: 'all', label: 'الكل' },
    { key: 'submitted', label: 'قيد الانتظار' },
    { key: 'under_review', label: 'قيد المراجعة' },
    { key: 'approved', label: 'مقبول' },
    { key: 'rejected', label: 'مرفوض' }
  ];

  return (
    <div className="va-page">
      {/* Page Header */}
      <div className="va-header">
        <div className="va-header-title">
          <h1>🇺🇸 تأشيرات أمريكا</h1>
          <p>إدارة طلبات التأشيرة الأمريكية</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="va-stats">
        {statsCards.map((card) => (
          <div
            key={card.key}
            className={`va-stat-card ${statusFilter === card.key ? 'active' : ''}`}
            style={{
              '--stat-color': card.color,
              '--stat-bg': card.bg,
              '--stat-border': card.border
            }}
            onClick={() => handleStatusFilterClick(card.key)}
          >
            <span className="va-stat-count">{card.count}</span>
            <span className="va-stat-label">{card.label}</span>
          </div>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="va-toolbar">
        <form className="va-search-form" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="بحث بالاسم، رقم الطلب، رقم الجواز..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="va-search-input"
          />
          <button type="submit" className="va-search-btn">بحث</button>
        </form>
        <div className="va-filter-buttons">
          {filterButtons.map((btn) => (
            <button
              key={btn.key}
              className={`va-filter-btn ${statusFilter === btn.key ? 'active' : ''}`}
              onClick={() => handleStatusFilterClick(btn.key)}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="va-loading">
          <div className="va-spinner"></div>
          <span>جاري تحميل الطلبات...</span>
        </div>
      ) : applications.length === 0 ? (
        <div className="va-empty">
          <div className="va-empty-icon">📋</div>
          <p>لا توجد طلبات</p>
          {(search || statusFilter !== 'all') && (
            <button
              className="va-empty-reset"
              onClick={() => { setSearch(''); setStatusFilter('all'); setPage(1); }}
            >
              إعادة ضبط الفلاتر
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="va-table-wrap">
            <table className="va-table">
              <thead>
                <tr>
                  <th>المتقدم</th>
                  <th>رقم الجواز</th>
                  <th>تاريخ التقديم</th>
                  <th>الحالة</th>
                  <th>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr
                    key={app._id}
                    className="va-table-row"
                    onClick={() => navigate(`/control/visa-applications/${app._id}`)}
                  >
                    <td>
                      <div className="va-applicant-info">
                        <span className="va-applicant-name">
                          {app.personalInfo?.fullName || '-'}
                        </span>
                        <span className="va-applicant-meta">
                          {formatDate(app.personalInfo?.dateOfBirth)}
                          {app.personalInfo?.maritalStatus && (
                            <> &middot; {MARITAL_STATUS_MAP[app.personalInfo.maritalStatus] || app.personalInfo.maritalStatus}</>
                          )}
                          {app.visaType && (
                            <> &middot; {VISA_TYPE_MAP[app.visaType] || app.visaType}</>
                          )}
                        </span>
                      </div>
                    </td>
                    <td dir="ltr" className="va-passport-num">
                      {app.passportDetails?.passportNumber || '-'}
                    </td>
                    <td className="va-date-cell">
                      {formatDate(app.submittedAt || app.createdAt)}
                    </td>
                    <td>
                      <span
                        className="va-status-badge"
                        style={{
                          color: VISA_STATUS_MAP[app.status]?.color,
                          background: VISA_STATUS_MAP[app.status]?.bg
                        }}
                      >
                        {VISA_STATUS_MAP[app.status]?.label || app.status}
                      </span>
                    </td>
                    <td>
                      <div className="va-actions" onClick={(e) => e.stopPropagation()}>
                        <button
                          className="va-action-btn va-action-view"
                          title="عرض التفاصيل"
                          onClick={() => navigate(`/control/visa-applications/${app._id}`)}
                        >
                          👁️
                        </button>
                        <button
                          className="va-action-btn va-action-delete"
                          title="حذف الطلب"
                          onClick={(e) => handleDelete(e, app._id)}
                        >
                          🗑️
                        </button>
                        <button
                          className="va-action-btn va-action-export"
                          title="تصدير / طباعة"
                          onClick={(e) => handleExport(e, app)}
                        >
                          📥
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="va-pagination">
              <button
                className="va-pagination-btn"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                السابق
              </button>
              <span className="va-pagination-info">
                صفحة {page} من {pagination.pages}
              </span>
              <button
                className="va-pagination-btn"
                disabled={page >= pagination.pages}
                onClick={() => setPage((p) => p + 1)}
              >
                التالي
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default VisaApplications;
