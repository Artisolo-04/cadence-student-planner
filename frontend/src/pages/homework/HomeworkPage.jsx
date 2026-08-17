import { useEffect, useState } from "react";
import { ClipboardList, Plus } from "lucide-react";
import api from "../../lib/api";
import Button from "../../components/ui/Button";
import HomeworkList from "./HomeworkList";
import HomeworkFormModal from "./HomeworkFormModal";

export default function HomeworkPage() {
  const [view, setView] = useState("loading");
  const [homework, setHomework] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editingHomework, setEditingHomework] = useState(null);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    try {
      const [homeworkRes, subjectsRes] = await Promise.all([
        api.get("/homework"),
        api.get("/subjects"),
      ]);
      setHomework(homeworkRes.data);
      setSubjects(subjectsRes.data.subjects);
      setView(homeworkRes.data.length === 0 ? "empty" : "list");
    } catch (err) {
      console.error("Load homework error:", err);
      setView("empty");
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

  if (view === "loading") {
    return null;
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
        <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
          <div className="rounded-full bg-[var(--color-surface-alt)] p-4">
            <ClipboardList size={28} className="text-[var(--color-text-muted)]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[var(--color-text)]">No homework yet</h2>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">
              Add your assignments and keep track of due dates.
            </p>
          </div>
          <Button onClick={startCreate}>
            <Plus size={16} />
            Add homework
          </Button>
        </div>
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
