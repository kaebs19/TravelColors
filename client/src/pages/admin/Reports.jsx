import { useState, useEffect } from 'react';
import { reportsApi } from '../../api';
import { Card, Loader } from '../../components/common';
import { formatCurrency, formatDate } from '../../utils';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import './Reports.css';

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
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

  useEffect(() => {
    fetchData();
  }, [activeTab, dateRange, groupBy, period, selectedEmployee]);

  // جلب بيانات أداء الموظفين للبطاقات العلوية عند تحميل الصفحة
  useEffect(() => {
    const fetchPerformanceSummary = async () => {
      try {
        const params = { ...dateRange, period: 'daily' };
        const empRes = await reportsApi.getEmployeePerformance(params);
        setEmployeePerformance(empRes.data?.data || {});
      } catch (error) {
        console.error('Error fetching performance summary:', error);
      }
    };
    fetchPerformanceSummary();
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
        case 'appointments':
          const appointmentsRes = await reportsApi.getAppointmentsReport(params);
          setAppointmentsData(appointmentsRes.data?.data || []);
          break;
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
        {/* الإحصائيات الرئيسية */}
        <div className="stats-grid stats-grid-4">
          <Card className="stat-card stat-primary">
            <div className="stat-icon">📅</div>
            <div className="stat-info">
              <span className="stat-value">{overviewData.totalAppointments || 0}</span>
              <span className="stat-label">إجمالي المواعيد</span>
            </div>
          </Card>
          <Card className="stat-card stat-success">
            <div className="stat-icon">👥</div>
            <div className="stat-info">
              <span className="stat-value">{overviewData.totalPersons || 0}</span>
              <span className="stat-label">إجمالي الأشخاص</span>
            </div>
          </Card>
          <Card className="stat-card stat-info">
            <div className="stat-icon">👤</div>
            <div className="stat-info">
              <span className="stat-value">{overviewData.totalCustomers || 0}</span>
              <span className="stat-label">العملاء</span>
            </div>
          </Card>
          <Card className="stat-card stat-warning">
            <div className="stat-icon">🧑‍💼</div>
            <div className="stat-info">
              <span className="stat-value">{overviewData.totalEmployees || 0}</span>
              <span className="stat-label">الموظفين</span>
            </div>
          </Card>
        </div>

        {/* الإحصائيات المالية */}
        <div className="stats-grid stats-grid-3">
          <Card className="stat-card stat-money">
            <div className="stat-icon">💵</div>
            <div className="stat-info">
              <span className="stat-value">{formatCurrency(overviewData.totalAmount || 0)}</span>
              <span className="stat-label">إجمالي المبالغ</span>
            </div>
          </Card>
          <Card className="stat-card stat-paid">
            <div className="stat-icon">✅</div>
            <div className="stat-info">
              <span className="stat-value">{formatCurrency(overviewData.totalPaid || 0)}</span>
              <span className="stat-label">المدفوع</span>
            </div>
          </Card>
          <Card className="stat-card stat-remaining">
            <div className="stat-icon">⏳</div>
            <div className="stat-info">
              <span className="stat-value">{formatCurrency(overviewData.remainingAmount || 0)}</span>
              <span className="stat-label">المتبقي</span>
            </div>
          </Card>
        </div>

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

  const renderAppointmentsTab = () => {
    const maxCount = Math.max(...appointmentsData.map(d => d.count), 1);

    return (
      <div className="appointments-report">
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
    const totalCustomers = summary.reduce((sum, emp) => sum + (emp.totals?.customers || 0), 0);
    const totalCompleted = summary.reduce((sum, emp) => sum + (emp.totals?.completedAppointments || 0), 0);
    const avgCompletionRate = totalAppointments > 0 ? Math.round((totalCompleted / totalAppointments) * 100) : 0;

    return (
      <div className="employee-performance-report">
        {/* بطاقات ملخص أداء الموظفين */}
        <div className="performance-summary-cards">
          {/* بطاقة أفضل موظف */}
          <Card className="summary-card top-employee">
            <div className="summary-icon">🏆</div>
            <div className="summary-info">
              <span className="summary-label">أفضل موظف</span>
              <span className="summary-value">{topEmployee?.employeeName || '-'}</span>
              <span className="summary-sub">
                {topEmployee ? `${topEmployee.totals?.completedAppointments || 0} مهمة مكتملة • ${topEmployee.totals?.customers || 0} عميل • ${topEmployee.totals?.persons || 0} شخص` : '-'}
              </span>
            </div>
          </Card>

          {/* بطاقة متوسط الإنجاز */}
          <Card className="summary-card avg-completion">
            <div className="summary-icon">📊</div>
            <div className="summary-info">
              <span className="summary-label">متوسط الإنجاز</span>
              <span className="summary-value">{avgCompletionRate}%</span>
              <span className="summary-sub">{summary.length} موظف نشط</span>
            </div>
          </Card>

          {/* بطاقة إجمالي العملاء */}
          <Card className="summary-card total-customers">
            <div className="summary-icon">👥</div>
            <div className="summary-info">
              <span className="summary-label">إجمالي العملاء</span>
              <span className="summary-value">{totalCustomers}</span>
              <span className="summary-sub">{totalPersons} شخص تمت خدمتهم</span>
            </div>
          </Card>

          {/* بطاقة إجمالي المواعيد */}
          <Card className="summary-card total-appointments">
            <div className="summary-icon">📅</div>
            <div className="summary-info">
              <span className="summary-label">إجمالي المواعيد</span>
              <span className="summary-value">{totalAppointments}</span>
              <span className="summary-sub">{totalCompleted} مكتملة</span>
            </div>
          </Card>
        </div>

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

      {/* بطاقات ملخص أداء الموظفين */}
      {employeePerformance && (
        <div className="performance-summary-cards">
          {/* بطاقة أفضل موظف */}
          <Card className="summary-card top-employee">
            <div className="summary-icon">🏆</div>
            <div className="summary-info">
              <span className="summary-label">أفضل موظف</span>
              <span className="summary-value">
                {(() => {
                  const summary = employeePerformance.summary || [];
                  const topEmp = summary.length > 0
                    ? summary.reduce((best, emp) =>
                        (emp.totals?.completedAppointments > (best?.totals?.completedAppointments || 0)) ? emp : best,
                        summary[0]
                      )
                    : null;
                  return topEmp?.employee?.name || '-';
                })()}
              </span>
              <span className="summary-sub">
                {(() => {
                  const summary = employeePerformance.summary || [];
                  const topEmp = summary.length > 0
                    ? summary.reduce((best, emp) =>
                        (emp.totals?.completedAppointments > (best?.totals?.completedAppointments || 0)) ? emp : best,
                        summary[0]
                      )
                    : null;
                  return topEmp ? `${topEmp.totals?.completedAppointments || 0} مهمة مكتملة` : '';
                })()}
              </span>
            </div>
          </Card>

          {/* بطاقة متوسط الإنجاز */}
          <Card className="summary-card avg-completion">
            <div className="summary-icon">📊</div>
            <div className="summary-info">
              <span className="summary-label">متوسط الإنجاز</span>
              <span className="summary-value">
                {(() => {
                  const summary = employeePerformance.summary || [];
                  const totalAppointments = summary.reduce((sum, emp) => sum + (emp.totals?.appointments || 0), 0);
                  const totalCompleted = summary.reduce((sum, emp) => sum + (emp.totals?.completedAppointments || 0), 0);
                  return totalAppointments > 0 ? `${Math.round((totalCompleted / totalAppointments) * 100)}%` : '0%';
                })()}
              </span>
              <span className="summary-sub">
                {(employeePerformance.summary || []).filter(emp => emp.totals?.appointments > 0).length} موظف نشط
              </span>
            </div>
          </Card>

          {/* بطاقة إجمالي العملاء */}
          <Card className="summary-card total-customers">
            <div className="summary-icon">👥</div>
            <div className="summary-info">
              <span className="summary-label">إجمالي العملاء</span>
              <span className="summary-value">
                {(employeePerformance.summary || []).reduce((sum, emp) => sum + (emp.totals?.customers || 0), 0)}
              </span>
              <span className="summary-sub">
                {(employeePerformance.summary || []).reduce((sum, emp) => sum + (emp.totals?.persons || 0), 0)} شخص تمت خدمتهم
              </span>
            </div>
          </Card>

          {/* بطاقة إجمالي المواعيد */}
          <Card className="summary-card total-appointments">
            <div className="summary-icon">📋</div>
            <div className="summary-info">
              <span className="summary-label">إجمالي المواعيد</span>
              <span className="summary-value">
                {(employeePerformance.summary || []).reduce((sum, emp) => sum + (emp.totals?.appointments || 0), 0)}
              </span>
              <span className="summary-sub">
                {(employeePerformance.summary || []).reduce((sum, emp) => sum + (emp.totals?.completedAppointments || 0), 0)} مكتملة
              </span>
            </div>
          </Card>
        </div>
      )}

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
        {renderContent()}
      </div>
    </div>
  );
};

export default Reports;
