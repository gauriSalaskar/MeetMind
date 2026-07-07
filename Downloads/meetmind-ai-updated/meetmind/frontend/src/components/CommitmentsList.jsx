import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import { useState } from "react";
import { commitmentsApi } from "../api/endpoints";

const LABELS = {
  open: "Open",
  due_today: "Due today",
  overdue: "Overdue",
  done: "Done",
};

const BURST_PARTICLES = Array.from({ length: 6 }, (_, i) => {
  const angle = (i / 6) * Math.PI * 2;
  return { x: Math.cos(angle) * 18, y: Math.sin(angle) * 18 };
});

/**
 * Shows a contact's (or the whole account's) open commitments -- things
 * that were said in a meeting or voice note and are being tracked until
 * they're followed through on.
 */
export default function CommitmentsList({ commitments, onChanged, emptyText = "No commitments yet." }) {
  const [burstId, setBurstId] = useState(null);

  const toggleDone = async (commitment) => {
    const willBeDone = !commitment.done;
    if (willBeDone) {
      setBurstId(commitment.id);
      setTimeout(() => setBurstId(null), 500);
    }
    await commitmentsApi.update(commitment.id, { done: willBeDone, closed_via: "manual" });
    onChanged?.();
  };

  if (!commitments || commitments.length === 0) {
    return <p className="text-sm text-ink-muted italic">{emptyText}</p>;
  }

  return (
    <ul className="space-y-2">
      <AnimatePresence initial={false}>
        {commitments.map((c) => (
          <motion.li
            key={c.id}
            layout
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="flex items-center justify-between gap-3 glass rounded-xl px-4 py-3"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative shrink-0">
                <motion.button
                  onClick={() => toggleDone(c)}
                  whileTap={{ scale: 0.85 }}
                  className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                    c.done ? "bg-sage border-sage" : "border-ink-muted hover:border-clay"
                  }`}
                >
                  {c.done && <Check size={12} className="text-white" />}
                </motion.button>
                {burstId === c.id && (
                  <>
                    {BURST_PARTICLES.map((p, i) => (
                      <motion.span
                        key={i}
                        className="absolute top-1/2 left-1/2 w-1.5 h-1.5 rounded-full bg-sage pointer-events-none"
                        initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                        animate={{ x: p.x, y: p.y, opacity: 0, scale: 0 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                      />
                    ))}
                  </>
                )}
              </div>
              <span className={`text-sm truncate ${c.done ? "line-through text-ink-muted" : "text-ink-primary"}`}>
                {c.text}
                {c.contact_name ? <span className="text-ink-muted"> — {c.contact_name}</span> : null}
              </span>
            </div>
            <span className={`pill pill-${c.status} shrink-0`}>
              {LABELS[c.status]}
              {c.due_date ? ` · ${c.due_date}` : ""}
            </span>
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
}