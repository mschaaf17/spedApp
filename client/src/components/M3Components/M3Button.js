import React from 'react';
import PropTypes from 'prop-types';
import './M3Button.css';

const M3Button = ({
  children,
  variant = 'filled',
  size = 'medium',
  disabled = false,
  startIcon,
  endIcon,
  onClick,
  className = '',
  type = 'button',
  fullWidth = false,
  ...props
}) => {
  const baseClass = 'md-button';
  const variantClass = `md-button-${variant}`;
  const sizeClass = `md-button-${size}`;
  const widthClass = fullWidth ? 'md-button-full-width' : '';
  const disabledClass = disabled ? 'md-button-disabled' : '';
  
  const buttonClass = [
    baseClass,
    variantClass,
    sizeClass,
    widthClass,
    disabledClass,
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      className={buttonClass}
      onClick={onClick}
      disabled={disabled}
      type={type}
      {...props}
    >
      {startIcon && <span className="md-button-icon md-button-icon-start">{startIcon}</span>}
      <span className="md-button-content">{children}</span>
      {endIcon && <span className="md-button-icon md-button-icon-end">{endIcon}</span>}
    </button>
  );
};

M3Button.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['filled', 'outlined', 'text', 'elevated', 'tonal']),
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  disabled: PropTypes.bool,
  startIcon: PropTypes.node,
  endIcon: PropTypes.node,
  onClick: PropTypes.func,
  className: PropTypes.string,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  fullWidth: PropTypes.bool,
};

export default M3Button; 