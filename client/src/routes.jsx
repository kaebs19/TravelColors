import { createBrowserRouter, Navigate } from 'react-router-dom';
import { useAuth } from './context';
import { useClientAuth } from './context/ClientAuthContext';
import { Loader } from './components/common';
import NotFound from './pages/public/NotFound';

// Layouts
import AdminLayout from './components/layout/AdminLayout';

// Auth Pages
import Login from './pages/auth/Login';

// Public Pages
import Home from './pages/public/Home';
import UsVisa from './pages/public/UsVisa';
import UsVisaForm from './pages/public/UsVisaForm';
import PrivacyPolicy from './pages/public/PrivacyPolicy';
import Terms from './pages/public/Terms';
import ContactUs from './pages/public/ContactUs';
import InternationalLicense from './pages/public/InternationalLicense';
import LicenseForm from './pages/public/LicenseForm';
import VisaCatalog from './pages/public/VisaCatalog';
import VisaDetail from './pages/public/VisaDetail';
import VisaServiceForm from './pages/public/VisaServiceForm';

// Portal Pages (Client)
import ClientLogin from './pages/portal/ClientLogin';
import ClientRegister from './pages/portal/ClientRegister';
import ClientDashboard from './pages/portal/ClientDashboard';
import ClientApplicationView from './pages/portal/ClientApplicationView';
import ClientLicenseView from './pages/portal/ClientLicenseView';
import ClientProfile from './pages/portal/ClientProfile';
import ForgotPassword from './pages/portal/ForgotPassword';
import ResetPassword from './pages/portal/ResetPassword';

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
import WebsiteManagement from './pages/admin/WebsiteManagement';
import VisaApplications from './pages/admin/VisaApplications';
import VisaApplicationDetails from './pages/admin/VisaApplicationDetails';
import LicenseApplicationDetails from './pages/admin/LicenseApplicationDetails';
import VisaServiceApplications from './pages/admin/VisaServiceApplications';
import VisaServiceAppDetails from './pages/admin/VisaServiceAppDetails';

// Protected Route Component (Admin/Employee)
const ProtectedRoute = ({ children, allowedRoles = [], requiredPermission }) => {
  const { isAuthenticated, user, hasPermission, loading } = useAuth();

  if (loading) {
    return <Loader fullScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to="/control/dashboard" replace />;
  }

  return children;
};

// Public Route (redirect to admin dashboard if authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <Loader fullScreen />;
  }

  if (isAuthenticated) {
    return <Navigate to="/control/dashboard" replace />;
  }

  return children;
};

// Client Protected Route (redirect to portal login if not authenticated)
const ClientProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useClientAuth();

  if (loading) {
    return <Loader fullScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/portal/login" replace />;
  }

  return children;
};

// Client Public Route (redirect to dashboard if already authenticated)
const ClientPublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useClientAuth();

  if (loading) {
    return <Loader fullScreen />;
  }

  if (isAuthenticated) {
    return <Navigate to="/portal/dashboard" replace />;
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
    path: '/us-visa',
    element: <UsVisa />
  },
  {
    path: '/us-visa/apply',
    element: <Navigate to="/portal/login" replace />
  },
  {
    path: '/privacy',
    element: <PrivacyPolicy />
  },
  {
    path: '/terms',
    element: <Terms />
  },
  {
    path: '/ContactUs',
    element: <ContactUs />
  },
  {
    path: '/visas',
    element: <VisaCatalog />
  },
  {
    path: '/visas/:slug',
    element: <VisaDetail />
  },
  {
    path: '/international-license',
    element: <InternationalLicense />
  },
  {
    path: '/login',
    element: (
      <PublicRoute>
        <Login />
      </PublicRoute>
    )
  },

  // === Portal Routes (Client) ===
  {
    path: '/portal/login',
    element: (
      <ClientPublicRoute>
        <ClientLogin />
      </ClientPublicRoute>
    )
  },
  {
    path: '/portal/register',
    element: (
      <ClientPublicRoute>
        <ClientRegister />
      </ClientPublicRoute>
    )
  },
  {
    path: '/portal/forgot-password',
    element: (
      <ClientPublicRoute>
        <ForgotPassword />
      </ClientPublicRoute>
    )
  },
  {
    path: '/portal/reset-password/:token',
    element: (
      <ClientPublicRoute>
        <ResetPassword />
      </ClientPublicRoute>
    )
  },
  {
    path: '/portal/dashboard',
    element: (
      <ClientProtectedRoute>
        <ClientDashboard />
      </ClientProtectedRoute>
    )
  },
  {
    path: '/portal/apply',
    element: (
      <ClientProtectedRoute>
        <UsVisaForm />
      </ClientProtectedRoute>
    )
  },
  {
    path: '/portal/apply/:id',
    element: (
      <ClientProtectedRoute>
        <UsVisaForm />
      </ClientProtectedRoute>
    )
  },
  {
    path: '/portal/view/:id',
    element: (
      <ClientProtectedRoute>
        <ClientApplicationView />
      </ClientProtectedRoute>
    )
  },
  {
    path: '/portal/license/apply',
    element: (
      <ClientProtectedRoute>
        <LicenseForm />
      </ClientProtectedRoute>
    )
  },
  {
    path: '/portal/license/apply/:id',
    element: (
      <ClientProtectedRoute>
        <LicenseForm />
      </ClientProtectedRoute>
    )
  },
  {
    path: '/portal/profile',
    element: (
      <ClientProtectedRoute>
        <ClientProfile />
      </ClientProtectedRoute>
    )
  },
  {
    path: '/portal/license/view/:id',
    element: (
      <ClientProtectedRoute>
        <ClientLicenseView />
      </ClientProtectedRoute>
    )
  },
  {
    path: '/portal/visa-apply/:visaId',
    element: (
      <ClientProtectedRoute>
        <VisaServiceForm />
      </ClientProtectedRoute>
    )
  },
  {
    path: '/portal/visa-apply/:visaId/:id',
    element: (
      <ClientProtectedRoute>
        <VisaServiceForm />
      </ClientProtectedRoute>
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
      <ProtectedRoute allowedRoles={['employee', 'accountant', 'admin']}>
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
          <ProtectedRoute requiredPermission="audit.view">
            <AuditLog />
          </ProtectedRoute>
        )
      },
      {
        path: 'employees',
        element: (
          <ProtectedRoute requiredPermission="employees.manage">
            <Employees />
          </ProtectedRoute>
        )
      },
      {
        path: 'visa-applications',
        element: <VisaApplications />
      },
      {
        path: 'visa-applications/:id',
        element: <VisaApplicationDetails />
      },
      {
        path: 'website',
        element: <WebsiteManagement />
      },
      {
        path: 'contacts',
        element: <WebsiteManagement initialTab="contact" />
      },
      {
        path: 'license-applications',
        element: <WebsiteManagement initialTab="licenseApps" />
      },
      {
        path: 'license-applications/:id',
        element: <LicenseApplicationDetails />
      },
      {
        path: 'visa-service-applications',
        element: <VisaServiceApplications />
      },
      {
        path: 'visa-service-applications/:id',
        element: <VisaServiceAppDetails />
      },
      {
        path: 'settings',
        element: <Settings />
      },
      {
        path: 'reports',
        element: (
          <ProtectedRoute requiredPermission="reports.view">
            <Reports />
          </ProtectedRoute>
        )
      }
    ]
  },

  // 404
  {
    path: '*',
    element: <NotFound />
  }
]);

export default router;
