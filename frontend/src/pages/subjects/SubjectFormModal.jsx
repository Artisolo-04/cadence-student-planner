import { useEffect, useState } from "react";
import Modal from "../../components/ui/Modal";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import ColorSwatchPicker from "../../components/ui/ColorSwatchPicker";

const DEFAULT_COLOR = "#14b8a6";

export default function SubjectFormModal({ open, onClose, subject, onSubmit }) {
  const [name, setName] = useState("");
  const [teacher, setTeacher] = useState("");
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(subject?.name || "");
      setTeacher(subject?.teacher || "");
      setColor(subject?.color || DEFAULT_COLOR);
      setError("");
    }
  }, [open, subject]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Subject name is required.");
      return;
    }

    setError("");
    setSaving(true);
    try {
      await onSubmit({ name: name.trim(), teacher: teacher.trim(), color });
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong saving the subject.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => !saving && onClose()}
      title={subject ? "Edit subject" : "New subject"}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="subject-form" disabled={saving}>
            {saving ? "Saving..." : subject ? "Save changes" : "Add subject"}
          </Button>
        </>
      }
    >
      <form id="subject-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          id="subject-name"
          label="Subject name"
          placeholder="e.g. Mathematics"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Input
          id="subject-teacher"
          label="Teacher (optional)"
          placeholder="e.g. Mr. Smith"
          value={teacher}
          onChange={(e) => setTeacher(e.target.value)}
        />
        <ColorSwatchPicker label="Color" value={color} onChange={setColor} />
        {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}
      </form>
    </Modal>
  );
}
