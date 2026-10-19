import React from 'react';

export default function Card({ children, className = '', hover = false, ...props }) {
  const hoverEffect = hover ? 'transition-colors duration-150 hover:border-slate-300 dark:hover:border-slate-700' : '';

  return (
    <div 
      className={`rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 ${hoverEffect} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
