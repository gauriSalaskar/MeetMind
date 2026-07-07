import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Brain, Home } from "lucide-react";
import ParticleNetwork from "../components/ParticleNetwork";
import Button from "../components/Button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 text-center">
      <ParticleNetwork variant="minimal" />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md"
      >
        <div className="w-16 h-16 rounded-2xl glass flex items-center justify-center mx-auto mb-6 shadow-glow">
          <Brain size={28} className="text-clay-soft" />
        </div>
        <h1 className="font-display text-3xl font-bold text-ink-primary mb-3">
          This Memory Doesn't Exist.
        </h1>
        <p className="text-ink-muted mb-8">
          The page you're looking for has been forgotten — or never existed at all.
        </p>
        <Link to="/">
          <Button variant="primary" className="mx-auto">
            <Home size={16} /> Return Home
          </Button>
        </Link>
      </motion.div>
    </div>
  );
}