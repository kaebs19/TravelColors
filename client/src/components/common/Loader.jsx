import './Loader.css';

const Loader = ({ size = 'medium', fullScreen = false, text }) => {
  if (fullScreen) {
    return (
      <div className="loader-fullscreen">
        <div className={`loader loader-${size}`}>
          <div className="loader-spinner" />
          <span>{text || 'جاري التحميل...'}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`loader loader-${size}`}>
      <div className="loader-spinner" />
      {text && <span>{text}</span>}
    </div>
  );
};

export default Loader;
