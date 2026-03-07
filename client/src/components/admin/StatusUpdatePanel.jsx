import './StatusUpdatePanel.css';

/**
 * Shared StatusUpdatePanel — status buttons + admin notes + save button.
 * Used across all admin detail pages.
 *
 * @param {object} statusMap        - STATUS_MAP with { key: { label, color, bg } }
 * @param {string} currentStatus    - Current application status
 * @param {string} adminNotes       - Admin notes value
 * @param {function} onStatusChange - (newStatus) => void
 * @param {function} onNotesChange  - (notes) => void
 * @param {function} onSave         - async () => void
 * @param {boolean} saving          - Is saving in progress
 * @param {string[]} excludeStatuses - Status keys to hide (default: ['draft'])
 */
const StatusUpdatePanel = ({
  statusMap,
  currentStatus,
  adminNotes,
  onStatusChange,
  onNotesChange,
  onSave,
  saving,
  excludeStatuses = ['draft']
}) => {
  return (
    <div className="admin-status-panel">
      <div className="admin-status-buttons">
        {Object.entries(statusMap)
          .filter(([key]) => !excludeStatuses.includes(key))
          .map(([key, val]) => (
            <button
              key={key}
              className={`admin-status-btn ${currentStatus === key ? 'active' : ''}`}
              style={{ '--btn-color': val.color, '--btn-bg': val.bg }}
              onClick={() => onStatusChange(key)}
            >
              {val.label}
            </button>
          ))
        }
      </div>
      <textarea
        value={adminNotes}
        onChange={e => onNotesChange(e.target.value)}
        placeholder="ملاحظات الأدمن..."
        rows={3}
        className="admin-notes-textarea"
      />
      <button
        className="admin-save-btn"
        onClick={onSave}
        disabled={saving}
      >
        {saving ? 'جاري التحديث...' : 'حفظ التغييرات'}
      </button>
    </div>
  );
};

export default StatusUpdatePanel;
