import EmptyState from "../../components/ui/EmptyState";
import { EMPTY_PREVIEW } from "../../lib/emptyPreview";
import { useEffect, useRef, useState } from "react";
import { BookOpen, Plus } from "lucide-react";
import api from "../../lib/api";
import Button from "../../components/ui/Button";
import SubjectList from "./SubjectList";
import SubjectsSkeleton from "./SubjectsSkeleton";
import { readSubjectsListShape, saveSubjectsListShape } from "./subjectsListShape";
import SubjectFormModal from "./SubjectFormModal";
import SubjectDetailDrawer from "./SubjectDetailDrawer";
import { useWorkspace } from "../../hooks/useWorkspace";

export default function SubjectsPage() {
  const { activeId, loading: wsLoading } = useWorkspace();
  // Workspace not resolved yet: do not request anything (avoids a request with no timetableId).
  const waiting = wsLoading && activeId == null;
  const key = String(activeId ?? "none");
  const [loadedKey, setLoadedKey] = useState(null);
  const okKeyRef = useRef(null);
  const reqRef = useRef(0);
  const [subjects, setSubjects] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [detailSubject, setDetailSubject] = useState(null);

  useEffect(() => {
    if (waiting) return;
    loadSubjects();
  }, [activeId, waiting]);

  // Keep the remembered skeleton shape in sync with real data (load, create, edit, delete).
  useEffect(() => {
    if (loadedKey !== key || okKeyRef.current !== key) return;
    saveSubjectsListShape(key, subjects);
  }, [subjects, loadedKey, key]);

  async function loadSubjects() {
    const reqId = ++reqRef.current;
    okKeyRef.current = null;
    try {
      const { data } = await api.get("/subjects", {
        params: activeId ? { timetableId: activeId } : undefined,
      });
      if (reqId !== reqRef.current) return;
      okKeyRef.current = key;
      setSubjects(data.subjects);
    } catch (err) {
      console.error("Load subjects error:", err);
      if (reqId === reqRef.current) setSubjects([]);
    } finally {
      if (reqId === reqRef.current) setLoadedKey(key);
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
    }
  }

  async function handleDelete(id) {
    await api.delete(`/subjects/${id}`);
    setSubjects((current) => current.filter((s) => s.id !== id));
  }

  const loading = waiting || loadedKey !== key;
  const savedShape = loading
    ? readSubjectsListShape(
        waiting ? localStorage.getItem("cadence_last_workspace") ?? "none" : key
      )
    : null;
  // Remembered as empty: show the real empty state right away, no skeleton cards.
  const guessEmpty = Array.isArray(savedShape) && savedShape.length === 0;
  const showSkeleton = loading && !guessEmpty;
  const isEmpty = loading ? guessEmpty : subjects.length === 0 || EMPTY_PREVIEW;

  return (
    <>
      {showSkeleton ? (
        <SubjectsSkeleton shape={savedShape} />
      ) : !isEmpty ? (
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
