export default function Select({ label, error, children, className = "", ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-ink-secondary">{label}</label>
      )}
      <select
        className={`w-full bg-bg-surface/60 border border-white/10 rounded-xl px-4 py-2.5 text-ink-primary focus:border-clay/50 focus:outline-none focus:ring-2 focus:ring-clay/20 transition-colors ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
}
