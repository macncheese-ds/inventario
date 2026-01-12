"use client"

export default function Input({
  label,
  type = "text",
  value,
  onChange,
  placeholder = "",
  required = false,
  min,
  max,
  step,
  className = "",
  name,
  icon,
  error,
  hint,
  ...props
}) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-semibold text-slate-200 mb-2.5">
          {label}
          {required && <span className="text-rose-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
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
            w-full rounded-xl border-2 bg-slate-800/50 backdrop-blur-sm
            text-slate-100 placeholder-slate-400
            px-4 py-2.5 shadow-sm
            transition-all duration-200
            ${icon ? "pl-12" : ""}
            ${
              error
                ? "border-rose-500/60 focus:ring-rose-500/30 focus:border-rose-500 text-rose-400"
                : "border-slate-700 focus:ring-blue-500/50 focus:border-blue-500 hover:border-slate-600"
            }
            focus:ring-2 focus:outline-none
          `}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-2 text-sm text-rose-400 flex items-center gap-1.5 animate-slide-up">
          <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <span>{error}</span>
        </p>
      )}
      {hint && !error && <p className="mt-2 text-sm text-slate-500">{hint}</p>}
    </div>
  )
}
