import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { useAuth } from './context';
import { useClientAuth } from './context/ClientAuthContext';
import { Loader } from './components/common';
import NotFound from './pages/public/NotFound';

// Layouts — eager (needed for admin shell)
import AdminLayout from './components/layout/AdminLayout';

// Eager imports — الصفحات الأساسية التي يزورها الزائر فوراً
import Home from './pages/public/Home';
import Login from './pages/auth/Login';
import ClientLogin from './pages/portal/ClientLogin';

// Lazy wrapper — يعرض Loader أثناء تحميل الصفحة
const L = (Component) => (
  <Suspense fallback={<Loader fullScreen />}>
    <Component />
  </Suspense>
);

// Public Pages — lazy loaded
const UsVisa = lazy(() => import('./pages/public/UsVisa'));
const UsVisaForm = lazy(() => import('./pages/public/UsVisaForm'));
const PrivacyPolicy = lazy(() => import('./pages/public/PrivacyPolicy'));
const Terms = lazy(() => import('./pages/public/Terms'));
const ContactUs = lazy(() => import('./pages/public/ContactUs'));
const InternationalLicense = lazy(() => import('./pages/public/InternationalLicense'));
const LicenseForm = lazy(() => import('./pages/public/LicenseForm'));
const VisaCatalog = lazy(() => import('./pages/public/VisaCatalog'));
const VisaDetail = lazy(() => import('./pages/public/VisaDetail'));
const VisaServiceForm = lazy(() => import('./pages/public/VisaServiceForm'));

// Portal Pages — lazy loaded
const ClientRegister = lazy(() => import('./pages/portal/ClientRegister'));
const ClientDashboard = lazy(() => import('./pages/portal/ClientDashboard'));
const ClientApplicationView = lazy(() => import('./pages/portal/ClientApplicationView'));
const ClientLicenseView = lazy(() => import('./pages/portal/ClientLicenseView'));
const ClientProfile = lazy(() => import('./pages/portal/ClientProfile'));
const ForgotPassword = lazy(() => import('./pages/portal/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/portal/ResetPassword'));

