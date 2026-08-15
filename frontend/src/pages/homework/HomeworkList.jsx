import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Flag, LayoutGrid, List as ListIcon, Pencil, Plus, Trash2 } from "lucide-react";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import Checkbox from "../../components/ui/Checkbox";
import HomeworkBoard from "./board/HomeworkBoard";

const PRIORITY_STYLES = {
  high: { label: "High", color: "var(--color-danger)" },
  normal: { label: "Normal", color: "var(--color-text-muted)" },
  low: { label: "Low", color: "var(--color-primary)" },
};

const STATUS_STYLES = {
  todo: {
    label: "To do",
    className: "border-[var(--color-border)] text-[var(--color-text-muted)]",
  },
  in_progress: {
    label: "In progress",
    className: "border-[var(--color-primary)]/40 text-[var(--color-primary)] bg-[var(--color-primary)]/10",
  },
  done: {
    label: "Done",
    className: "border-emerald-500/40 text-emerald-400 bg-emerald-500/10",
  },
};

function formatDueDate(dueDate) {
  const isoDate = String(dueDate).slice(0, 10);
  const date = new Date(`${isoDate}T00:00:00`);
  return date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

function isOverdue(dueDate, status) {
  if (status === "done") return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isoDate = String(dueDate).slice(0, 10);
  const due = new Date(`${isoDate}T00:00:00`);
  return due < today;
}

export default function HomeworkList({ homework, onAddNew, onEdit, onDelete, onToggleDone, onStatusChange, onReorder }) {
  const [view, setView] = useState("list");
  const [selectedItem, setSelectedItem] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef(null);
  const [showTopFade, setShowTopFade] = useState(false);
  const [showBottomFade, setShowBottomFade] = useState(false);

  function updateScrollFades() {
    const element = scrollRef.current;
    if (!element) return;
    setShowTopFade(element.scrollTop > 4);
    setShowBottomFade(element.scrollTop + element.clientHeight < element.scrollHeight - 4);
  }

  useEffect(() => {
    const frame = requestAnimationFrame(updateScrollFades);
    window.addEventListener("resize", updateScrollFades);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", updateScrollFades);
    };
  }, [homework]);

  const pending = homework.filter((h) => h.status !== "done");
  const completed = homework.filter((h) => h.status === "done");

  async function handleDelete() {
    if (!selectedItem) return;
    setError("");
    setDeleting(true);
    try {
      await onDelete(selectedItem.id);
      setSelectedItem(null);
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong deleting the homework.");
    } finally {
      setDeleting(false);
    }
  }

  function renderItem(item) {
    const overdue = isOverdue(item.due_date, item.status);
    const priority = PRIORITY_STYLES[item.priority] || PRIORITY_STYLES.normal;
    const statusStyle = STATUS_STYLES[item.status] || STATUS_STYLES.todo;
    const hasTags = Boolean(item.subject_name) || item.priority !== "normal";

    return (
      <article
        key={item.id}
        style={{
          backgroundImage:
            "linear-gradient(155deg, color-mix(in srgb, var(--color-primary) 14%, transparent) 0%, color-mix(in srgb, var(--color-accent) 6%, transparent) 55%, transparent 100%)",
        }}
        className="group relative flex items-start gap-4 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-xl transition-all duration-300 ease-out hover:border-[color-mix(in_srgb,var(--color-primary)_55%,transparent)] hover:shadow-[0_0_28px_-8px_color-mix(in_srgb,var(--color-primary)_40%,transparent)]"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full bg-[var(--color-primary)] opacity-10 blur-3xl transition-opacity duration-300 group-hover:opacity-20"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-b from-white/[0.03] to-transparent"
        />

        <Checkbox
          id={`homework-done-${item.id}`}
          checked={item.status === "done"}
          onChange={() => onToggleDone(item)}
          className="relative z-10 mt-0.5 shrink-0"
          aria-label={item.status === "done" ? "Mark as not done" : "Mark as done"}
        />

        <div className="relative z-10 min-w-0 flex-1">
          {hasTags && (
            <div className="flex flex-wrap items-center gap-2">
              {item.subject_name && (
                <span
                  className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold backdrop-blur-md"
                  style={{
                    borderColor: `color-mix(in srgb, ${item.subject_color || "var(--color-primary)"} 45%, transparent)`,
                    backgroundColor: `color-mix(in srgb, ${item.subject_color || "var(--color-primary)"} 20%, transparent)`,
                    color: item.subject_color || "var(--color-primary)",
                    boxShadow: `inset 0 1px 0 0 color-mix(in srgb, ${item.subject_color || "var(--color-primary)"} 25%, transparent), 0 0 12px -4px color-mix(in srgb, ${item.subject_color || "var(--color-primary)"} 55%, transparent)`,
                  }}
                >
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{
                      backgroundColor: item.subject_color || "var(--color-primary)",
                      boxShadow: `0 0 6px 0 color-mix(in srgb, ${item.subject_color || "var(--color-primary)"} 90%, transparent)`,
                    }}
                    aria-hidden="true"
                  />
                  {item.subject_name}
                </span>
              )}
              {item.priority !== "normal" && (
                <span
                  className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1 text-xs font-medium backdrop-blur-md"
                  style={{ color: priority.color }}
                >
                  <Flag size={12} />
                  {priority.label}
                </span>
              )}
            </div>
          )}

          <h3
            className={`truncate text-sm font-semibold text-[var(--color-text)] ${hasTags ? "mt-2" : ""} ${
              item.status === "done" ? "line-through opacity-60" : ""
            }`}
          >
            {item.title}
          </h3>

          {item.notes && (
            <p className="mt-1 text-sm text-[var(--color-text-muted)] line-clamp-2">{item.notes}</p>
          )}
        </div>

        <div className="relative z-10 flex shrink-0 flex-col items-end gap-2">
          <span
            className={`inline-flex items-center whitespace-nowrap rounded-lg border px-2.5 py-1 text-xs font-medium ${
              overdue
                ? "border-[var(--color-danger)]/40 bg-[var(--color-danger)]/10 text-[var(--color-danger)]"
                : "border-white/10 bg-white/[0.03] text-[var(--color-text-muted)]"
            }`}
          >
            {overdue && <AlertTriangle size={12} className="mr-1" />}
            {formatDueDate(item.due_date)}
          </span>
          <span className={`rounded-lg border px-2.5 py-1 text-[11px] font-medium ${statusStyle.className}`}>
            {statusStyle.label}
          </span>
        </div>

        <div className="relative z-20 ml-2 flex shrink-0 items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(item)}
            className="h-8 w-8 rounded-lg border border-white/10 bg-white/[0.03] backdrop-blur-md hover:border-[var(--color-primary)]/40 hover:bg-[var(--color-primary)]/10 hover:text-[var(--color-primary)]"
            aria-label={`Edit ${item.title}`}
            title="Edit"
          >
            <Pencil size={14} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setError("");
              setSelectedItem(item);
            }}
            className="h-8 w-8 rounded-lg border border-white/10 bg-white/[0.03] backdrop-blur-md hover:border-[var(--color-danger)]/40 hover:bg-[var(--color-danger)]/10 hover:text-[var(--color-danger)]"
            aria-label={`Delete ${item.title}`}
            title="Delete"
          >
            <Trash2 size={14} />
          </Button>
        </div>
      </article>
    );
  }

  return (
    <div className="mx-auto flex h-full w-full max-w-6xl min-h-0 flex-col gap-5">
      <header className="flex shrink-0 items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-text)]">Your homework</h2>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Track what's due and mark it off as you go.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-1">
            <button type="button" onClick={() => setView("list")} className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${view === "list" ? "bg-[var(--color-primary)] text-[var(--color-primary-fg)]" : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"}`}>
              <ListIcon size={14} />
              List
            </button>
            <button type="button" onClick={() => setView("board")} className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${view === "board" ? "bg-[var(--color-primary)] text-[var(--color-primary-fg)]" : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"}`}>
              <LayoutGrid size={14} />
              Board
            </button>
          </div>
          <Button type="button" onClick={onAddNew} className="shrink-0">
            <Plus size={16} />
            New homework
          </Button>
        </div>
      </header>

      {view === "list" && (
      <section className="relative min-h-0 flex-1 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-2">
        <div ref={scrollRef} onScroll={updateScrollFades} className="h-full overflow-y-auto rounded-xl p-3 pr-4 scrollbar-cadence sm:p-5 sm:pr-6">
        <div className="flex flex-col gap-6 pb-2">
          <section className="flex flex-col gap-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
              Pending ({pending.length})
            </h3>
            {pending.length === 0 ? (
              <p className="text-sm text-[var(--color-text-muted)]">Nothing pending. You're all caught up.</p>
            ) : (
              <div className="flex flex-col gap-3">{pending.map(renderItem)}</div>
            )}
          </section>

          {completed.length > 0 && (
            <section className="flex flex-col gap-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                Completed ({completed.length})
              </h3>
              <div className="flex flex-col gap-3">{completed.map(renderItem)}</div>
            </section>
          )}
        </div>
        </div>

        <div aria-hidden="true" className={`pointer-events-none absolute inset-x-2 top-2 z-10 h-12 bg-gradient-to-b from-[var(--color-surface)] to-transparent transition-opacity duration-200 ${showTopFade ? "opacity-100" : "opacity-0"}`} />
        <div aria-hidden="true" className={`pointer-events-none absolute inset-x-2 bottom-2 z-10 h-16 bg-gradient-to-t from-[var(--color-surface)] to-transparent transition-opacity duration-200 ${showBottomFade ? "opacity-100" : "opacity-0"}`} />
      </section>
      )}

      {view === "board" && (
        <div className="min-h-0 flex-1 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
          <HomeworkBoard homework={homework} onEdit={onEdit} onReorder={onReorder} />
        </div>
      )}

      <Modal
        open={Boolean(selectedItem)}
        onClose={() => !deleting && setSelectedItem(null)}
        title="Delete homework?"
        footer={
          <>
            <Button type="button" variant="secondary" onClick={() => setSelectedItem(null)} disabled={deleting}>
              Keep it
            </Button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--color-danger)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Trash2 size={16} />
              {deleting ? "Deleting..." : "Delete homework"}
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
              Delete <strong className="font-semibold text-[var(--color-text)]">{selectedItem?.title}</strong>?
            </p>
            {error && <p className="mt-3 text-sm text-[var(--color-danger)]">{error}</p>}
          </div>
        </div>
      </Modal>
    </div>
  );
}
