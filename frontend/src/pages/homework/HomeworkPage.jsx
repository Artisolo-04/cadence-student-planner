import EmptyState from "../../components/ui/EmptyState";
import { EMPTY_PREVIEW } from "../../lib/emptyPreview";
import { useEffect, useRef, useState } from "react";
import { ClipboardList, Plus } from "lucide-react";
import api from "../../lib/api";
import Button from "../../components/ui/Button";
import HomeworkList from "./HomeworkList";
import HomeworkSkeleton from "./HomeworkSkeleton";
import { readHomeworkListShape, saveHomeworkListShape } from "./homeworkListShape";
import HomeworkFormModal from "./HomeworkFormModal";

export default function HomeworkPage() {
  const [view, setView] = useState("loading");
  const [homework, setHomework] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editingHomework, setEditingHomework] = useState(null);
  const reqRef = useRef(0);
  const okRef = useRef(false);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    const reqId = ++reqRef.current;
    let nextView = "empty";
    try {
      const [homeworkRes, subjectsRes] = await Promise.all([
        api.get("/homework"),
        api.get("/subjects"),
      ]);
      if (reqId !== reqRef.current) return;
      okRef.current = true;
      setHomework(homeworkRes.data);
      setSubjects(subjectsRes.data.subjects);
      nextView = homeworkRes.data.length === 0 || EMPTY_PREVIEW ? "empty" : "list";
    } catch (err) {
      console.error("Load homework error:", err);
    } finally {
      if (reqId === reqRef.current) setView(nextView);
    }
  }

  function startCreate() {
    setEditingHomework(null);
    setFormOpen(true);
  }

  function startEdit(item) {
    setEditingHomework(item);
    setFormOpen(true);
  }

  async function handleFormSubmit(payload) {
    if (editingHomework) {
      await api.patch(`/homework/${editingHomework.id}`, payload);
    } else {
      await api.post("/homework", payload);
    }
    await loadAll();
  }

  async function handleDelete(id) {
    await api.delete(`/homework/${id}`);
    await loadAll();
  }

  async function handleStatusChange(id, status) {
    await api.patch(`/homework/${id}/status`, { status });
    await loadAll();
  }

  async function handleReorder(id, status, position) {
    setHomework((current) =>
      current.map((h) => (h.id === id ? { ...h, status, position } : h))
    );
    try {
      await api.patch(`/homework/${id}/position`, { status, position });
    } catch (err) {
      console.error("Reorder failed, reloading:", err);
      await loadAll();
    }
  }

  async function handleToggleDone(item) {
    const nextStatus = item.status === "done" ? "todo" : "done";
    await handleStatusChange(item.id, nextStatus);
  }

  // Keep the remembered skeleton shape in sync with real data (load, create, edit, delete).
  useEffect(() => {
    if (view === "loading" || !okRef.current || EMPTY_PREVIEW) return;
    saveHomeworkListShape(homework);
  }, [homework, view]);

  const loading = view === "loading";
  const savedShape = loading ? readHomeworkListShape() : null;
  // Remembered as empty: show the real empty state right away, no skeleton rows.
  const guessEmpty = Array.isArray(savedShape) && savedShape.length === 0;

  if (loading && !guessEmpty) {
    return <HomeworkSkeleton shape={savedShape} />;
  }

  return (
    <>
      {view === "list" ? (
        <HomeworkList
          homework={homework}
          subjects={subjects}
          onAddNew={startCreate}
          onEdit={startEdit}
          onDelete={handleDelete}
          onToggleDone={handleToggleDone}
          onStatusChange={handleStatusChange}
          onReorder={handleReorder}
        />
      ) : (
        <EmptyState
          className="h-full"
          icon={ClipboardList}
          title="No homework yet"
          body="Add your assignments and keep track of due dates."
          action={
            <Button onClick={startCreate}>
              <Plus size={16} />
              Add homework
            </Button>
          }
        />
      )}

      <HomeworkFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        homework={editingHomework}
        subjects={subjects}
        onSubmit={handleFormSubmit}
      />
    </>
  );
}
