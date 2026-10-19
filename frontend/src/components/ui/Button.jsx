import React from 'react';
import { trLocal } from '../../i18n/index.js';

export default function Button({ 
  children, 
  variant = 'primary', 
  size = 'md',
  onClick, 
  type = 'button', 
  className = '',
  disabled = false,
  loading = false,
  icon,
  ...props
}) {
  const baseClasses = 'relative inline-flex items-center justify-center font-medium transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 dark:focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const sizeClasses = {
    sm: 'px-2.5 py-1 text-xs rounded gap-1.5',
    md: 'px-3.5 py-2 text-sm rounded-md gap-2',
    lg: 'px-5 py-2.5 text-base rounded-md gap-2.5',
  };
  
  const variantClasses = {
    primary: 'bg-teal-700 hover:bg-teal-800 text-white focus:ring-teal-600 dark:bg-teal-600 dark:hover:bg-teal-500',
    secondary: 'bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 focus:ring-slate-400 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100 dark:border-slate-700',
    danger: 'bg-white hover:bg-rose-50 text-rose-700 border border-rose-300 focus:ring-rose-500 dark:bg-transparent dark:hover:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
    success: 'bg-emerald-700 hover:bg-emerald-800 text-white focus:ring-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-500',
    ghost: 'bg-transparent hover:bg-slate-100 text-slate-600 hover:text-slate-900 focus:ring-slate-400 dark:hover:bg-slate-800 dark:text-slate-300 dark:hover:text-white',
    outline: 'bg-white border border-slate-400 text-slate-700 hover:bg-slate-50 focus:ring-slate-400 dark:bg-transparent dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${sizeClasses[size] || sizeClasses.md} ${variantClasses[variant] || variantClasses.primary} ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>{trLocal('loading')}</span>
        </>
      ) : (
        <>
          {icon && <span className="flex-shrink-0">{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
}
