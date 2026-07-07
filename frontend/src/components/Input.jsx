export default function Input({ label, error, className = "", textarea = false, ...props }) {
  const Component = textarea ? "textarea" : "input";
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-ink-secondary">{label}</label>
      )}
      <Component
        className={`w-full bg-bg-surface/60 border border-white/10 rounded-xl px-4 py-2.5 text-ink-primary placeholder:text-ink-muted focus:border-clay/50 focus:outline-none focus:ring-2 focus:ring-clay/20 focus:shadow-glow transition-all duration-200 ${
          textarea ? "min-h-[100px] resize-y" : ""
        } ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
}