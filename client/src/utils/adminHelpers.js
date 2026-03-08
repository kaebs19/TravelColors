/**
 * Shared admin utilities — used across VisaServiceAppDetails, VisaApplicationDetails, LicenseApplicationDetails
 */

const API_URL = (process.env.REACT_APP_API_URL || 'http://localhost:5002/api').replace(/\/api\/?$/, '');

/* ─── Arabic/Persian digits → English ─── */
export const toEnDigits = (str) => {
  if (!str && str !== 0) return str;
  return String(str)
    .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d))
    .replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d));
};

/* ─── Format date (unified locale) ─── */
export const formatDate = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric', month: '2-digit', day: '2-digit'
  });
};

export const formatDateTime = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  });
};

/* ─── Build full image URL from relative path ─── */
export const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${API_URL}${path}`;
};

/* ─── Copy text to clipboard with fallback ─── */
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(String(text));
  } catch {
    const t = document.createElement('textarea');
    t.value = String(text);
    document.body.appendChild(t);
    t.select();
    document.execCommand('copy');
    document.body.removeChild(t);
  }
};

/* ─── Base status map — pages can override labels as needed ─── */
export const BASE_STATUS_MAP = {
  draft:        { label: 'مسودة',       color: 'var(--status-draft)',     bg: 'var(--status-draft-bg)' },
  submitted:    { label: 'قيد الانتظار', color: 'var(--status-submitted)', bg: 'var(--status-submitted-bg)' },
  under_review: { label: 'قيد المراجعة', color: 'var(--status-review)',    bg: 'var(--status-review-bg)' },
  approved:     { label: 'مقبول',       color: 'var(--status-approved)',  bg: 'var(--status-approved-bg)' },
  rejected:     { label: 'مرفوض',       color: 'var(--status-rejected)',  bg: 'var(--status-rejected-bg)' },
  completed:    { label: 'مكتمل',       color: 'var(--status-completed)', bg: 'var(--status-completed-bg)' },
  received:     { label: 'مُستلم',      color: 'var(--status-received)',  bg: 'var(--status-received-bg)' },
};
