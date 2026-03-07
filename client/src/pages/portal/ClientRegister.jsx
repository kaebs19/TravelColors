import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// تم دمج التسجيل مع صفحة تسجيل الدخول
const ClientRegister = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/portal/login?tab=register', { replace: true });
  }, [navigate]);

  return null;
};

export default ClientRegister;
