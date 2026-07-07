import { motion } from "framer-motion";

const LEVELS = [
  { max: 20, label: "Beginner", color: "#9C8F86" },
  { max: 40, label: "Familiar", color: "#F2A488" },
  { max: 60, label: "Connected", color: "#E8946F" },
  { max: 80, label: "Trusted", color: "#E07A5F" },
  { max: 100, label: "Deep Relationship", color: "#C24B2E" },
];

function getLevel(score) {
  return LEVELS.find((l) => score <= l.max) || LEVELS[LEVELS.length - 1];
}

export default function MemoryRing({ score = 0, size = 160 }) {
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, score));
  const offset = circumference - (clamped / 100) * circumference;
  const level = getLevel(clamped);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(148, 163, 184, 0.1)"
            strokeWidth="10"
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={level.color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            style={{
              filter: `drop-shadow(0 0 8px ${level.color}80)`,
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            className="text-3xl font-display font-bold text-ink-primary"
          >
            {clamped}
          </motion.span>
          <span className="text-xs text-ink-muted">Memory Score</span>
        </div>
      </div>
      <span
        className="text-sm font-medium px-3 py-1 rounded-full glass"
        style={{ color: level.color }}
      >
        {level.label}
      </span>
    </div>
  );
}
