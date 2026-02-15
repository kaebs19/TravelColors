import { RouterProvider } from 'react-router-dom';
import { AuthProvider, AppProvider } from './context';
import router from './routes';
import './styles/globals.css';

function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <RouterProvider router={router} />
      </AppProvider>
    </AuthProvider>
  );
}

export default App;
