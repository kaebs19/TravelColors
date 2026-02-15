import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { appointmentsApi, tasksApi } from '../../api';
import { Card, Loader } from '../../components/common';
import { ARABIC_MONTHS } from '../../utils';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [taskStats, setTaskStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashboardRes, todayRes, taskStatsRes] = await Promise.all([
          appointmentsApi.getDashboardStats(),
          appointmentsApi.getTodayAppointments(),
          tasksApi.getDashboardStats()
        ]);
        setStats(dashboardRes.data?.data || dashboardRes.data || {});
        setTodayAppointments(todayRes.data?.data?.appointments || []);
        setTaskStats(taskStatsRes.data?.data || taskStatsRes.data || {});
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <Loader fullScreen />;
  }

  // بيانات المخطط البياني
  const chartData = stats?.dailyStats || [];
  const maxAppointments = Math.max(...chartData.map(d => d.appointments), 1);
  const maxPersons = Math.max(...chartData.map(d => d.persons), 1);

  // بيانات مخطط المهام
  const taskChartData = taskStats?.weeklyChart || [];
  const maxTasksReceived = Math.max(...taskChartData.map(d => d.received || 0), 1);
  const maxTasksCompleted = Math.max(...taskChartData.map(d => d.completed || 0), 1);
  const maxTaskValue = Math.max(maxTasksReceived, maxTasksCompleted, 1);

  // تنسيق التاريخ للمخطط
  const formatChartDate = (dateStr) => {
    const date = new Date(dateStr);
    return `${date.getDate()}/${date.getMonth() + 1}`;
  };

  // تنسيق الوقت
  const formatTime = (time) => {
    if (!time) return '-';
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const period = h < 12 ? 'ص' : 'م';
    const displayHour = h > 12 ? h - 12 : (h === 0 ? 12 : h);
    return `${displayHour}:${minutes} ${period}`;
  };

  // نسبة التغيير
  const getChangeClass = (change) => {
    if (change > 0) return 'positive';
    if (change < 0) return 'negative';
    return 'neutral';
  };

  const getChangeIcon = (change) => {
    if (change > 0) return '↑';
    if (change < 0) return '↓';
    return '→';
  };

  // التعامل مع البحث
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/control/appointments?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="dashboard-page">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <h1>لوحة التحكم</h1>
          <p className="header-subtitle">
            {new Date().toLocaleDateString('ar-u-nu-latn', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>
        <div className="header-actions">
          {/* شريط البحث */}
          <form className="dashboard-search" onSubmit={handleSearch}>
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="بحث عن عميل أو موعد..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </form>
        </div>
      </div>

      {/* أزرار الإضافة السريعة */}
      <div className="quick-actions">
        <button
          className="quick-action-btn confirmed"
          onClick={() => navigate('/control/appointments/add?type=confirmed')}
        >
          <span className="quick-icon">✓</span>
          <span className="quick-label">موعد مؤكد</span>
        </button>
        <button
          className="quick-action-btn unconfirmed"
          onClick={() => navigate('/control/appointments/add?type=unconfirmed')}
        >
          <span className="quick-icon">○</span>
          <span className="quick-label">غير مؤكد</span>
        </button>
        <button
          className="quick-action-btn draft"
          onClick={() => navigate('/control/appointments/add?type=draft')}
        >
          <span className="quick-icon">📝</span>
          <span className="quick-label">مسودة</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid stats-grid-4">
        {/* إجمالي العملاء */}
        <Card className="stat-card stat-customers" onClick={() => navigate('/control/customers')}>
          <div className="stat-content">
            <div className="stat-icon-wrapper">
              <span className="stat-icon">👥</span>
            </div>
            <div className="stat-info">
              <span className="stat-label">إجمالي العملاء</span>
              <span className="stat-value">{stats?.customers?.total || 0}</span>
              <div className="stat-details">
                <span className="stat-sub">اليوم: {stats?.customers?.today || 0}</span>
                <span className="stat-sub">الشهر: {stats?.customers?.month || 0}</span>
              </div>
              {stats?.customers?.monthChange !== undefined && (
                <span className={`stat-change ${getChangeClass(stats.customers.monthChange)}`}>
                  {getChangeIcon(stats.customers.monthChange)} {Math.abs(stats.customers.monthChange)}% عن الشهر السابق
                </span>
              )}
            </div>
          </div>
        </Card>

        {/* إجمالي الأشخاص */}
        <Card className="stat-card stat-persons">
          <div className="stat-content">
            <div className="stat-icon-wrapper">
              <span className="stat-icon">🧑‍🤝‍🧑</span>
            </div>
            <div className="stat-info">
              <span className="stat-label">إجمالي الأشخاص</span>
              <span className="stat-value">{stats?.persons?.total || 0}</span>
              <div className="stat-details">
                <span className="stat-sub">اليوم: {stats?.persons?.today || 0}</span>
                <span className="stat-sub">الشهر: {stats?.persons?.month || 0}</span>
              </div>
              {stats?.persons?.monthChange !== undefined && (
                <span className={`stat-change ${getChangeClass(stats.persons.monthChange)}`}>
                  {getChangeIcon(stats.persons.monthChange)} {Math.abs(stats.persons.monthChange)}% عن الشهر السابق
                </span>
              )}
            </div>
          </div>
        </Card>

        {/* إجمالي المواعيد */}
        <Card className="stat-card stat-appointments" onClick={() => navigate('/control/appointments')}>
          <div className="stat-content">
            <div className="stat-icon-wrapper">
              <span className="stat-icon">📅</span>
            </div>
            <div className="stat-info">
              <span className="stat-label">إجمالي المواعيد</span>
              <span className="stat-value">{stats?.appointments?.total || 0}</span>
              <div className="stat-details">
                <span className="stat-sub">اليوم: {stats?.appointments?.today || 0}</span>
                <span className="stat-sub">جديدة: {stats?.appointments?.new || 0}</span>
              </div>
              {stats?.appointments?.monthChange !== undefined && (
                <span className={`stat-change ${getChangeClass(stats.appointments.monthChange)}`}>
                  {getChangeIcon(stats.appointments.monthChange)} {Math.abs(stats.appointments.monthChange)}% عن الشهر السابق
                </span>
              )}
            </div>
          </div>
        </Card>

        {/* عملاء VIP */}
        <Card className="stat-card stat-vip" onClick={() => navigate('/control/customers?filter=vip')}>
          <div className="stat-content">
            <div className="stat-icon-wrapper">
              <span className="stat-icon">⭐</span>
            </div>
            <div className="stat-info">
              <span className="stat-label">عملاء VIP</span>
              <span className="stat-value">{stats?.customers?.vip || 0}</span>
              <div className="stat-details">
                <span className="stat-sub">مكتملة: {stats?.appointments?.completed || 0}</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="dashboard-charts">
        {/* مخطط المواعيد اليومية */}
        <Card className="chart-card">
          <div className="card-header">
            <h3>المواعيد والأشخاص - {ARABIC_MONTHS[new Date().getMonth()]}</h3>
          </div>
          <div className="chart-container">
            {chartData.length > 0 ? (
              <div className="bar-chart">
                <div className="chart-legend">
                  <span className="legend-item">
                    <span className="legend-color appointments"></span>
                    المواعيد
                  </span>
                  <span className="legend-item">
                    <span className="legend-color persons"></span>
                    الأشخاص
                  </span>
                </div>
                <div className="chart-bars">
                  {chartData.map((day, index) => (
                    <div key={index} className="chart-bar-group">
                      <div className="bars">
                        <div
                          className="bar appointments"
                          style={{ height: `${(day.appointments / maxAppointments) * 100}%` }}
                          title={`${day.appointments} موعد`}
                        >
                          <span className="bar-value">{day.appointments}</span>
                        </div>
                        <div
                          className="bar persons"
                          style={{ height: `${(day.persons / maxPersons) * 100}%` }}
                          title={`${day.persons} شخص`}
                        >
                          <span className="bar-value">{day.persons}</span>
                        </div>
                      </div>
                      <span className="bar-label">{formatChartDate(day._id)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="empty-chart">لا توجد بيانات للعرض</div>
            )}
          </div>
        </Card>

        {/* مخطط أنواع المواعيد */}
        <Card className="chart-card">
          <div className="card-header">
            <h3>أنواع المواعيد</h3>
          </div>
          <div className="chart-container">
            <div className="donut-chart-container">
              <div className="donut-stats">
                <div className="donut-stat">
                  <span className="donut-color confirmed"></span>
                  <span className="donut-label">مؤكد</span>
                  <span className="donut-value">{stats?.byType?.confirmed?.count || 0}</span>
                </div>
                <div className="donut-stat">
                  <span className="donut-color unconfirmed"></span>
                  <span className="donut-label">غير مؤكد</span>
                  <span className="donut-value">{stats?.byType?.unconfirmed?.count || 0}</span>
                </div>
                <div className="donut-stat">
                  <span className="donut-color draft"></span>
                  <span className="donut-label">مسودة</span>
                  <span className="donut-value">{stats?.byType?.draft?.count || 0}</span>
                </div>
              </div>
              <div className="status-stats">
                <h4>الحالات</h4>
                <div className="status-bars">
                  <div className="status-bar">
                    <span className="status-name">🆕 جديد</span>
                    <div className="status-progress">
                      <div
                        className="progress-fill new"
                        style={{ width: `${((stats?.byStatus?.new || 0) / (stats?.appointments?.month || 1)) * 100}%` }}
                      ></div>
                    </div>
                    <span className="status-count">{stats?.byStatus?.new || 0}</span>
                  </div>
                  <div className="status-bar">
                    <span className="status-name">🔄 قيد العمل</span>
                    <div className="status-progress">
                      <div
                        className="progress-fill in-progress"
                        style={{ width: `${((stats?.byStatus?.in_progress || 0) / (stats?.appointments?.month || 1)) * 100}%` }}
                      ></div>
                    </div>
                    <span className="status-count">{stats?.byStatus?.in_progress || 0}</span>
                  </div>
                  <div className="status-bar">
                    <span className="status-name">✅ مكتمل</span>
                    <div className="status-progress">
                      <div
                        className="progress-fill completed"
                        style={{ width: `${((stats?.byStatus?.completed || 0) / (stats?.appointments?.month || 1)) * 100}%` }}
                      ></div>
                    </div>
                    <span className="status-count">{stats?.byStatus?.completed || 0}</span>
                  </div>
                  <div className="status-bar">
                    <span className="status-name">❌ ملغي</span>
                    <div className="status-progress">
                      <div
                        className="progress-fill cancelled"
                        style={{ width: `${((stats?.byStatus?.cancelled || 0) / (stats?.appointments?.month || 1)) * 100}%` }}
                      ></div>
                    </div>
                    <span className="status-count">{stats?.byStatus?.cancelled || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Tasks Section */}
      <div className="tasks-section">
        <h2 className="section-title">📋 المهام</h2>

        {/* بطاقات إحصائيات المهام */}
        <div className="stats-grid stats-grid-4 tasks-stats-grid">
          {/* مهام اليوم */}
          <Card className="stat-card stat-tasks-today" onClick={() => navigate('/control/tasks')}>
            <div className="stat-content">
              <div className="stat-icon-wrapper">
                <span className="stat-icon">📅</span>
              </div>
              <div className="stat-info">
                <span className="stat-label">مهام اليوم</span>
                <span className="stat-value">{taskStats?.todayTasks?.total || 0}</span>
                <div className="stat-details">
                  <span className="stat-sub">مكتمل: {taskStats?.todayTasks?.completed || 0}</span>
                  <span className="stat-sub">متبقي: {taskStats?.todayTasks?.pending || 0}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* مهام متأخرة */}
          <Card className="stat-card stat-tasks-overdue" onClick={() => navigate('/control/tasks?filter=overdue')}>
            <div className="stat-content">
              <div className="stat-icon-wrapper">
                <span className="stat-icon">⚠️</span>
              </div>
              <div className="stat-info">
                <span className="stat-label">مهام متأخرة</span>
                <span className="stat-value">{taskStats?.overdueTasks || 0}</span>
                <div className="stat-details">
                  <span className="stat-sub warning-text">تحتاج متابعة</span>
                </div>
              </div>
            </div>
          </Card>

          {/* تنتهي قريباً */}
          <Card className="stat-card stat-tasks-soon" onClick={() => navigate('/control/tasks?filter=due-soon')}>
            <div className="stat-content">
              <div className="stat-icon-wrapper">
                <span className="stat-icon">⏰</span>
              </div>
              <div className="stat-info">
                <span className="stat-label">تنتهي خلال 24 ساعة</span>
                <span className="stat-value">{taskStats?.dueSoon || 0}</span>
                <div className="stat-details">
                  <span className="stat-sub urgent-text">عاجل</span>
                </div>
              </div>
            </div>
          </Card>

          {/* نسبة الإنجاز */}
          <Card className="stat-card stat-tasks-rate">
            <div className="stat-content">
              <div className="stat-icon-wrapper">
                <span className="stat-icon">📊</span>
              </div>
              <div className="stat-info">
                <span className="stat-label">نسبة الإنجاز اليومية</span>
                <span className="stat-value">{taskStats?.dailyCompletionRate || 0}%</span>
                <div className="completion-bar">
                  <div
                    className="completion-fill"
                    style={{ width: `${taskStats?.dailyCompletionRate || 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* مخطط أداء المهام + التنبيهات */}
        <div className="tasks-charts-row">
          {/* مخطط أداء المهام */}
          <Card className="chart-card tasks-chart-card">
            <div className="card-header">
              <h3>أداء المهام - آخر 7 أيام</h3>
            </div>
            <div className="chart-container">
              {taskChartData.length > 0 ? (
                <div className="bar-chart">
                  <div className="chart-legend">
                    <span className="legend-item">
                      <span className="legend-color tasks-received"></span>
                      مستلمة
                    </span>
                    <span className="legend-item">
                      <span className="legend-color tasks-completed"></span>
                      مكتملة
                    </span>
                  </div>
                  <div className="chart-bars">
                    {taskChartData.map((day, index) => (
                      <div key={index} className="chart-bar-group">
                        <div className="bars">
                          <div
                            className="bar tasks-received"
                            style={{ height: `${((day.received || 0) / maxTaskValue) * 100}%` }}
                            title={`${day.received || 0} مستلمة`}
                          >
                            <span className="bar-value">{day.received || 0}</span>
                          </div>
                          <div
                            className="bar tasks-completed"
                            style={{ height: `${((day.completed || 0) / maxTaskValue) * 100}%` }}
                            title={`${day.completed || 0} مكتملة`}
                          >
                            <span className="bar-value">{day.completed || 0}</span>
                          </div>
                        </div>
                        <span className="bar-label">{formatChartDate(day.date)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="empty-chart">لا توجد بيانات للعرض</div>
              )}
            </div>
          </Card>

          {/* التنبيهات */}
          <Card className="list-card tasks-alerts-card">
            <div className="card-header">
              <h3>🔔 تنبيهات المهام</h3>
            </div>
            <div className="list-content">
              <div className="alerts-list">
                <div className="alert-item alert-new" onClick={() => navigate('/control/tasks?status=new')}>
                  <span className="alert-icon">🆕</span>
                  <span className="alert-text">مهام لم تُستلم</span>
                  <span className="alert-count">{taskStats?.alerts?.unassigned || 0}</span>
                </div>
                <div className="alert-item alert-warning" onClick={() => navigate('/control/tasks?status=in_progress')}>
                  <span className="alert-icon">⏳</span>
                  <span className="alert-text">قيد التنفيذ لأكثر من 24 ساعة</span>
                  <span className="alert-count">{taskStats?.alerts?.longRunning || 0}</span>
                </div>
                <div className="alert-item alert-urgent" onClick={() => navigate('/control/tasks?filter=urgent')}>
                  <span className="alert-icon">🚨</span>
                  <span className="alert-text">مهام عاجلة</span>
                  <span className="alert-count">{taskStats?.alerts?.urgent || 0}</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* أفضل الموظفين في إنجاز المهام */}
        <Card className="list-card top-task-employees">
          <div className="card-header">
            <h3>🏆 أفضل الموظفين في إنجاز المهام - هذا الأسبوع</h3>
            <button className="view-all-btn" onClick={() => navigate('/control/tasks')}>
              عرض الكل
            </button>
          </div>
          <div className="list-content">
            {taskStats?.topEmployees?.length > 0 ? (
              <div className="ranking-list horizontal-ranking">
                {taskStats.topEmployees.map((emp, index) => (
                  <div key={index} className="ranking-item task-ranking-item">
                    <span className={`rank rank-${index + 1}`}>
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                    </span>
                    <div className="ranking-info">
                      <span className="ranking-name">{emp.name}</span>
                      <span className="ranking-sub">{emp.completedTasks} مهمة مكتملة</span>
                    </div>
                    <span className="ranking-value">{emp.totalPersons} شخص</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-list">لا توجد بيانات</div>
            )}
          </div>
        </Card>
      </div>

      {/* Lists Section */}
      <div className="dashboard-lists">
        {/* مواعيد اليوم */}
        <Card className="list-card today-appointments">
          <div className="card-header">
            <h3>📆 مواعيد اليوم</h3>
            <button className="view-all-btn" onClick={() => navigate('/control/appointments')}>
              عرض الكل
            </button>
          </div>
          <div className="list-content">
            {todayAppointments.length > 0 ? (
              <div className="appointments-list">
                {todayAppointments.slice(0, 5).map((appt) => (
                  <div key={appt._id} className="appointment-item">
                    <div className="appointment-time">
                      {formatTime(appt.appointmentTime || appt.reminderTime)}
                    </div>
                    <div className="appointment-info">
                      <span className="customer-name">{appt.customerName}</span>
                      {appt.department && (
                        <span className="dept-name">{appt.department.title}</span>
                      )}
                    </div>
                    <span className={`type-badge type-${appt.type}`}>
                      {appt.type === 'confirmed' ? 'مؤكد' : appt.type === 'unconfirmed' ? 'غير مؤكد' : 'مسودة'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-list">لا توجد مواعيد اليوم</div>
            )}
          </div>
        </Card>

        {/* أكثر الموظفين نشاطاً */}
        <Card className="list-card top-employees">
          <div className="card-header">
            <h3>🏆 أكثر الموظفين إضافة (أشخاص)</h3>
          </div>
          <div className="list-content">
            {stats?.topEmployeesByPersons?.length > 0 ? (
              <div className="ranking-list">
                {stats.topEmployeesByPersons.map((emp, index) => (
                  <div key={index} className="ranking-item">
                    <span className={`rank rank-${index + 1}`}>{index + 1}</span>
                    <div className="ranking-info">
                      <span className="ranking-name">{emp.name}</span>
                      <span className="ranking-sub">{emp.appointmentsCount} موعد</span>
                    </div>
                    <span className="ranking-value">{emp.totalPersons} شخص</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-list">لا توجد بيانات</div>
            )}
          </div>
        </Card>

        {/* أكثر الأقسام نشاطاً */}
        <Card className="list-card top-departments">
          <div className="card-header">
            <h3>🏢 أكثر الأقسام نشاطاً</h3>
          </div>
          <div className="list-content">
            {stats?.topDepartments?.length > 0 ? (
              <div className="ranking-list">
                {stats.topDepartments.map((dept, index) => (
                  <div
                    key={index}
                    className="ranking-item clickable"
                    onClick={() => navigate(`/control/appointments?department=${dept._id}`)}
                  >
                    <span className={`rank rank-${index + 1}`}>{index + 1}</span>
                    <div className="ranking-info">
                      <span className="ranking-name">{dept.title}</span>
                      <span className="ranking-sub">{dept.totalPersons} شخص</span>
                    </div>
                    <span className="ranking-value">{dept.appointmentsCount} موعد</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-list">لا توجد بيانات</div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
