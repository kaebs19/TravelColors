import { createContext, useContext, useState, useEffect } from 'react';
import clientApi from '../api/clientApi';

const ClientAuthContext = createContext(null);

export const ClientAuthProvider = ({ children }) => {
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // التحقق من وجود عميل مسجل
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('clientToken');
      if (token) {
        try {
          const response = await clientApi.getMe();
          setClient(response.data.client);
        } catch (err) {
          localStorage.removeItem('clientToken');
          localStorage.removeItem('clientUser');
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  // تسجيل الدخول
  const login = async (credentials) => {
    try {
      setError(null);
      const response = await clientApi.login(credentials);
      const { token, client: clientData } = response.data;

      if (!token || !clientData) {
        throw new Error('بيانات الاستجابة غير صحيحة');
      }

      localStorage.setItem('clientToken', token);
      localStorage.setItem('clientUser', JSON.stringify(clientData));
      setClient(clientData);

      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'حدث خطأ في تسجيل الدخول';
      setError(message);
      return { success: false, message };
    }
  };

  // تسجيل عميل جديد
  const register = async (userData) => {
    try {
      setError(null);
      const response = await clientApi.register(userData);
      const { token, client: clientData } = response.data;

      localStorage.setItem('clientToken', token);
      localStorage.setItem('clientUser', JSON.stringify(clientData));
      setClient(clientData);

      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'حدث خطأ في التسجيل';
      setError(message);
      return { success: false, message };
    }
  };

  // تسجيل الخروج
  const logout = () => {
    localStorage.removeItem('clientToken');
    localStorage.removeItem('clientUser');
    setClient(null);
  };

  // تحديث بيانات العميل
  const updateClient = (data) => {
    setClient(prev => ({ ...prev, ...data }));
    localStorage.setItem('clientUser', JSON.stringify({ ...client, ...data }));
  };

  const value = {
    client,
    loading,
    error,
    isAuthenticated: !!client,
    login,
    register,
    logout,
    updateClient
  };

  return (
    <ClientAuthContext.Provider value={value}>
      {children}
    </ClientAuthContext.Provider>
  );
};

export const useClientAuth = () => {
  const context = useContext(ClientAuthContext);
  if (!context) {
    throw new Error('useClientAuth must be used within a ClientAuthProvider');
  }
  return context;
};
