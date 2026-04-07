import { useState, useEffect } from 'react';
import { reportsApi, settingsApi, departmentsApi } from '../../api';
import { Card, Loader } from '../../components/common';
import { formatCurrency, formatDate } from '../../utils';
import {
  generateOverviewReport, generateAppointmentsReport, generateTasksReport,
  generateEmployeePerformanceReport, generateTopCustomersReport, generateProfitLossReport,
  generateDepartmentsReport, generateFinancialReport, generateEmployeesReport, openReportWindow
} from '../../utils/reportPrintGenerator';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import './Reports.css';

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedEmployees, setExpandedEmployees] = useState({});
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [groupBy, setGroupBy] = useState('day');
  const [overviewData, setOverviewData] = useState(null);
  const [appointmentsData, setAppointmentsData] = useState([]);
  const [employeesData, setEmployeesData] = useState([]);
  const [departmentsData, setDepartmentsData] = useState([]);
  const [financialData, setFinancialData] = useState(null);
  const [employeePerformance, setEmployeePerformance] = useState(null);
  const [topCustomers, setTopCustomers] = useState(null);
  const [profitLoss, setProfitLoss] = useState(null);
  const [chartsData, setChartsData] = useState(null);
  const [tasksData, setTasksData] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [period, setPeriod] = useState('daily');
  const [companySettings, setCompanySettings] = useState(null);
  // استثناءات تقرير المواعيد
  const [allDepartments, setAllDepartments] = useState([]);
  const [excludeTypes, setExcludeTypes] = useState([]); // ['confirmed', 'unconfirmed']
  const [excludeDepartments, setExcludeDepartments] = useState([]); // array of department ids
  const [appointmentsDetails, setAppointmentsDetails] = useState([]);
  const [showAppointmentsDetails, setShowAppointmentsDetails] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeTab, dateRange, groupBy, period, selectedEmployee, excludeTypes, excludeDepartments, showAppointmentsDetails]);

  // جلب قائمة الأقسام مرة واحدة (للفلاتر)
  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const res = await departmentsApi.getDepartments({ limit: 200 });
        const list = res?.data?.departments || res?.departments || res?.data || [];
        setAllDepartments(Array.isArray(list) ? list : []);
      } catch (err) {
        console.error('Error loading departments:', err);
      }
    };
    loadDepartments();
  }, []);

  // جلب إعدادات الشركة + أداء الموظفين عند تحميل الصفحة
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [settingsRes, empRes] = await Promise.all([
          settingsApi.getSettings(),
          reportsApi.getEmployeePerformance({ ...dateRange, period: 'daily' })
        ]);
        setCompanySettings(settingsRes.data?.data?.settings || settingsRes.data?.settings || {});
        setEmployeePerformance(empRes.data?.data || {});
      } catch (error) {
        console.error('Error fetching initial data:', error);
      }
    };
    fetchInitialData();
  }, [dateRange]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = { ...dateRange, groupBy };

      switch (activeTab) {
        case 'overview':
          const overviewRes = await reportsApi.getOverviewReport(params);
          setOverviewData(overviewRes.data?.data || {});
          break;
        case 'appointments': {
          const apptParams = {
            ...params,
            excludeTypes: excludeTypes.join(',') || undefined,
            excludeDepartments: excludeDepartments.join(',') || undefined,
            includeDetails: showAppointmentsDetails ? 'true' : undefined
          };
          const [appointmentsRes, empForApptRes] = await Promise.all([
            reportsApi.getAppointmentsReport(apptParams),
            reportsApi.getEmployeesReport(apptParams)
          ]);
          setAppointmentsData(appointmentsRes.data?.data || []);
          setEmployeesData(empForApptRes.data?.data || []);
          setAppointmentsDetails(appointmentsRes.data?.details || []);
          break;
        }
        case 'employees':
          const employeesRes = await reportsApi.getEmployeesReport(params);
          setEmployeesData(employeesRes.data?.data || []);
          break;
        case 'departments':
          const departmentsRes = await reportsApi.getDepartmentsReport(params);
          setDepartmentsData(departmentsRes.data?.data || []);
          break;
        case 'financial':
          const financialRes = await reportsApi.getFinancialReport(params);
          setFinancialData(financialRes.data?.data || {});
          break;
        case 'employee-performance':
          const empParams = { ...params, period, employeeId: selectedEmployee || undefined };
          const empRes = await reportsApi.getEmployeePerformance(empParams);
          setEmployeePerformance(empRes.data?.data || {});
          break;
        case 'top-customers':
          const topCustRes = await reportsApi.getTopCustomers({ ...params, limit: 10 });
          setTopCustomers(topCustRes.data?.data || {});
          break;
        case 'profit-loss':
          const plRes = await reportsApi.getProfitLoss({ ...params, groupBy });
          setProfitLoss(plRes.data?.data || {});
          break;
        case 'charts':
          const chartsRes = await reportsApi.getChartsData(params);
          setChartsData(chartsRes.data?.data || {});
          break;
        case 'tasks':
          const tasksRes = await reportsApi.getTasksReport(params);
          setTasksData(tasksRes.data?.data || {});
          break;
      }
    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({ ...prev, [name]: value }));
  };

  const handleQuickRange = (range) => {
    const today = new Date();
    let startDate, endDate = today.toISOString().split('T')[0];

    switch (range) {
      case 'today':
        startDate = endDate;
        break;
      case 'week':
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        startDate = weekAgo.toISOString().split('T')[0];
        break;
      case 'month':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
        break;
      case 'year':
        startDate = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
        break;
      default:
        return;
    }

    setDateRange({ startDate, endDate });
  };

  // عرض / طباعة التقرير
  const handleReportAction = (autoPrint = false) => {
    const titleMap = {
      'overview': 'تقرير نظرة عامة',
      'appointments': 'تقرير المواعيد',
      'tasks': 'تقرير المهام',
      'employee-performance': 'تقرير أداء الموظفين',
      'top-customers': 'تقرير أفضل العملاء',
      'profit-loss': 'تقرير الأرباح والخسائر',
      'departments': 'تقرير الأقسام',
      'financial': 'التقرير المالي',
      'employees': 'تقرير الموظفين'
    };

    let content = '';
    switch (activeTab) {
      case 'overview':
        content = generateOverviewReport(overviewData || {}, companySettings, dateRange);
        break;
      case 'appointments':
        content = generateAppointmentsReport(
          appointmentsData,
          companySettings,
          dateRange,
          employeesData,
          showAppointmentsDetails ? appointmentsDetails : null
        );
        break;
      case 'tasks':
        content = generateTasksReport(tasksData, companySettings, dateRange);
        break;
      case 'employee-performance':
        content = generateEmployeePerformanceReport(employeePerformance, companySettings, dateRange);
        break;
      case 'top-customers':
        content = generateTopCustomersReport(topCustomers, companySettings, dateRange);
        break;
      case 'profit-loss':
        content = generateProfitLossReport(profitLoss, companySettings, dateRange);
        break;
      case 'departments':
        content = generateDepartmentsReport(departmentsData, companySettings, dateRange);
        break;
      case 'financial':
        content = generateFinancialReport(financialData, companySettings, dateRange);
        break;
      case 'employees':
        content = generateEmployeesReport(employeesData, companySettings, dateRange);
        break;
      default:
        return;
    }

    if (content) {
      openReportWindow(content, titleMap[activeTab] || 'تقرير', autoPrint);
    }
  };

  const tabs = [
    { id: 'overview', label: 'نظرة عامة', icon: '📊' },
    { id: 'charts', label: 'الرسوم البيانية', icon: '📈' },
    { id: 'appointments', label: 'المواعيد', icon: '📅' },
    { id: 'tasks', label: 'المهام', icon: '✅' },
    { id: 'employee-performance', label: 'أداء الموظفين', icon: '👥' },
    { id: 'top-customers', label: 'أفضل العملاء', icon: '⭐' },
    { id: 'profit-loss', label: 'الأرباح والخسائر', icon: '💹' },
    { id: 'departments', label: 'الأقسام', icon: '🏢' },
    { id: 'financial', label: 'المالية', icon: '💰' }
  ];

  // ألوان الرسوم البيانية
  const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  const getPaymentLabel = (type) => {
    const labels = {
      cash: 'نقدي',
      card: 'شبكة',
      transfer: 'تحويل'
    };
    return labels[type] || type;
  };

  const renderOverviewTab = () => {
    if (!overviewData) return null;

    return (
      <div className="overview-content">
        {/* التقديمات الإلكترونية */}
        {overviewData.electronic && (overviewData.electronic.processing > 0 || overviewData.electronic.overdue > 0 || overviewData.electronic.acceptedMonth > 0) && (
          <Card className="electronic-overview-card">
            <h3>📤 التقديمات الإلكترونية</h3>
            <div className="electronic-overview-grid">
              <div className="electronic-overview-item">
                <span className="electronic-overview-value">{overviewData.electronic.processing || 0}</span>
                <span className="electronic-overview-label">قيد المعالجة</span>
              </div>
              <div className={`electronic-overview-item ${overviewData.electronic.overdue > 0 ? 'overdue-warning' : ''}`}>
                <span className="electronic-overview-value">{overviewData.electronic.overdue || 0}</span>
                <span className="electronic-overview-label">متأخرة ⚠️</span>
              </div>
              <div className="electronic-overview-item accepted">
                <span className="electronic-overview-value">{overviewData.electronic.acceptedMonth || 0}</span>
                <span className="electronic-overview-label">مقبولة هذا الشهر</span>
              </div>
            </div>
          </Card>
        )}

        {/* ملخص المواعيد - التوزيع */}
        <Card className="appointment-summary-card">
          <h3>ملخص المواعيد</h3>
          <div className="appointment-type-bars">
            {(() => {
              const total = overviewData.totalAppointments || 1;
              const inPerson = (overviewData.confirmedCount || 0) - (overviewData.electronic?.total || 0);
              const electronic = overviewData.electronic?.total || 0;
              const unconfirmed = overviewData.unconfirmedCount || 0;
              return (
                <>
                  <div className="type-bar-row">
                    <span className="type-bar-label">🏢 حضوري</span>
                    <div className="type-bar-track">
                      <div className="type-bar-fill in-person" style={{ width: `${Math.max((inPerson / total) * 100, 0)}%` }}></div>
                    </div>
                    <span className="type-bar-count">{Math.max(inPerson, 0)}</span>
                  </div>
                  <div className="type-bar-row">
                    <span className="type-bar-label">📤 إلكتروني</span>
                    <div className="type-bar-track">
                      <div className="type-bar-fill electronic" style={{ width: `${(electronic / total) * 100}%` }}></div>
                    </div>
                    <span className="type-bar-count">{electronic}</span>
                  </div>
                  <div className="type-bar-row">
                    <span className="type-bar-label">◌ غير مؤكد</span>
                    <div className="type-bar-track">
                      <div className="type-bar-fill unconfirmed" style={{ width: `${(unconfirmed / total) * 100}%` }}></div>
                    </div>
                    <span className="type-bar-count">{unconfirmed}</span>
                  </div>
                </>
              );
            })()}
          </div>
        </Card>

        {/* توزيع الحالات */}
        <div className="overview-charts">
          <Card className="chart-card">
            <h3>توزيع أنواع المواعيد</h3>
            <div className="chart-content">
              <div className="donut-chart">
                <div className="donut-segment confirmed" style={{
                  '--percentage': `${(overviewData.confirmedCount / (overviewData.totalAppointments || 1)) * 100}%`
                }}></div>
              </div>
              <div className="chart-legend">
                <div className="legend-item">
                  <span className="legend-color confirmed"></span>
                  <span className="legend-label">مؤكد</span>
                  <span className="legend-value">{overviewData.confirmedCount || 0}</span>
                </div>
                <div className="legend-item">
                  <span className="legend-color unconfirmed"></span>
                  <span className="legend-label">غير مؤكد</span>
                  <span className="legend-value">{overviewData.unconfirmedCount || 0}</span>
                </div>
              </div>
            </div>
          </Card>

          <Card className="chart-card">
            <h3>توزيع حالات المواعيد</h3>
            <div className="chart-content">
              <div className="status-bars">
                <div className="status-bar">
                  <span className="status-label">مكتمل</span>
                  <div className="bar-container">
                    <div
                      className="bar completed"
                      style={{ width: `${(overviewData.completedCount / (overviewData.totalAppointments || 1)) * 100}%` }}
                    ></div>
                  </div>
                  <span className="status-count">{overviewData.completedCount || 0}</span>
                </div>
                <div className="status-bar">
                  <span className="status-label">ملغي</span>
                  <div className="bar-container">
                    <div
                      className="bar cancelled"
                      style={{ width: `${(overviewData.cancelledCount / (overviewData.totalAppointments || 1)) * 100}%` }}
                    ></div>
                  </div>
                  <span className="status-count">{overviewData.cancelledCount || 0}</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  };

  const toggleExcludeType = (type) => {
    setExcludeTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
  };
  const toggleExcludeDepartment = (id) => {
    setExcludeDepartments(prev => prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]);
  };

  const renderAppointmentsTab = () => {
    const maxCount = Math.max(...appointmentsData.map(d => d.count), 1);
    const typeLabels = { confirmed: 'مؤكد', unconfirmed: 'غير مؤكد' };
    const statusLabels = { new: 'جديد', in_progress: 'قيد التنفيذ', completed: 'مكتمل', cancelled: 'ملغي' };

    return (
      <div className="appointments-report">
        {/* فلاتر الاستثناء + خيار التفاصيل */}
        <Card className="filters-card">
          <div className="filters-row" style={{ flexWrap: 'wrap', gap: '16px' }}>
            <div className="filter-group">
              <label>استثناء الأنواع:</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {[
                  { value: 'confirmed', label: 'مؤكد' },
                  { value: 'unconfirmed', label: 'غير مؤكد' }
                ].map(t => (
                  <label key={t.value} style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={excludeTypes.includes(t.value)}
                      onChange={() => toggleExcludeType(t.value)}
                    />
                    {t.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="filter-group" style={{ flex: 1, minWidth: '250px' }}>
              <label>استثناء الأقسام:</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', maxHeight: '80px', overflowY: 'auto' }}>
                {allDepartments.length === 0 && <span style={{ color: '#999' }}>لا توجد أقسام</span>}
                {allDepartments.map(dep => (
                  <label key={dep._id} style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '12px' }}>
                    <input
                      type="checkbox"
                      checked={excludeDepartments.includes(dep._id)}
                      onChange={() => toggleExcludeDepartment(dep._id)}
                    />
                    {dep.title}
                  </label>
                ))}
              </div>
            </div>

            <div className="filter-group">
              <label>
                <input
                  type="checkbox"
                  checked={showAppointmentsDetails}
                  onChange={(e) => setShowAppointmentsDetails(e.target.checked)}
                  style={{ marginLeft: '6px' }}
                />
                عرض تفاصيل العملاء
              </label>
            </div>

            {(excludeTypes.length > 0 || excludeDepartments.length > 0) && (
              <button
                className="quick-btn"
                onClick={() => { setExcludeTypes([]); setExcludeDepartments([]); }}
              >
                مسح الاستثناءات
              </button>
            )}
          </div>
        </Card>

        <Card className="chart-card">
          <div className="chart-header">
            <h3>المواعيد حسب الفترة</h3>
            <select value={groupBy} onChange={(e) => setGroupBy(e.target.value)} className="group-select">
              <option value="day">يومي</option>
              <option value="week">أسبوعي</option>
              <option value="month">شهري</option>
            </select>
          </div>
          <div className="bar-chart">
            {appointmentsData.map((item, index) => (
              <div key={index} className="bar-item">
                <div className="bar-label">{item._id}</div>
                <div className="bar-wrapper">
                  <div
                    className="bar-fill"
                    style={{ width: `${(item.count / maxCount) * 100}%` }}
                  >
                    <span className="bar-value">{item.count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="table-card">
          <h3>تفاصيل المواعيد</h3>
          <table className="report-table">
            <thead>
              <tr>
                <th>الفترة</th>
                <th>المواعيد</th>
                <th>الأشخاص</th>
                <th>المبلغ</th>
                <th>المدفوع</th>
              </tr>
            </thead>
            <tbody>
              {appointmentsData.map((item, index) => (
                <tr key={index}>
                  <td>{item._id}</td>
                  <td>{item.count}</td>
                  <td>{item.persons}</td>
                  <td>{formatCurrency(item.amount)}</td>
                  <td>{formatCurrency(item.paid)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        {/* جدول الموظفين - عدد الأشخاص المضافين */}
        {employeesData && employeesData.length > 0 && (
          <Card className="table-card">
            <h3>👥 الموظفين - عدد الأشخاص المضافين</h3>
            <table className="report-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>الموظف</th>
                  <th>المواعيد</th>
                  <th>الأشخاص</th>
                  <th>المبلغ</th>
                  <th>نسبة الإنجاز</th>
                </tr>
              </thead>
              <tbody>
                {employeesData.map((emp, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td><strong>{emp.employeeName}</strong></td>
                    <td>{emp.totalAppointments}</td>
                    <td>{emp.totalPersons}</td>
                    <td>{formatCurrency(emp.totalAmount)}</td>
                    <td>
                      <span className={`badge ${emp.completionRate >= 70 ? 'badge-success' : emp.completionRate >= 40 ? 'badge-warning' : 'badge-danger'}`}>
                        {emp.completionRate?.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
                <tr className="total-row-table">
                  <td></td>
                  <td><strong>الإجمالي</strong></td>
                  <td><strong>{employeesData.reduce((s, e) => s + (e.totalAppointments || 0), 0)}</strong></td>
                  <td><strong>{employeesData.reduce((s, e) => s + (e.totalPersons || 0), 0)}</strong></td>
                  <td><strong>{formatCurrency(employeesData.reduce((s, e) => s + (e.totalAmount || 0), 0))}</strong></td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </Card>
        )}

        {/* تفاصيل العملاء */}
        {showAppointmentsDetails && (
          <Card className="table-card">
            <h3>📋 تفاصيل العملاء ({appointmentsDetails.length})</h3>
            {appointmentsDetails.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#999', padding: '20px' }}>لا توجد بيانات</p>
            ) : (
              <div className="table-scroll" style={{ maxHeight: '500px' }}>
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>اسم العميل</th>
                      <th>الهاتف</th>
                      <th>القسم</th>
                      <th>عدد الأشخاص</th>
                      <th>النوع</th>
                      <th>الحالة</th>
                      <th>التاريخ</th>
                      <th>المبلغ</th>
                      <th>المدفوع</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointmentsDetails.map((appt, idx) => (
                      <tr key={appt.appointmentId || idx}>
                        <td>{idx + 1}</td>
                        <td><strong>{appt.customerName || '-'}</strong></td>
                        <td>{appt.phone || '-'}</td>
                        <td>{appt.departmentName || '-'}</td>
                        <td>
                          <span className="badge badge-info">{appt.personsCount || 0}</span>
                        </td>
                        <td>{typeLabels[appt.type] || appt.type}</td>
                        <td>
                          <span className={`badge ${
                            appt.status === 'completed' ? 'badge-success' :
                            appt.status === 'cancelled' ? 'badge-danger' :
                            'badge-warning'
                          }`}>
                            {statusLabels[appt.status] || appt.status}
                          </span>
                        </td>
                        <td>{appt.appointmentDate ? formatDate(appt.appointmentDate) : '-'}</td>
                        <td>{formatCurrency(appt.totalAmount || 0)}</td>
                        <td className="text-success">{formatCurrency(appt.paidAmount || 0)}</td>
                      </tr>
                    ))}
                    <tr className="total-row-table">
                      <td colSpan="4"><strong>الإجمالي</strong></td>
                      <td>
                        <strong>{appointmentsDetails.reduce((s, a) => s + (a.personsCount || 0), 0)}</strong>
                      </td>
                      <td colSpan="3"></td>
                      <td><strong>{formatCurrency(appointmentsDetails.reduce((s, a) => s + (a.totalAmount || 0), 0))}</strong></td>
                      <td className="text-success">
                        <strong>{formatCurrency(appointmentsDetails.reduce((s, a) => s + (a.paidAmount || 0), 0))}</strong>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}
      </div>
    );
  };

  const renderEmployeesTab = () => {
    return (
      <div className="employees-report">
        <Card className="table-card">
          <h3>تقرير أداء الموظفين</h3>
          <table className="report-table">
            <thead>
              <tr>
                <th>الموظف</th>
                <th>المواعيد</th>
                <th>الأشخاص</th>
                <th>المبلغ</th>
                <th>مكتمل</th>
                <th>ملغي</th>
                <th>نسبة الإنجاز</th>
              </tr>
            </thead>
            <tbody>
              {employeesData.map((item, index) => (
                <tr key={index}>
                  <td>
                    <div className="employee-cell">
                      <span className="employee-name">{item.employeeName}</span>
                      {item.employeeEmail && (
                        <span className="employee-email">{item.employeeEmail}</span>
                      )}
                    </div>
                  </td>
                  <td>{item.totalAppointments}</td>
                  <td>{item.totalPersons}</td>
                  <td>{formatCurrency(item.totalAmount)}</td>
                  <td>
                    <span className="badge badge-success">{item.completedCount}</span>
                  </td>
                  <td>
                    <span className="badge badge-danger">{item.cancelledCount}</span>
                  </td>
                  <td>
                    <div className="progress-cell">
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{ width: `${item.completionRate}%` }}
                        ></div>
                      </div>
                      <span className="progress-value">{item.completionRate?.toFixed(1)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    );
  };

  const renderDepartmentsTab = () => {
    return (
      <div className="departments-report">
        <Card className="table-card">
          <h3>تقرير الأقسام</h3>
          <table className="report-table">
            <thead>
              <tr>
                <th>القسم</th>
                <th>المواعيد</th>
                <th>الأشخاص</th>
                <th>المبلغ</th>
                <th>مؤكد</th>
                <th>غير مؤكد</th>
              </tr>
            </thead>
            <tbody>
              {departmentsData.map((item, index) => (
                <tr key={index}>
                  <td>{item.departmentName}</td>
                  <td>{item.totalAppointments}</td>
                  <td>{item.totalPersons}</td>
                  <td>{formatCurrency(item.totalAmount)}</td>
                  <td>
                    <span className="badge badge-primary">{item.confirmedCount}</span>
                  </td>
                  <td>
                    <span className="badge badge-warning">{item.unconfirmedCount}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    );
  };

  const renderFinancialTab = () => {
    if (!financialData) return null;

    return (
      <div className="financial-report">
        {/* ملخص المالية */}
        <div className="stats-grid stats-grid-3">
          <Card className="stat-card stat-money">
            <div className="stat-icon">💵</div>
            <div className="stat-info">
              <span className="stat-value">{formatCurrency(financialData.totals?.totalAmount || 0)}</span>
              <span className="stat-label">إجمالي المبالغ</span>
            </div>
          </Card>
          <Card className="stat-card stat-paid">
            <div className="stat-icon">✅</div>
            <div className="stat-info">
              <span className="stat-value">{formatCurrency(financialData.totals?.paidAmount || 0)}</span>
              <span className="stat-label">المدفوع</span>
            </div>
          </Card>
          <Card className="stat-card stat-remaining">
            <div className="stat-icon">⏳</div>
            <div className="stat-info">
              <span className="stat-value">{formatCurrency(financialData.totals?.remainingAmount || 0)}</span>
              <span className="stat-label">المتبقي</span>
            </div>
          </Card>
        </div>

        {/* طرق الدفع */}
        <Card className="chart-card">
          <h3>توزيع طرق الدفع</h3>
          <div className="payment-methods">
            {financialData.paymentMethods?.map((method, index) => (
              <div key={index} className="payment-method-item">
                <span className="method-label">{getPaymentLabel(method._id)}</span>
                <span className="method-count">{method.count} معاملة</span>
                <span className="method-amount">{formatCurrency(method.amount)}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* التفاصيل اليومية */}
        <Card className="table-card">
          <div className="chart-header">
            <h3>التفاصيل المالية</h3>
            <select value={groupBy} onChange={(e) => setGroupBy(e.target.value)} className="group-select">
              <option value="day">يومي</option>
              <option value="week">أسبوعي</option>
              <option value="month">شهري</option>
            </select>
          </div>
          <table className="report-table">
            <thead>
              <tr>
                <th>الفترة</th>
                <th>المعاملات</th>
                <th>المبلغ</th>
                <th>المدفوع</th>
                <th>المتبقي</th>
              </tr>
            </thead>
            <tbody>
              {financialData.daily?.map((item, index) => (
                <tr key={index}>
                  <td>{item._id}</td>
                  <td>{item.appointmentsCount}</td>
                  <td>{formatCurrency(item.totalAmount)}</td>
                  <td className="text-success">{formatCurrency(item.paidAmount)}</td>
                  <td className={item.remainingAmount > 0 ? 'text-warning' : ''}>
                    {formatCurrency(item.remainingAmount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    );
  };

  // تبويب الرسوم البيانية التفاعلية
  const renderChartsTab = () => {
    if (!chartsData) return null;

    const statusLabels = {
      pending: 'قيد الانتظار',
      confirmed: 'مؤكد',
      completed: 'مكتمل',
      cancelled: 'ملغي'
    };

    const typeLabels = {
      confirmed: 'مؤكد',
      unconfirmed: 'غير مؤكد'
    };

    return (
      <div className="charts-report">
        {/* رسم المواعيد اليومية */}
        <Card className="chart-card chart-large">
          <h3>المواعيد والإيرادات اليومية</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartsData.appointmentsChart}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip
                formatter={(value, name) => {
                  if (name === 'amount') return [formatCurrency(value), 'الإيرادات'];
                  if (name === 'count') return [value, 'المواعيد'];
                  if (name === 'persons') return [value, 'الأشخاص'];
                  return [value, name];
                }}
              />
              <Legend />
              <Area yAxisId="left" type="monotone" dataKey="persons" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.3} name="الأشخاص" />
              <Area yAxisId="right" type="monotone" dataKey="amount" stroke="#10b981" fill="#10b981" fillOpacity={0.3} name="الإيرادات" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <div className="charts-row">
          {/* توزيع حالات المواعيد */}
          <Card className="chart-card">
            <h3>توزيع حالات المواعيد</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={chartsData.statusDistribution?.map(s => ({
                    ...s,
                    name: statusLabels[s._id] || s._id
                  }))}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {chartsData.statusDistribution?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>

          {/* توزيع أنواع المواعيد */}
          <Card className="chart-card">
            <h3>توزيع أنواع المواعيد</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={chartsData.typeDistribution?.map(t => ({
                    ...t,
                    name: typeLabels[t._id] || t._id
                  }))}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {chartsData.typeDistribution?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* الإيرادات الشهرية */}
        <Card className="chart-card chart-large">
          <h3>الإيرادات الشهرية</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartsData.monthlyRevenue}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="revenue" fill="#4f46e5" name="الإيرادات" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* أداء الموظفين */}
        <Card className="chart-card chart-large">
          <h3>أداء الموظفين - عدد الأشخاص</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartsData.employeePerformance} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={100} />
              <Tooltip />
              <Legend />
              <Bar dataKey="persons" fill="#10b981" name="الأشخاص" radius={[0, 4, 4, 0]} />
              <Bar dataKey="appointments" fill="#f59e0b" name="المواعيد" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    );
  };

  // تبويب أداء الموظفين التفصيلي
  const renderEmployeePerformanceTab = () => {
    if (!employeePerformance) return null;

    // حساب ملخص الأداء
    const summary = employeePerformance.summary || [];
    const topEmployee = summary.length > 0
      ? summary.reduce((best, emp) =>
          (emp.totals.completedAppointments > (best?.totals?.completedAppointments || 0)) ? emp : best,
          summary[0]
        )
      : null;

    const totalAppointments = summary.reduce((sum, emp) => sum + (emp.totals?.appointments || 0), 0);
    const totalPersons = summary.reduce((sum, emp) => sum + (emp.totals?.persons || 0), 0);
    const totalCompleted = summary.reduce((sum, emp) => sum + (emp.totals?.completedAppointments || 0), 0);
    const totalCompletedPersons = summary.reduce((sum, emp) => sum + (emp.totals?.completedPersons || 0), 0);
    const avgCompletionRate = totalPersons > 0 ? Math.round((totalCompletedPersons / totalPersons) * 100) : 0;

    return (
      <div className="employee-performance-report">
        {/* فلاتر */}
        <Card className="filters-card">
          <div className="filters-row">
            <div className="filter-group">
              <label>الفترة:</label>
              <select value={period} onChange={(e) => setPeriod(e.target.value)}>
                <option value="daily">يومي</option>
                <option value="monthly">شهري</option>
                <option value="yearly">سنوي</option>
              </select>
            </div>
            <div className="filter-group">
              <label>الموظف:</label>
              <select value={selectedEmployee} onChange={(e) => setSelectedEmployee(e.target.value)}>
                <option value="">جميع الموظفين</option>
                {employeePerformance.summary?.map(emp => (
                  <option key={emp.employeeId} value={emp.employeeId}>{emp.employeeName}</option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* جدول ملخص أداء الموظفين */}
        <Card className="table-card">
          <h3>👥 ملخص أداء الموظفين</h3>
          <table className="report-table">
            <thead>
              <tr>
                <th>الموظف</th>
                <th>المواعيد</th>
                <th>الأشخاص</th>
                <th>المكتملة</th>
                <th>أشخاص مكتملة</th>
                <th>نسبة الإنجاز</th>
              </tr>
            </thead>
            <tbody>
              {summary.map((emp, index) => {
                const persons = emp.totals?.persons || 0;
                const completedPersons = emp.totals?.completedPersons || 0;
                const rate = persons > 0 ? Math.round((completedPersons / persons) * 100) : 0;
                return (
                  <tr key={index}>
                    <td><strong>{emp.employeeName}</strong></td>
                    <td>{emp.totals?.appointments || 0}</td>
                    <td>{persons}</td>
                    <td>{emp.totals?.completedAppointments || 0}</td>
                    <td>{completedPersons}</td>
                    <td>
                      <span className={`badge ${rate >= 70 ? 'badge-success' : rate >= 40 ? 'badge-warning' : 'badge-danger'}`}>
                        {rate}%
                      </span>
                    </td>
                  </tr>
                );
              })}
              {summary.length > 0 && (
                <tr className="total-row-table">
                  <td><strong>الإجمالي</strong></td>
                  <td><strong>{totalAppointments}</strong></td>
                  <td><strong>{totalPersons}</strong></td>
                  <td><strong>{totalCompleted}</strong></td>
                  <td><strong>{totalCompletedPersons}</strong></td>
                  <td>
                    <strong>
                      <span className={`badge ${avgCompletionRate >= 70 ? 'badge-success' : avgCompletionRate >= 40 ? 'badge-warning' : 'badge-danger'}`}>
                        {avgCompletionRate}%
                      </span>
                    </strong>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>

        {/* التقرير الشهري - الأشخاص المضافين حسب الموظف */}
        {period === 'monthly' && summary.length > 0 && (() => {
          // تجميع الأشهر الفريدة من جميع الموظفين
          const allMonths = new Set();
          summary.forEach(emp => {
            (emp.breakdown?.appointments || []).forEach(item => {
              if (item.period) allMonths.add(item.period);
            });
          });
          const months = Array.from(allMonths).sort();
          const monthNames = {
            '01': 'يناير', '02': 'فبراير', '03': 'مارس', '04': 'أبريل',
            '05': 'مايو', '06': 'يونيو', '07': 'يوليو', '08': 'أغسطس',
            '09': 'سبتمبر', '10': 'أكتوبر', '11': 'نوفمبر', '12': 'ديسمبر'
          };
          const getMonthLabel = (m) => {
            const parts = m.split('-');
            return monthNames[parts[1]] || m;
          };

          if (months.length === 0) return null;

          return (
            <Card className="table-card">
              <h3>📅 التقرير الشهري - الأشخاص المضافين</h3>
              <div className="table-scroll">
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>الموظف</th>
                      {months.map(m => (
                        <th key={m}>{getMonthLabel(m)}</th>
                      ))}
                      <th>الإجمالي</th>
                      <th>نسبة الإنجاز</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.map((emp, index) => {
                      const empPersons = emp.totals?.persons || 0;
                      const empCompletedPersons = emp.totals?.completedPersons || 0;
                      const empRate = empPersons > 0 ? Math.round((empCompletedPersons / empPersons) * 100) : 0;

                      return (
                        <tr key={index}>
                          <td><strong>{emp.employeeName}</strong></td>
                          {months.map(m => {
                            const monthData = (emp.breakdown?.appointments || []).find(a => a.period === m);
                            return <td key={m}>{monthData?.totalPersons || 0}</td>;
                          })}
                          <td><strong>{empPersons}</strong></td>
                          <td>
                            <span className={`badge ${empRate >= 70 ? 'badge-success' : empRate >= 40 ? 'badge-warning' : 'badge-danger'}`}>
                              {empRate}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="total-row-table">
                      <td><strong>الإجمالي</strong></td>
                      {months.map(m => {
                        const monthTotal = summary.reduce((sum, emp) => {
                          const monthData = (emp.breakdown?.appointments || []).find(a => a.period === m);
                          return sum + (monthData?.totalPersons || 0);
                        }, 0);
                        return <td key={m}><strong>{monthTotal}</strong></td>;
                      })}
                      <td><strong>{totalPersons}</strong></td>
                      <td>
                        <strong>
                          <span className={`badge ${avgCompletionRate >= 70 ? 'badge-success' : avgCompletionRate >= 40 ? 'badge-warning' : 'badge-danger'}`}>
                            {avgCompletionRate}%
                          </span>
                        </strong>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>
          );
        })()}

        {/* ملخص الموظفين */}
        {employeePerformance.summary?.map((emp, index) => (
          <Card key={index} className="employee-card">
            <div className="employee-header">
              <div className="employee-info">
                <h3>{emp.employeeName}</h3>
                <span className="employee-email">{emp.employeeEmail}</span>
                <span className={`role-badge ${emp.employeeRole}`}>
                  {emp.employeeRole === 'admin' ? 'مدير' : 'موظف'}
                </span>
              </div>
            </div>

            {/* إحصائيات الموظف */}
            <div className="employee-stats">
              <div className="stat-item">
                <span className="stat-icon">📅</span>
                <div className="stat-details">
                  <span className="stat-value">{emp.totals.appointments}</span>
                  <span className="stat-label">المواعيد</span>
                </div>
              </div>
              <div className="stat-item">
                <span className="stat-icon">👥</span>
                <div className="stat-details">
                  <span className="stat-value">{emp.totals.persons}</span>
                  <span className="stat-label">الأشخاص</span>
                </div>
              </div>
              <div className="stat-item">
                <span className="stat-icon">👤</span>
                <div className="stat-details">
                  <span className="stat-value">{emp.totals.customers}</span>
                  <span className="stat-label">عملاء مضافين</span>
                </div>
              </div>
              <div className="stat-item">
                <span className="stat-icon">📄</span>
                <div className="stat-details">
                  <span className="stat-value">{emp.totals.invoices}</span>
                  <span className="stat-label">الفواتير</span>
                </div>
              </div>
              <div className="stat-item">
                <span className="stat-icon">💰</span>
                <div className="stat-details">
                  <span className="stat-value">{formatCurrency(emp.totals.appointmentAmount)}</span>
                  <span className="stat-label">إيرادات المواعيد</span>
                </div>
              </div>
              <div className="stat-item">
                <span className="stat-icon">✅</span>
                <div className="stat-details">
                  <span className="stat-value">{emp.totals.completedAppointments}</span>
                  <span className="stat-label">مكتمل</span>
                </div>
              </div>
              <div className="stat-item">
                <span className="stat-icon">❌</span>
                <div className="stat-details">
                  <span className="stat-value">{emp.totals.cancelledAppointments}</span>
                  <span className="stat-label">ملغي</span>
                </div>
              </div>
            </div>

            {/* تفاصيل حسب الفترة */}
            {emp.breakdown.appointments?.length > 0 && (
              <div className="breakdown-section">
                <h4>تفاصيل المواعيد حسب الفترة</h4>
                <table className="report-table compact">
                  <thead>
                    <tr>
                      <th>الفترة</th>
                      <th>المواعيد</th>
                      <th>الأشخاص</th>
                      <th>المبلغ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {emp.breakdown.appointments.slice(0, 10).map((item, idx) => (
                      <tr key={idx}>
                        <td>{item.period}</td>
                        <td>{item.totalAppointments}</td>
                        <td>{item.totalPersons}</td>
                        <td>{formatCurrency(item.totalAmount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* العملاء المضافين */}
            {emp.breakdown.customers?.length > 0 && (
              <div className="breakdown-section">
                <h4>العملاء المضافين حسب الفترة</h4>
                <table className="report-table compact">
                  <thead>
                    <tr>
                      <th>الفترة</th>
                      <th>عدد العملاء</th>
                    </tr>
                  </thead>
                  <tbody>
                    {emp.breakdown.customers.slice(0, 10).map((item, idx) => (
                      <tr key={idx}>
                        <td>{item.period}</td>
                        <td>{item.totalCustomers}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* تفاصيل المواعيد - قائمة العملاء الكاملة */}
            {emp.appointmentsDetails?.length > 0 && (() => {
              const empKey = emp.employeeId?.toString() || emp.employeeEmail || emp.employeeName;
              const isExpanded = !!expandedEmployees[empKey];
              const details = emp.appointmentsDetails;
              const totalPersons = details.reduce((s, a) => s + (a.personsCount || 0), 0);
              const totalAmount = details.reduce((s, a) => s + (a.totalAmount || 0), 0);
              const totalPaid = details.reduce((s, a) => s + (a.paidAmount || 0), 0);
              const statusLabels = {
                new: 'جديد',
                in_progress: 'قيد التنفيذ',
                completed: 'مكتمل',
                cancelled: 'ملغي'
              };
              const typeLabels = {
                confirmed: 'مؤكد',
                unconfirmed: 'غير مؤكد'
              };
              return (
                <div className="breakdown-section">
                  <div
                    className="breakdown-toggle"
                    onClick={() => setExpandedEmployees(prev => ({ ...prev, [empKey]: !isExpanded }))}
                    style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}
                  >
                    <h4 style={{ margin: 0 }}>
                      {isExpanded ? '▼' : '◀'} تفاصيل المواعيد والعملاء ({details.length})
                    </h4>
                  </div>
                  {isExpanded && (
                    <div className="table-scroll" style={{ maxHeight: '500px' }}>
                      <table className="report-table compact">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>اسم العميل</th>
                            <th>الهاتف</th>
                            <th>القسم</th>
                            <th>الأشخاص</th>
                            <th>النوع</th>
                            <th>الحالة</th>
                            <th>التاريخ</th>
                            <th>المبلغ</th>
                            <th>المدفوع</th>
                          </tr>
                        </thead>
                        <tbody>
                          {details.map((appt, idx) => (
                            <tr key={appt.appointmentId || idx}>
                              <td>{idx + 1}</td>
                              <td><strong>{appt.customerName || '-'}</strong></td>
                              <td>{appt.phone || '-'}</td>
                              <td>{appt.departmentName || '-'}</td>
                              <td>
                                <span className="badge badge-info">{appt.personsCount || 0}</span>
                              </td>
                              <td>{typeLabels[appt.type] || appt.type}</td>
                              <td>
                                <span className={`badge ${
                                  appt.status === 'completed' ? 'badge-success' :
                                  appt.status === 'cancelled' ? 'badge-danger' :
                                  'badge-warning'
                                }`}>
                                  {statusLabels[appt.status] || appt.status}
                                </span>
                              </td>
                              <td>{appt.appointmentDate ? formatDate(appt.appointmentDate) : '-'}</td>
                              <td>{formatCurrency(appt.totalAmount || 0)}</td>
                              <td className="text-success">{formatCurrency(appt.paidAmount || 0)}</td>
                            </tr>
                          ))}
                          <tr className="total-row-table">
                            <td colSpan="4"><strong>الإجمالي</strong></td>
                            <td><strong>{totalPersons}</strong></td>
                            <td colSpan="3"></td>
                            <td><strong>{formatCurrency(totalAmount)}</strong></td>
                            <td className="text-success"><strong>{formatCurrency(totalPaid)}</strong></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })()}
          </Card>
        ))}
      </div>
    );
  };

  // تبويب أفضل العملاء
  const renderTopCustomersTab = () => {
    if (!topCustomers) return null;

    return (
      <div className="top-customers-report">
        {/* أفضل العملاء من المواعيد */}
        <Card className="table-card">
          <h3>⭐ أفضل 10 عملاء - المواعيد</h3>
          <table className="report-table">
            <thead>
              <tr>
                <th>#</th>
                <th>العميل</th>
                <th>الهاتف</th>
                <th>المواعيد</th>
                <th>الأشخاص</th>
                <th>المدفوع</th>
                <th>المتبقي</th>
              </tr>
            </thead>
            <tbody>
              {topCustomers.byAppointments?.map((customer, index) => (
                <tr key={index}>
                  <td>
                    <span className={`rank-badge rank-${index + 1}`}>{index + 1}</span>
                  </td>
                  <td>{customer.customerName}</td>
                  <td>{customer.customerPhone || '-'}</td>
                  <td>{customer.totalAppointments}</td>
                  <td>{customer.totalPersons}</td>
                  <td className="text-success">{formatCurrency(customer.paidAmount)}</td>
                  <td className={customer.remainingAmount > 0 ? 'text-warning' : ''}>
                    {formatCurrency(customer.remainingAmount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        {/* أفضل العملاء من الفواتير */}
        {topCustomers.byInvoices?.length > 0 && (
          <Card className="table-card">
            <h3>⭐ أفضل 10 عملاء - الفواتير</h3>
            <table className="report-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>العميل</th>
                  <th>الهاتف</th>
                  <th>الفواتير</th>
                  <th>المبلغ</th>
                  <th>المدفوع</th>
                </tr>
              </thead>
              <tbody>
                {topCustomers.byInvoices?.map((customer, index) => (
                  <tr key={index}>
                    <td>
                      <span className={`rank-badge rank-${index + 1}`}>{index + 1}</span>
                    </td>
                    <td>{customer.customerName}</td>
                    <td>{customer.customerPhone || '-'}</td>
                    <td>{customer.totalInvoices}</td>
                    <td>{formatCurrency(customer.totalAmount)}</td>
                    <td className="text-success">{formatCurrency(customer.paidAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>
    );
  };

  // تبويب الأرباح والخسائر
  const renderProfitLossTab = () => {
    if (!profitLoss) return null;

    return (
      <div className="profit-loss-report">
        {/* ملخص الأرباح */}
        <div className="stats-grid stats-grid-4">
          <Card className="stat-card stat-income">
            <div className="stat-icon">💵</div>
            <div className="stat-info">
              <span className="stat-value">{formatCurrency(profitLoss.totals?.totalIncome || 0)}</span>
              <span className="stat-label">إجمالي الدخل</span>
            </div>
          </Card>
          <Card className="stat-card stat-expense">
            <div className="stat-icon">📤</div>
            <div className="stat-info">
              <span className="stat-value">{formatCurrency(profitLoss.totals?.expense || 0)}</span>
              <span className="stat-label">المصروفات</span>
            </div>
          </Card>
          <Card className="stat-card stat-profit">
            <div className="stat-icon">📈</div>
            <div className="stat-info">
              <span className="stat-value">{formatCurrency(profitLoss.totals?.profit || 0)}</span>
              <span className="stat-label">صافي الربح</span>
            </div>
          </Card>
          <Card className="stat-card stat-margin">
            <div className="stat-icon">%</div>
            <div className="stat-info">
              <span className="stat-value">{profitLoss.totals?.profitMargin || 0}%</span>
              <span className="stat-label">هامش الربح</span>
            </div>
          </Card>
        </div>

        {/* رسم بياني للأرباح */}
        <Card className="chart-card chart-large">
          <div className="chart-header">
            <h3>الدخل والمصروفات والأرباح</h3>
            <select value={groupBy} onChange={(e) => setGroupBy(e.target.value)} className="group-select">
              <option value="day">يومي</option>
              <option value="month">شهري</option>
              <option value="yearly">سنوي</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={profitLoss.breakdown}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="totalIncome" fill="#10b981" name="الدخل" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" fill="#ef4444" name="المصروفات" radius={[4, 4, 0, 0]} />
              <Bar dataKey="profit" fill="#4f46e5" name="الربح" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* تفاصيل الأرباح والخسائر */}
        <Card className="table-card">
          <h3>تفاصيل الأرباح والخسائر</h3>
          <table className="report-table">
            <thead>
              <tr>
                <th>الفترة</th>
                <th>دخل المواعيد</th>
                <th>دخل الفواتير</th>
                <th>إجمالي الدخل</th>
                <th>المصروفات</th>
                <th>صافي الربح</th>
                <th>الهامش</th>
              </tr>
            </thead>
            <tbody>
              {profitLoss.breakdown?.map((item, index) => (
                <tr key={index}>
                  <td>{item.period}</td>
                  <td>{formatCurrency(item.appointmentIncome)}</td>
                  <td>{formatCurrency(item.invoiceIncome)}</td>
                  <td className="text-primary">{formatCurrency(item.totalIncome)}</td>
                  <td className="text-danger">{formatCurrency(item.expense)}</td>
                  <td className={item.profit >= 0 ? 'text-success' : 'text-danger'}>
                    {formatCurrency(item.profit)}
                  </td>
                  <td>{item.profitMargin}%</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="totals-row">
                <td><strong>الإجمالي</strong></td>
                <td>{formatCurrency(profitLoss.totals?.appointmentIncome)}</td>
                <td>{formatCurrency(profitLoss.totals?.invoiceIncome)}</td>
                <td className="text-primary"><strong>{formatCurrency(profitLoss.totals?.totalIncome)}</strong></td>
                <td className="text-danger"><strong>{formatCurrency(profitLoss.totals?.expense)}</strong></td>
                <td className={profitLoss.totals?.profit >= 0 ? 'text-success' : 'text-danger'}>
                  <strong>{formatCurrency(profitLoss.totals?.profit)}</strong>
                </td>
                <td><strong>{profitLoss.totals?.profitMargin}%</strong></td>
              </tr>
            </tfoot>
          </table>
        </Card>
      </div>
    );
  };

  // فلاتر تقرير المهام
  const [tasksFilter, setTasksFilter] = useState({
    filterType: 'range', // range, month, specific
    month: '',
    specificDate: ''
  });

  const monthOptions = [
    { value: '1', label: 'يناير' },
    { value: '2', label: 'فبراير' },
    { value: '3', label: 'مارس' },
    { value: '4', label: 'أبريل' },
    { value: '5', label: 'مايو' },
    { value: '6', label: 'يونيو' },
    { value: '7', label: 'يوليو' },
    { value: '8', label: 'أغسطس' },
    { value: '9', label: 'سبتمبر' },
    { value: '10', label: 'أكتوبر' },
    { value: '11', label: 'نوفمبر' },
    { value: '12', label: 'ديسمبر' }
  ];

  const handleTasksFilterChange = (filterType, value) => {
    const newFilter = { ...tasksFilter, filterType };
    if (filterType === 'month') {
      newFilter.month = value;
      newFilter.specificDate = '';
    } else if (filterType === 'specific') {
      newFilter.specificDate = value;
      newFilter.month = '';
    } else {
      newFilter.month = '';
      newFilter.specificDate = '';
    }
    setTasksFilter(newFilter);
  };

  // تحديث fetchData لتضمين فلاتر المهام
  useEffect(() => {
    if (activeTab === 'tasks') {
      const fetchTasksData = async () => {
        setLoading(true);
        try {
          const params = { ...dateRange };
          if (tasksFilter.filterType === 'month' && tasksFilter.month) {
            params.month = tasksFilter.month;
          } else if (tasksFilter.filterType === 'specific' && tasksFilter.specificDate) {
            params.specificDate = tasksFilter.specificDate;
          }
          const tasksRes = await reportsApi.getTasksReport(params);
          setTasksData(tasksRes.data?.data || {});
        } catch (error) {
          console.error('Error fetching tasks report:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchTasksData();
    }
  }, [tasksFilter, dateRange, activeTab]);

  // تبويب تقرير المهام
  const renderTasksTab = () => {
    if (!tasksData) return null;

    const { summary, byEmployee, byMonth, completedTasksDetails } = tasksData;

    return (
      <div className="tasks-report">
        {/* فلاتر المهام */}
        <Card className="filters-card tasks-filters">
          <h3>فلاتر البحث</h3>
          <div className="filters-row">
            <div className="filter-group">
              <label>نوع الفلتر:</label>
              <select
                value={tasksFilter.filterType}
                onChange={(e) => handleTasksFilterChange(e.target.value, '')}
              >
                <option value="range">نطاق التاريخ</option>
                <option value="month">حسب الشهر</option>
                <option value="specific">تاريخ محدد</option>
              </select>
            </div>

            {tasksFilter.filterType === 'month' && (
              <div className="filter-group">
                <label>الشهر:</label>
                <select
                  value={tasksFilter.month}
                  onChange={(e) => handleTasksFilterChange('month', e.target.value)}
                >
                  <option value="">اختر الشهر</option>
                  {monthOptions.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
            )}

            {tasksFilter.filterType === 'specific' && (
              <div className="filter-group">
                <label>التاريخ:</label>
                <input
                  type="date"
                  value={tasksFilter.specificDate}
                  onChange={(e) => handleTasksFilterChange('specific', e.target.value)}
                />
              </div>
            )}
          </div>
        </Card>

        {/* المهام حسب الشهر */}
        {byMonth?.length > 0 && (
          <Card className="table-card">
            <h3>المهام المكتملة حسب الشهر</h3>
            <div className="table-scroll">
              <table className="report-table">
                <thead>
                  <tr>
                    <th>الشهر</th>
                    <th>المهام المكتملة</th>
                    <th>عدد الأشخاص</th>
                  </tr>
                </thead>
                <tbody>
                  {byMonth.map((item, index) => (
                    <tr key={index}>
                      <td>{item.monthName}</td>
                      <td>
                        <span className="badge badge-success">{item.completedTasks}</span>
                      </td>
                      <td>{item.totalPersons}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* جدول المهام حسب الموظف */}
        <Card className="table-card">
          <h3>إنجاز المهام حسب الموظف</h3>
          <div className="table-scroll">
            <table className="report-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>الموظف</th>
                  <th>المهام المكتملة</th>
                  <th>عدد الأشخاص</th>
                  <th>المبلغ</th>
                </tr>
              </thead>
              <tbody>
                {byEmployee?.length > 0 ? (
                  byEmployee.map((emp, index) => (
                    <tr key={emp.employeeId || index}>
                      <td>
                        <span className={`rank-badge rank-${index + 1}`}>{index + 1}</span>
                      </td>
                      <td>
                        <div className="employee-cell">
                          <span className="employee-name">{emp.employeeName}</span>
                          {emp.employeeEmail && (
                            <span className="employee-email">{emp.employeeEmail}</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-success">{emp.completedTasks}</span>
                      </td>
                      <td>{emp.totalPersons}</td>
                      <td>{formatCurrency(emp.totalAmount)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center">لا توجد بيانات</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* تفاصيل المهام المكتملة مع بيانات العملاء */}
        <Card className="table-card">
          <h3>تفاصيل المهام المكتملة</h3>
          <div className="table-scroll" style={{ maxHeight: '400px' }}>
            <table className="report-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>رقم المهمة</th>
                  <th>اسم العميل</th>
                  <th>الهاتف</th>
                  <th>عدد الأشخاص</th>
                  <th>الموظف المنفذ</th>
                  <th>تاريخ الاستكمال</th>
                </tr>
              </thead>
              <tbody>
                {completedTasksDetails?.length > 0 ? (
                  completedTasksDetails.map((task, index) => (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>
                        <span className="badge badge-primary">{task.taskNumber || '-'}</span>
                      </td>
                      <td>{task.customerName}</td>
                      <td>{task.customerPhone || '-'}</td>
                      <td>
                        <span className="badge badge-info">{task.personsCount}</span>
                      </td>
                      <td>{task.employeeName}</td>
                      <td>{task.completedAt ? formatDate(task.completedAt) : '-'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center">لا توجد مهام مكتملة</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    );
  };

  const renderContent = () => {
    if (loading) {
      return <Loader />;
    }

    switch (activeTab) {
      case 'overview':
        return renderOverviewTab();
      case 'charts':
        return renderChartsTab();
      case 'appointments':
        return renderAppointmentsTab();
      case 'tasks':
        return renderTasksTab();
      case 'employee-performance':
        return renderEmployeePerformanceTab();
      case 'top-customers':
        return renderTopCustomersTab();
      case 'profit-loss':
        return renderProfitLossTab();
      case 'departments':
        return renderDepartmentsTab();
      case 'financial':
        return renderFinancialTab();
      default:
        return null;
    }
  };

  return (
    <div className="reports-page">
      {/* Breadcrumb */}
      <div className="page-breadcrumb">
        <span>لوحة التحكم</span>
        <span className="separator">/</span>
        <span className="current">التقارير</span>
      </div>

      {/* Page Header */}
      <div className="page-header">
        <h1>التقارير والإحصائيات</h1>
        <div className="date-filters">
          <div className="quick-filters">
            <button onClick={() => handleQuickRange('today')} className="quick-btn">اليوم</button>
            <button onClick={() => handleQuickRange('week')} className="quick-btn">أسبوع</button>
            <button onClick={() => handleQuickRange('month')} className="quick-btn">شهر</button>
            <button onClick={() => handleQuickRange('year')} className="quick-btn">سنة</button>
          </div>
          <div className="date-inputs">
            <input
              type="date"
              name="startDate"
              value={dateRange.startDate}
              onChange={handleDateChange}
            />
            <span>إلى</span>
            <input
              type="date"
              name="endDate"
              value={dateRange.endDate}
              onChange={handleDateChange}
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="report-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="report-content">
        {/* أزرار عرض/طباعة التقرير */}
        {activeTab !== 'charts' && (
          <div className="report-actions-bar">
            <button className="report-action-btn view-btn" onClick={() => handleReportAction(false)}>
              <span>👁</span> عرض التقرير
            </button>
            <button className="report-action-btn print-btn" onClick={() => handleReportAction(true)}>
              <span>🖨</span> طباعة
            </button>
          </div>
        )}
        {renderContent()}
      </div>
    </div>
  );
};

export default Reports;
