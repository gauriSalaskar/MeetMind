import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Users, Trash2, Pencil } from "lucide-react";
import { contactsApi } from "../api/endpoints";
import Card from "../components/Card";
import Avatar from "../components/Avatar";
import CategoryBadge from "../components/CategoryBadge";
import Button from "../components/Button";
import Input from "../components/Input";
import Modal from "../components/Modal";
import ContactForm, { CATEGORIES } from "../components/ContactForm";
import EmptyState from "../components/EmptyState";
import { SkeletonGrid } from "../components/Skeleton";
import { useToast } from "../context/ToastContext";

const EMPTY_FORM = {
  name: "", email: "", phone: "", company: "", role: "", category: "Other", notes: "",
};

export default function Contacts() {
  const { showToast } = useToast();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchContacts = useCallback(() => {
    setLoading(true);
    const params = {};
    if (search) params.search = search;
    if (category) params.category = category;
    contactsApi
      .list(params)
      .then((res) => setContacts(res.data.contacts))
      .finally(() => setLoading(false));
  }, [search, category]);

  useEffect(() => {
    const t = setTimeout(fetchContacts, 250);
    return () => clearTimeout(t);
  }, [fetchContacts]);

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (c) => {
    setEditing(c);
    setForm({
      name: c.name || "", email: c.email || "", phone: c.phone || "",
      company: c.company || "", role: c.role || "", category: c.category || "Other",
      notes: c.notes || "",
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editing) {
        await contactsApi.update(editing.id, form);
        showToast("Contact updated", "success");
      } else {
        await contactsApi.create(form);
        showToast("Contact added", "success");
      }
      setModalOpen(false);
      fetchContacts();
    } catch (err) {
      showToast(err.response?.data?.error || "Something went wrong", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await contactsApi.remove(deleteTarget.id);
      showToast("Contact deleted", "success");
      setDeleteTarget(null);
      fetchContacts();
    } catch (err) {
      showToast(err.response?.data?.error || "Could not delete contact", "error");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink-primary">Contacts</h1>
          <p className="text-ink-muted mt-1">Your relationship intelligence database.</p>
        </div>
        <Button variant="primary" onClick={openAdd}>
          <Plus size={16} /> Add Contact
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted" />
          <Input
            placeholder="Search by name, company, or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-11"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setCategory("")}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              category === "" ? "bg-clay/15 text-clay-soft border border-clay/30" : "glass text-ink-muted hover:text-ink-primary"
            }`}
          >
            All
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(category === c ? "" : c)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                category === c ? "bg-clay/15 text-clay-soft border border-clay/30" : "glass text-ink-muted hover:text-ink-primary"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <SkeletonGrid count={6} />
      ) : contacts.length === 0 ? (
        <Card hover={false}>
          <EmptyState
            icon={Users}
            title={search || category ? "No matches found" : "No contacts yet"}
            description={
              search || category
                ? "Try a different search or filter."
                : "Add your first relationship to start building your second brain."
            }
            action={
              !search && !category && (
                <Button variant="primary" onClick={openAdd}>
                  <Plus size={16} /> Add your first contact
                </Button>
              )
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {contacts.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
              >
                <Card className="relative group">
                  <Link to={`/contacts/${c.id}`} className="block">
                    <div className="flex items-start gap-4 mb-3">
                      <Avatar initials={c.initials} category={c.category} size="lg" />
                      <div className="flex-1 min-w-0">
                        <p className="font-display font-semibold text-ink-primary truncate">{c.name}</p>
                        <p className="text-sm text-ink-muted truncate">{c.role || "—"}</p>
                        <p className="text-sm text-ink-muted truncate">{c.company || ""}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <CategoryBadge category={c.category} />
                      <span className="text-xs text-ink-muted">
                        Score: {c.relationship_score ?? 0}
                      </span>
                    </div>
                  </Link>
                  <div className="absolute top-4 right-4 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.preventDefault(); openEdit(c); }}
                      className="w-8 h-8 rounded-lg glass flex items-center justify-center text-ink-muted hover:text-clay-soft transition-colors"
                      aria-label="Edit contact"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={(e) => { e.preventDefault(); setDeleteTarget(c); }}
                      className="w-8 h-8 rounded-lg glass flex items-center justify-center text-ink-muted hover:text-red-400 transition-colors"
                      aria-label="Delete contact"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Contact" : "Add Contact"}>
        <ContactForm
          form={form}
          setForm={setForm}
          onSubmit={handleSubmit}
          loading={submitting}
          submitLabel={editing ? "Save Changes" : "Add Contact"}
        />
      </Modal>

      {/* Delete confirmation */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Contact">
        <p className="text-sm text-ink-secondary mb-5">
          Are you sure you want to delete <span className="font-medium text-ink-primary">{deleteTarget?.name}</span>?
          This will also remove all associated meetings and reminders. This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={() => setDeleteTarget(null)}>
            Cancel
          </Button>
          <Button variant="danger" className="flex-1" onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}
