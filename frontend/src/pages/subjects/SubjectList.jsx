import { useEffect, useRef, useState } from "react";
import { AlertTriangle, BookOpen, Clock, Pencil, Plus, Trash2 } from "lucide-react";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";

function formatWeeklyHours(hours) {
  if (!hours) return null;
  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m}m/wk`;
  if (m === 0) return `${h}h/wk`;
  return `${h}h ${m}m/wk`;
}

export default function SubjectList({ subjects, onAddNew, onEdit, onDelete, onSelect }) {
  const scrollRef = useRef(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [showTopFade, setShowTopFade] = useState(false);
  const [showBottomFade, setShowBottomFade] = useState(false);

  function updateScrollFades() {
    const element = scrollRef.current;
    if (!element) return;

    setShowTopFade(element.scrollTop > 4);
    setShowBottomFade(
      element.scrollTop + element.clientHeight < element.scrollHeight - 4
    );
  }

  useEffect(() => {
    const frame = requestAnimationFrame(updateScrollFades);
    window.addEventListener("resize", updateScrollFades);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", updateScrollFades);
    };
  }, [subjects]);

  async function handleDelete() {
    if (!selectedSubject) return;

    setError("");
    setDeleting(true);

    try {
      await onDelete(selectedSubject.id);
      setSelectedSubject(null);
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong deleting the subject.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto flex h-full w-full max-w-6xl min-h-0 flex-col gap-5">
      <header className="flex shrink-0 items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-text)]">Your subjects</h2>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Manage the subjects you'll assign into your timetable.
          </p>
        </div>

        <Button type="button" onClick={onAddNew} className="shrink-0">
          <Plus size={16} />
          New subject
        </Button>
      </header>

      <section className="relative min-h-0 flex-1 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-2">
        <div
          ref={scrollRef}
          onScroll={updateScrollFades}
          className="h-full overflow-y-auto rounded-xl p-3 pr-4 scrollbar-cadence sm:p-5 sm:pr-6"
        >
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {subjects.map((subject) => {
              const hoursLabel = formatWeeklyHours(subject.weekly_hours);
              return (
                <article
                  key={subject.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelect?.(subject)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelect?.(subject);
                    }
                  }}
                  style={{
                    "--subject-color": subject.color,
                    backgroundImage:
                      "linear-gradient(155deg, color-mix(in srgb, var(--subject-color) 22%, transparent) 0%, color-mix(in srgb, var(--color-accent) 10%, transparent) 55%, transparent 100%)",
                  }}
                  className="group relative flex min-h-[160px] cursor-pointer flex-col justify-between overflow-hidden rounded-xl border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-text)_3%,var(--color-surface))] p-5 backdrop-blur-xl transition-all duration-300 ease-out hover:border-[color-mix(in_srgb,var(--subject-color)_55%,transparent)] hover:shadow-[0_20px_45px_-18px_color-mix(in_srgb,var(--subject-color)_35%,transparent)] focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-ring)]"
                >
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full opacity-20 blur-3xl transition-opacity duration-300 group-hover:opacity-35"
                    style={{ backgroundColor: "var(--subject-color)" }}
                  />
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-b from-[color-mix(in_srgb,var(--color-text)_4%,transparent)] to-transparent"
                  />

                  <div className="relative z-10 flex items-start justify-between">
                    <span
                      className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg border border-white/15 backdrop-blur-md"
                      style={{
                        backgroundImage: `linear-gradient(155deg, color-mix(in srgb, ${subject.color} 40%, black 20%) 0%, color-mix(in srgb, ${subject.color} 15%, black 45%) 100%)`,
                        boxShadow:
                          "0 1px 0 0 rgba(255,255,255,0.15) inset, 0 -1px 3px 0 rgba(0,0,0,0.35) inset, 0 2px 6px -2px rgba(0,0,0,0.4)",
                      }}
                      aria-hidden="true"
                    >
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-x-0 top-0 h-1/2 rounded-t-md bg-gradient-to-b from-white/10 to-transparent"
                      />
                      <BookOpen size={16} style={{ color: subject.color }} className="relative z-10 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]" />
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(subject);
                        }}
                        className="rounded-md p-1.5 text-[var(--color-text-muted)] transition-colors hover:bg-white/10 hover:text-[var(--color-text)] focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-ring)]"
                        aria-label={`Edit ${subject.name}`}
                        title="Edit subject"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setError("");
                          setSelectedSubject(subject);
                        }}
                        className="rounded-md p-1.5 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-danger)]/10 hover:text-[var(--color-danger)] focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-ring)]"
                        aria-label={`Delete ${subject.name}`}
                        title="Delete subject"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="relative z-10 mt-5 flex flex-1 flex-col justify-between">
                    <div>
                      <span className="block text-base font-semibold leading-snug text-[var(--color-text)] line-clamp-2">
                        {subject.name}
                      </span>
                      {subject.teacher && (
                        <span className="mt-1 block text-sm text-[var(--color-text-muted)] line-clamp-1">
                          {subject.teacher}
                        </span>
                      )}
                    </div>
                    {hoursLabel && (
                      <span
                        className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium"
                        style={{
                          borderColor: `color-mix(in srgb, ${subject.color} 35%, transparent)`,
                          backgroundColor: `color-mix(in srgb, ${subject.color} 14%, transparent)`,
                          color: subject.color,
                        }}
                      >
                        <Clock size={11} />
                        {hoursLabel}
                      </span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-x-2 top-2 z-10 h-12 bg-gradient-to-b from-[var(--color-surface)] to-transparent transition-opacity duration-200 ${
            showTopFade ? "opacity-100" : "opacity-0"
          }`}
        />

        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-x-2 bottom-2 z-10 h-16 bg-gradient-to-t from-[var(--color-surface)] to-transparent transition-opacity duration-200 ${
            showBottomFade ? "opacity-100" : "opacity-0"
          }`}
        />
      </section>

      <Modal
        open={Boolean(selectedSubject)}
        onClose={() => !deleting && setSelectedSubject(null)}
        title="Delete subject?"
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setSelectedSubject(null)}
              disabled={deleting}
            >
              Keep subject
            </Button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--color-danger)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Trash2 size={16} />
              {deleting ? "Deleting..." : "Delete subject"}
            </button>
          </>
        }
      >
        <div className="flex gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-danger)]/10 text-[var(--color-danger)]">
            <AlertTriangle size={18} />
          </span>
          <div>
            <p className="text-sm leading-6 text-[var(--color-text-muted)]">
              Delete <strong className="font-semibold text-[var(--color-text)]">{selectedSubject?.name}</strong>?
            </p>
            <p className="mt-1 text-sm leading-6 text-[var(--color-text-muted)]">
              It will be removed from any timetable cells it's assigned to.
            </p>
            {error && <p className="mt-3 text-sm text-[var(--color-danger)]">{error}</p>}
          </div>
        </div>
      </Modal>
    </div>
  );
}
