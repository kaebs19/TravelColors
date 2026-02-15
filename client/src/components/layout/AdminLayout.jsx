import { Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { KeyboardShortcutsHelp } from '../common';
import { useNotifications, useKeyboardShortcuts } from '../../hooks';
import './AdminLayout.css';

const AdminLayout = () => {
  const { permission, requestPermission, startMonitoring, isSupported, upcomingAppointments } = useNotifications();
  const { showHelp, setShowHelp, getShortcutsList } = useKeyboardShortcuts();

  // بدء مراقبة المواعيد
  useEffect(() => {
    if (permission === 'granted') {
      startMonitoring();
    }
  }, [permission, startMonitoring]);

  return (
    <div className="admin-layout">
      <Sidebar />
      <div className="admin-main">
        <Navbar
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
