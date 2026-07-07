import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, AlertCircle, Calendar, CalendarClock, Check, Trash2, Plus, ListChecks } from "lucide-react";
import { remindersApi, contactsApi, commitmentsApi } from "../api/endpoints";
import Card from "../components/Card";
import Button from "../components/Button";
import Input from "../components/Input";
import Select from "../components/Select";
import Modal from "../components/Modal";
import EmptyState from "../components/EmptyState";
import CommitmentsList from "../components/CommitmentsList";
import { SkeletonCard } from "../components/Skeleton";
import { useToast } from "../context/ToastContext";

const SECTIONS = [
  { key: "overdue", label: "Overdue", icon: AlertCircle, color: "text-clay-bright" },
  { key: "today", label: "Today", icon: Calendar, color: "text-clay-soft" },
  { key: "upcoming", label: "Upcoming", icon: CalendarClock, color: "text-ink-secondary" },
];

const EMPTY_FORM = { title: "", due_date: "", contact_id: "" };

export default function Reminders() {
  const { showToast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const [commitments, setCommitments] = useState([]);
  const [commitmentsLoading, setCommitmentsLoading] = useState(true);

  const fetchReminders = useCallback(() => {
    setLoading(true);
    remindersApi.list().then((res) => setData(res.data)).finally(() => setLoading(false));
  }, []);

  const fetchCommitments = useCallback(() => {
    setCommitmentsLoading(true);
    commitmentsApi
      .list()
      .then((res) => setCommitments(res.data.commitments))
      .finally(() => setCommitmentsLoading(false));
  }, []);

  useEffect(() => {
    fetchReminders();
    fetchCommitments();
    contactsApi.list().then((res) => setContacts(res.data.contacts));
  }, [fetchReminders, fetchCommitments]);

  const handleComplete = async (id) => {
    try {
      await remindersApi.update(id, { completed: true });
      showToast("Reminder completed", "success");
      fetchReminders();
    } catch (err) {
      showToast(err.response?.data?.error || "Could not update reminder", "error");
    }
  };

  const handleDelete = async (id) => {
    try {
      await remindersApi.remove(id);
      showToast("Reminder deleted", "success");
      fetchReminders();
    } catch (err) {
      showToast(err.response?.data?.error || "Could not delete reminder", "error");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await remindersApi.create(form);
      showToast("Reminder created", "success");
      setModalOpen(false);
      setForm(EMPTY_FORM);
      fetchReminders();
    } catch (err) {
      showToast(err.response?.data?.error || "Could not create reminder", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const totalCount = data ? data.overdue.length + data.today.length + data.upcoming.length : 0;
  const openCommitments = commitments.filter((c) => !c.done);

  return (
    <div className="space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink-primary">Commitments</h1>
          <p className="text-ink-muted mt-1">Everything you or they promised, and everything you've scheduled to follow up on.</p>
        </div>
        <Button variant="primary" onClick={() => setModalOpen(true)}>
          <Plus size={16} /> Add Reminder
        </Button>
      </div>

      {/* Auto-tracked commitments (from meetings / voice notes) */}
      <div className="space-y-3">
        <h2 className="font-display text-lg font-semibold flex items-center gap-2 text-ink-primary">
          <ListChecks size={18} className="text-clay-soft" /> Tracked Promises
          <span className="text-sm text-ink-muted">({openCommitments.length} open)</span>
        </h2>
        {commitmentsLoading ? (
          <SkeletonCard />
        ) : (
          <Card hover={false}>
            <CommitmentsList
              commitments={commitments}
              onChanged={fetchCommitments}
              emptyText="Nothing tracked yet — these appear automatically when you log a meeting or voice note with an action item."
            />
          </Card>
        )}
      </div>

      {/* Manually scheduled reminders */}
      <div className="space-y-4">
        <h2 className="font-display text-lg font-semibold flex items-center gap-2 text-ink-primary">
          <Bell size={18} className="text-clay-soft" /> Scheduled Reminders
        </h2>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : totalCount === 0 ? (
          <Card hover={false}>
            <EmptyState
              icon={Bell}
              title="No reminders yet"
              description="Create a reminder to follow up with someone, or log a meeting with a follow-up date."
              action={
                <Button variant="primary" onClick={() => setModalOpen(true)}>
                  <Plus size={16} /> Add Reminder
                </Button>
              }
            />
          </Card>
        ) : (
          <div className="space-y-8">
            {SECTIONS.map(({ key, label, icon: Icon, color }) => {
              const items = data?.[key] || [];
              if (items.length === 0) return null;
              return (
                <div key={key} className="space-y-3">
                  <h3 className={`font-display text-base font-semibold flex items-center gap-2 ${color}`}>
                    <Icon size={16} /> {label} <span className="text-sm text-ink-muted">({items.length})</span>
                  </h3>
                  <div className="space-y-2">
                    <AnimatePresence>
                      {items.map((r) => (
                        <motion.div
                          key={r.id}
                          initial={{ opacity: 0, x: -12 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                        >
                          <Card hover={false} className="flex items-center justify-between py-4">
                            <div className="min-w-0">
                              {r.contact_id ? (
                                <Link to={`/contacts/${r.contact_id}`} className="font-medium text-ink-primary hover:text-clay-soft transition-colors truncate block">
                                  {r.title}
                                </Link>
                              ) : (
                                <p className="font-medium text-ink-primary truncate">{r.title}</p>
                              )}
                              <p className="text-sm text-ink-muted">{r.due_date}{r.contact_name ? ` · ${r.contact_name}` : ""}</p>
                            </div>
                            <div className="flex gap-2 shrink-0">
                              <button
                                onClick={() => handleComplete(r.id)}
                                className="w-8 h-8 rounded-lg glass flex items-center justify-center text-ink-muted hover:text-clay-soft transition-colors"
                                aria-label="Mark complete"
                              >
                                <Check size={14} />
                              </button>
                              <button
                                onClick={() => handleDelete(r.id)}
                                className="w-8 h-8 rounded-lg glass flex items-center justify-center text-ink-muted hover:text-clay-bright transition-colors"
                                aria-label="Delete reminder"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </Card>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Reminder">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Title"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="e.g. Send proposal"
            required
          />
          <Input
            label="Due Date"
            type="date"
            value={form.due_date}
            onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))}
            required
          />
          <Select
            label="Related Contact (optional)"
            value={form.contact_id}
            onChange={(e) => setForm((f) => ({ ...f, contact_id: e.target.value }))}
          >
            <option value="">None</option>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
          <Button type="submit" variant="primary" className="w-full" loading={submitting}>
            Add Reminder
          </Button>
        </form>
      </Modal>
    </div>
  );
}
