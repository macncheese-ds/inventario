export default function Card({ children, className = "", variant = "default", hover = false, ...props }) {
  /* Modern dark card designs with glass morphism and minimal styling */
  const variants = {
    default: "bg-slate-800/40 backdrop-blur-sm border border-slate-700/30",
    glass: "bg-slate-800/20 backdrop-blur-xl border border-slate-700/20",
    elevated: "bg-slate-800/60 backdrop-blur-md border border-slate-700/40 shadow-xl shadow-slate-900/20",
    dark: "bg-slate-900/50 border border-slate-800 shadow-lg shadow-slate-900/30 backdrop-blur-sm",
  }

  const hoverEffect = hover
    ? "transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20 hover:-translate-y-0.5 hover:border-blue-500/30"
    : "transition-all duration-200"

  return (
    <div className={`rounded-2xl p-6 ${variants[variant] || variants.default} ${hoverEffect} ${className}`} {...props}>
      {children}
    </div>
  )
}
