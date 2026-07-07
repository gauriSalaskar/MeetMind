import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  ListChecks,
  Search,
  User,
  LogOut,
  Brain,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import ParticleNetwork from "./ParticleNetwork";
import NotificationBell from "./NotificationBell";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Home", icon: LayoutDashboard },
  { to: "/contacts", label: "People", icon: Users },
  { to: "/search", label: "Ask MeetMind", icon: Search },
  { to: "/reminders", label: "Commitments", icon: ListChecks },
  { to: "/profile", label: "Profile", icon: User },
];

export default function AppLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/signin");
  };

  return (
    <div className="min-h-screen flex">
      <ParticleNetwork variant="minimal" />

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 glass border-b border-white/5 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-clay to-clay-soft flex items-center justify-center shadow-glow">
            <Brain size={16} className="text-white" />
          </div>
          <span className="font-display font-semibold text-ink-primary">MeetMind AI</span>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="text-ink-secondary"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-64 glass border-r border-white/5 flex flex-col z-50 transition-transform duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="p-6 hidden lg:flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-clay to-clay-soft flex items-center justify-center shadow-glow">
            <Brain size={20} className="text-white" />
          </div>
          <div>
            <h1 className="font-display font-bold text-ink-primary text-lg leading-tight">MeetMind AI</h1>
            <p className="text-xs text-ink-muted">Second Brain</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-4 lg:py-0 mt-16 lg:mt-0 space-y-1.5 overflow-y-auto relative">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
            const isActive = location.pathname === to || location.pathname.startsWith(to + "/");
            return (
              <NavLink
                key={to}
                to={to}
                onClick={() => setMobileOpen(false)}
                className={`relative flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors duration-200 ${
                  isActive
                    ? "text-clay-soft"
                    : "text-ink-secondary hover:bg-white/5 hover:text-ink-primary"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-nav-pill"
                    className="absolute inset-0 bg-clay/10 border border-clay/20 shadow-glow rounded-xl"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
                <Icon size={18} className="relative z-10" />
                <span className="relative z-10">{label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3 px-2 py-2 mb-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-clay to-glow-light flex items-center justify-center font-display font-semibold text-white text-sm shrink-0">
              {(user?.name || "?").slice(0, 1).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-ink-primary truncate">{user?.name}</p>
              <p className="text-xs text-ink-muted truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-ink-secondary hover:bg-red-500/10 hover:text-red-400 transition-all duration-200"
          >
            <LogOut size={18} />
            Log out
          </button>
        </div>
      </aside>

      {/* Backdrop for mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Desktop notification bell */}
      <div className="hidden lg:block fixed top-5 right-6 z-40">
        <NotificationBell />
      </div>

      {/* Main content */}
      <main className="flex-1 min-w-0 pt-16 lg:pt-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}