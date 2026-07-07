import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, Sparkles, Copy, Download, Users, Lightbulb, ListChecks,
  MessageCircle, Target, Check,
} from "lucide-react";
import { aiApi, contactsApi } from "../api/endpoints";
import Card from "../components/Card";
import Button from "../components/Button";
import AILoading from "../components/AILoading";
import { useToast } from "../context/ToastContext";

export default function AIBrief() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [contact, setContact] = useState(null);
  const [brief, setBrief] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    contactsApi.get(id).then((res) => setContact(res.data.contact));
    setLoading(true);
    aiApi
      .brief(id)
      .then((res) => setBrief(res.data))
      .catch((err) => showToast(err.response?.data?.error || "Could not generate brief", "error"))
      .finally(() => setLoading(false));
  }, [id]);

  const buildBriefText = () => {
    if (!brief) return "";
    const lines = [];
    lines.push(`AI Relationship Brief — ${brief.contact_name || contact?.name || ""}`);
    if (brief.contact_role || brief.contact_company) {
      lines.push(`${brief.contact_role || ""}${brief.contact_company ? ` at ${brief.contact_company}` : ""}`);
    }
    lines.push("");
    if (brief.relationship_summary) {
      lines.push("RELATIONSHIP SUMMARY");
      lines.push(brief.relationship_summary);
      lines.push("");
    }
    const section = (title, items) => {
      if (items && items.length) {
        lines.push(title.toUpperCase());
        items.forEach((it) => lines.push(`- ${it}`));
        lines.push("");
      }
    };
    section("Things to Remember", brief.things_to_remember);
    section("Open Loops", brief.open_loops);
    section("Conversation Starters", brief.conversation_starters);
    section("Suggested Actions", brief.suggested_actions);
    return lines.join("\n");
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildBriefText());
      setCopied(true);
      showToast("Brief copied to clipboard", "success");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast("Could not copy to clipboard", "error");
    }
  };

  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await aiApi.exportBriefPdf(id);
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(contact?.name || "brief").replace(/\s+/g, "_")}_brief.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast("Brief exported as PDF", "success");
    } catch {
      showToast("Could not export PDF", "error");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate(`/contacts/${id}`)}
        className="flex items-center gap-2 text-sm text-ink-muted hover:text-ink-primary transition-colors"
      >
        <ArrowLeft size={16} /> Back to {contact?.name || "Contact"}
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink-primary flex items-center gap-2">
            <Sparkles size={24} className="text-clay-soft" /> AI Brief
          </h1>
          <p className="text-ink-muted mt-1">
            {contact?.name ? `Full relationship briefing for ${contact.name}` : "Generating your briefing..."}
          </p>
        </div>
        {!loading && brief && (
          <div className="flex gap-3">
            <Button variant="secondary" onClick={handleCopy}>
              {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? "Copied" : "Copy Brief"}
            </Button>
            <Button variant="primary" onClick={handleExport} disabled={exporting}>
              <Download size={16} /> {exporting ? "Exporting..." : "Export PDF"}
            </Button>
          </div>
        )}
      </div>

      {loading ? (
        <Card hover={false}>
          <AILoading label="Building your full relationship briefing..." />
        </Card>
      ) : brief ? (
        <div className="space-y-4">
          {brief.relationship_summary && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card hover={false}>
                <div className="flex items-center gap-2 mb-2">
                  <Users size={15} className="text-clay-soft" />
                  <h3 className="font-display font-semibold text-ink-primary">Relationship Summary</h3>
                </div>
                <p className="text-sm text-ink-secondary leading-relaxed">{brief.relationship_summary}</p>
              </Card>
            </motion.div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <BriefSection title="Things to Remember" icon={Lightbulb} items={brief.things_to_remember} delay={0.05} />
            <BriefSection title="Open Loops" icon={ListChecks} items={brief.open_loops} delay={0.1} />
            <BriefSection title="Conversation Starters" icon={MessageCircle} items={brief.conversation_starters} delay={0.15} />
            <BriefSection title="Suggested Actions" icon={Target} items={brief.suggested_actions} delay={0.2} />
          </div>
        </div>
      ) : (
        <Card hover={false}>
          <p className="text-sm text-ink-muted text-center py-8">Could not generate a brief for this contact.</p>
        </Card>
      )}
    </div>
  );
}

function BriefSection({ title, icon: Icon, items, delay }) {
  if (!items || items.length === 0) return null;
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
      <Card hover={false}>
        <div className="flex items-center gap-2 mb-3">
          <Icon size={15} className="text-clay-soft" />
          <h3 className="font-display font-semibold text-ink-primary text-sm">{title}</h3>
        </div>
        <ul className="space-y-2">
          {items.map((item, idx) => (
            <li key={idx} className="text-sm text-ink-secondary flex items-start gap-2">
              <span className="text-clay-soft mt-1 shrink-0">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </Card>
    </motion.div>
  );
}