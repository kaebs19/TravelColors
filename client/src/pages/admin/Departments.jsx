import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { departmentsApi, appointmentsApi } from '../../api';
import { Card, Loader, Modal } from '../../components/common';
import { formatDate } from '../../utils';
import DepartmentForm from '../../components/features/departments/DepartmentForm';
import './Departments.css';

const Departments = () => {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [appointmentsCounts, setAppointmentsCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // grid or table
  const [showModal, setShowModal] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [viewDepartment, setViewDepartment] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [deptsResponse, apptsResponse] = await Promise.all([
        departmentsApi.getDepartments(),
        appointmentsApi.getAppointments()
      ]);

      const depts = deptsResponse.data.departments || [];
      const appts = apptsResponse.data?.data?.appointments || apptsResponse.data?.appointments || [];

      // حساب عدد المواعيد لكل قسم
      const counts = {};
      appts.forEach(appt => {
        const deptId = appt.department?._id;
        if (deptId) {
          counts[deptId] = (counts[deptId] || 0) + 1;
        }
      });

      setDepartments(depts);
      setAppointmentsCounts(counts);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const response = await departmentsApi.getDepartments();
      setDepartments(response.data.departments || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingDepartment(null);
    setShowModal(true);
  };

  const handleEdit = (department) => {
    setEditingDepartment(department);
    setShowModal(true);
  };

  const handleView = (department) => {
    setViewDepartment(department);
  };

  const handleDelete = async (id) => {
    if (window.confirm('هل أنت متأكد من حذف هذا القسم؟')) {
      try {
        await departmentsApi.deleteDepartment(id);
        fetchDepartments();
      } catch (error) {
        console.error('Error deleting department:', error);
      }
    }
  };

  const handleToggle = async (id) => {
    try {
      await departmentsApi.toggleDepartment(id);
      fetchDepartments();
    } catch (error) {
      console.error('Error toggling department:', error);
    }
  };

  const handleFormSubmit = async (data) => {
    try {
      if (editingDepartment) {
        await departmentsApi.updateDepartment(editingDepartment._id, data);
      } else {
        await departmentsApi.createDepartment(data);
      }
      setShowModal(false);
      fetchDepartments();
    } catch (error) {
      console.error('Error saving department:', error);
    }
  };

  const filteredDepartments = departments.filter(dept => {
    if (!search) return true;
    return dept.title.toLowerCase().includes(search.toLowerCase());
  });

  // إحصائيات
  const stats = {
    total: departments.length,
    active: departments.filter(d => d.isActive).length,
    inactive: departments.filter(d => !d.isActive).length,
    totalCities: departments.reduce((acc, d) => acc + (d.cities?.length || 0), 0)
  };

  if (loading) {
    return <Loader fullScreen />;
  }

  return (
    <div className="departments-page">
      {/* Breadcrumb */}
      <div className="page-breadcrumb">
        <span>لوحة التحكم</span>
        <span className="separator">/</span>
        <span className="current">الأقسام / السفارات</span>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card stat-total">
          <div className="stat-icon">🏢</div>
          <div className="stat-info">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">إجمالي الأقسام</span>
          </div>
        </div>
        <div className="stat-card stat-active">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <span className="stat-value">{stats.active}</span>
            <span className="stat-label">أقسام مفعلة</span>
          </div>
        </div>
        <div className="stat-card stat-inactive">
          <div className="stat-icon">⏸️</div>
          <div className="stat-info">
            <span className="stat-value">{stats.inactive}</span>
            <span className="stat-label">أقسام معطلة</span>
          </div>
        </div>
        <div className="stat-card stat-cities">
          <div className="stat-icon">📍</div>
          <div className="stat-info">
            <span className="stat-value">{stats.totalCities}</span>
            <span className="stat-label">إجمالي المدن</span>
          </div>
        </div>
      </div>

      {/* Header with Actions */}
      <div className="page-header">
        <div className="header-right">
          <button className="add-btn" onClick={handleCreate}>
            <span>+</span>
            إضافة قسم
          </button>
          <div className="view-toggle">
            <button
              className={`toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="عرض شبكي"
            >
              ▦
            </button>
            <button
              className={`toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
              title="عرض جدولي"
            >
              ☰
            </button>
          </div>
        </div>
        <div className="header-left">
          <span className="results-count">{filteredDepartments.length} نتيجة</span>
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="بحث عن قسم..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'grid' ? (
        <div className="departments-grid">
          {filteredDepartments.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">📂</span>
              <p>لا توجد أقسام</p>
              <button className="add-btn" onClick={handleCreate}>إضافة قسم جديد</button>
            </div>
          ) : (
            filteredDepartments.map(department => (
              <Card key={department._id} className="department-card">
                <div className="card-header">
                  <h3
                    className="card-title clickable"
                    onClick={() => navigate(`/control/appointments?department=${department._id}`)}
                  >
                    {department.title}
                  </h3>
                  <span className={`status-dot ${department.isActive ? 'active' : 'inactive'}`}></span>
                </div>
                <div className="card-body">
                  <div className="appointments-count-badge">
                    <span className="count-icon">📅</span>
                    <span className="count-value">{appointmentsCounts[department._id] || 0}</span>
                    <span className="count-label">موعد</span>
                  </div>
                  <div className="cities-preview">
                    {department.cities?.slice(0, 3).map((city, index) => (
                      <span key={index} className="city-chip">
                        📍 {city.name}
                      </span>
                    ))}
                  </div>
                  <div className="card-meta">
                    <span className="meta-item">
                      📅 {formatDate(department.createdAt)}
                    </span>
                  </div>
                </div>
                <div className="card-actions">
                  <button className="card-action-btn view" onClick={() => handleView(department)} title="عرض">
                    👁️
                  </button>
                  <button className="card-action-btn edit" onClick={() => handleEdit(department)} title="تعديل">
                    ✏️
                  </button>
                  <button className="card-action-btn toggle" onClick={() => handleToggle(department._id)} title={department.isActive ? 'إيقاف' : 'تفعيل'}>
                    {department.isActive ? '⏸️' : '▶️'}
                  </button>
                  <button className="card-action-btn delete" onClick={() => handleDelete(department._id)} title="حذف">
                    🗑️
                  </button>
                </div>
              </Card>
            ))
          )}
        </div>
      ) : (
        <Card className="table-card">
          <table className="departments-table">
            <thead>
              <tr>
                <th>اسم القسم</th>
                <th>المواعيد</th>
                <th>المدن</th>
                <th>الحالة</th>
                <th>تاريخ الإنشاء</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredDepartments.length === 0 ? (
                <tr>
                  <td colSpan="6" className="empty-row">
                    لا توجد أقسام
                  </td>
                </tr>
              ) : (
                filteredDepartments.map(department => (
                  <tr key={department._id}>
                    <td className="dept-name">
                      <button
                        className="dept-link"
                        onClick={() => navigate(`/control/appointments?department=${department._id}`)}
                      >
                        {department.title}
                      </button>
                    </td>
                    <td>
                      <span className="appt-count-cell">
                        📅 {appointmentsCounts[department._id] || 0}
                      </span>
                    </td>
                    <td>
                      <div className="cities-inline">
                        {department.cities?.map((city, index) => (
                          <span key={index} className="city-mini">{city.name}</span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${department.isActive ? 'active' : 'inactive'}`}>
                        {department.isActive ? 'مفعل' : 'معطل'}
                      </span>
                    </td>
                    <td>{formatDate(department.createdAt)}</td>
                    <td className="actions-cell">
                      <button className="action-btn info-btn" onClick={() => handleView(department)} title="عرض">
                        👁️
                      </button>
                      <button className="action-btn edit-btn" onClick={() => handleEdit(department)} title="تعديل">
                        ✏️
                      </button>
                      <button className="action-btn toggle-btn" onClick={() => handleToggle(department._id)} title={department.isActive ? 'إيقاف' : 'تفعيل'}>
                        {department.isActive ? '⏸️' : '▶️'}
                      </button>
                      <button className="action-btn delete-btn" onClick={() => handleDelete(department._id)} title="حذف">
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingDepartment ? 'تعديل القسم' : 'إضافة قسم جديد'}
        size="medium"
      >
        <DepartmentForm
          department={editingDepartment}
          onSubmit={handleFormSubmit}
          onCancel={() => setShowModal(false)}
        />
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={!!viewDepartment}
        onClose={() => setViewDepartment(null)}
        title="تفاصيل القسم"
        size="medium"
      >
        {viewDepartment && (
          <div className="department-details">
            <div className="detail-row">
              <span className="detail-label">اسم القسم:</span>
              <span className="detail-value">{viewDepartment.title}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">عدد المواعيد:</span>
              <span className="detail-value appointments-count-value">
                📅 {appointmentsCounts[viewDepartment._id] || 0} موعد
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">المدن:</span>
              <div className="detail-value cities-list">
                {viewDepartment.cities?.map((city, index) => (
                  <span key={index} className="city-tag">
                    {city.name}
                    {city.mapLink && (
                      <a href={city.mapLink} target="_blank" rel="noopener noreferrer">
                        📍
                      </a>
                    )}
                  </span>
                ))}
              </div>
            </div>
            <div className="detail-row">
              <span className="detail-label">الحالة:</span>
              <span className={`status-badge ${viewDepartment.isActive ? 'active' : 'inactive'}`}>
                {viewDepartment.isActive ? 'مفعل' : 'غير مفعل'}
              </span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Departments;
