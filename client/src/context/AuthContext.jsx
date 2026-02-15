import { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // التحقق من وجود مستخدم مسجل
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await authApi.getMe();
          setUser(response.data.user);
        } catch (err) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
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
      const response = await authApi.login(credentials);
      // التحقق من بنية الاستجابة
      const data = response.data || response;
      const { token, user } = data;

      if (!token || !user) {
        throw new Error('بيانات الاستجابة غير صحيحة');
      }

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);

      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'حدث خطأ في تسجيل الدخول';
      setError(message);
      return { success: false, message };
    }
  };

  // تسجيل مستخدم جديد
  const register = async (userData) => {
    try {
      setError(null);
      const response = await authApi.register(userData);
      const { token, user } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);

      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'حدث خطأ في التسجيل';
      setError(message);
      return { success: false, message };
    }
  };

  // تسجيل الخروج
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  // تحديث بيانات المستخدم
  const updateUser = (userData) => {
    setUser(prev => ({ ...prev, ...userData }));
    localStorage.setItem('user', JSON.stringify({ ...user, ...userData }));
  };

  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isEmployee: user?.role === 'employee' || user?.role === 'admin',
    login,
    register,
    logout,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
