import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import {
  Brain,
  Sparkles,
  Search,
  Clock,
  MessageSquare,
  ArrowRight,
  PlayCircle,
  Mic,
  ListChecks,
} from "lucide-react";
import ParticleNetwork from "../components/ParticleNetwork";
import Button from "../components/Button";

const FEATURES = [
  {
    icon: Mic,
    title: "Voice Meeting Notes",
    description: "Just speak after a conversation, in your own language — Sarvam AI transcribes it and MeetMind takes it from there.",
  },
  {
    icon: ListChecks,
    title: "Commitments That Follow Up",
    description: "\"I'll send that by Friday\" becomes a tracked promise automatically — reminded, escalated, and closed without a to-do list.",
  },
  {
    icon: Sparkles,
    title: "AI Meeting Prep",
    description: "One-click briefs before every meeting — relationship summary, open commitments, and talking points, generated instantly.",
  },
  {
    icon: MessageSquare,
    title: "AI Brief Generation",
    description: "Full relationship briefings with things to remember, open loops, and conversation starters, ready to copy or export.",
  },
  {
    icon: Clock,
    title: "Memory Timeline",
    description: "Every conversation logged in a premium vertical timeline so you never lose the thread of a relationship.",
  },
  {
    icon: Search,
    title: "AI Memory Search",
    description: "Ask in plain language — \"who is building a startup?\" — and instantly find the right people.",
  },
];

const DEMO_PEOPLE = [
  {
    initials: "RS",
    name: "Rohan Sharma",
    role: "Founder · Fintech Startup",
    remember: "Daughter named Anaya · Loves cricket",
    loop: "Send portfolio deck by Friday",
  },
  {
    initials: "PS",
    name: "Priya Sharma",
    role: "Senior PM · Bluepeak Technologies",
    remember: "Training for a half-marathon · Has a dog named Max",
    loop: "Send book recommendation this week",
  },
  {
    initials: "AK",
    name: "Arjun Kapoor",
    role: "Angel Investor",
    remember: "Just moved to Bangalore · Enjoys chess",
    loop: "Intro him to the design lead",
  },
];

function useScrollShrink() {
  const [shrunk, setShrunk] = useState(false);
  useEffect(() => {
    const onScroll = () => setShrunk(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return shrunk;
}

function DemoCard() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((i) => (i + 1) % DEMO_PEOPLE.length);
    }, 3200);
    return () => clearInterval(interval);
  }, []);

  const person = DEMO_PEOPLE[index];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, delay: 0.4 }}
      className="mt-20 glass rounded-3xl p-8 max-w-3xl mx-auto shadow-glow-lg"
    >
      <motion.div
        key={person.initials}
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-clay to-glow-light flex items-center justify-center font-display font-semibold text-white text-sm">
              {person.initials}
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-ink-primary">{person.name}</p>
              <p className="text-xs text-ink-muted">{person.role}</p>
            </div>
          </div>
          <span className="text-xs px-3 py-1 rounded-full bg-clay/10 text-clay-soft border border-clay/20">
            Trusted
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
          <div className="rounded-xl bg-bg-surface/60 border border-white/5 p-4">
            <p className="text-xs text-ink-muted mb-2">Things to remember</p>
            <p className="text-sm text-ink-secondary">{person.remember}</p>
          </div>
          <div className="rounded-xl bg-bg-surface/60 border border-white/5 p-4">
            <p className="text-xs text-ink-muted mb-2">Open loops</p>
            <p className="text-sm text-ink-secondary">{person.loop}</p>
          </div>
        </div>
      </motion.div>
      <div className="flex items-center justify-center gap-1.5 mt-6">
        {DEMO_PEOPLE.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === index ? "w-6 bg-clay" : "w-1.5 bg-clay/20"
            }`}
          />
        ))}
      </div>
    </motion.div>
  );
}

export default function Landing() {
  const shrunk = useScrollShrink();

  return (
    <div className="min-h-screen overflow-x-hidden">
      <ParticleNetwork />

      {/* Nav */}
      <motion.header
        animate={{
          paddingTop: shrunk ? 12 : 24,
          paddingBottom: shrunk ? 12 : 24,
        }}
        transition={{ duration: 0.25 }}
        className={`sticky top-0 z-20 max-w-7xl mx-auto px-6 flex items-center justify-between transition-colors duration-300 ${
          shrunk ? "glass shadow-card backdrop-blur-md rounded-b-2xl" : ""
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-clay to-clay-soft flex items-center justify-center shadow-glow">
            <Brain size={20} className="text-white" />
          </div>
          <span className="font-display font-bold text-lg text-ink-primary">MeetMind AI</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/signin">
            <Button variant="ghost">Sign in</Button>
          </Link>
          <Link to="/signup">
            <Button variant="primary">Get Started</Button>
          </Link>
        </div>
      </motion.header>

      {/* Hero */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pt-20 pb-28 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-clay/20 text-xs font-medium text-clay-soft mb-8"
        >
          <Sparkles size={14} />
          Never forget what matters about the people who matter
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6"
        >
          Remember Every Person.
          <br />
          <span className="text-gradient">Keep Every Promise.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg text-ink-muted max-w-2xl mx-auto mb-10"
        >
          Speak or type a quick note after every conversation. MeetMind remembers the person,
          and quietly tracks what you promised — until it's actually done.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link to="/signup">
            <Button variant="primary" className="px-8 py-3.5 text-base">
              Get Started <ArrowRight size={18} />
            </Button>
          </Link>
          <Link to="/signin">
            <Button variant="secondary" className="px-8 py-3.5 text-base">
              <PlayCircle size={18} /> Watch Demo
            </Button>
          </Link>
        </motion.div>

        {/* Hero visual: rotating live demo preview */}
        <DemoCard />
      </section>

      {/* Features */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pb-28">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-3">
            Everything you need to <span className="text-gradient">never forget</span>
          </h2>
          <p className="text-ink-muted max-w-xl mx-auto">
            A relationship intelligence system built on persistent AI memory.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="glass glass-hover rounded-2xl p-6"
            >
              <motion.div
                className="w-11 h-11 rounded-xl bg-clay/10 border border-clay/20 flex items-center justify-center mb-4"
                animate={{ scale: [1, 1.08, 1] }}
                transition={{
                  duration: 2.4,
                  repeat: Infinity,
                  repeatType: "loop",
                  delay: i * 0.3,
                  ease: "easeInOut",
                }}
              >
                <f.icon size={20} className="text-clay-soft" />
              </motion.div>
              <h3 className="font-display font-semibold text-ink-primary mb-2">{f.title}</h3>
              <p className="text-sm text-ink-muted leading-relaxed">{f.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 pb-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="glass rounded-3xl p-12 shadow-glow"
        >
          <h2 className="font-display text-3xl font-bold mb-4">
            Wow your network. <span className="text-gradient">Starting today.</span>
          </h2>
          <p className="text-ink-muted mb-8 max-w-lg mx-auto">
            Create your account and start building your second brain for relationships.
          </p>
          <Link to="/signup">
            <Button variant="primary" className="px-8 py-3.5 text-base">
              Get Started <ArrowRight size={18} />
            </Button>
          </Link>
        </motion.div>
      </section>

      <footer className="relative z-10 max-w-7xl mx-auto px-6 py-8 text-center text-xs text-ink-muted border-t border-white/5">
        MeetMind AI — Your Second Brain For Relationships
      </footer>
    </div>
  );
}