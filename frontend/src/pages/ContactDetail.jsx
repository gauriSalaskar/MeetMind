import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, Sparkles, Plus, Mail, Phone, Building2, Briefcase,
  Lightbulb, ListChecks, MessageCircle, Calendar, FileText, Trash2, Pencil, Users,
} from "lucide-react";
import { contactsApi, meetingsApi, aiApi, commitmentsApi } from "../api/endpoints";
import Card from "../components/Card";
import Avatar from "../components/Avatar";
import CategoryBadge from "../components/CategoryBadge";
import Button from "../components/Button";
import MemoryRing from "../components/MemoryRing";
import Modal from "../components/Modal";
import ContactForm, { CATEGORIES } from "../components/ContactForm";
import MeetingForm from "../components/MeetingForm";
import MeetingPrepModal from "../components/MeetingPrepModal";
import AILoading from "../components/AILoading";
import EmptyState from "../components/EmptyState";
import { SkeletonCard } from "../components/Skeleton";
import { useToast } from "../context/ToastContext";
import VoiceRecorder from "../components/VoiceRecorder";
import CommitmentsList from "../components/CommitmentsList";
import { Mic } from "lucide-react";

const EMPTY_MEETING = {
  date: new Date().toISOString().slice(0, 10),
  summary: "", key_points: "", personal_details: "", action_items: "", follow_up_date: "",
};

