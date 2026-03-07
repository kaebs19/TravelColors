import { useState } from 'react';
import { toEnDigits, copyToClipboard } from '../../utils/adminHelpers';
import './DataRow.css';

/**
 * Shared DataRow — displays label + value with a hover-visible copy button.
 * Used across all admin detail pages (VisaService, VisaApplication, License).
 *
 * @param {string} label        - Field label
 * @param {string|number} value - Raw value
 * @param {string} dir          - 'ltr' | 'rtl' (default: 'rtl')
 * @param {boolean} copyable    - Show copy button (default: true)
 * @param {string} className    - Additional class
 */
const DataRow = ({ label, value, dir, copyable = true, className }) => {
  const [copied, setCopied] = useState(false);

  if (!value && value !== 0) return null;

  const displayVal = toEnDigits(value);

  const handleCopy = async (e) => {
    e.stopPropagation();
    await copyToClipboard(displayVal);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className={`admin-data-row ${className || ''}`}>
      <span className="admin-data-label">{label}</span>
      <div className="admin-data-value-wrap">
        <span className="admin-data-value" dir={dir || 'rtl'}>{displayVal}</span>
        {copyable && (
          <button
            className={`admin-copy-btn ${copied ? 'copied' : ''}`}
            onClick={handleCopy}
            title="نسخ"
          >
            {copied ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5" /></svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default DataRow;
