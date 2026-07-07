import Input from "./Input";
import Button from "./Button";

export default function MeetingForm({ form, setForm, onSubmit, loading, submitLabel }) {
  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Input label="Date" type="date" value={form.date} onChange={update("date")} required />
      <Input
        label="Meeting Summary"
        textarea
        value={form.summary}
        onChange={update("summary")}
        placeholder="What was this meeting about?"
        required
      />
      <Input
        label="Key Discussion Points"
        textarea
        value={form.key_points}
        onChange={update("key_points")}
        placeholder="What did you discuss?"
      />
      <Input
        label="Personal Details Learned"
        textarea
        value={form.personal_details}
        onChange={update("personal_details")}
        placeholder="Anything personal worth remembering — family, hobbies, preferences..."
      />
      <Input
        label="Action Items"
        textarea
        value={form.action_items}
        onChange={update("action_items")}
        placeholder="What needs to happen next?"
      />
      <Input
        label="Follow-Up Date"
        type="date"
        value={form.follow_up_date}
        onChange={update("follow_up_date")}
      />
      <Button type="submit" variant="primary" className="w-full" loading={loading}>
        {submitLabel}
      </Button>
    </form>
  );
}
