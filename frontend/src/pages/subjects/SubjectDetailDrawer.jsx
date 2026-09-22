import { useEffect, useMemo, useState } from "react";
import { Calendar, ClipboardList, Search } from "lucide-react";
import api from "../../lib/api";
import DrawerHeader from "./subjectDetail/DrawerHeader";
import ScheduleSection from "./subjectDetail/ScheduleSection";
import HomeworkSection from "./subjectDetail/HomeworkSection";
import SummaryHud from "./subjectDetail/SummaryHud";
import useScrollFade from "../../hooks/useScrollFade";
import CalendarWorkspaceEngine from "./subjectDetail/CalendarWorkspaceEngine";
import SegmentedControl from "../../components/ui/SegmentedControl";
import {
  groupEntriesByDay,
  todayISO,
  getNextSession,
  sumEntryMinutes,
} from "./subjectDetail/subjectDetailUtils";

const FALLBACK_TOTAL_WEEKLY_MINUTES = 1800;

export default function SubjectDetailDrawer({
  subject,
  timetableId,
  onClose,
  totalWeeklyMinutes = FALLBACK_TOTAL_WEEKLY_MINUTES,
}) {
  const open = Boolean(subject);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState("");

  const [togglingIds, setTogglingIds] = useState(() => new Set());
  const [newTitle, setNewTitle] = useState("");
  const [addingHomework, setAddingHomework] = useState(false);
  const [addError, setAddError] = useState("");

  const [activeTab, setActiveTab] = useState("schedule");
  const [viewMode, setViewMode] = useState("default");

  const scheduleFadeRaw = useScrollFade(detail?.entries);
  const homeworkFadeRaw = useScrollFade(detail?.homework);

  const scheduleFade = {
    ref: scheduleFadeRaw.scrollRef,
    onScroll: scheduleFadeRaw.updateScrollFades,
    showTop: scheduleFadeRaw.showTopFade,
    showBottom: scheduleFadeRaw.showBottomFade,
  };
  const homeworkFade = {
    ref: homeworkFadeRaw.scrollRef,
    onScroll: homeworkFadeRaw.updateScrollFades,
    showTop: homeworkFadeRaw.showTopFade,
    showBottom: homeworkFadeRaw.showBottomFade,
  };

  const scheduleDays = useMemo(
    () => (detail?.entries ? groupEntriesByDay(detail.entries) : []),
    [detail?.entries]
  );

  const activeTaskCount = useMemo(
    () => (detail?.homework ? detail.homework.filter((hw) => hw.status !== "done").length : 0),
    [detail?.homework]
  );

  const daysPerWeek = scheduleDays.length;

  const nextSession = useMemo(
    () => (detail?.entries ? getNextSession(detail.entries) : null),
    [detail?.entries]
  );

  const subjectWeeklyMinutes = useMemo(
    () => (detail?.entries ? sumEntryMinutes(detail.entries) : 0),
    [detail?.entries]
  );

  const footprintPercent = useMemo(() => {
    if (!totalWeeklyMinutes) return 0;
    return Math.round((subjectWeeklyMinutes / totalWeeklyMinutes) * 100);
  }, [subjectWeeklyMinutes, totalWeeklyMinutes]);

  const tasksCompleted = useMemo(
    () => (detail?.homework ? detail.homework.filter((hw) => hw.status === "done").length : 0),
    [detail?.homework]
  );
  const tasksTotal = detail?.homework?.length || 0;

  useEffect(() => {
    let raf1, raf2;
    if (open) {
      setMounted(true);
      setActiveTab("schedule");
      setViewMode("default");
      raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => setVisible(true));
      });
    } else {
      setVisible(false);
      const timeout = setTimeout(() => setMounted(false), 220);
      return () => clearTimeout(timeout);
    }
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !subject) return;

    let cancelled = false;
    setLoading(true);
    setError("");
    setDetail(null);
    setNewTitle("");
    setAddError("");

    api
      .get(`/subjects/${subject.id}/detail`, {
        params: timetableId ? { timetableId } : undefined,
      })
      .then(({ data }) => {
        if (!cancelled) setDetail(data);
      })
      .catch((err) => {
        console.error("Load subject detail error:", err);
        if (!cancelled) setError("Couldn't load this subject's details.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, subject, timetableId]);

  async function toggleHomeworkStatus(hw) {
    const nextStatus = hw.status === "done" ? "todo" : "done";

    setTogglingIds((prev) => new Set(prev).add(hw.id));
    setDetail((prev) => ({
      ...prev,
      homework: prev.homework.map((item) =>
        item.id === hw.id ? { ...item, status: nextStatus } : item
      ),
    }));

    try {
      const { data } = await api.patch(`/homework/${hw.id}/status`, {
        status: nextStatus,
      });
      setDetail((prev) => ({
        ...prev,
        homework: prev.homework.map((item) =>
          item.id === hw.id ? { ...item, ...data } : item
        ),
      }));
    } catch (err) {
      console.error("Toggle homework status error:", err);
      setDetail((prev) => ({
        ...prev,
        homework: prev.homework.map((item) =>
          item.id === hw.id ? { ...item, status: hw.status } : item
        ),
      }));
    } finally {
      setTogglingIds((prev) => {
        const next = new Set(prev);
        next.delete(hw.id);
        return next;
      });
    }
  }

  async function handleAddHomework(e) {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title || addingHomework) return;

    setAddingHomework(true);
    setAddError("");

    try {
      const { data } = await api.post("/homework", {
        subjectId: subject.id,
        title,
        dueDate: todayISO(),
        status: "todo",
      });
      setDetail((prev) => ({
        ...prev,
        homework: [...prev.homework, data],
      }));
      setNewTitle("");
    } catch (err) {
      console.error("Create homework error:", err);
      setAddError("Couldn't add that task.");
    } finally {
      setAddingHomework(false);
    }
  }

  if (!mounted) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center md:p-wide">
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-200 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className={`relative flex h-full w-full max-w-[1400px] flex-col overflow-hidden bg-[color-mix(in_srgb,var(--color-surface)_92%,transparent)] shadow-[0_0_80px_-20px_rgba(0,0,0,0.5)] transition-all duration-200 ease-out md:rounded-2xl md:border md:border-[var(--color-border)] md:h-[90vh] ${
          visible ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        {subject && (
          <>
            <DrawerHeader
              subject={subject}
              onClose={onClose}
              weeklySlots={detail?.entries?.length || 0}
              activeTasks={activeTaskCount}
              daysPerWeek={daysPerWeek}
            />

            <div className="relative z-10 flex min-h-0 flex-1 flex-col backdrop-blur-2xl">
              {loading && (
                <p className="p-plush text-sm text-[var(--color-text-muted)]">Loading…</p>
              )}
              {error && (
                <p className="p-plush text-sm text-[var(--color-danger)]">{error}</p>
              )}

              {!loading && !error && detail && (
                <div className="flex min-h-0 flex-1 flex-col md:flex-row">
                  <div className="hidden shrink-0 flex-col gap-plush px-plush py-plush md:flex md:w-72 md:border-r md:border-[var(--color-border)]">
                    <SummaryHud
                      nextSession={nextSession}
                      footprintPercent={footprintPercent}
                      accentColor={subject.color}
                      tasksCompleted={tasksCompleted}
                      tasksTotal={tasksTotal}
                    />

                    <div className="mt-auto">
                      <button
                        type="button"
                        onClick={() =>
                          setViewMode((prev) => (prev === "default" ? "grid" : "default"))
                        }
                        aria-pressed={viewMode === "grid"}
                        className={`flex w-full items-center justify-center gap-inline rounded-xl border px-comfy py-cozy text-xs font-medium backdrop-blur-md transition-colors duration-200 ${
                          viewMode === "grid"
                            ? "border-[var(--color-primary)] bg-[color-mix(in_srgb,var(--color-primary)_18%,transparent)] text-[var(--color-primary)]"
                            : "border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-surface)_55%,transparent)] text-[var(--color-text)] hover:border-[color-mix(in_srgb,var(--color-primary)_35%,transparent)]"
                        }`}
                      >
                        <Search size={14} />
                        {viewMode === "grid" ? "Back to Panel View" : "Toggle Timetable Grid View"}
                      </button>
                    </div>
                  </div>

                  <div className="relative min-h-0 flex-1">
                    <div
                      className={`absolute inset-0 flex min-h-0 flex-col transition-opacity duration-200 md:flex-row ${
                        viewMode === "default"
                          ? "pointer-events-auto opacity-100"
                          : "pointer-events-none opacity-0"
                      }`}
                    >
                      <div
                        className={`min-h-0 flex-1 flex-col px-plush py-roomy pb-nav-clearance-b md:flex md:border-r md:border-[var(--color-border)] md:pb-roomy ${
                          activeTab === "schedule" ? "flex" : "hidden"
                        }`}
                      >
                        <ScheduleSection
                          entries={detail.entries}
                          timetableId={timetableId}
                          scheduleDays={scheduleDays}
                          fade={scheduleFade}
                        />
                      </div>

                      <div
                        className={`min-h-0 flex-1 flex-col px-plush py-roomy pb-nav-clearance-b md:flex md:pb-roomy ${
                          activeTab === "tasks" ? "flex" : "hidden"
                        }`}
                      >
                        <HomeworkSection
                          homework={detail.homework}
                          togglingIds={togglingIds}
                          newTitle={newTitle}
                          setNewTitle={setNewTitle}
                          addingHomework={addingHomework}
                          addError={addError}
                          onSubmit={handleAddHomework}
                          onToggle={toggleHomeworkStatus}
                          fade={homeworkFade}
                        />
                      </div>
                    </div>

                    <div
                      className={` hidden absolute inset-0 px-plush py-plush transition-opacity duration-200 md:block ${
                        viewMode === "grid"
                          ? "pointer-events-auto opacity-100"
                          : "pointer-events-none opacity-0"
                      }`}
                    >
                      <CalendarWorkspaceEngine
                        subject={subject}
                        timetableId={timetableId}
                        enabled={viewMode === "grid"}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {!loading && !error && detail && viewMode === "default" && (
              <div className="pointer-events-none absolute inset-x-0 bottom-4 z-20 flex justify-center md:hidden">
                <div className="pointer-events-auto rounded-lg shadow-[0_8px_30px_-8px_rgba(0,0,0,0.5)] backdrop-blur-xl">
                    <SegmentedControl
                      ariaLabel="Drawer section"
                      variant="labeled"
                      value={activeTab}
                      onChange={setActiveTab}
                      options={[
                        { id: "schedule", label: "Schedule", Icon: Calendar },
                        { id: "tasks", label: "Tasks", Icon: ClipboardList },
                      ]}
                    />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
