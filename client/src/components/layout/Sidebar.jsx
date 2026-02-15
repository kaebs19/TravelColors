import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context';
import { settingsApi } from '../../api';
import './Sidebar.css';

const Sidebar = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [logoUrl, setLogoUrl] = useState('/favicon.svg');
  const [openMenus, setOpenMenus] = useState({
    appointments: false,
    invoices: false,
    finance: false
  });

  // تحميل الشعار من الإعدادات
  useEffect(() => {
    const loadLogo = async () => {
      try {
        const res = await settingsApi.getSettings();
        if (res.data?.data?.logo) {
          setLogoUrl(`${process.env.REACT_APP_API_URL || 'http://localhost:5002'}${res.data.data.logo}`);
        }
      } catch (err) {
        // استخدام الشعار الافتراضي
      }
    };
    loadLogo();
  }, []);

  // التحقق إذا كان المسار الحالي داخل قائمة معينة
  const isAppointmentsActive = ['/control/appointments', '/control/tasks'].some(
    path => location.pathname.startsWith(path)
  );
  const isInvoicesActive = ['/control/invoices', '/control/receipts'].some(
    path => location.pathname.startsWith(path)
  );
  const isFinanceActive = ['/control/transactions', '/control/reports', '/control/audit-log'].some(
    path => location.pathname.startsWith(path)
  );

  const toggleMenu = (menu) => {
    setOpenMenus(prev => ({
      ...prev,
      [menu]: !prev[menu]
    }));
  };

  // فتح القوائم تلقائياً إذا كان المسار الحالي بداخلها
  useState(() => {
    if (isAppointmentsActive) setOpenMenus(prev => ({ ...prev, appointments: true }));
    if (isInvoicesActive) setOpenMenus(prev => ({ ...prev, invoices: true }));
    if (isFinanceActive) setOpenMenus(prev => ({ ...prev, finance: true }));
  }, [location.pathname]);

  // لوحة التحكم فقط في الأعلى
  const dashboardItem = { path: '/control/dashboard', label: 'لوحة التحكم', icon: '📊' };

  const mainMenuItems = [
    { path: '/control/notes', label: 'المسودات والتذاكير', icon: '📝' },
    { path: '/control/customers', label: 'العملاء', icon: '👥' },
    { path: '/control/departments', label: 'الأقسام / السفارات', icon: '🏢' },
  ];

  const appointmentsSubMenu = [
    { path: '/control/appointments', label: 'إدارة المواعيد', icon: '📅' },
    { path: '/control/tasks', label: 'المهام', icon: '✅' },
  ];

  const invoicesSubMenu = [
    { path: '/control/invoices', label: 'الفواتير', icon: '📄' },
    { path: '/control/receipts', label: 'الإيصالات', icon: '🧾' },
  ];

  const financeSubMenu = [
    { path: '/control/transactions', label: 'السجل المالي', icon: '📒', adminOnly: true },
    { path: '/control/reports', label: 'التقارير', icon: '📈', adminOnly: true },
    { path: '/control/audit-log', label: 'سجل التدقيق', icon: '🔍', adminOnly: true }
  ];

  const bottomMenuItems = [
    ...(user?.role === 'admin' ? [
      { path: '/control/employees', label: 'الموظفين', icon: '🧑‍💼' }
    ] : []),
    { path: '/control/settings', label: 'الإعدادات', icon: '⚙️' },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <img src={logoUrl} alt="Travel Colors Logo" className="sidebar-logo-img" onError={(e) => { e.target.src = '/favicon.svg'; }} />
        <div className="sidebar-brand">
          <h1 className="sidebar-logo">Travel Colors</h1>
          <span className="sidebar-subtitle">ألوان المسافر</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {/* لوحة التحكم */}
        <NavLink
          to={dashboardItem.path}
          className={({ isActive }) =>
            `sidebar-link ${isActive ? 'active' : ''}`
          }
        >
          <span className="sidebar-icon">{dashboardItem.icon}</span>
          <span className="sidebar-label">{dashboardItem.label}</span>
        </NavLink>

        {/* المواعيد والمهام - قائمة منسدلة */}
        <div className={`sidebar-dropdown ${openMenus.appointments || isAppointmentsActive ? 'open' : ''}`}>
          <button
            className={`sidebar-dropdown-toggle ${isAppointmentsActive ? 'active' : ''}`}
            onClick={() => toggleMenu('appointments')}
          >
            <span className="sidebar-icon">📅</span>
            <span className="sidebar-label">المواعيد والمهام</span>
            <span className="sidebar-arrow">{openMenus.appointments || isAppointmentsActive ? '▼' : '◀'}</span>
          </button>
          <div className="sidebar-dropdown-menu">
            {appointmentsSubMenu.map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `sidebar-sublink ${isActive ? 'active' : ''}`
                }
              >
                <span className="sidebar-icon">{item.icon}</span>
                <span className="sidebar-label">{item.label}</span>
              </NavLink>
            ))}
          </div>
        </div>

        {/* القائمة الرئيسية */}
        {mainMenuItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''}`
            }
          >
            <span className="sidebar-icon">{item.icon}</span>
            <span className="sidebar-label">{item.label}</span>
          </NavLink>
        ))}

        {/* الفواتير والإيصالات - قائمة منسدلة */}
        <div className={`sidebar-dropdown ${openMenus.invoices || isInvoicesActive ? 'open' : ''}`}>
          <button
            className={`sidebar-dropdown-toggle ${isInvoicesActive ? 'active' : ''}`}
            onClick={() => toggleMenu('invoices')}
          >
            <span className="sidebar-icon">📄</span>
            <span className="sidebar-label">الفواتير والإيصالات</span>
            <span className="sidebar-arrow">{openMenus.invoices || isInvoicesActive ? '▼' : '◀'}</span>
          </button>
          <div className="sidebar-dropdown-menu">
            {invoicesSubMenu.map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `sidebar-sublink ${isActive ? 'active' : ''}`
                }
              >
                <span className="sidebar-icon">{item.icon}</span>
                <span className="sidebar-label">{item.label}</span>
              </NavLink>
            ))}
          </div>
        </div>

        {/* المالية - قائمة منسدلة */}
        <div className={`sidebar-dropdown ${openMenus.finance || isFinanceActive ? 'open' : ''}`}>
          <button
            className={`sidebar-dropdown-toggle ${isFinanceActive ? 'active' : ''}`}
            onClick={() => toggleMenu('finance')}
          >
            <span className="sidebar-icon">💰</span>
            <span className="sidebar-label">المالية</span>
            <span className="sidebar-arrow">{openMenus.finance || isFinanceActive ? '▼' : '◀'}</span>
          </button>
          <div className="sidebar-dropdown-menu">
            {financeSubMenu.map(item => {
              const isLocked = item.adminOnly && user?.role !== 'admin';
              return isLocked ? (
                <div
                  key={item.path}
                  className="sidebar-sublink locked"
                  title="هذا القسم للمدراء فقط"
                >
                  <span className="sidebar-icon">{item.icon}</span>
                  <span className="sidebar-label">{item.label}</span>
                  <span className="admin-badge">🔒</span>
                </div>
              ) : (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `sidebar-sublink ${isActive ? 'active' : ''}`
                  }
                >
                  <span className="sidebar-icon">{item.icon}</span>
                  <span className="sidebar-label">{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        </div>

        {/* فاصل */}
        <div className="sidebar-divider"></div>

        {/* القائمة السفلية */}
        {bottomMenuItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''}`
            }
          >
            <span className="sidebar-icon">{item.icon}</span>
            <span className="sidebar-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <p>© 2026 Travel Colors</p>
      </div>
    </aside>
  );
};

export default Sidebar;
