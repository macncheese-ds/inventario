import React from 'react';

export default function Card({ children, className = '', variant = 'default', hover = false, ...props }) {
  const variants = {
    default: 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800',
    glass: 'bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-md',
    gradient: 'bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 border border-slate-200 dark:border-slate-800',
    elevated: 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none',
  };

  const hoverEffect = hover 
    ? 'transition-all duration-300 hover:shadow-xl hover:shadow-slate-200 dark:hover:shadow-black hover:-translate-y-1 hover:border-slate-300 dark:hover:border-slate-700' 
    : 'transition-all duration-200';

  return (
    <div 
      className={`rounded-2xl shadow-lg p-6 ${variants[variant] || variants.default} ${hoverEffect} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
