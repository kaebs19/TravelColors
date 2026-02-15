import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { employeesApi } from '../../api';
import { Card, Loader, Modal } from '../../components/common';
import { formatDate, formatCurrency } from '../../utils';
import EmployeeForm from '../../components/features/employees/EmployeeForm';
import './Employees.css';

const Employees = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [viewEmployee, setViewEmployee] = useState(null);
  const [viewEmployeeData, setViewEmployeeData] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await employeesApi.getEmployees();
      const data = response.data?.data?.employees || response.data?.employees || [];
      setEmployees(data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingEmployee(null);
    setShowModal(true);
  };

  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    setShowModal(true);
  };

  const handleView = async (employee) => {
    setViewEmployee(employee);
    setLoadingDetails(true);
    try {
      const response = await employeesApi.getEmployee(employee._id);
      setViewEmployeeData(response.data?.data || {});
    } catch (error) {
      console.error('Error fetching employee details:', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleCloseView = () => {
    setViewEmployee(null);
    setViewEmployeeData(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الموظف؟')) {
      try {
        await employeesApi.deleteEmployee(id);
        fetchEmployees();
      } catch (error) {
        console.error('Error deleting employee:', error);
        alert(error.response?.data?.message || 'حدث خطأ أثناء الحذف');
      }
    }
  };

  const handleToggle = async (id) => {
    try {
      await employeesApi.toggleEmployee(id);
      fetchEmployees();
    } catch (error) {
      console.error('Error toggling employee:', error);
      alert(error.response?.data?.message || 'حدث خطأ');
    }
  };

  const handleFormSubmit = async (data) => {
    try {
      if (editingEmployee) {
        await employeesApi.updateEmployee(editingEmployee._id, data);
      } else {
        await employeesApi.createEmployee(data);
      }
      setShowModal(false);
      fetchEmployees();
    } catch (error) {
      console.error('Error saving employee:', error);
      alert(error.response?.data?.message || 'حدث خطأ أثناء الحفظ');
    }
  };

  // الانتقال لصفحة المواعيد مع فلتر الموظف
  const handleViewAppointments = (employeeId) => {
    navigate(`/control/appointments?createdBy=${employeeId}`);
  };

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = !search ||
      emp.name.toLowerCase().includes(search.toLowerCase()) ||
      emp.email.toLowerCase().includes(search.toLowerCase()) ||
      (emp.jobTitle && emp.jobTitle.toLowerCase().includes(search.toLowerCase()));

    const matchesRole = filterRole === 'all' || emp.role === filterRole;

    return matchesSearch && matchesRole;
  });

  // إحصائيات عامة
  const stats = {
    total: employees.length,
    admins: employees.filter(e => e.role === 'admin').length,
    employees: employees.filter(e => e.role === 'employee').length,
    active: employees.filter(e => e.isActive).length,
    totalAppointments: employees.reduce((sum, e) => sum + (e.stats?.totalAppointments || 0), 0),
    totalPersons: employees.reduce((sum, e) => sum + (e.stats?.totalPersons || 0), 0),
    monthAppointments: employees.reduce((sum, e) => sum + (e.stats?.monthAppointments || 0), 0),
    monthPersons: employees.reduce((sum, e) => sum + (e.stats?.monthPersons || 0), 0)
  };

  const getRoleBadge = (role) => {
    return role === 'admin' ? 'مدير' : 'موظف';
  };

  const getRoleClass = (role) => {
    return role === 'admin' ? 'role-admin' : 'role-employee';
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      new: { label: 'جديد', class: 'status-new' },
      in_progress: { label: 'قيد العمل', class: 'status-in-progress' },
      completed: { label: 'مكتمل', class: 'status-completed' },
      cancelled: { label: 'ملغي', class: 'status-cancelled' }
    };
    return statusMap[status] || { label: status, class: '' };
  };

  if (loading) {
    return <Loader fullScreen />;
  }

  return (
    <div className="employees-page">
      {/* Breadcrumb */}
      <div className="page-breadcrumb">
        <span>لوحة التحكم</span>
        <span className="separator">/</span>
        <span className="current">الموظفين</span>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid stats-grid-6">
        <div className="stat-card stat-total">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">إجمالي الموظفين</span>
          </div>
        </div>
        <div className="stat-card stat-admins">
          <div className="stat-icon">👔</div>
          <div className="stat-info">
            <span className="stat-value">{stats.admins}</span>
            <span className="stat-label">مدراء</span>
          </div>
        </div>
        <div className="stat-card stat-employees">
          <div className="stat-icon">🧑‍💼</div>
          <div className="stat-info">
            <span className="stat-value">{stats.employees}</span>
            <span className="stat-label">موظفين</span>
          </div>
        </div>
        <div className="stat-card stat-active">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <span className="stat-value">{stats.active}</span>
            <span className="stat-label">نشط</span>
          </div>
        </div>
        <div className="stat-card stat-appointments">
          <div className="stat-icon">📅</div>
          <div className="stat-info">
            <span className="stat-value">{stats.monthAppointments}</span>
            <span className="stat-label">مواعيد الشهر</span>
          </div>
        </div>
        <div className="stat-card stat-persons">
          <div className="stat-icon">🧑‍🤝‍🧑</div>
          <div className="stat-info">
            <span className="stat-value">{stats.monthPersons}</span>
            <span className="stat-label">أشخاص الشهر</span>
          </div>
        </div>
      </div>

      {/* Header with Actions */}
      <div className="page-header">
        <div className="header-right">
          <button className="add-btn" onClick={handleCreate}>
            <span>+</span>
            إضافة موظف
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
          <select
            className="filter-select"
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
          >
            <option value="all">جميع الصلاحيات</option>
            <option value="admin">مدير</option>
            <option value="employee">موظف</option>
          </select>
          <span className="results-count">{filteredEmployees.length} نتيجة</span>
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="بحث عن موظف..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'grid' ? (
        <div className="employees-grid">
          {filteredEmployees.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">👥</span>
              <p>لا يوجد موظفين</p>
              <button className="add-btn" onClick={handleCreate}>إضافة موظف جديد</button>
            </div>
          ) : (
            filteredEmployees.map(employee => (
              <Card key={employee._id} className="employee-card">
                <div className="card-header">
                  <div className="employee-avatar">
                    <img
                      src={employee.avatar || '/favicon.svg'}
                      alt={employee.name}
                      onError={(e) => { e.target.src = '/favicon.svg'; }}
                    />
                  </div>
                  <span className={`status-dot ${employee.isActive ? 'active' : 'inactive'}`}></span>
                </div>
                <div className="card-body">
                  <h3 className="employee-name">{employee.name}</h3>
                  <p className="employee-job">{employee.jobTitle || 'لم يحدد'}</p>
                  <p className="employee-email">{employee.email}</p>
                  <span className={`role-badge ${getRoleClass(employee.role)}`}>
                    {getRoleBadge(employee.role)}
                  </span>
                </div>

                {/* إحصائيات الموظف */}
                <div className="employee-stats">
                  <div className="emp-stat">
                    <span className="emp-stat-value">{employee.stats?.totalAppointments || 0}</span>
                    <span className="emp-stat-label">موعد</span>
                  </div>
                  <div className="emp-stat">
                    <span className="emp-stat-value">{employee.stats?.totalPersons || 0}</span>
                    <span className="emp-stat-label">شخص</span>
                  </div>
                  <div className="emp-stat">
                    <span className="emp-stat-value">{employee.stats?.monthAppointments || 0}</span>
                    <span className="emp-stat-label">هذا الشهر</span>
                  </div>
                </div>

                <div className="card-actions">
                  <button className="card-action-btn view" onClick={() => handleView(employee)} title="عرض">
                    👁️
                  </button>
                  <button className="card-action-btn edit" onClick={() => handleEdit(employee)} title="تعديل">
                    ✏️
                  </button>
                  <button className="card-action-btn toggle" onClick={() => handleToggle(employee._id)} title={employee.isActive ? 'إيقاف' : 'تفعيل'}>
                    {employee.isActive ? '⏸️' : '▶️'}
                  </button>
                  <button className="card-action-btn delete" onClick={() => handleDelete(employee._id)} title="حذف">
                    🗑️
                  </button>
                </div>
              </Card>
            ))
          )}
        </div>
      ) : (
        <Card className="table-card">
          <table className="employees-table">
            <thead>
              <tr>
                <th>الموظف</th>
                <th>البريد الإلكتروني</th>
                <th>الوظيفة</th>
                <th>الصلاحية</th>
                <th>المواعيد</th>
                <th>الأشخاص</th>
                <th>الشهر</th>
                <th>الحالة</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan="9" className="empty-row">
                    لا يوجد موظفين
                  </td>
                </tr>
              ) : (
                filteredEmployees.map(employee => (
                  <tr key={employee._id}>
                    <td>
                      <div className="employee-cell">
                        <img
                          src={employee.avatar || '/favicon.svg'}
                          alt={employee.name}
                          className="employee-thumb"
                          onError={(e) => { e.target.src = '/favicon.svg'; }}
                        />
                        <span>{employee.name}</span>
                      </div>
                    </td>
                    <td>{employee.email}</td>
                    <td>{employee.jobTitle || '-'}</td>
                    <td>
                      <span className={`role-badge ${getRoleClass(employee.role)}`}>
                        {getRoleBadge(employee.role)}
                      </span>
                    </td>
                    <td>
                      <span className="stat-cell">{employee.stats?.totalAppointments || 0}</span>
                    </td>
                    <td>
                      <span className="stat-cell">{employee.stats?.totalPersons || 0}</span>
                    </td>
                    <td>
                      <span className="stat-cell highlight">{employee.stats?.monthAppointments || 0}</span>
                    </td>
                    <td>
                      <span className={`status-badge ${employee.isActive ? 'active' : 'inactive'}`}>
                        {employee.isActive ? 'نشط' : 'معطل'}
                      </span>
                    </td>
                    <td className="actions-cell">
                      <button className="action-btn info-btn" onClick={() => handleView(employee)} title="عرض">
                        👁️
                      </button>
                      <button className="action-btn edit-btn" onClick={() => handleEdit(employee)} title="تعديل">
                        ✏️
                      </button>
                      <button className="action-btn toggle-btn" onClick={() => handleToggle(employee._id)} title={employee.isActive ? 'إيقاف' : 'تفعيل'}>
                        {employee.isActive ? '⏸️' : '▶️'}
                      </button>
                      <button className="action-btn delete-btn" onClick={() => handleDelete(employee._id)} title="حذف">
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
        title={editingEmployee ? 'تعديل موظف' : 'إضافة موظف جديد'}
        size="medium"
      >
        <EmployeeForm
          employee={editingEmployee}
          onSubmit={handleFormSubmit}
          onCancel={() => setShowModal(false)}
        />
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={!!viewEmployee}
        onClose={handleCloseView}
        title="تفاصيل الموظف"
        size="large"
      >
        {loadingDetails ? (
          <Loader />
        ) : viewEmployee && viewEmployeeData && (
          <div className="employee-details">
            <div className="details-header">
              <div className="detail-avatar">
                <img
                  src={viewEmployee.avatar || '/favicon.svg'}
                  alt={viewEmployee.name}
                  onError={(e) => { e.target.src = '/favicon.svg'; }}
                />
              </div>
              <div className="detail-header-info">
                <h2>{viewEmployee.name}</h2>
                <p>{viewEmployee.jobTitle || 'لم يحدد'}</p>
                <span className={`role-badge ${getRoleClass(viewEmployee.role)}`}>
                  {getRoleBadge(viewEmployee.role)}
                </span>
              </div>
            </div>

            {/* إحصائيات الموظف */}
            <div className="detail-stats">
              <div className="detail-stat">
                <span className="detail-stat-icon">📅</span>
                <div className="detail-stat-info">
                  <span className="detail-stat-value">
                    {viewEmployeeData.employee?.stats?.totalAppointments || 0}
                  </span>
                  <span className="detail-stat-label">إجمالي المواعيد</span>
                </div>
              </div>
              <div className="detail-stat">
                <span className="detail-stat-icon">👥</span>
                <div className="detail-stat-info">
                  <span className="detail-stat-value">
                    {viewEmployeeData.employee?.stats?.totalPersons || 0}
                  </span>
                  <span className="detail-stat-label">إجمالي الأشخاص</span>
                </div>
              </div>
              <div className="detail-stat">
                <span className="detail-stat-icon">💰</span>
                <div className="detail-stat-info">
                  <span className="detail-stat-value">
                    {formatCurrency(viewEmployeeData.employee?.stats?.totalAmount || 0)}
                  </span>
                  <span className="detail-stat-label">إجمالي المبالغ</span>
                </div>
              </div>
              <div className="detail-stat">
                <span className="detail-stat-icon">✅</span>
                <div className="detail-stat-info">
                  <span className="detail-stat-value">
                    {viewEmployeeData.employee?.stats?.completedCount || 0}
                  </span>
                  <span className="detail-stat-label">مكتمل</span>
                </div>
              </div>
            </div>

            {/* معلومات الاتصال */}
            <div className="detail-section">
              <h3>معلومات الاتصال</h3>
              <div className="detail-grid">
                <div className="detail-row">
                  <span className="detail-label">📧 البريد الإلكتروني:</span>
                  <span className="detail-value">{viewEmployee.email}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">📱 رقم الهاتف:</span>
                  <span className="detail-value" dir="ltr">{viewEmployee.phone || '-'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">📅 تاريخ الإنشاء:</span>
                  <span className="detail-value">{formatDate(viewEmployee.createdAt)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">🔄 الحالة:</span>
                  <span className={`status-badge ${viewEmployee.isActive ? 'active' : 'inactive'}`}>
                    {viewEmployee.isActive ? 'نشط' : 'معطل'}
                  </span>
                </div>
              </div>
            </div>

            {/* آخر المواعيد */}
            {viewEmployeeData.recentAppointments?.length > 0 && (
              <div className="detail-section">
                <div className="section-header">
                  <h3>آخر المواعيد</h3>
                  <button
                    className="view-all-btn"
                    onClick={() => {
                      handleCloseView();
                      handleViewAppointments(viewEmployee._id);
                    }}
                  >
                    عرض الكل
                  </button>
                </div>
                <div className="recent-appointments">
                  {viewEmployeeData.recentAppointments.slice(0, 5).map(appt => (
                    <div key={appt._id} className="recent-appointment-item">
                      <div className="appointment-info">
                        <span className="customer-name">{appt.customerName}</span>
                        <span className="department-name">{appt.department?.title || '-'}</span>
                      </div>
                      <div className="appointment-meta">
                        <span className="persons-count">{appt.personsCount || 1} شخص</span>
                        <span className={`status-badge ${getStatusBadge(appt.status).class}`}>
                          {getStatusBadge(appt.status).label}
                        </span>
                      </div>
                      <span className="appointment-date">{formatDate(appt.createdAt)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="detail-actions">
              <button
                className="btn btn-primary"
                onClick={() => {
                  handleCloseView();
                  handleViewAppointments(viewEmployee._id);
                }}
              >
                📅 عرض جميع المواعيد
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  handleCloseView();
                  handleEdit(viewEmployee);
                }}
              >
                ✏️ تعديل
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Employees;
