import { useEffect, useRef, useState } from "react";
import {
  Calendar, Plus, ArrowLeft, Pencil, Settings2, Check, Undo2, Redo2, BarChart3,
} from "lucide-react";
import api from "../../lib/api";
import Button from "../../components/ui/Button";
import WorkspaceList from "./WorkspaceList";
import TimetableWizard from "./wizard/TimetableWizard";
import TimetableGrid from "./grid/layout/TimetableGrid";
import AnalyticsPanel from "./analytics/AnalyticsPanel";
import ViewOptionsPanel from "./ViewOptionsPanel";
import useTimetableViewOptions from "../../hooks/useTimetableViewOptions";
import { publishWorkspaceGroupChange } from "../../lib/workspaceGroupSync";

const GAP_PX = 8;

export default function TimetablePage() {
  const [view, setView] = useState("loading");
  const [wizardMode, setWizardMode] = useState("create");
  const [timetables, setTimetables] = useState([]);
  const [workspace, setWorkspace] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [activePanel, setActivePanel] = useState("grid");
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
      setActivePanel("grid");
      setView("grid");
    } catch (err) {
      console.error("Load workspace detail error:", err);
    }
  }

  async function handleWizardComplete(detail) {
    setWorkspace(detail);
    setIsEditMode(false);
    setActivePanel("grid");
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
        publishWorkspaceGroupChange({
          workspaceId: data.timetable.id,
            myGroup: data.timetable.my_group,
        });

    } catch (err) {
      console.error("Update timetable group error:", err);
    }
  }

  function handleBackToList() {
    setWorkspace(null);
    setIsEditMode(false);
    setActivePanel("grid");
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

  function toggleAnalyticsPanel() {
    setActivePanel((current) => {
      const next = current === "analytics" ? "grid" : "analytics";

      if (next === "analytics") {
        setIsEditMode(false);
      }

      return next;
    });
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
    const isAnalytics = activePanel === "analytics";
    const standardActionClass = isEditMode
      ? "pointer-events-none opacity-0"
      : "pointer-events-auto opacity-100";
    const editActionClass = isEditMode
      ? "pointer-events-auto opacity-100"
      : "pointer-events-none opacity-0";

    return (
      <div
        className="flex h-full min-h-0 flex-col"
        style={{ gap: "12px" }}
      >
        <header
          className="relative flex h-[60px] shrink-0 items-center justify-between border-b"
          style={{ borderColor: "var(--color-border)" }}
        >
          <div className="relative flex min-w-0 items-center">
            <div
              className={`flex items-center gap-2 transition-all duration-200 ease-in-out ${standardActionClass}`}
            >
              <Button
                variant="secondary"
                onClick={handleBackToList}
                className="whitespace-nowrap transition-all duration-200 ease-in-out"
              >
                <ArrowLeft size={15} />
                <span className="hidden sm:inline">All timetables</span>
              </Button>

              <Button
                variant="secondary"
                onClick={startEditSetup}
                title="Edit timetable setup"
                aria-label="Edit timetable setup"
                className="!px-2.5 !py-2.5 transition-all duration-200 ease-in-out"
              >
                <Settings2 size={15} />
              </Button>

              <div
                className="hidden h-5 w-px sm:block"
                style={{ background: "var(--color-border)" }}
              />

        <Button
          variant={!isAnalytics ? "secondary" : "ghost"}
          onClick={() => setActivePanel("grid")}
          aria-pressed={!isAnalytics}
          className={`whitespace-nowrap transition-all duration-200 ease-in-out ${
            !isAnalytics
              ? "border border-transparent"
              : "border border-[var(--color-border)]"
          }`}
        >
          <Calendar size={15} />
          <span className="hidden sm:inline">Grid View</span>
        </Button>

        <Button
          variant={isAnalytics ? "secondary" : "ghost"}
          onClick={toggleAnalyticsPanel}
          aria-pressed={isAnalytics}
          className={`whitespace-nowrap transition-all duration-200 ease-in-out ${
            isAnalytics
              ? "border border-transparent"
              : "border border-[var(--color-border)]"
          }`}
        >
          <BarChart3 size={15} />
          <span className="hidden sm:inline">Analytics</span>
        </Button>

              <div
                className={`transition-all duration-200 ease-in-out ${
                  isAnalytics
                    ? "pointer-events-none opacity-40"
                    : "pointer-events-auto opacity-100"
                }`}
              >
                <ViewOptionsPanel
                  myGroup={workspace.timetable.my_group}
                  onMyGroupChange={handleMyGroupChange}
                  viewOptions={viewOptions}
                  onViewOptionChange={setViewOption}
                />
              </div>
            </div>

            <div
              className={`absolute left-0 flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-semibold transition-all duration-200 ease-in-out ${editActionClass}`}
              style={{
                color: "var(--color-text)",
                borderColor: "var(--color-border)",
                background: "var(--color-surface-alt)",
              }}
            >
              <span
                className="h-1.5 w-1.5 rounded-sm"
                style={{ background: "var(--color-text-muted)" }}
              />
              Editing Timetable Mode
            </div>
          </div>

          <div className="relative flex h-10 items-center">
            <div
              className={`absolute right-0 flex items-center transition-all duration-200 ease-in-out ${standardActionClass}`}
              style={{ gap: `${GAP_PX}px` }}
            >
              <Button
                variant="primary"
                onClick={toggleEditMode}
                className="whitespace-nowrap transition-all duration-200 ease-in-out"
              >
                <Pencil size={15} />
                <span className="hidden sm:inline">Edit</span>
              </Button>
            </div>

            <div
              className={`absolute right-0 flex items-center transition-all duration-200 ease-in-out ${editActionClass}`}
              style={{ gap: `${GAP_PX}px` }}
            >
              <Button
                variant="secondary"
                onClick={() => editActionsRef.current.undo()}
                disabled={!editState.canUndo}
                title="Undo last change"
                className="!px-2.5 !py-2.5"
              >
                <Undo2 size={15} />
              </Button>

              <Button
                variant="secondary"
                onClick={() => editActionsRef.current.redo()}
                disabled={!editState.canRedo}
                title="Redo last change"
                className="!px-2.5 !py-2.5"
              >
                <Redo2 size={15} />
              </Button>

              <Button
                variant="primary"
                onClick={toggleEditMode}
                className="whitespace-nowrap"
              >
                <Check size={16} />
                Save Changes
              </Button>
            </div>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 flex-col">
          {isAnalytics ? (
            <AnalyticsPanel workspace={workspace} slots={workspace.slots} />
          ) : (
            <TimetableGrid
              workspace={workspace}
              onWorkspaceChange={setWorkspace}
              myGroup={workspace.timetable.my_group}
              viewOptions={viewOptions}
              isEditMode={isEditMode}
              actionsRef={editActionsRef}
              onEditStateChange={setEditState}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-5 py-24 text-center">
      <div
        className="flex items-center justify-center rounded-2xl"
        style={{
          width: "64px",
          height: "64px",
          background: "var(--color-surface-alt)",
          border: "1px solid var(--color-border)",
        }}
      >
        <Calendar size={26} style={{ color: "var(--color-text-muted)" }} />
      </div>

      <div style={{ maxWidth: "280px" }}>
        <h2
          className="text-base font-semibold"
          style={{
            color: "var(--color-text)",
            letterSpacing: "-0.02em",
            marginBottom: "6px",
          }}
        >
          No timetable yet
        </h2>
        <p
          className="text-sm leading-relaxed"
          style={{ color: "var(--color-text-muted)" }}
        >
          Build your weekly schedule in a few quick steps.
        </p>
      </div>

      <Button onClick={startCreate}>
        <Plus size={15} />
        Add timetable
      </Button>
    </div>
  );
}
