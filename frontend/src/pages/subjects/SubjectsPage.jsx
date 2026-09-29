import EmptyState from "../../components/ui/EmptyState";
import { EMPTY_PREVIEW } from "../../lib/emptyPreview";
import { useEffect, useState } from "react";
import { BookOpen, Plus } from "lucide-react";
import api from "../../lib/api";
import Button from "../../components/ui/Button";
import SubjectList from "./SubjectList";
import SubjectFormModal from "./SubjectFormModal";
import SubjectDetailDrawer from "./SubjectDetailDrawer";
import { useWorkspace } from "../../hooks/useWorkspace";

export default function SubjectsPage() {
  const { activeId } = useWorkspace();
  const [view, setView] = useState("loading");
  const [subjects, setSubjects] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [detailSubject, setDetailSubject] = useState(null);

  useEffect(() => {
    loadSubjects();
    
  }, [activeId]);

  async function loadSubjects() {
    try {
      const { data } = await api.get("/subjects", {
        params: activeId ? { timetableId: activeId } : undefined,
      });
      setSubjects(data.subjects);
      setView(data.subjects.length === 0 || EMPTY_PREVIEW ? "empty" : "list");
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

  function openDetail(subject) {
    setDetailSubject(subject);
  }

  async function handleFormSubmit(payload) {
    if (editingSubject) {
      const { data } = await api.patch(`/subjects/${editingSubject.id}`, payload);
      setSubjects((current) =>
        current.map((s) => (s.id === data.subject.id ? { ...s, ...data.subject } : s))
      );
    } else {
      const { data } = await api.post("/subjects", payload);
      setSubjects((current) => [{ ...data.subject, weekly_hours: 0 }, ...current]);
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
          onSelect={openDetail}
        />
      ) : (
        <EmptyState
          className="h-full"
          icon={BookOpen}
          title="No subjects yet"
          body="Add the subjects you'll assign into your timetable."
          action={
            <Button onClick={startCreate}>
              <Plus size={16} />
              Add subject
            </Button>
          }
        />
      )}

      <SubjectFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        subject={editingSubject}
        onSubmit={handleFormSubmit}
      />

      <SubjectDetailDrawer
        subject={detailSubject}
        timetableId={activeId}
        onClose={() => setDetailSubject(null)}
      />
    </>
  );
}
