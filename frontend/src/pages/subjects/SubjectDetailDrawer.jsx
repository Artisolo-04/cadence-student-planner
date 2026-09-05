import { useEffect, useMemo, useState } from "react";
import api from "../../lib/api";
import DrawerHeader from "./subjectDetail/DrawerHeader";
import ScheduleSection from "./subjectDetail/ScheduleSection";
import HomeworkSection from "./subjectDetail/HomeworkSection";
import { useScrollFade } from "./subjectDetail/useScrollFade";
import { groupEntriesByDay, todayISO } from "./subjectDetail/subjectDetailUtils";

export default function SubjectDetailDrawer({ subject, timetableId, onClose }) {
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

  const scheduleFade = useScrollFade([detail?.entries]);
  const homeworkFade = useScrollFade([detail?.homework]);

  const scheduleDays = useMemo(
    () => (detail?.entries ? groupEntriesByDay(detail.entries) : []),
    [detail?.entries]
  );

  useEffect(() => {
    let raf1, raf2;
    if (open) {
      setMounted(true);
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
    <div className="absolute inset-0 z-50 flex justify-end">
      <div
        className={`absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-200 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={`relative flex h-full w-full max-w-sm flex-col overflow-hidden border-l border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-surface)_92%,transparent)] shadow-[0_0_60px_-15px_rgba(0,0,0,0.35)] transition-transform duration-200 ease-out ${
          visible ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {subject && (
          <>
            <DrawerHeader subject={subject} onClose={onClose} />

            <div className="relative z-10 flex min-h-0 flex-1 flex-col px-5 py-4 backdrop-blur-2xl">
              {loading && <p className="text-sm text-[var(--color-text-muted)]">Loading…</p>}
              {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}

              {!loading && !error && detail && (
                <div className="flex min-h-0 flex-1 flex-col gap-4">
                  <ScheduleSection
                    entries={detail.entries}
                    timetableId={timetableId}
                    scheduleDays={scheduleDays}
                    fade={scheduleFade}
                  />

                  <div className="shrink-0 border-t border-[var(--color-border)]" />

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
              )}
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
