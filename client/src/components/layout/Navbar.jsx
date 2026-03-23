import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context';
import { appointmentsApi, tasksApi } from '../../api';
import { NotificationBell } from '../common';
import './Navbar.css';

const Navbar = ({ notificationProps, taskNotifications = [], onClearTaskNotifications }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [todayCount, setTodayCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [recentTaskActivities, setRecentTaskActivities] = useState([]);
  const [overdueElectronic, setOverdueElectronic] = useState([]);

  useEffect(() => {
    fetchTodayAppointments();
    fetchRecentTaskActivities();
    fetchOverdueElectronic();
  }, []);

  // دمج إشعارات المهام المباشرة مع النشاطات الأخيرة
  useEffect(() => {
    if (taskNotifications.length > 0) {
      setRecentTaskActivities(prev => [...taskNotifications, ...prev].slice(0, 10));
    }
  }, [taskNotifications]);

  const fetchTodayAppointments = async () => {
    try {
      const res = await appointmentsApi.getTodayAppointments();
      const appointments = res.data?.data?.appointments || res.data?.appointments || [];
      setTodayCount(appointments.length);

      // تحويل المواعيد إلى تنبيهات
      const notifs = appointments.slice(0, 5).map(appt => ({
        id: appt._id,
        text: `موعد ${appt.customerName} - ${appt.appointmentTime}`,
        type: appt.type
      }));
      setNotifications(notifs);
    } catch (error) {
      console.error('Error fetching today appointments:', error);
    }
  };

  const fetchRecentTaskActivities = async () => {
    try {
      // محاولة جلب النشاطات الأخيرة للمهام
      const res = await tasksApi.getRecentActivities?.();
      if (res?.data?.data?.activities) {
        setRecentTaskActivities(res.data.data.activities);
      }
    } catch (error) {
      // تجاهل الخطأ إذا كان API غير موجود
      console.log('Recent activities API not available');
    }
  };

  const fetchOverdueElectronic = async () => {
    try {
      const res = await appointmentsApi.getOverdueElectronic();
      const overdue = res.data?.data || [];

      setOverdueElectronic(overdue);

      // إرسال إشعار متصفح إذا وجدت تقديمات متأخرة
      if (overdue.length > 0 && notificationProps?.permission === 'granted' && notificationProps?.notify) {
        overdue.forEach(item => {
          notificationProps.notify(
            `⚠️ تأخر في معالجة تأشيرة`,
            `${item.customerName} لدى ${item.departmentTitle} - مضى ${item.daysPassed} يوم`
          );
        });
      }
    } catch (error) {
      console.log('Error checking overdue electronic submissions:', error);
    }
  };

  return (
    <header className="navbar">
      <div className="navbar-start">
        <h2 className="navbar-title">مرحباً، {user?.name}</h2>
      </div>

      <div className="navbar-end">
        {/* أيقونة التقويم */}
        <button
          className="navbar-icon-btn"
          onClick={() => navigate('/control/appointments')}
          title="المواعيد"
        >
          <span className="icon">📅</span>
          {todayCount > 0 && <span className="badge">{todayCount}</span>}
        </button>

        {/* أيقونة إشعارات المتصفح */}
        {notificationProps && (
          <NotificationBell {...notificationProps} />
        )}

        {/* أيقونة التنبيهات */}
        <div className="notifications-wrapper">
          <button
            className="navbar-icon-btn"
            onClick={() => setShowNotifications(!showNotifications)}
            title="التنبيهات"
          >
            <span className="icon">📋</span>
            {(() => {
              const unreadActivities = recentTaskActivities.filter(a => !a.isRead).length;
              const totalCount = notifications.length + unreadActivities + overdueElectronic.length;
              return totalCount > 0 && <span className="badge">{totalCount}</span>;
            })()}
          </button>

          {showNotifications && (
            <div className="notifications-dropdown notifications-dropdown-large">
              {/* قسم نشاطات المهام */}
              {recentTaskActivities.length > 0 && (
                <>
                  <div className="notifications-header">
                    <h4>نشاطات المهام</h4>
                    <span className="count">{recentTaskActivities.filter(a => !a.isRead).length || recentTaskActivities.length}</span>
                    {recentTaskActivities.some(a => !a.isRead) && (
                      <button
                        className="mark-read-btn"
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            await tasksApi.markActivitiesRead();
                            setRecentTaskActivities(prev => prev.map(a => ({ ...a, isRead: true })));
                          } catch (err) {
                            console.error('Error marking activities as read:', err);
                          }
                        }}
                      >
                        ✓ تم القراءة
                      </button>
                    )}
                  </div>
                  <div className="notifications-list task-activities">
                    {recentTaskActivities.map((activity, index) => (
                      <div
                        key={activity.id || index}
                        className={`notification-item task-activity ${activity.type} ${activity.isRead ? 'read' : 'unread'}`}
                        onClick={() => {
                          if (activity.taskId) {
                            navigate(`/control/tasks`);
                          }
                          setShowNotifications(false);
                        }}
                      >
                        <span className="notif-icon">
                          {activity.type === 'start' ? '▶️' : activity.type === 'complete' ? '✅' : '📌'}
                        </span>
                        <div className="notif-content">
                          <span className="notif-text">
                            {activity.type === 'start' ? 'بدأ ' : activity.type === 'complete' ? 'أكمل ' : ''}
                            <strong className="clickable-name" onClick={(e) => { e.stopPropagation(); navigate(`/control/employees`); }}>
                              {activity.employeeName}
                            </strong>
                            {' مهمة العميل '}
                            <strong className="clickable-name" onClick={(e) => { e.stopPropagation(); navigate(`/control/customers`); }}>
                              {activity.customerName}
                            </strong>
                          </span>
                          <span className="notif-time">{activity.timeAgo || 'الآن'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* قسم التقديمات المتأخرة */}
              {overdueElectronic.length > 0 && (
                <>
                  <div className="notifications-header overdue-header">
                    <h4>⚠️ تقديمات متأخرة</h4>
                    <span className="count overdue-count">{overdueElectronic.length}</span>
                  </div>
                  <div className="notifications-list overdue-list">
                    {overdueElectronic.map(item => (
                      <div
                        key={item.id}
                        className="notification-item overdue-item"
                        onClick={() => {
                          navigate(`/control/appointments?type=electronic`);
                          setShowNotifications(false);
                        }}
                      >
                        <span className="notif-icon">⚠️</span>
                        <div className="notif-content">
                          <span className="notif-text">
                            تأخر معالجة تأشيرة <strong>{item.customerName}</strong> لدى <strong>{item.departmentTitle}</strong>
                          </span>
                          <span className="notif-time overdue-time">مضى {item.daysPassed} يوم (المتوقع {item.processingDays} يوم)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* قسم مواعيد اليوم */}
              <div className="notifications-header">
                <h4>مواعيد اليوم</h4>
                <span className="count">{notifications.length}</span>
              </div>
              <div className="notifications-list">
                {notifications.length === 0 ? (
                  <div className="no-notifications">لا توجد مواعيد اليوم</div>
                ) : (
                  notifications.map(notif => (
                    <div
                      key={notif.id}
                      className="notification-item"
                      onClick={() => {
                        navigate('/control/appointments');
                        setShowNotifications(false);
                      }}
                    >
                      <span className="notif-icon">📌</span>
                      <span className="notif-text">{notif.text}</span>
                    </div>
                  ))
                )}
              </div>
              {(notifications.length > 0 || recentTaskActivities.length > 0) && (
                <div className="notifications-footer">
                  <button onClick={() => navigate('/control/tasks')}>
                    عرض المهام
                  </button>
                  <button onClick={() => navigate('/control/appointments')}>
                    عرض المواعيد
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="navbar-user">
          <div className="user-avatar">
            {user?.name?.charAt(0)}
          </div>
          <div className="user-info">
            <span className="user-name">{user?.name}</span>
            <span className="user-role">
              {user?.role === 'admin' ? 'مدير' : 'موظف'}
            </span>
          </div>
        </div>

        <button className="navbar-logout" onClick={logout}>
          خروج
        </button>
      </div>
    </header>
  );
};

export default Navbar;
