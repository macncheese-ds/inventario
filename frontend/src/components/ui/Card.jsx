import React from 'react';

export default function Card({ children, className = '', variant = 'default', hover = false, ...props }) {
  const variants = {
    default: 'bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-slate-200/60 dark:border-slate-700/60',
    glass: 'bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border border-white/30 dark:border-slate-600/30',
    gradient: 'bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border border-slate-200/60 dark:border-slate-700/60',
    elevated: 'bg-white dark:bg-slate-800 border-0 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50',
  };

  const hoverEffect = hover 
    ? 'transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1 hover:border-indigo-200 dark:hover:border-indigo-800' 
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
