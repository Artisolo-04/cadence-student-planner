import { useEffect, useState } from "react";
import Modal from "../../components/ui/Modal";
import Input from "../../components/ui/Input";
import Textarea from "../../components/ui/Textarea";
import Dropdown from "../../components/ui/Dropdown";
import Button from "../../components/ui/Button";

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low priority" },
  { value: "normal", label: "Normal priority" },
  { value: "high", label: "High priority" },
];

const STATUS_OPTIONS = [
  { value: "todo", label: "To do" },
  { value: "in_progress", label: "In progress" },
  { value: "done", label: "Done" },
];

export default function HomeworkFormModal({ open, onClose, homework, subjects, onSubmit }) {
  const [title, setTitle] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("normal");
  const [status, setStatus] = useState("todo");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(homework?.title || "");
      setSubjectId(homework?.subject_id ? String(homework.subject_id) : "");
      setDueDate(homework?.due_date ? homework.due_date.slice(0, 10) : "");
      setPriority(homework?.priority || "normal");
      setStatus(homework?.status || "todo");
      setNotes(homework?.notes || "");
      setError("");
    }
  }, [open, homework]);

  const subjectOptions = [
    { value: "", label: "No subject" },
    ...subjects.map((s) => ({ value: String(s.id), label: s.name })),
  ];

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    if (!dueDate) {
      setError("Due date is required.");
      return;
    }

    setError("");
    setSaving(true);
    try {
      await onSubmit({
        subjectId: subjectId ? Number(subjectId) : null,
        title: title.trim(),
        notes: notes.trim(),
        dueDate,
        priority,
        status,
      });
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong saving the homework.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => !saving && onClose()}
      title={homework ? "Edit homework" : "New homework"}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="homework-form" disabled={saving}>
            {saving ? "Saving..." : homework ? "Save changes" : "Add homework"}
          </Button>
        </>
      }
    >
      <form
        id="homework-form"
        onSubmit={handleSubmit}
        className="flex max-h-[60vh] flex-col gap-4 overflow-y-auto scrollbar-cadence pr-1"
      >
        <Input
          id="homework-title"
          label="Title"
          placeholder="e.g. Chapter 4 exercises"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <Dropdown
          id="homework-subject"
          label="Subject"
          value={subjectId}
          onChange={(e) => setSubjectId(e.target.value)}
          options={subjectOptions}
          placeholder="No subject"
        />

        <Input
          id="homework-due-date"
          label="Due date"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />

        <div className="grid grid-cols-2 gap-4">
          <Dropdown
            id="homework-priority"
            label="Priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            options={PRIORITY_OPTIONS}
          />
          <Dropdown
            id="homework-status"
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={STATUS_OPTIONS}
          />
        </div>

        <Textarea
          id="homework-notes"
          label="Notes (optional)"
          placeholder="Any extra details..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}
      </form>
    </Modal>
  );
}
