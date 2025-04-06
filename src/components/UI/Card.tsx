import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
  variant?: 'default' | 'glass' | 'outlined';
}

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  onClick,
  hoverable = false,
  variant = 'default',
}) => {
  const baseClasses = 'rounded-lg transition-all duration-300 ease-in-out overflow-hidden';
  
  const variantClasses = {
    default: 'bg-white shadow-md dark:bg-gray-800 dark:shadow-gray-900/30',
    glass: 'bg-white/10 backdrop-blur-lg border border-white/20 shadow-lg dark:bg-gray-900/30 dark:border-gray-700/30',
    outlined: 'border border-gray-200 dark:border-gray-700',
  };
  
  const hoverClasses = hoverable
    ? 'hover:shadow-xl transform hover:-translate-y-1 cursor-pointer dark:hover:shadow-gray-900/40'
    : '';
  
  const clickableClass = onClick ? 'cursor-pointer' : '';

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${hoverClasses} ${clickableClass} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default Card; 