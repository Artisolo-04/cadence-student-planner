import { useEffect, useRef, useState } from "react";
import { AlertTriangle, CalendarDays, Plus, Trash2 } from "lucide-react";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import { useWorkspace } from "../../hooks/useWorkspace";

export default function WorkspaceList({ timetables, onOpen, onAddNew, onDelete }) {
  const { activeId } = useWorkspace();
  const scrollRef = useRef(null);
  const [selectedTimetable, setSelectedTimetable] = useState(null);
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
  }, [timetables]);

  async function handleDelete() {
    if (!selectedTimetable) return;

    setError("");
    setDeleting(true);

    try {
      await onDelete(selectedTimetable.id);
      setSelectedTimetable(null);
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong deleting the timetable.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto flex h-full w-full max-w-6xl min-h-0 flex-col gap-5">
      <header className="flex shrink-0 items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-text)]">Your timetables</h2>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Pick a workspace to open, or create a new one.
          </p>
        </div>

        <Button type="button" onClick={onAddNew} className="shrink-0">
          <Plus size={16} />
          New timetable
        </Button>
      </header>

      <section className="relative min-h-0 flex-1 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-2">
        <div
          ref={scrollRef}
          onScroll={updateScrollFades}
          className="h-full overflow-y-auto rounded-xl p-3 pr-4 scrollbar-cadence sm:p-5 sm:pr-6"
        >
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {timetables.map((timetable) => {
              const isActive = String(timetable.id) === String(activeId);

              return (
                <article
                  key={timetable.id}
                  style={{
                    backgroundImage: isActive
                      ? "linear-gradient(155deg, color-mix(in srgb, var(--color-primary) 30%, transparent) 0%, color-mix(in srgb, var(--color-primary) 14%, transparent) 55%, transparent 100%)"
                      : "linear-gradient(155deg, color-mix(in srgb, var(--color-primary) 22%, transparent) 0%, color-mix(in srgb, var(--color-accent) 10%, transparent) 55%, transparent 100%)",
                  }}
                  className={`group relative flex min-h-[160px] flex-col justify-between overflow-hidden rounded-xl border bg-white/[0.03] p-5 backdrop-blur-xl transition-all duration-300 ease-out hover:border-[color-mix(in_srgb,var(--color-primary)_55%,transparent)] hover:shadow-[0_20px_45px_-18px_color-mix(in_srgb,var(--color-primary)_55%,transparent)] ${
                    isActive ? "border-[var(--color-primary)]/50" : "border-white/10"
                  }`}
                >
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-[var(--color-primary)] opacity-20 blur-3xl transition-opacity duration-300 group-hover:opacity-35"
                  />
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-b from-white/[0.04] to-transparent"
                  />

                  <button
                    type="button"
                    onClick={() => onOpen(timetable.id)}
                    className="absolute inset-0 z-10 rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
                    aria-label={`Open ${timetable.name}`}
                  />

                  <div className="relative z-10 flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-md border border-white/15 backdrop-blur-md"
                        style={{
                          backgroundImage:
                            "linear-gradient(155deg, color-mix(in srgb, var(--color-primary) 40%, black 20%) 0%, color-mix(in srgb, var(--color-primary) 15%, black 45%) 100%)",
                          boxShadow:
                            "0 1px 0 0 rgba(255,255,255,0.15) inset, 0 -1px 3px 0 rgba(0,0,0,0.35) inset, 0 2px 6px -2px rgba(0,0,0,0.4)",
                        }}
                        aria-hidden="true"
                      >
                        <span
                          aria-hidden="true"
                          className="pointer-events-none absolute inset-x-0 top-0 h-1/2 rounded-t-md bg-gradient-to-b from-white/10 to-transparent"
                        />
                        <CalendarDays size={16} className="relative z-10 text-[var(--color-primary)] drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]" />
                      </span>

                      {isActive && (
                        <span
                          className="relative z-10 inline-flex h-9 w-fit items-center gap-1.5 overflow-hidden rounded-md px-2.5 text-[11px] font-semibold tracking-wide text-[var(--color-surface)]"
                          style={{
                            backgroundImage:
                              "linear-gradient(155deg, color-mix(in srgb, var(--color-primary) 100%, white 8%) 0%, var(--color-primary) 100%)",
                            boxShadow:
                              "0 1px 0 0 rgba(255,255,255,0.2) inset, 0 -1px 3px 0 rgba(0,0,0,0.25) inset, 0 4px 10px -4px color-mix(in srgb, var(--color-primary) 60%, transparent)",
                          }}
                        >
                          <span
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-x-0 top-0 h-1/2 rounded-t-md bg-gradient-to-b from-white/15 to-transparent"
                          />
                          <span className="relative z-10 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-surface)]" />
                          <span className="relative z-10">Active</span>
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setError("");
                        setSelectedTimetable(timetable);
                      }}
                      className="relative z-20 rounded-md p-1.5 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-danger)]/10 hover:text-[var(--color-danger)] focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-ring)]"
                      aria-label={`Delete ${timetable.name}`}
                      title="Delete timetable"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <span className="relative z-10 pr-7 text-base font-semibold leading-snug text-[var(--color-text)] line-clamp-2">
                    {timetable.name}
                  </span>
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
        open={Boolean(selectedTimetable)}
        onClose={() => !deleting && setSelectedTimetable(null)}
        title="Delete timetable?"
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setSelectedTimetable(null)}
              disabled={deleting}
            >
              Keep timetable
            </Button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--color-danger)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Trash2 size={16} />
              {deleting ? "Deleting..." : "Delete timetable"}
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
              Delete <strong className="font-semibold text-[var(--color-text)]">{selectedTimetable?.name}</strong>?
            </p>
            <p className="mt-1 text-sm leading-6 text-[var(--color-text-muted)]">
              Its timetable days and slots will be permanently removed.
            </p>
            {error && <p className="mt-3 text-sm text-[var(--color-danger)]">{error}</p>}
          </div>
        </div>
      </Modal>
    </div>
  );
}
