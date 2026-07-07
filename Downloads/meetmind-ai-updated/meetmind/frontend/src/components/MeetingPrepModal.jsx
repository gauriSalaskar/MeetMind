import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Sparkles, Users, Clock, Lightbulb, ListChecks, MessageCircle, Target,
} from "lucide-react";
import { aiApi } from "../api/endpoints";
import Modal from "./Modal";
import AILoading from "./AILoading";
import { useToast } from "../context/ToastContext";

const SECTIONS = [
  { key: "relationship_summary", label: "Relationship Summary", icon: Users, type: "text" },
  { key: "last_interaction_recap", label: "Last Interaction Recap", icon: Clock, type: "text" },
  { key: "important_facts", label: "Important Facts", icon: Lightbulb, type: "list" },
  { key: "open_commitments", label: "Open Commitments", icon: ListChecks, type: "list" },
  { key: "talking_points", label: "Suggested Talking Points", icon: MessageCircle, type: "list" },
  { key: "recommended_actions", label: "Recommended Follow-Up Actions", icon: Target, type: "list" },
];

export default function MeetingPrepModal({ open, onClose, contactId, contactName }) {
  const { showToast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !contactId) return;
    setData(null);
    setLoading(true);
    aiApi
      .meetingPrep(contactId)
      .then((res) => setData(res.data))
      .catch((err) => showToast(err.response?.data?.error || "Could not generate meeting prep", "error"))
      .finally(() => setLoading(false));
  }, [open, contactId]);

  return (
    <Modal open={open} onClose={onClose} title={`AI Meeting Prep — ${contactName || ""}`}>
      <div className="flex items-center gap-2 mb-5 px-3 py-2 rounded-xl bg-clay/10 border border-clay/20">
        <Sparkles size={14} className="text-clay-soft" />
        <span className="text-xs text-clay-soft font-medium">
          Generated from recalled memories — your AI command center for this meeting
        </span>
      </div>

      {loading ? (
        <AILoading label="Recalling memories and preparing your brief..." />
      ) : data ? (
        <div className="space-y-4">
          {SECTIONS.map(({ key, label, icon: Icon, type }, i) => {
            const value = data[key];
            const hasContent = type === "list" ? Array.isArray(value) && value.length > 0 : !!value;
            if (!hasContent) return null;

            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className="rounded-xl bg-bg-surface/60 border border-white/5 p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon size={15} className="text-clay-soft" />
                  <h4 className="text-sm font-semibold text-ink-primary">{label}</h4>
                </div>
                {type === "text" ? (
                  <p className="text-sm text-ink-secondary leading-relaxed">{value}</p>
                ) : (
                  <ul className="space-y-1.5">
                    {value.map((item, idx) => (
                      <li key={idx} className="text-sm text-ink-secondary flex items-start gap-2">
                        <span className="text-clay-soft mt-1">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </motion.div>
            );
          })}
          {SECTIONS.every(({ key, type }) => {
            const value = data[key];
            return type === "list" ? !(Array.isArray(value) && value.length) : !value;
          }) && (
            <p className="text-sm text-ink-muted text-center py-6">
              Not enough memory yet to generate a brief. Log a meeting with this contact first.
            </p>
          )}
        </div>
      ) : null}
    </Modal>
  );
}
