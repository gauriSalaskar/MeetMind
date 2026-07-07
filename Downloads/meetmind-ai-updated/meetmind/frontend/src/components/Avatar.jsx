import { motion } from "framer-motion";

const CATEGORY_COLORS = {
  Friend: "from-clay to-clay-soft",
  Mentor: "from-glow-light to-clay-soft",
  Recruiter: "from-clay-bright to-glow-pale",
  Founder: "from-clay to-glow-light",
  Investor: "from-glow-pale to-clay-soft",
  Client: "from-clay-soft to-clay-bright",
  Student: "from-clay/70 to-glow-light/70",
  Other: "from-ink-muted/40 to-clay/40",
};

export default function Avatar({ initials, category = "Other", size = "md" }) {
  const sizes = {
    sm: "w-9 h-9 text-xs",
    md: "w-12 h-12 text-sm",
    lg: "w-20 h-20 text-xl",
  };
  const gradient = CATEGORY_COLORS[category] || CATEGORY_COLORS.Other;

  return (
    <motion.div
      whileHover={{ scale: 1.12 }}
      transition={{ type: "spring", stiffness: 400, damping: 15 }}
      className={`${sizes[size]} rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center font-display font-semibold text-white shrink-0 shadow-glow`}
    >
      {initials}
    </motion.div>
  );
}