import { createContext, useContext, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";

const ToastContext = createContext(null);

let idCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message, type = "success") => {
    const id = ++idCounter;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 4000);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full px-4 sm:px-0">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60, scale: 0.9, transition: { duration: 0.2 } }}
              transition={{ type: "spring", stiffness: 380, damping: 20 }}
              className="glass rounded-xl px-4 py-3 flex items-center gap-3 shadow-card border-l-2"
              style={{
                borderLeftColor:
                  toast.type === "error" ? "#f87171" : toast.type === "info" ? "#34D399" : "#22C55E",
              }}
            >
              {toast.type === "error" ? (
                <XCircle size={18} className="text-red-400 shrink-0" />
              ) : toast.type === "info" ? (
                <Info size={18} className="text-clay-soft shrink-0" />
              ) : (
                <CheckCircle2 size={18} className="text-clay-bright shrink-0" />
              )}
              <p className="text-sm text-ink-secondary flex-1">{toast.message}</p>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-ink-muted hover:text-ink-primary transition-colors"
                aria-label="Dismiss notification"
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}