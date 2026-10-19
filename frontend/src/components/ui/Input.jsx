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
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
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
            w-full rounded-md border bg-white dark:bg-slate-950
            text-slate-900 dark:text-slate-100 placeholder-slate-400
            px-3 py-2 text-sm
            transition-colors duration-150
            ${icon ? 'pl-11' : ''}
            ${error 
              ? 'border-rose-400 focus:ring-rose-500/20 focus:border-rose-500' 
              : 'border-slate-300 dark:border-slate-700 focus:ring-teal-600/20 focus:border-teal-600 dark:focus:border-teal-500 hover:border-slate-400 dark:hover:border-slate-600'
            }
            focus:ring-2 focus:outline-none
          `}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1.5 text-sm text-rose-600 dark:text-rose-400">
          {error}
        </p>
      )}
      {hint && !error && (
        <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">{hint}</p>
      )}
    </div>
  );
}
