import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { visaApi } from '../../api';
import { BASE_STATUS_MAP, toEnDigits, formatDate } from '../../utils/adminHelpers';
import './VisaServiceApplications.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002';

const STATUS_MAP = {
  ...BASE_STATUS_MAP,
  submitted: { ...BASE_STATUS_MAP.submitted, label: 'جديد' }
};

const VisaServiceApplications = () => {
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
      const params = { page, limit: 20 };
      if (search.trim()) params.search = search.trim();
      if (statusFilter !== 'all') params.status = statusFilter;

      const res = await visaApi.getVisaServiceApplications(params);
      if (res.success) {
        setApplications(res.data.applications);
        setStats(res.data.stats || {});
        setPagination(res.data.pagination || {});
      }
    } catch (err) {
      console.error('Error fetching visa service applications:', err);
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
      const res = await visaApi.deleteVisaServiceApplication(id);
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

  const handleExport = (e, app) => {
    e.stopPropagation();
    window.open(`/control/visa-service-applications/${app._id}`, '_blank');
  };

  const totalApps = Object.values(stats).reduce((sum, n) => sum + n, 0);

  const statsCards = [
    { key: 'all', label: 'الإجمالي', count: totalApps, color: '#475569', bg: '#f8fafc', border: '#94a3b8' },
    { key: 'submitted', label: 'جديد', count: stats.submitted || 0, color: '#2563eb', bg: '#eff6ff', border: '#2563eb' },
    { key: 'under_review', label: 'قيد المراجعة', count: stats.under_review || 0, color: '#d97706', bg: '#fffbeb', border: '#d97706' },
    { key: 'approved', label: 'مقبول', count: stats.approved || 0, color: '#16a34a', bg: '#f0fdf4', border: '#16a34a' },
    { key: 'rejected', label: 'مرفوض', count: stats.rejected || 0, color: '#dc2626', bg: '#fef2f2', border: '#dc2626' },
    { key: 'completed', label: 'مكتمل', count: stats.completed || 0, color: '#7c3aed', bg: '#f5f3ff', border: '#7c3aed' }
  ];

  const filterButtons = [
    { key: 'all', label: 'الكل' },
    { key: 'submitted', label: 'جديد' },
    { key: 'under_review', label: 'قيد المراجعة' },
    { key: 'approved', label: 'مقبول' },
    { key: 'rejected', label: 'مرفوض' },
    { key: 'completed', label: 'مكتمل' }
  ];

  return (
    <div className="vsa-page">
      {/* Page Header */}
      <div className="vsa-header">
        <div className="vsa-header-title">
          <h1>📋 طلبات التأشيرة الإلكترونية</h1>
          <p>إدارة طلبات التأشيرات الإلكترونية للعملاء</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="vsa-stats">
        {statsCards.map((card) => (
          <div
            key={card.key}
            className={`vsa-stat-card ${statusFilter === card.key ? 'active' : ''}`}
            style={{
              '--stat-color': card.color,
              '--stat-bg': card.bg,
              '--stat-border': card.border
            }}
            onClick={() => handleStatusFilterClick(card.key)}
          >
            <span className="vsa-stat-count">{toEnDigits(card.count)}</span>
            <span className="vsa-stat-label">{card.label}</span>
          </div>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="vsa-toolbar">
        <form className="vsa-search-form" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="بحث بالاسم، رقم الطلب، رقم الجوال..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="vsa-search-input"
          />
          <button type="submit" className="vsa-search-btn">بحث</button>
        </form>
        <div className="vsa-filter-buttons">
          {filterButtons.map((btn) => (
            <button
              key={btn.key}
              className={`vsa-filter-btn ${statusFilter === btn.key ? 'active' : ''}`}
              onClick={() => handleStatusFilterClick(btn.key)}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="vsa-loading">
          <div className="vsa-spinner"></div>
          <span>جاري تحميل الطلبات...</span>
        </div>
      ) : applications.length === 0 ? (
        <div className="vsa-empty">
          <div className="vsa-empty-icon">📋</div>
          <p>لا توجد طلبات</p>
          {(search || statusFilter !== 'all') && (
            <button
              className="vsa-empty-reset"
              onClick={() => { setSearch(''); setStatusFilter('all'); setPage(1); }}
            >
              إعادة ضبط الفلاتر
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="vsa-table-wrap">
            <table className="vsa-table">
              <thead>
                <tr>
                  <th>رقم الطلب</th>
                  <th>الدولة</th>
                  <th>العميل</th>
                  <th>الجوال</th>
                  <th>الحالة</th>
                  <th>الإجمالي</th>
                  <th>التاريخ</th>
                  <th>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => {
                  const st = STATUS_MAP[app.status] || STATUS_MAP.draft;
                  return (
                    <tr
                      key={app._id}
                      className="vsa-table-row"
                      onClick={() => navigate(`/control/visa-service-applications/${app._id}`)}
                    >
                      <td className="vsa-app-num" dir="ltr">{toEnDigits(app.applicationNumber)}</td>
                      <td>
                        <div className="vsa-country">
                          {app.visaId?.flagImage && (
                            <img src={`${API_URL}${app.visaId.flagImage}`} alt="" className="vsa-flag" />
                          )}
                          <span>{app.visaId?.countryName || '—'}</span>
                        </div>
                      </td>
                      <td>{app.personalInfo?.fullName || app.clientId?.fullName || '—'}</td>
                      <td dir="ltr">{toEnDigits(app.personalInfo?.phone || app.clientId?.phone || '—')}</td>
                      <td>
                        <span
                          className="vsa-status-badge"
                          style={{ color: st.color, background: st.bg }}
                        >
                          {st.label}
                        </span>
                      </td>
                      <td>{toEnDigits(app.totalPrice || 0)} ريال</td>
                      <td className="vsa-date-cell">{formatDate(app.createdAt)}</td>
                      <td>
                        <div className="vsa-actions" onClick={(e) => e.stopPropagation()}>
                          <button
                            className="vsa-action-btn vsa-action-view"
                            title="عرض التفاصيل"
                            onClick={() => navigate(`/control/visa-service-applications/${app._id}`)}
                          >
                            👁️
                          </button>
                          <button
                            className="vsa-action-btn vsa-action-delete"
                            title="حذف الطلب"
                            onClick={(e) => handleDelete(e, app._id)}
                          >
                            🗑️
                          </button>
                          <button
                            className="vsa-action-btn vsa-action-export"
                            title="تصدير / طباعة"
                            onClick={(e) => handleExport(e, app)}
                          >
                            📥
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="vsa-pagination">
              <button
                className="vsa-pagination-btn"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                السابق
              </button>
              <span className="vsa-pagination-info">
                صفحة {toEnDigits(page)} من {toEnDigits(pagination.pages)}
              </span>
              <button
                className="vsa-pagination-btn"
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

export default VisaServiceApplications;
