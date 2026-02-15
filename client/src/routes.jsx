import { createBrowserRouter, Navigate } from 'react-router-dom';
import { useAuth } from './context';

// Layouts
import AdminLayout from './components/layout/AdminLayout';

// Auth Pages
import Login from './pages/auth/Login';

// Public Pages
import Home from './pages/public/Home';

// Admin Pages
import Dashboard from './pages/admin/Dashboard';
import Appointments from './pages/admin/Appointments';
import AddAppointment from './pages/admin/AddAppointment';
import Trips from './pages/admin/Trips';
import Bookings from './pages/admin/Bookings';
import Customers from './pages/admin/Customers';
import CustomerDetails from './pages/admin/CustomerDetails';
import Departments from './pages/admin/Departments';
import Employees from './pages/admin/Employees';
import Settings from './pages/admin/Settings';
import Notes from './pages/admin/Notes';
import Reports from './pages/admin/Reports';
import CashRegister from './pages/admin/CashRegister';
import Invoices from './pages/admin/Invoices';
import Receipts from './pages/admin/Receipts';
import Transactions from './pages/admin/Transactions';
import AuditLog from './pages/admin/AuditLog';
import Tasks from './pages/admin/Tasks';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Public Route (redirect to dashboard if authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (isAuthenticated) {
    return <Navigate to="/control/dashboard" replace />;
  }

  return children;
};

const router = createBrowserRouter([
  // Public Routes
  {
    path: '/',
    element: <Home />
  },
  {
    path: '/login',
    element: (
      <PublicRoute>
        <Login />
      </PublicRoute>
    )
  },

  // Redirect old /admin routes to /control
  {
    path: '/admin/*',
    element: <Navigate to="/control" replace />
  },

  // Control Panel Routes (formerly Admin)
  {
    path: '/control',
    element: (
      <ProtectedRoute allowedRoles={['employee', 'admin']}>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/control/dashboard" replace />
      },
      {
        path: 'dashboard',
        element: <Dashboard />
      },
      {
        path: 'appointments',
        element: <Appointments />
      },
      {
        path: 'appointments/add',
        element: <AddAppointment />
      },
      {
        path: 'tasks',
        element: <Tasks />
      },
      {
        path: 'notes',
        element: <Notes />
      },
      {
        path: 'trips',
        element: <Trips />
      },
      {
        path: 'bookings',
        element: <Bookings />
      },
      {
        path: 'customers',
        element: <Customers />
      },
      {
        path: 'customers/:id',
        element: <CustomerDetails />
      },
      {
        path: 'departments',
        element: <Departments />
      },
      {
        path: 'cash-register',
        element: <CashRegister />
      },
      {
        path: 'invoices',
        element: <Invoices />
      },
      {
        path: 'receipts',
        element: <Receipts />
      },
      {
        path: 'transactions',
        element: <Transactions />
      },
      {
        path: 'audit-log',
        element: (
          <ProtectedRoute allowedRoles={['admin']}>
            <AuditLog />
          </ProtectedRoute>
        )
      },
      {
        path: 'employees',
        element: (
          <ProtectedRoute allowedRoles={['admin']}>
            <Employees />
          </ProtectedRoute>
        )
      },
      {
        path: 'settings',
        element: <Settings />
      },
      {
        path: 'reports',
        element: (
          <ProtectedRoute allowedRoles={['admin']}>
            <Reports />
          </ProtectedRoute>
        )
      }
    ]
  },

  // 404
  {
    path: '*',
    element: <Navigate to="/" replace />
  }
]);

export default router;
