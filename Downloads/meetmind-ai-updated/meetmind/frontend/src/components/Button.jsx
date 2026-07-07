import { motion } from "framer-motion";

const variants = {
  primary:
    "bg-gradient-to-r from-clay to-clay-soft text-white font-semibold shadow-glow hover:shadow-glow-lg",
  secondary:
    "glass border border-clay/20 text-ink-primary hover:border-clay/40",
  ghost: "text-ink-secondary hover:text-ink-primary hover:bg-ink-primary/5",
  danger: "bg-clay/10 text-clay-bright border border-clay/20 hover:bg-clay/20",
};

export default function Button({
  children,
  variant = "primary",
  className = "",
  loading = false,
  disabled = false,
  type = "button",
  onClick,
  ...props
}) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      whileHover={disabled || loading ? {} : { scale: 1.03 }}
      whileTap={disabled || loading ? {} : { scale: 0.96 }}
      transition={{ type: "spring", stiffness: 420, damping: 22 }}
      className={`px-5 py-2.5 rounded-xl text-sm transition-shadow duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${variants[variant]} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : null}
      {children}
    </motion.button>
  );
}