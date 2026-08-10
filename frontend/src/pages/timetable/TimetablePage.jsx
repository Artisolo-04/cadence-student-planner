import { useEffect, useState } from "react";
import { Calendar, Plus, ArrowLeft, Pencil } from "lucide-react";
import api from "../../lib/api";
import Button from "../../components/ui/Button";
import WorkspaceList from "./WorkspaceList";
import TimetableWizard from "./wizard/TimetableWizard";
import TimetableGrid from "./grid/TimetableGrid";

export default function TimetablePage() {
  const [view, setView] = useState("loading");
  const [wizardMode, setWizardMode] = useState("create");
  const [timetables, setTimetables] = useState([]);
  const [workspace, setWorkspace] = useState(null);

  useEffect(() => {
    loadTimetables();
  }, []);

  async function loadTimetables() {
    try {
      const { data } = await api.get("/timetables");
      setTimetables(data.timetables);
      setView(data.timetables.length === 0 ? "empty" : "list");
    } catch (err) {
      console.error("Load timetables error:", err);
      setView("empty");
    }
  }

  async function openWorkspace(id) {
    try {
      const { data } = await api.get(`/timetables/${id}`);
      setWorkspace(data);
      setView("grid");
    } catch (err) {
      console.error("Load workspace detail error:", err);
    }
  }

  async function handleWizardComplete(detail) {
    setWorkspace(detail);
    setView("grid");
    try {
      const { data } = await api.get("/timetables");
      setTimetables(data.timetables);
    } catch (err) {
      console.error("Refresh timetables error:", err);
    }
  }

  async function handleDeleteTimetable(id) {
    await api.delete(`/timetables/${id}`);
    setTimetables((current) => {
      const remaining = current.filter((timetable) => timetable.id !== id);
      setView(remaining.length ? "list" : "empty");
      return remaining;
    });
  }

  function handleBackToList() {
    setWorkspace(null);
    setView("list");
  }

  function startCreate() {
    setWizardMode("create");
    setView("wizard");
  }

  function startEdit() {
    setWizardMode("edit");
    setView("wizard");
  }

  function handleWizardCancel() {
    if (wizardMode === "edit") {
      setView("grid");
    } else {
      setView(timetables.length > 0 ? "list" : "empty");
    }
  }

  if (view === "loading") {
    return null;
  }

  if (view === "wizard") {
    return (
      <TimetableWizard
        mode={wizardMode}
        workspace={wizardMode === "edit" ? workspace : null}
        onComplete={handleWizardComplete}
        onCancel={handleWizardCancel}
      />
    );
  }

  if (view === "list") {
    return (
      <WorkspaceList
        timetables={timetables}
        onOpen={openWorkspace}
        onAddNew={startCreate}
        onDelete={handleDeleteTimetable}
      />
    );
  }

  if (view === "grid" && workspace) {
    return (
      <div className="flex h-full min-h-0 flex-col gap-4">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={handleBackToList}
            className="flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors duration-150"
          >
            <ArrowLeft size={16} />
            All timetables
          </button>
          <Button variant="secondary" onClick={startEdit}>
            <Pencil size={16} />
            Edit
          </Button>
        </div>
        <TimetableGrid workspace={workspace} onWorkspaceChange={setWorkspace} />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <div className="rounded-full bg-[var(--color-surface-alt)] p-4">
        <Calendar size={28} className="text-[var(--color-text-muted)]" />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-[var(--color-text)]">No timetable yet</h2>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          Build your weekly schedule in a few quick steps.
        </p>
      </div>
      <Button onClick={startCreate}>
        <Plus size={16} />
        Add New Timetable
      </Button>
    </div>
  );
}
