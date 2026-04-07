import React from 'react';

export default function Input({ 
  label, 
  type = 'text', 
  value, 
  onChange, 
  placeholder = '',
  required = false,
  min,
  max,
  step,
  className = '',
  name,
  icon,
  error,
  hint,
  ...props
}) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
          {label}
          {required && <span className="text-rose-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            {icon}
          </div>
        )}
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          min={min}
          max={max}
          step={step}
          name={name}
          className={`
            w-full rounded-xl border-2 bg-white/10 dark:bg-slate-900/50 backdrop-blur-sm
            text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500
            px-4 py-2.5 shadow-sm
            transition-all duration-200
            ${icon ? 'pl-11' : ''}
            ${error 
              ? 'border-rose-300 dark:border-rose-600 focus:ring-rose-500/20 focus:border-rose-500' 
              : 'border-slate-200 dark:border-slate-700 focus:ring-slate-400/20 focus:border-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
            }
            focus:ring-4 focus:outline-none
          `}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1.5 text-sm text-rose-600 dark:text-rose-400 flex items-center gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
      {hint && !error && (
        <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">{hint}</p>
      )}
    </div>
  );
}
