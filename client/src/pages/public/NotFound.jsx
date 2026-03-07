import { useNavigate } from 'react-router-dom';
import './LegalPage.css';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '70vh',
      padding: '2rem',
      textAlign: 'center',
      fontFamily: "'Tajawal', 'Cairo', sans-serif"
    }}>
      <span style={{ fontSize: '5rem', lineHeight: 1, marginBottom: '1rem' }}>404</span>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1f2937', margin: '0 0 0.5rem' }}>
        الصفحة غير موجودة
      </h1>
      <p style={{ fontSize: '1rem', color: '#6b7280', margin: '0 0 1.5rem' }}>
        عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها.
      </p>
      <button
        onClick={() => navigate('/')}
        style={{
          padding: '0.625rem 2rem',
          border: 'none',
          borderRadius: '8px',
          background: '#0d9488',
          color: '#fff',
          fontSize: '0.9rem',
          fontWeight: 600,
          cursor: 'pointer'
        }}
      >
        العودة للرئيسية
      </button>
    </div>
  );
};

export default NotFound;
