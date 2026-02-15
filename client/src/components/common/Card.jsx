import './Card.css';

const Card = ({
  children,
  title,
  subtitle,
  image,
  footer,
  className = '',
  hoverable = false,
  onClick
}) => {
  const classes = [
    'card',
    hoverable && 'card-hoverable',
    onClick && 'card-clickable',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} onClick={onClick}>
      {image && (
        <div className="card-image">
          <img src={image} alt={title || ''} />
        </div>
      )}
      <div className="card-body">
        {title && <h3 className="card-title">{title}</h3>}
        {subtitle && <p className="card-subtitle">{subtitle}</p>}
        {children}
      </div>
      {footer && (
        <div className="card-footer">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;
