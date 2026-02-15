import { useState } from 'react';
import './NotificationBell.css';

const NotificationBell = ({
  permission,
  onRequestPermission,
  upcomingAppointments = [],
  isSupported
}) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!isSupported) return null;

  const hasUpcoming = upcomingAppointments.length > 0;

  const formatTime = (date, time) => {
    const aptTime = new Date(`${date}T${time}`);
    const now = new Date();
    const diff = Math.round((aptTime - now) / (1000 * 60));

    if (diff <= 0) return 'الآن';
    if (diff < 60) return `بعد ${diff} دقيقة`;
    return `بعد ${Math.round(diff / 60)} ساعة`;
  };

  return (
    <div className="notification-bell-container">
      <button
        className={`notification-bell ${hasUpcoming ? 'has-notifications' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="الإشعارات"
      >
        <span className="bell-icon">🔔</span>
        {hasUpcoming && (
          <span className="notification-badge">{upcomingAppointments.length}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h4>الإشعارات</h4>
            {permission !== 'granted' && (
              <button
                className="enable-btn"
                onClick={onRequestPermission}
              >
                تفعيل
              </button>
            )}
          </div>

          <div className="notification-content">
            {permission !== 'granted' ? (
              <div className="notification-permission">
                <span className="icon">🔕</span>
                <p>الإشعارات غير مفعلة</p>
                <button onClick={onRequestPermission} className="enable-notifications-btn">
                  تفعيل إشعارات المواعيد
                </button>
              </div>
            ) : upcomingAppointments.length === 0 ? (
              <div className="no-notifications">
                <span className="icon">✅</span>
                <p>لا توجد مواعيد قادمة خلال الساعة القادمة</p>
              </div>
            ) : (
              <div className="notifications-list">
                {upcomingAppointments.map((apt, index) => (
                  <div key={index} className="notification-item">
                    <div className="notification-icon">📅</div>
                    <div className="notification-info">
                      <span className="notification-title">
                        {apt.customer?.name || apt.customerName || 'عميل'}
                      </span>
                      <span className="notification-time">
                        {formatTime(apt.date, apt.time)}
                      </span>
                      <span className="notification-persons">
                        {apt.personsCount || 1} شخص
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {permission === 'granted' && (
            <div className="notification-footer">
              <span className="status-indicator active"></span>
              <span>الإشعارات مفعلة</span>
            </div>
          )}
        </div>
      )}

      {isOpen && <div className="notification-backdrop" onClick={() => setIsOpen(false)} />}
    </div>
  );
};

export default NotificationBell;
