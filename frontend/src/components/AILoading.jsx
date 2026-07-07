import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export default function AILoading({ label = "MeetMind AI is thinking..." }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-4">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
        className="w-14 h-14 rounded-2xl glass flex items-center justify-center shadow-glow relative"
      >
        <motion.div
          className="absolute inset-0 rounded-2xl border-2 border-clay-soft/40"
          animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <Sparkles size={22} className="text-clay-soft" />
      </motion.div>
      <div className="flex items-center gap-2">
        <p className="text-sm text-ink-muted">{label}</p>
        <span className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="w-1 h-1 rounded-full bg-clay-soft"
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
            />
          ))}
        </span>
      </div>
    </div>
  );
}