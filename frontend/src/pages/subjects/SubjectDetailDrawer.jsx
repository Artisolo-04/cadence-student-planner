import { useEffect, useMemo, useRef, useState } from "react";
import { X, Clock, MapPin, Users, BookOpen, Plus } from "lucide-react";
import api from "../../lib/api";
import Checkbox from "../../components/ui/Checkbox";
import Input from "../../components/ui/Input";
import { PRIORITY_STYLES } from "../homework/homeworkUtils";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_LABELS_FULL = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function formatTime(t) {
  if (!t) return "";
  const [h, m] = t.split(":");
  const hour = Number(h);
  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = ((hour + 11) % 12) + 1;
  return `${displayHour}:${m} ${suffix}`;
}

function toMinutes(t) {
  if (!t) return null;
  const parts = t.split(":");
  const h = Number(parts[0]);
  const m = Number(parts[1] || 0);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

function formatDuration(start, end) {
  const startMin = toMinutes(start);
  const endMin = toMinutes(end);
  if (startMin === null || endMin === null) return "";

  let diff = endMin - startMin;
  if (diff < 0) diff += 24 * 60; 
  if (diff === 0) return "0m";

  return formatMinutesTotal(diff);
}

function formatMinutesTotal(totalMinutes) {
  if (!totalMinutes) return "0m";
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h`;
  return `${minutes}m`;
}

function groupEntriesByDay(entries) {
  const buckets = new Map();
  for (const entry of entries) {
    const day = entry.day_of_week;
    if (!buckets.has(day)) buckets.set(day, []);
    buckets.get(day).push(entry);
  }

  return [...buckets.keys()]
    .sort((a, b) => a - b)
    .map((day) => {
      const dayEntries = buckets.get(day);
      const totalMinutes = dayEntries.reduce((sum, entry) => {
        const startMin = toMinutes(entry.start_time);
        const endMin = toMinutes(entry.end_time);
        if (startMin === null || endMin === null) return sum;
        let diff = endMin - startMin;
        if (diff < 0) diff += 24 * 60;
        return sum + diff;
      }, 0);

      return {
        key: day,
        label: DAY_LABELS_FULL[day] || DAY_LABELS[day] || `Day ${day}`,
        totalLabel: formatMinutesTotal(totalMinutes),
        entries: dayEntries,
      };
    });
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function useScrollFade(deps) {
  const ref = useRef(null);
  const [showTop, setShowTop] = useState(false);
  const [showBottom, setShowBottom] = useState(false);

  function update() {
    const el = ref.current;
    if (!el) return;
    setShowTop(el.scrollTop > 4);
    setShowBottom(el.scrollTop + el.clientHeight < el.scrollHeight - 4);
  }

  useEffect(() => {
    const frame = requestAnimationFrame(update);
    window.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", update);
    };

  }, deps);

  return { ref, showTop, showBottom, onScroll: update };
}

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
            <div className="relative z-10 flex shrink-0 items-start justify-between gap-3 overflow-hidden border-b border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full opacity-25 blur-3xl"
                style={{ backgroundColor: subject.color }}
              />

              <div className="relative z-10 flex items-center gap-3">
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--color-border)]"
                  style={{
                    backgroundImage: `linear-gradient(155deg, color-mix(in srgb, ${subject.color} 40%, black 20%) 0%, color-mix(in srgb, ${subject.color} 15%, black 45%) 100%)`,
                  }}
                >
                  <BookOpen size={18} style={{ color: subject.color }} />
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-[var(--color-text)]">{subject.name}</h3>
                  {subject.teacher && (
                    <p className="text-xs text-[var(--color-text-muted)]">{subject.teacher}</p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="relative z-10 rounded-md p-1.5 text-[var(--color-text-muted)] transition-colors hover:bg-[color-mix(in_srgb,var(--color-text)_8%,transparent)] hover:text-[var(--color-text)]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="relative z-10 flex min-h-0 flex-1 flex-col px-5 py-4 backdrop-blur-2xl">
              {loading && <p className="text-sm text-[var(--color-text-muted)]">Loading…</p>}
              {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}

              {!loading && !error && detail && (
                <div className="flex min-h-0 flex-1 flex-col gap-4">
                  {}
                  <section className="flex min-h-0 flex-1 basis-0 flex-col">
                    <h4 className="mb-2 shrink-0 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                      Weekly schedule
                    </h4>
                    <div className="relative min-h-0 flex-1">
                      <div
                        ref={scheduleFade.ref}
                        onScroll={scheduleFade.onScroll}
                        className="h-full overflow-y-auto scrollbar-cadence pr-1"
                      >
                        {detail.entries.length === 0 ? (
                          <p className="text-sm text-[var(--color-text-muted)]">
                            {timetableId
                              ? "Not scheduled in this workspace."
                              : "Select a workspace to see scheduling."}
                          </p>
                        ) : (
                          <div className="flex flex-col gap-3">
                            {scheduleDays.map((day) => (
                              <div
                                key={day.key}
                                className="rounded-lg border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-text)_4%,transparent)] px-3 py-3"
                              >
                                {}
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-sm font-semibold text-[var(--color-text)]">
                                    {day.label}
                                  </span>
                                  <span className="rounded-md border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-text)_7%,transparent)] px-2 py-0.5 text-[11px] font-medium tracking-tight text-[var(--color-text-muted)]">
                                    {day.totalLabel}
                                  </span>
                                </div>

                                {}
                                <ul className="relative mt-2.5 flex flex-col gap-2.5 pl-3">
                                  <span
                                    aria-hidden="true"
                                    className="absolute left-0 top-1 bottom-1 w-[3px] rounded-full bg-[color-mix(in_srgb,var(--color-primary)_20%,transparent)]"
                                  />
                                  {day.entries.map((entry) => {
                                    const duration = formatDuration(entry.start_time, entry.end_time);
                                    const groupLabel =
                                      entry.group_tag && entry.group_tag !== "all"
                                        ? entry.group_tag.toUpperCase()
                                        : "All";

                                    return (
                                      <li key={entry.id}>
                                        <div className="flex items-start justify-between gap-1.5 text-xs">
                                          <span className="flex shrink-0 items-center gap-1 whitespace-nowrap text-[var(--color-text-muted)]">
                                            <Clock size={11} className="shrink-0" />
                                            {formatTime(entry.start_time)} - {formatTime(entry.end_time)}
                                          </span>

                                          <div className="flex flex-wrap items-center justify-end gap-1.5">
                                            {duration && (
                                              <span className="shrink-0 rounded-md border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-text)_6%,transparent)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--color-text-muted)]">
                                                {duration}
                                              </span>
                                            )}

                                            <span className="flex shrink-0 items-center gap-1 rounded-md border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-surface)_55%,transparent)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--color-text)] backdrop-blur-md">
                                              <Users size={10} />
                                              {groupLabel}
                                            </span>

                                            {entry.room && (
                                              <span className="flex max-w-[100px] items-center gap-1 rounded-md border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-surface)_55%,transparent)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--color-text)] backdrop-blur-md">
                                                <MapPin size={10} className="shrink-0" />
                                                <span className="truncate">{entry.room}</span>
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </li>
                                    );
                                  })}
                                </ul>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div
                        aria-hidden="true"
                        className={`pointer-events-none absolute inset-x-0 top-0 z-10 h-8 bg-gradient-to-b from-[var(--color-surface)] to-transparent transition-opacity duration-200 ${
                          scheduleFade.showTop ? "opacity-100" : "opacity-0"
                        }`}
                      />
                      <div
                        aria-hidden="true"
                        className={`pointer-events-none absolute inset-x-0 bottom-0 z-10 h-10 bg-gradient-to-t from-[var(--color-surface)] to-transparent transition-opacity duration-200 ${
                          scheduleFade.showBottom ? "opacity-100" : "opacity-0"
                        }`}
                      />
                    </div>
                  </section>

                  <div className="shrink-0 border-t border-[var(--color-border)]" />

                  {}
                  <section className="flex min-h-0 flex-1 basis-0 flex-col">
                    <h4 className="mb-2 shrink-0 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                      Homework
                    </h4>

                    <form onSubmit={handleAddHomework} className="mb-3 flex shrink-0 items-center gap-2">
                      <div className="flex-1">
                        <Input
                          id="quick-add-homework"
                          value={newTitle}
                          onChange={(e) => setNewTitle(e.target.value)}
                          placeholder="Add a task…"
                          disabled={addingHomework}
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={!newTitle.trim() || addingHomework}
                        aria-label="Add task"
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary)] text-[var(--color-primary-fg)] transition-colors hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:bg-[var(--color-border)] disabled:text-[var(--color-text-muted)]"
                      >
                        <Plus size={16} />
                      </button>
                    </form>
                    {addError && (
                      <p className="mb-2 shrink-0 text-xs text-[var(--color-danger)]">{addError}</p>
                    )}

                    <div className="relative min-h-0 flex-1">
                      <div
                        ref={homeworkFade.ref}
                        onScroll={homeworkFade.onScroll}
                        className="h-full overflow-y-auto scrollbar-cadence pr-1"
                      >
                        {detail.homework.length === 0 ? (
                          <p className="text-sm text-[var(--color-text-muted)]">No homework linked yet.</p>
                        ) : (
                          <ul className="flex flex-col gap-2">
                            {detail.homework.map((hw) => {
                              const isDone = hw.status === "done";
                              const isToggling = togglingIds.has(hw.id);
                              const priority = PRIORITY_STYLES[hw.priority] || PRIORITY_STYLES.normal;
                              return (
                                <li
                                  key={hw.id}
                                  className="group rounded-lg border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-text)_4%,transparent)] px-3 py-2 text-sm transition-colors duration-200 hover:border-[color-mix(in_srgb,var(--color-primary)_35%,transparent)]"
                                >
                                  <div className="flex items-center gap-2.5">
                                    <Checkbox
                                      id={`hw-${hw.id}`}
                                      checked={isDone}
                                      disabled={isToggling}
                                      onChange={() => toggleHomeworkStatus(hw)}
                                      className="shrink-0"
                                    />

                                    <span
                                      aria-hidden="true"
                                      className="h-1.5 w-1.5 shrink-0 rounded-full transition-transform duration-200 group-hover:scale-125"
                                      style={{
                                        backgroundColor: priority.color,
                                        boxShadow: `0 0 6px color-mix(in srgb, ${priority.color} 55%, transparent)`,
                                      }}
                                      title={`${priority.label || hw.priority || "Normal"} priority`}
                                    />

                                    <span
                                      className={`flex-1 font-medium line-clamp-1 transition-all duration-200 ${
                                        isDone
                                          ? "text-[var(--color-text-muted)] line-through opacity-40"
                                          : "text-[var(--color-text)] opacity-100"
                                      }`}
                                    >
                                      {hw.title}
                                    </span>
                                    <span className="shrink-0 text-xs text-[var(--color-text-muted)]">
                                      {hw.due_date?.slice(0, 10)}
                                    </span>
                                  </div>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </div>

                      <div
                        aria-hidden="true"
                        className={`pointer-events-none absolute inset-x-0 top-0 z-10 h-8 bg-gradient-to-b from-[var(--color-surface)] to-transparent transition-opacity duration-200 ${
                          homeworkFade.showTop ? "opacity-100" : "opacity-0"
                        }`}
                      />
                      <div
                        aria-hidden="true"
                        className={`pointer-events-none absolute inset-x-0 bottom-0 z-10 h-10 bg-gradient-to-t from-[var(--color-surface)] to-transparent transition-opacity duration-200 ${
                          homeworkFade.showBottom ? "opacity-100" : "opacity-0"
                        }`}
                      />
                    </div>
                  </section>
                </div>
              )}
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