// Admin Pages — lazy loaded (أكبر قسم — ~20 صفحة)
const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const Appointments = lazy(() => import('./pages/admin/Appointments'));
const AddAppointment = lazy(() => import('./pages/admin/AddAppointment'));
const Trips = lazy(() => import('./pages/admin/Trips'));
const Bookings = lazy(() => import('./pages/admin/Bookings'));
const Customers = lazy(() => import('./pages/admin/Customers'));
const CustomerDetails = lazy(() => import('./pages/admin/CustomerDetails'));
const Departments = lazy(() => import('./pages/admin/Departments'));
const Employees = lazy(() => import('./pages/admin/Employees'));
const Settings = lazy(() => import('./pages/admin/Settings'));
const Notes = lazy(() => import('./pages/admin/Notes'));
const Reports = lazy(() => import('./pages/admin/Reports'));
const CashRegister = lazy(() => import('./pages/admin/CashRegister'));
const Invoices = lazy(() => import('./pages/admin/Invoices'));
const Receipts = lazy(() => import('./pages/admin/Receipts'));
const Transactions = lazy(() => import('./pages/admin/Transactions'));
const AuditLog = lazy(() => import('./pages/admin/AuditLog'));
const Tasks = lazy(() => import('./pages/admin/Tasks'));
const WebsiteManagement = lazy(() => import('./pages/admin/WebsiteManagement'));
const VisaApplications = lazy(() => import('./pages/admin/VisaApplications'));
const VisaApplicationDetails = lazy(() => import('./pages/admin/VisaApplicationDetails'));
const LicenseApplicationDetails = lazy(() => import('./pages/admin/LicenseApplicationDetails'));
const VisaServiceApplications = lazy(() => import('./pages/admin/VisaServiceApplications'));
const VisaServiceAppDetails = lazy(() => import('./pages/admin/VisaServiceAppDetails'));

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
    element: L(UsVisa)
  },
  {
    path: '/us-visa/apply',
    element: <Navigate to="/portal/login" replace />
  },
  {
    path: '/privacy',
    element: L(PrivacyPolicy)
  },
  {
    path: '/terms',
    element: L(Terms)
  },
  {
    path: '/ContactUs',
    element: L(ContactUs)
  },
  {
    path: '/visas',
    element: L(VisaCatalog)
  },
  {
    path: '/visas/:slug',
    element: L(VisaDetail)
  },
  {
    path: '/international-license',
    element: L(InternationalLicense)
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
        <Suspense fallback={<Loader fullScreen />}><ClientRegister /></Suspense>
      </ClientPublicRoute>
    )
  },
  {
    path: '/portal/forgot-password',
    element: (
      <ClientPublicRoute>
        <Suspense fallback={<Loader fullScreen />}><ForgotPassword /></Suspense>
      </ClientPublicRoute>
    )
  },
  {
    path: '/portal/reset-password/:token',
    element: (
      <ClientPublicRoute>
        <Suspense fallback={<Loader fullScreen />}><ResetPassword /></Suspense>
      </ClientPublicRoute>
    )
  },
  {
    path: '/portal/dashboard',
    element: (
      <ClientProtectedRoute>
        <Suspense fallback={<Loader fullScreen />}><ClientDashboard /></Suspense>
      </ClientProtectedRoute>
    )
  },
  {
    path: '/portal/apply',
    element: (
      <ClientProtectedRoute>
        <Suspense fallback={<Loader fullScreen />}><UsVisaForm /></Suspense>
      </ClientProtectedRoute>
    )
  },
  {
    path: '/portal/apply/:id',
    element: (
      <ClientProtectedRoute>
        <Suspense fallback={<Loader fullScreen />}><UsVisaForm /></Suspense>
      </ClientProtectedRoute>
    )
  },
  {
    path: '/portal/view/:id',
    element: (
      <ClientProtectedRoute>
        <Suspense fallback={<Loader fullScreen />}><ClientApplicationView /></Suspense>
      </ClientProtectedRoute>
    )
  },
  {
    path: '/portal/license/apply',
    element: (
      <ClientProtectedRoute>
        <Suspense fallback={<Loader fullScreen />}><LicenseForm /></Suspense>
      </ClientProtectedRoute>
    )
  },
  {
    path: '/portal/license/apply/:id',
    element: (
      <ClientProtectedRoute>
        <Suspense fallback={<Loader fullScreen />}><LicenseForm /></Suspense>
      </ClientProtectedRoute>
    )
  },
  {
    path: '/portal/profile',
    element: (
      <ClientProtectedRoute>
        <Suspense fallback={<Loader fullScreen />}><ClientProfile /></Suspense>
      </ClientProtectedRoute>
    )
  },
  {
    path: '/portal/license/view/:id',
    element: (
      <ClientProtectedRoute>
        <Suspense fallback={<Loader fullScreen />}><ClientLicenseView /></Suspense>
      </ClientProtectedRoute>
    )
  },
  {
    path: '/portal/visa-apply/:visaId',
    element: (
      <ClientProtectedRoute>
        <Suspense fallback={<Loader fullScreen />}><VisaServiceForm /></Suspense>
      </ClientProtectedRoute>
    )
  },
  {
    path: '/portal/visa-apply/:visaId/:id',
    element: (
      <ClientProtectedRoute>
        <Suspense fallback={<Loader fullScreen />}><VisaServiceForm /></Suspense>
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
        element: <Suspense fallback={<Loader />}><Dashboard /></Suspense>
      },
      {
        path: 'appointments',
        element: <Suspense fallback={<Loader />}><Appointments /></Suspense>
      },
      {
        path: 'appointments/add',
        element: <Suspense fallback={<Loader />}><AddAppointment /></Suspense>
      },
      {
        path: 'tasks',
        element: <Suspense fallback={<Loader />}><Tasks /></Suspense>
      },
      {
        path: 'notes',
        element: <Suspense fallback={<Loader />}><Notes /></Suspense>
      },
      {
        path: 'trips',
        element: <Suspense fallback={<Loader />}><Trips /></Suspense>
      },
      {
        path: 'bookings',
        element: <Suspense fallback={<Loader />}><Bookings /></Suspense>
      },
      {
        path: 'customers',
        element: <Suspense fallback={<Loader />}><Customers /></Suspense>
      },
      {
        path: 'customers/:id',
        element: <Suspense fallback={<Loader />}><CustomerDetails /></Suspense>
      },
      {
        path: 'departments',
        element: <Suspense fallback={<Loader />}><Departments /></Suspense>
      },
      {
        path: 'cash-register',
        element: <Suspense fallback={<Loader />}><CashRegister /></Suspense>
      },
      {
        path: 'invoices',
        element: <Suspense fallback={<Loader />}><Invoices /></Suspense>
      },
      {
        path: 'receipts',
        element: <Suspense fallback={<Loader />}><Receipts /></Suspense>
      },
      {
        path: 'transactions',
        element: <Suspense fallback={<Loader />}><Transactions /></Suspense>
      },
      {
        path: 'audit-log',
        element: (
          <ProtectedRoute requiredPermission="audit.view">
            <Suspense fallback={<Loader />}><AuditLog /></Suspense>
          </ProtectedRoute>
        )
      },
      {
        path: 'employees',
        element: (
          <ProtectedRoute requiredPermission="employees.manage">
            <Suspense fallback={<Loader />}><Employees /></Suspense>
          </ProtectedRoute>
        )
      },
      {
        path: 'visa-applications',
        element: <Suspense fallback={<Loader />}><VisaApplications /></Suspense>
      },
      {
        path: 'visa-applications/:id',
        element: <Suspense fallback={<Loader />}><VisaApplicationDetails /></Suspense>
      },
      {
        path: 'website',
        element: <Suspense fallback={<Loader />}><WebsiteManagement /></Suspense>
      },
      {
        path: 'contacts',
        element: <Suspense fallback={<Loader />}><WebsiteManagement initialTab="contact" /></Suspense>
      },
      {
        path: 'license-applications',
        element: <Suspense fallback={<Loader />}><WebsiteManagement initialTab="licenseApps" /></Suspense>
      },
      {
        path: 'license-applications/:id',
        element: <Suspense fallback={<Loader />}><LicenseApplicationDetails /></Suspense>
      },
      {
        path: 'visa-service-applications',
        element: <Suspense fallback={<Loader />}><VisaServiceApplications /></Suspense>
      },
      {
        path: 'visa-service-applications/:id',
        element: <Suspense fallback={<Loader />}><VisaServiceAppDetails /></Suspense>
      },
      {
        path: 'settings',
        element: <Suspense fallback={<Loader />}><Settings /></Suspense>
      },
      {
        path: 'reports',
        element: (
          <ProtectedRoute requiredPermission="reports.view">
            <Suspense fallback={<Loader />}><Reports /></Suspense>
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
