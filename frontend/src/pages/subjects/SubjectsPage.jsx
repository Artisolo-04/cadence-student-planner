import { useEffect, useState } from "react";
import { BookOpen, Plus } from "lucide-react";
import api from "../../lib/api";
import Button from "../../components/ui/Button";
import SubjectList from "./SubjectList";
import SubjectFormModal from "./SubjectFormModal";

export default function SubjectsPage() {
  const [view, setView] = useState("loading");
  const [subjects, setSubjects] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);

  useEffect(() => {
    loadSubjects();
  }, []);

  async function loadSubjects() {
    try {
      const { data } = await api.get("/subjects");
      setSubjects(data.subjects);
      setView(data.subjects.length === 0 ? "empty" : "list");
    } catch (err) {
      console.error("Load subjects error:", err);
      setView("empty");
    }
  }

  function startCreate() {
    setEditingSubject(null);
    setFormOpen(true);
  }

  function startEdit(subject) {
    setEditingSubject(subject);
    setFormOpen(true);
  }

  async function handleFormSubmit(payload) {
    if (editingSubject) {
      const { data } = await api.patch(`/subjects/${editingSubject.id}`, payload);
      setSubjects((current) =>
        current.map((s) => (s.id === data.subject.id ? data.subject : s))
      );
    } else {
      const { data } = await api.post("/subjects", payload);
      setSubjects((current) => [data.subject, ...current]);
      setView("list");
    }
  }

  async function handleDelete(id) {
    await api.delete(`/subjects/${id}`);
    setSubjects((current) => {
      const remaining = current.filter((s) => s.id !== id);
      setView(remaining.length ? "list" : "empty");
      return remaining;
    });
  }

  if (view === "loading") {
    return null;
  }

  return (
    <>
      {view === "list" ? (
        <SubjectList
          subjects={subjects}
          onAddNew={startCreate}
          onEdit={startEdit}
          onDelete={handleDelete}
        />
      ) : (
        <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
          <div className="rounded-full bg-[var(--color-surface-alt)] p-4">
            <BookOpen size={28} className="text-[var(--color-text-muted)]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[var(--color-text)]">No subjects yet</h2>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">
              Add the subjects you'll assign into your timetable.
            </p>
          </div>
          <Button onClick={startCreate}>
            <Plus size={16} />
            Add subject
          </Button>
        </div>
      )}

      <SubjectFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        subject={editingSubject}
        onSubmit={handleFormSubmit}
      />
    </>
  );
}
