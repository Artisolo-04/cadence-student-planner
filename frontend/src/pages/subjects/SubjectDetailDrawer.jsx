import { useEffect, useState } from "react";
import { X, Clock, MapPin, Users, BookOpen } from "lucide-react";
import api from "../../lib/api";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatTime(t) {
  if (!t) return "";
  const [h, m] = t.split(":");
  const hour = Number(h);
  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = ((hour + 11) % 12) + 1;
  return `${displayHour}:${m} ${suffix}`;
}

export default function SubjectDetailDrawer({ subject, timetableId, onClose }) {
  const open = Boolean(subject);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState("");

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
        className={`relative flex h-full w-full max-w-sm flex-col overflow-hidden border-l border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-surface)_92%,transparent)] backdrop-blur-2xl shadow-[0_0_60px_-15px_rgba(0,0,0,0.35)] transition-transform duration-200 ease-out ${
          visible ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {subject && (
          <>
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full opacity-25 blur-3xl"
              style={{ backgroundColor: subject.color }}
            />

            <div className="relative z-10 flex shrink-0 items-start justify-between gap-3 border-b border-[var(--color-border)] px-5 py-4">
              <div className="flex items-center gap-3">
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
                className="rounded-md p-1.5 text-[var(--color-text-muted)] transition-colors hover:bg-[color-mix(in_srgb,var(--color-text)_8%,transparent)] hover:text-[var(--color-text)]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="relative z-10 min-h-0 flex-1 overflow-y-auto scrollbar-cadence px-5 py-4">
              {loading && <p className="text-sm text-[var(--color-text-muted)]">Loading…</p>}
              {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}

              {!loading && !error && detail && (
                <>
                  <section className="mb-6">
                    <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                      Weekly schedule
                    </h4>
                    {detail.entries.length === 0 ? (
                      <p className="text-sm text-[var(--color-text-muted)]">
                        {timetableId
                          ? "Not scheduled in this workspace."
                          : "Select a workspace to see scheduling."}
                      </p>
                    ) : (
                      <ul className="flex flex-col gap-2">
                        {detail.entries.map((entry) => (
                          <li
                            key={entry.id}
                            className="rounded-lg border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-text)_4%,transparent)] px-3 py-2 text-sm text-[var(--color-text)]"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{DAY_LABELS[entry.day_of_week]}</span>
                              <span className="flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
                                <Clock size={12} />
                                {formatTime(entry.start_time)}–{formatTime(entry.end_time)}
                              </span>
                            </div>
                            {(entry.room || entry.group_tag !== "all") && (
                              <div className="mt-1 flex items-center gap-3 text-xs text-[var(--color-text-muted)]">
                                {entry.room && (
                                  <span className="flex items-center gap-1">
                                    <MapPin size={12} />
                                    {entry.room}
                                  </span>
                                )}
                                {entry.group_tag !== "all" && (
                                  <span className="flex items-center gap-1">
                                    <Users size={12} />
                                    {entry.group_tag.toUpperCase()}
                                  </span>
                                )}
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>

                  <section>
                    <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                      Homework
                    </h4>
                    {detail.homework.length === 0 ? (
                      <p className="text-sm text-[var(--color-text-muted)]">No homework linked yet.</p>
                    ) : (
                      <ul className="flex flex-col gap-2">
                        {detail.homework.map((hw) => (
                          <li
                            key={hw.id}
                            className="rounded-lg border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-text)_4%,transparent)] px-3 py-2 text-sm"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-medium text-[var(--color-text)] line-clamp-1">
                                {hw.title}
                              </span>
                              <span className="shrink-0 text-xs text-[var(--color-text-muted)]">
                                {hw.due_date?.slice(0, 10)}
                              </span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                </>
              )}
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
