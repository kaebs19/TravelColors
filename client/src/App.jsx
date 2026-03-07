import { RouterProvider } from 'react-router-dom';
import { AuthProvider, AppProvider, ClientAuthProvider, ToastProvider } from './context';
import { ErrorBoundary } from './components/common';
import router from './routes';
import './styles/globals.css';
import './styles/Toast.css';

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <AppProvider>
            <ClientAuthProvider>
              <RouterProvider router={router} />
            </ClientAuthProvider>
          </AppProvider>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
