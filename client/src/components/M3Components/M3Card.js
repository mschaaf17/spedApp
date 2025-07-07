import React from 'react';
import PropTypes from 'prop-types';
import './M3Card.css';

const M3Card = ({
  children,
  variant = 'elevated',
  padding = 'medium',
  className = '',
  onClick,
  ...props
}) => {
  const baseClass = 'md-card';
  const variantClass = `md-card-${variant}`;
  const paddingClass = `md-card-padding-${padding}`;
  const clickableClass = onClick ? 'md-card-clickable' : '';
  
  const cardClass = [
    baseClass,
    variantClass,
    paddingClass,
    clickableClass,
    className
  ].filter(Boolean).join(' ');

  return (
    <div
      className={cardClass}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
};

M3Card.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['elevated', 'outlined', 'filled']),
  padding: PropTypes.oneOf(['none', 'small', 'medium', 'large']),
  className: PropTypes.string,
  onClick: PropTypes.func,
};

export default M3Card; 