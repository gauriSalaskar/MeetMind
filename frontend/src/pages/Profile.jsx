import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { motion } from "framer-motion";
import { User, Mail, Calendar, LogOut, Send } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { notificationsApi } from "../api/endpoints";
import { useToast } from "../context/ToastContext";
import Card from "../components/Card";
import Button from "../components/Button";

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [sending, setSending] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/signin");
  };

  const handleSendDigest = async () => {
    setSending(true);
    try {
      const res = await notificationsApi.checkNow();
      showToast(res.data.message, res.data.sent ? "success" : "info");
    } catch (err) {
      showToast(err.response?.data?.error || "Could not send digest", "error");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink-primary">Profile</h1>
        <p className="text-ink-muted mt-1">Your account details.</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Card hover={false}>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-clay to-glow-light flex items-center justify-center font-display font-bold text-white text-2xl">
              {(user?.name || "?").slice(0, 1).toUpperCase()}
            </div>
            <div>
              <h2 className="font-display text-xl font-semibold text-ink-primary">{user?.name}</h2>
              <p className="text-sm text-ink-muted">{user?.email}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 rounded-xl bg-bg-surface/60 border border-white/5 p-4">
              <User size={16} className="text-clay-soft" />
              <div>
                <p className="text-xs text-ink-muted">Name</p>
                <p className="text-sm text-ink-primary">{user?.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-bg-surface/60 border border-white/5 p-4">
              <Mail size={16} className="text-clay-soft" />
              <div>
                <p className="text-xs text-ink-muted">Email</p>
                <p className="text-sm text-ink-primary">{user?.email}</p>
              </div>
            </div>
            {user?.created_at && (
              <div className="flex items-center gap-3 rounded-xl bg-bg-surface/60 border border-white/5 p-4">
                <Calendar size={16} className="text-clay-soft" />
                <div>
                  <p className="text-xs text-ink-muted">Member since</p>
                  <p className="text-sm text-ink-primary">{new Date(user.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            )}
          </div>

          <Button variant="danger" className="w-full mt-6" onClick={handleLogout}>
            <LogOut size={16} /> Log out
          </Button>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <Card hover={false}>
          <h3 className="font-display font-semibold text-ink-primary mb-1">Commitment Email Digest</h3>
          <p className="text-sm text-ink-muted mb-4">
            You'll automatically get a daily email of due &amp; overdue commitments at 8am,
            if email notifications are configured on the server. Use this to send yourself
            one right now for testing.
          </p>
          <Button variant="secondary" onClick={handleSendDigest} disabled={sending}>
            <Send size={16} /> {sending ? "Sending..." : "Send Digest Now"}
          </Button>
        </Card>
      </motion.div>
    </div>
  );
}