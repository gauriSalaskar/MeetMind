import Input from "./Input";
import Select from "./Select";
import Button from "./Button";

export const CATEGORIES = [
  "Friend", "Mentor", "Recruiter", "Founder", "Investor", "Client", "Student", "Other",
];

export default function ContactForm({ form, setForm, onSubmit, loading, submitLabel }) {
  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Input label="Name" value={form.name} onChange={update("name")} required placeholder="Full name" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Email" type="email" value={form.email} onChange={update("email")} placeholder="email@example.com" />
        <Input label="Phone" value={form.phone} onChange={update("phone")} placeholder="+91 98765 43210" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Company" value={form.company} onChange={update("company")} placeholder="Company name" />
        <Input label="Role" value={form.role} onChange={update("role")} placeholder="e.g. Founder" />
      </div>
      <Select label="Category" value={form.category} onChange={update("category")}>
        {CATEGORIES.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </Select>
      <Input label="Notes" textarea value={form.notes} onChange={update("notes")} placeholder="Anything worth remembering..." />
      <Button type="submit" variant="primary" className="w-full" loading={loading}>
        {submitLabel}
      </Button>
    </form>
  );
}
