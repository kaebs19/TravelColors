import './Loader.css';

const Loader = ({ size = 'medium', fullScreen = false }) => {
  if (fullScreen) {
    return (
      <div className="loader-fullscreen">
        <div className={`loader loader-${size}`}>
          <div className="loader-spinner" />
          <span>جاري التحميل...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`loader loader-${size}`}>
      <div className="loader-spinner" />
    </div>
  );
};

export default Loader;
