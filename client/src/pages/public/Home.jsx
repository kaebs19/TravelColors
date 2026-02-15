import { Link } from 'react-router-dom';
import { Button } from '../../components/common';
import './Home.css';

const Home = () => {
  return (
    <div className="home-page">
      <header className="home-header">
        <div className="container">
          <nav className="home-nav">
            <div className="home-logo">
              <h1>Travel Colors</h1>
              <span>ألوان المسافر</span>
            </div>
            <div className="home-nav-links">
              <Link to="/login">
                <Button variant="outline">تسجيل الدخول</Button>
              </Link>
            </div>
          </nav>
        </div>
      </header>

      <main className="home-hero">
        <div className="container">
          <div className="hero-content">
            <h2>رحلتك القادمة تبدأ من هنا</h2>
            <p>اكتشف أجمل الوجهات السياحية مع ألوان المسافر</p>
            <div className="hero-buttons">
              <Button size="large">استكشف الرحلات</Button>
              <Button variant="outline" size="large">تواصل معنا</Button>
            </div>
          </div>
        </div>
      </main>

      <section className="home-features">
        <div className="container">
          <h3>لماذا ألوان المسافر؟</h3>
          <div className="features-grid">
            <div className="feature-card">
              <span className="feature-icon">✈️</span>
              <h4>رحلات متنوعة</h4>
              <p>نوفر لك رحلات محلية ودولية بأفضل الأسعار</p>
            </div>
            <div className="feature-card">
              <span className="feature-icon">🛡️</span>
              <h4>حجز آمن</h4>
              <p>نظام حجز موثوق وآمن لضمان راحتك</p>
            </div>
            <div className="feature-card">
              <span className="feature-icon">💬</span>
              <h4>دعم متواصل</h4>
              <p>فريق دعم متاح على مدار الساعة</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="home-footer">
        <div className="container">
          <p>© 2024 Travel Colors - ألوان المسافر. جميع الحقوق محفوظة</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
