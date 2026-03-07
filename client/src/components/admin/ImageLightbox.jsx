import { useEffect } from 'react';
import './ImageLightbox.css';

/**
 * Shared ImageLightbox — modal for viewing images and PDFs.
 * Used across all admin detail pages.
 *
 * @param {string} src         - File URL
 * @param {string} title       - Document title
 * @param {boolean} isPdf      - Show as iframe (PDF) vs img
 * @param {function} onClose   - Close handler
 * @param {boolean} showHeader - Show header bar (default: true)
 */
const ImageLightbox = ({ src, title, isPdf, onClose, showHeader = true }) => {
  // ESC key handler
  useEffect(() => {
    if (!src) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [src, onClose]);

  if (!src) return null;

  const handleDownload = (e) => {
    e.stopPropagation();
    window.open(src, '_blank');
  };

  return (
    <div className="admin-lightbox-overlay" onClick={onClose}>
      <div className="admin-lightbox-content" onClick={e => e.stopPropagation()}>
        {showHeader && (
          <div className="admin-lightbox-header">
            <span className="admin-lightbox-title">{title || 'عرض المستند'}</span>
            <div className="admin-lightbox-actions">
              <button className="admin-lightbox-download" onClick={handleDownload} title="فتح في تبويب جديد">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
              </button>
              <button className="admin-lightbox-close" onClick={onClose}>✕</button>
            </div>
          </div>
        )}
        <div className="admin-lightbox-body">
          {isPdf ? (
            <iframe src={src} title={title || 'PDF'} className="admin-lightbox-iframe" />
          ) : (
            <img src={src} alt={title || ''} />
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageLightbox;
