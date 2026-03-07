import { Component } from 'react';
import './ErrorBoundary.css';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <span className="error-boundary-icon">⚠️</span>
          <h2 className="error-boundary-title">حدث خطأ غير متوقع</h2>
          <p className="error-boundary-desc">نعتذر عن هذا الخطأ. يرجى المحاولة مرة أخرى.</p>
          <div className="error-boundary-actions">
            <button className="error-boundary-btn" onClick={this.handleReset}>
              إعادة المحاولة
            </button>
            <button className="error-boundary-btn secondary" onClick={() => window.location.href = '/'}>
              الصفحة الرئيسية
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