export default function ContactDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [contact, setContact] = useState(null);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);

  const [intelligence, setIntelligence] = useState(null);
  const [intelligenceLoading, setIntelligenceLoading] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [editSubmitting, setEditSubmitting] = useState(false);

  const [meetingModalOpen, setMeetingModalOpen] = useState(false);
  const [meetingForm, setMeetingForm] = useState(EMPTY_MEETING);
  const [meetingSubmitting, setMeetingSubmitting] = useState(false);

  const [prepOpen, setPrepOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [commitments, setCommitments] = useState([]);

  const fetchCommitments = useCallback(() => {
    commitmentsApi
      .list({ contact_id: id })
      .then((res) => setCommitments(res.data.commitments))
      .catch(() => {});
  }, [id]);

  const fetchContact = useCallback(() => {
    setLoading(true);
    contactsApi
      .get(id)
      .then((res) => {
        setContact(res.data.contact);
        setMeetings(res.data.meetings);
      })
      .catch(() => showToast("Could not load contact", "error"))
      .finally(() => setLoading(false));
  }, [id]);

  const fetchIntelligence = useCallback(() => {
    setIntelligenceLoading(true);
    aiApi
      .intelligence(id)
      .then((res) => setIntelligence(res.data))
      .catch(() => {})
      .finally(() => setIntelligenceLoading(false));
  }, [id]);

  useEffect(() => {
    fetchContact();
    fetchIntelligence();
    fetchCommitments();
  }, [fetchContact, fetchIntelligence, fetchCommitments]);

  const openEdit = () => {
    setEditForm({
      name: contact.name || "", email: contact.email || "", phone: contact.phone || "",
      company: contact.company || "", role: contact.role || "", category: contact.category || "Other",
      notes: contact.notes || "",
    });
    setEditOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditSubmitting(true);
    try {
      await contactsApi.update(id, editForm);
      showToast("Contact updated", "success");
      setEditOpen(false);
      fetchContact();
    } catch (err) {
      showToast(err.response?.data?.error || "Could not update contact", "error");
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await contactsApi.remove(id);
      showToast("Contact deleted", "success");
      navigate("/contacts");
    } catch (err) {
      showToast(err.response?.data?.error || "Could not delete contact", "error");
    }
  };

  const handleAddMeeting = async (e) => {
    e.preventDefault();
    setMeetingSubmitting(true);
    try {
      await meetingsApi.create({ ...meetingForm, contact_id: id });
      showToast("Meeting logged — memory updated", "success");
      setMeetingModalOpen(false);
      setMeetingForm(EMPTY_MEETING);
      fetchContact();
      fetchIntelligence();
      fetchCommitments();
    } catch (err) {
      showToast(err.response?.data?.error || "Could not save meeting", "error");
    } finally {
      setMeetingSubmitting(false);
    }
  };

  const handleVoiceSaved = () => {
    fetchContact();
    fetchIntelligence();
    fetchCommitments();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-8 w-32 rounded" />
        <SkeletonCard className="h-48" />
        <SkeletonCard className="h-64" />
      </div>
    );
  }

  if (!contact) {
    return (
      <EmptyState
        icon={Users}
        title="This Memory Doesn't Exist."
        description="We couldn't find this contact."
        action={
          <Link to="/contacts">
            <Button variant="primary">Back to Contacts</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate("/contacts")}
        className="flex items-center gap-2 text-sm text-ink-muted hover:text-ink-primary transition-colors"
      >
        <ArrowLeft size={16} /> Back to Contacts
      </button>

      {/* Header card */}
      <Card hover={false} className="relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-clay/10 rounded-full blur-3xl" />
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6 relative z-10">
          <Avatar initials={contact.initials} category={contact.category} size="lg" />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap mb-1">
              <h1 className="font-display text-2xl font-bold text-ink-primary">{contact.name}</h1>
              <CategoryBadge category={contact.category} />
            </div>
            <p className="text-ink-muted mb-3">
              {contact.role || "—"} {contact.company ? `at ${contact.company}` : ""}
            </p>
            <div className="flex flex-wrap gap-4 text-sm text-ink-secondary">
              {contact.email && (
                <span className="flex items-center gap-1.5"><Mail size={14} className="text-clay-soft" /> {contact.email}</span>
              )}
              {contact.phone && (
                <span className="flex items-center gap-1.5"><Phone size={14} className="text-clay-soft" /> {contact.phone}</span>
              )}
              {contact.last_interaction && (
                <span className="flex items-center gap-1.5"><Calendar size={14} className="text-clay-soft" /> Last met {contact.last_interaction}</span>
              )}
            </div>
          </div>

          <MemoryRing score={contact.relationship_score ?? 0} size={120} />
        </div>

        <div className="flex flex-wrap gap-3 mt-6 relative z-10">
          <Button variant="primary" onClick={() => setPrepOpen(true)}>
            <Sparkles size={16} /> AI Meeting Prep
          </Button>
          <Link to={`/contacts/${id}/brief`}>
            <Button variant="secondary">
              <FileText size={16} /> AI Brief
            </Button>
          </Link>
          <Button variant="secondary" onClick={() => setMeetingModalOpen(true)}>
            <Plus size={16} /> Log Meeting
          </Button>
          <Button variant="secondary" onClick={() => setVoiceOpen(true)}>
            <Mic size={16} /> Voice Note
          </Button>
          <Button variant="ghost" onClick={openEdit}>
            <Pencil size={16} /> Edit
          </Button>
          <Button variant="ghost" onClick={() => setDeleteOpen(true)} className="text-red-400 hover:bg-red-500/10">
            <Trash2 size={16} /> Delete
          </Button>
        </div>
      </Card>

      {/* Relationship Intelligence */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <IntelligenceCard
          title="Things to Remember"
          icon={Lightbulb}
          items={intelligence?.things_to_remember}
          loading={intelligenceLoading}
          emptyText="Log meetings to surface personal details worth remembering."
        />
        <IntelligenceCard
          title="Open Loops"
          icon={ListChecks}
          items={intelligence?.open_loops}
          loading={intelligenceLoading}
          emptyText="No pending commitments tracked yet."
        />
        <IntelligenceCard
          title="Conversation Starters"
          icon={MessageCircle}
          items={intelligence?.conversation_starters}
          loading={intelligenceLoading}
          emptyText="Add more context to get conversation ideas."
        />
      </div>

      {/* Commitments -- things you or they promised, tracked until closed */}
      <Card hover={false}>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-clay/10 flex items-center justify-center">
            <ListChecks size={15} className="text-clay-soft" />
          </div>
          <h3 className="font-display font-semibold text-ink-primary text-sm">
            Commitments {commitments.length > 0 && `(${commitments.filter((c) => !c.done).length} open)`}
          </h3>
        </div>
        <CommitmentsList
          commitments={commitments}
          onChanged={fetchCommitments}
          emptyText="Nothing tracked yet — commitments are picked up automatically when you log a meeting or voice note."
        />
      </Card>

      {/* Notes */}
      {contact.notes && (
        <Card hover={false}>
          <h3 className="font-display font-semibold text-ink-primary mb-2">Notes</h3>
          <p className="text-sm text-ink-secondary whitespace-pre-wrap">{contact.notes}</p>
        </Card>
      )}

      {/* Meeting Timeline */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-semibold text-ink-primary">Meeting Timeline</h2>
          <Button variant="secondary" onClick={() => setMeetingModalOpen(true)}>
            <Plus size={16} /> Log Meeting
          </Button>
        </div>

        {meetings.length === 0 ? (
          <Card hover={false}>
            <EmptyState
              icon={Calendar}
              title="No meetings logged"
              description="Log your first meeting to start building memory for this contact."
              action={
                <Button variant="primary" onClick={() => setMeetingModalOpen(true)}>
                  <Plus size={16} /> Log Meeting
                </Button>
              }
            />
          </Card>
        ) : (
          <div className="relative pl-6 border-l-2 border-clay/15 space-y-6">
            {meetings.map((m, i) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className="relative"
              >
                <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-gradient-to-br from-clay to-clay-soft shadow-glow border-2 border-bg-deep" />
                <Card hover={false}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-clay-soft">{m.date}</span>
                    {m.follow_up_date && (
                      <span className="text-xs text-ink-muted">Follow-up: {m.follow_up_date}</span>
                    )}
                  </div>
                  <p className="text-sm text-ink-primary font-medium mb-2">{m.summary}</p>
                  {m.key_points && (
                    <p className="text-sm text-ink-secondary mb-1"><span className="text-ink-muted">Key points: </span>{m.key_points}</p>
                  )}
                  {m.personal_details && (
                    <p className="text-sm text-ink-secondary mb-1"><span className="text-ink-muted">Learned: </span>{m.personal_details}</p>
                  )}
                  {m.action_items && (
                    <p className="text-sm text-ink-secondary"><span className="text-ink-muted">Action items: </span>{m.action_items}</p>
                  )}
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Edit modal */}
      {editForm && (
        <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Contact">
          <ContactForm form={editForm} setForm={setEditForm} onSubmit={handleEditSubmit} loading={editSubmitting} submitLabel="Save Changes" />
        </Modal>
      )}

      {/* Add meeting modal */}
      <Modal open={meetingModalOpen} onClose={() => setMeetingModalOpen(false)} title="Log Meeting">
        <MeetingForm form={meetingForm} setForm={setMeetingForm} onSubmit={handleAddMeeting} loading={meetingSubmitting} submitLabel="Save Meeting" />
      </Modal>

      {/* Voice note modal -- Sarvam AI transcription + auto commitment extraction */}
      <Modal open={voiceOpen} onClose={() => setVoiceOpen(false)} title="Leave a Voice Note">
        <VoiceRecorder contactId={id} onSaved={handleVoiceSaved} />
      </Modal>

      {/* AI Meeting Prep */}
      <MeetingPrepModal open={prepOpen} onClose={() => setPrepOpen(false)} contactId={id} contactName={contact.name} />

      {/* Delete confirmation */}
      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete Contact">
        <p className="text-sm text-ink-secondary mb-5">
          Are you sure you want to delete <span className="font-medium text-ink-primary">{contact.name}</span>?
          This will also remove all associated meetings and reminders. This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button variant="danger" className="flex-1" onClick={handleDelete}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
}

function IntelligenceCard({ title, icon: Icon, items, loading, emptyText }) {
  return (
    <Card hover={false}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-clay/10 flex items-center justify-center">
          <Icon size={15} className="text-clay-soft" />
        </div>
        <h3 className="font-display font-semibold text-ink-primary text-sm">{title}</h3>
      </div>
      {loading ? (
        <div className="space-y-2">
          <div className="skeleton h-3 w-full rounded" />
          <div className="skeleton h-3 w-4/5 rounded" />
          <div className="skeleton h-3 w-2/3 rounded" />
        </div>
      ) : items && items.length > 0 ? (
        <ul className="space-y-2">
          {items.map((item, idx) => (
            <li key={idx} className="text-sm text-ink-secondary flex items-start gap-2">
              <span className="text-clay-soft mt-1 shrink-0">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-ink-muted">{emptyText}</p>
      )}
    </Card>
  );
}
