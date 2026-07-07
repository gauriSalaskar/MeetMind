import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import { commitmentsApi } from "../api/endpoints";

export default function NotificationBell() {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  const fetchDue = () => {
    commitmentsApi
      .list()
      .then((res) => {
        const all = res.data.commitments || [];
        setItems(all.filter((c) => c.status === "due_today" || c.status === "overdue"));
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchDue();
    const interval = setInterval(fetchDue, 60000); // poll every 60s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative w-9 h-9 rounded-lg flex items-center justify-center text-ink-secondary hover:bg-white/5 hover:text-ink-primary transition-colors"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {items.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-amber-500 text-[10px] font-bold text-white flex items-center justify-center">
            {items.length > 9 ? "9+" : items.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto glass border border-white/10 rounded-xl shadow-xl z-50 p-3">
          <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-2 px-1">
            Due &amp; Overdue Commitments
          </p>
          {items.length === 0 ? (
            <p className="text-sm text-ink-muted text-center py-6">You're all caught up.</p>
          ) : (
            <div className="space-y-1">
              {items.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setOpen(false);
                    if (c.contact_id) navigate(`/contacts/${c.contact_id}`);
                  }}
                  className="w-full text-left px-2 py-2 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <p className="text-sm text-ink-primary truncate">{c.text}</p>
                  <p
                    className={`text-xs ${
                      c.status === "overdue" ? "text-red-400" : "text-amber-400"
                    }`}
                  >
                    {c.status === "overdue" ? "Overdue" : "Due today"}
                    {c.contact_name ? ` · ${c.contact_name}` : ""}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}