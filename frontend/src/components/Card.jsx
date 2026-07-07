import { motion } from "framer-motion";

export default function Card({ children, className = "", hover = true, ...props }) {
  return (
    <motion.div
      whileHover={hover ? { y: -4, scale: 1.005 } : {}}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className={`glass rounded-2xl p-6 ${hover ? "hover:shadow-glow" : ""} ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
}