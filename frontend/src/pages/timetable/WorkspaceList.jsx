import { useEffect, useRef, useState } from "react";
import { AlertTriangle, CalendarDays, Plus, Trash2 } from "lucide-react";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";

export default function WorkspaceList({ timetables, onOpen, onAddNew, onDelete }) {
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
            {timetables.map((timetable) => (
              <article
                key={timetable.id}
                className="group relative flex min-h-[160px] flex-col justify-between rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-5 transition-colors duration-150 hover:border-[var(--color-primary)]"
              >
                <button
                  type="button"
                  onClick={() => onOpen(timetable.id)}
                  className="absolute inset-0 rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
                  aria-label={`Open ${timetable.name}`}
                />

                <div className="relative z-10 flex items-start justify-between">
                  <CalendarDays
                    size={20}
                    className="text-[var(--color-text-muted)] transition-colors group-hover:text-[var(--color-primary)]"
                  />

                  <button
                    type="button"
                    onClick={() => {
                      setError("");
                      setSelectedTimetable(timetable);
                    }}
                    className="rounded-md p-1.5 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-danger)]/10 hover:text-[var(--color-danger)] focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-ring)]"
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
            ))}

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
