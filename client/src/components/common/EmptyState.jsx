import './EmptyState.css';

const EmptyState = ({ icon = '📭', title = 'لا توجد بيانات', description, actionLabel, onAction }) => (
  <div className="empty-state">
    <span className="empty-state-icon">{icon}</span>
    <h3 className="empty-state-title">{title}</h3>
    {description && <p className="empty-state-desc">{description}</p>}
    {actionLabel && onAction && (
      <button className="empty-state-btn" onClick={onAction}>
        {actionLabel}
      </button>
    )}
  </div>
);

export default EmptyState;
