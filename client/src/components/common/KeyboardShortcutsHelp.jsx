import { useEffect } from 'react';
import './KeyboardShortcutsHelp.css';

const KeyboardShortcutsHelp = ({ isOpen, onClose, shortcuts }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="shortcuts-overlay" onClick={onClose}>
      <div className="shortcuts-modal" onClick={(e) => e.stopPropagation()}>
        <div className="shortcuts-header">
          <h2>اختصارات لوحة المفاتيح</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="shortcuts-content">
          {Object.entries(shortcuts).map(([category, items]) => (
            <div key={category} className="shortcuts-category">
              <h3>{category}</h3>
              <div className="shortcuts-list">
                {items.map((item, index) => (
                  <div key={index} className="shortcut-item">
                    <kbd className="shortcut-key">{item.key}</kbd>
                    <span className="shortcut-desc">{item.description}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="shortcuts-footer">
          <span>اضغط <kbd>?</kbd> لإظهار/إخفاء هذه النافذة</span>
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcutsHelp;
