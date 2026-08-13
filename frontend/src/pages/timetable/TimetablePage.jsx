import { useEffect, useRef, useState } from "react";
import { Calendar, Plus, ArrowLeft, Pencil, Settings2, Check, Undo2, Redo2 } from "lucide-react";
import api from "../../lib/api";
import Button from "../../components/ui/Button";
import WorkspaceList from "./WorkspaceList";
import TimetableWizard from "./wizard/TimetableWizard";
import TimetableGrid from "./grid/TimetableGrid";
import ViewOptionsPanel from "./ViewOptionsPanel";
import useTimetableViewOptions from "../../hooks/useTimetableViewOptions";

export default function TimetablePage() {
  const [view, setView] = useState("loading");
  const [wizardMode, setWizardMode] = useState("create");
  const [timetables, setTimetables] = useState([]);
  const [workspace, setWorkspace] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const editActionsRef = useRef({ undo: () => {}, redo: () => {} });
  const [editState, setEditState] = useState({ canUndo: false, canRedo: false });
  const { viewOptions, setViewOption } = useTimetableViewOptions(
    workspace?.timetable?.id
  );

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
      localStorage.setItem("cadence_last_workspace", String(id));
      setIsEditMode(false);
      setView("grid");
    } catch (err) {
      console.error("Load workspace detail error:", err);
    }
  }

  async function handleWizardComplete(detail) {
    setWorkspace(detail);
    setIsEditMode(false);
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

  async function handleMyGroupChange(myGroup) {
    if (!workspace) return;

    try {
      const { data } = await api.patch(
        `/timetables/${workspace.timetable.id}/my-group`,
        { myGroup }
      );

      setWorkspace((current) => ({
        ...current,
        timetable: data.timetable,
      }));

      setTimetables((current) =>
        current.map((timetable) =>
          timetable.id === data.timetable.id ? data.timetable : timetable
        )
      );
    } catch (err) {
      console.error("Update timetable group error:", err);
    }
  }

  function handleBackToList() {
    setWorkspace(null);
    setIsEditMode(false);
    setView("list");
  }

  function startCreate() {
    setWizardMode("create");
    setView("wizard");
  }

  function startEditSetup() {
    setWizardMode("edit");
    setView("wizard");
  }

  function toggleEditMode() {
    setIsEditMode((current) => !current);
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
          <div className="flex items-center gap-2">
            <div className="relative flex h-9 items-center">
              <div
                className="flex items-center gap-2 transition-opacity duration-500 ease-in-out"
                style={{
                  opacity: isEditMode ? 0 : 1,
                  pointerEvents: isEditMode ? "none" : "auto",
                  transitionDelay: isEditMode ? "0ms" : "500ms",
                  visibility: isEditMode ? "hidden" : "visible",
                }}
              >
                <ViewOptionsPanel
                  myGroup={workspace.timetable.my_group}
                  onMyGroupChange={handleMyGroupChange}
                  viewOptions={viewOptions}
                  onViewOptionChange={setViewOption}
                />
                <Button
                  variant="secondary"
                  onClick={startEditSetup}
                  title="Edit timetable setup (name, days, slots)"
                >
                  <Settings2 size={16} />
                  Edit setup
                </Button>
              </div>
              <div
                className="absolute right-0 flex items-center gap-2 transition-opacity duration-500 ease-in-out"
                style={{
                  opacity: isEditMode ? 1 : 0,
                  pointerEvents: isEditMode ? "auto" : "none",
                  transitionDelay: isEditMode ? "500ms" : "0ms",
                  visibility: isEditMode ? "visible" : "hidden",
                }}
              >
                <Button
                  variant="secondary"
                  onClick={() => editActionsRef.current.undo()}
                  disabled={!editState.canUndo}
                  title="Undo last change"
                  className="!px-2.5 !py-2.5"
                >
                  <Undo2 size={16} />
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => editActionsRef.current.redo()}
                  disabled={!editState.canRedo}
                  title="Redo last change"
                  className="!px-2.5 !py-2.5"
                >
                  <Redo2 size={16} />
                </Button>
              </div>
            </div>
            <Button
              variant={isEditMode ? "primary" : "secondary"}
              onClick={toggleEditMode}
              className={isEditMode ? "border border-transparent" : ""}
            >
              <span className="relative inline-flex h-5 w-[4.5rem] items-center overflow-hidden">
                <span
                  className={`absolute inset-0 flex items-center whitespace-nowrap transition-opacity duration-300 ease-in-out ${
                    isEditMode ? "opacity-0" : "opacity-100"
                  }`}
                >
                  <span className="flex h-full aspect-square items-center justify-center">
                    <Pencil size={16} />
                  </span>
                  <span className="flex-1 text-center">Edit</span>
                </span>
                <span
                  className={`absolute inset-0 flex items-center whitespace-nowrap transition-opacity duration-300 ease-in-out ${
                    isEditMode ? "opacity-100" : "opacity-0"
                  }`}
                >
                  <span className="flex h-full aspect-square items-center justify-center">
                    <Check size={18} />
                  </span>
                  <span className="flex-1 text-center">Done</span>
                </span>
              </span>
            </Button>
          </div>
        </div>
        <TimetableGrid
          workspace={workspace}
          onWorkspaceChange={setWorkspace}
          myGroup={workspace.timetable.my_group}
          viewOptions={viewOptions}
          isEditMode={isEditMode}
          actionsRef={editActionsRef}
          onEditStateChange={setEditState}
        />
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
