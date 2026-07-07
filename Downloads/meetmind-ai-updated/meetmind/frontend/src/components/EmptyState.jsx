import { motion } from "framer-motion";

export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center text-center py-16 px-6"
    >
      <motion.div
        className="w-16 h-16 rounded-2xl glass flex items-center justify-center mb-5 shadow-glow"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
      >
        {Icon && <Icon size={28} className="text-clay-soft" />}
      </motion.div>
      <h3 className="text-lg font-display font-semibold text-ink-primary mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-ink-muted max-w-sm mb-5">{description}</p>
      )}
      {action}
    </motion.div>
  );
}