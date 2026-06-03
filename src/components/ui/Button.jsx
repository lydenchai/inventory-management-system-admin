import React from 'react';
import PropTypes from 'prop-types';

const variants = {
  primary: 'bg-[#1e3a5f] hover:bg-[#16375b] text-white',
  secondary: 'bg-gray-100 hover:bg-gray-200 text-[#1e3a5f] border border-gray-100',
  danger: 'bg-red-500 hover:bg-red-600 text-white',
  dangerOutline: 'bg-transparent text-red-500 hover:bg-red-50 border border-red-500',
};

export default function Button({ children, variant = 'primary', className = '', ...props }) {
  const baseStyle = 'px-6 py-2 rounded-xl focus:outline-none flex items-center justify-center gap-2 cursor-pointer text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
  const variantStyle = variants[variant] || variants.primary;

  return (
    <button className={`${baseStyle} ${variantStyle} ${className}`} {...props}>
      {children}
    </button>
  );
}

Button.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(Object.keys(variants)),
  className: PropTypes.string,
};
