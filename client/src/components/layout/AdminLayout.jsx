import { Outlet, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { KeyboardShortcutsHelp } from '../common';
import { useNotifications, useKeyboardShortcuts } from '../../hooks';
import './AdminLayout.css';

const AdminLayout = () => {
  const { permission, requestPermission, startMonitoring, isSupported, upcomingAppointments } = useNotifications();
  const { showHelp, setShowHelp, getShortcutsList } = useKeyboardShortcuts();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // بدء مراقبة المواعيد
  useEffect(() => {
    if (permission === 'granted') {
      startMonitoring();
    }
  }, [permission, startMonitoring]);

  // إغلاق القائمة الجانبية تلقائياً عند التنقل بين الصفحات (للجوال)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // منع تمرير الصفحة خلف القائمة الجانبية عند فتحها على الجوال
  useEffect(() => {
    if (sidebarOpen) {
      document.body.classList.add('sidebar-open-no-scroll');
    } else {
      document.body.classList.remove('sidebar-open-no-scroll');
    }
    return () => document.body.classList.remove('sidebar-open-no-scroll');
  }, [sidebarOpen]);

  return (
    <div className="admin-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* خلفية معتمة تغلق القائمة عند الضغط عليها (الجوال) */}
      <div
        className={`sidebar-backdrop ${sidebarOpen ? 'visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      <div className="admin-main">
        <Navbar
          onMenuClick={() => setSidebarOpen(prev => !prev)}
          notificationProps={{
            permission,
            onRequestPermission: requestPermission,
            upcomingAppointments,
            isSupported
          }}
        />
        <main className="admin-content">
          <Outlet />
        </main>
      </div>

      {/* نافذة اختصارات لوحة المفاتيح */}
      <KeyboardShortcutsHelp
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
        shortcuts={getShortcutsList()}
      />
    </div>
  );
};

export default AdminLayout;
