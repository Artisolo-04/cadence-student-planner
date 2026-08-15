import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Flag, Pencil } from "lucide-react";
import Button from "../../../components/ui/Button";
import Dropdown from "../../../components/ui/Dropdown";
import { PRIORITY_STYLES, STATUS_OPTIONS, formatDueDate, isOverdue } from "../homeworkUtils";

const COLUMNS = [
  { key: "todo", label: "To do" },
  { key: "in_progress", label: "In progress" },
  { key: "done", label: "Done" },
];

function BoardCard({ item, onEdit, onStatusChange }) {
  const overdue = isOverdue(item.due_date, item.status);
  const priority = PRIORITY_STYLES[item.priority] || PRIORITY_STYLES.normal;
  const hasTags = Boolean(item.subject_name) || item.priority !== "normal";

  return (
    <article
      style={{
        backgroundImage:
          "linear-gradient(155deg, color-mix(in srgb, var(--color-primary) 14%, transparent) 0%, color-mix(in srgb, var(--color-accent) 6%, transparent) 55%, transparent 100%)",
      }}
      className="group relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-3.5 backdrop-blur-xl transition-all duration-300 ease-out hover:border-[color-mix(in_srgb,var(--color-primary)_55%,transparent)] hover:shadow-[0_0_28px_-8px_color-mix(in_srgb,var(--color-primary)_40%,transparent)]"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-8 -top-10 h-24 w-24 rounded-full bg-[var(--color-primary)] opacity-10 blur-3xl transition-opacity duration-300 group-hover:opacity-20"
      />

      <div className="relative z-10 flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          {hasTags && item.subject_name && (
            <span
              className="inline-flex items-center gap-1.5 rounded-lg border px-2 py-0.5 text-[11px] font-semibold backdrop-blur-md"
              style={{
                borderColor: `color-mix(in srgb, ${item.subject_color || "var(--color-primary)"} 45%, transparent)`,
                backgroundColor: `color-mix(in srgb, ${item.subject_color || "var(--color-primary)"} 20%, transparent)`,
                color: item.subject_color || "var(--color-primary)",
              }}
            >
              <span
                className="h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: item.subject_color || "var(--color-primary)" }}
                aria-hidden="true"
              />
              {item.subject_name}
            </span>
          )}
          {item.priority !== "normal" && (
            <span
              className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[11px] font-medium backdrop-blur-md"
              style={{ color: priority.color }}
            >
              <Flag size={11} />
              {priority.label}
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEdit(item)}
          className="h-7 w-7 shrink-0 rounded-lg border border-white/10 bg-white/[0.03] backdrop-blur-md hover:border-[var(--color-primary)]/40 hover:bg-[var(--color-primary)]/10 hover:text-[var(--color-primary)]"
          aria-label={`Edit ${item.title}`}
          title="Edit"
        >
          <Pencil size={13} />
        </Button>
      </div>

      <h3 className="relative z-10 text-sm font-semibold text-[var(--color-text)]">{item.title}</h3>

      {item.notes && (
        <p className="relative z-10 text-xs text-[var(--color-text-muted)] line-clamp-2">{item.notes}</p>
      )}

      <span
        className={`relative z-10 inline-flex w-fit items-center whitespace-nowrap rounded-lg border px-2 py-1 text-[11px] font-medium ${
          overdue
            ? "border-[var(--color-danger)]/40 bg-[var(--color-danger)]/10 text-[var(--color-danger)]"
            : "border-white/10 bg-white/[0.03] text-[var(--color-text-muted)]"
        }`}
      >
        {overdue && <AlertTriangle size={11} className="mr-1" />}
        {formatDueDate(item.due_date)}
      </span>

      <div className="relative z-20" onClick={(e) => e.stopPropagation()}>
        <Dropdown
          id={`board-status-${item.id}`}
          value={item.status}
          onChange={(e) => onStatusChange(item.id, e.target.value)}
          options={STATUS_OPTIONS}
        />
      </div>
    </article>
  );
}

function BoardColumn({ column, items, onEdit, onStatusChange }) {
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
  }, [items]);

  return (
    <div className="flex h-full min-w-[280px] flex-1 flex-col gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
      <div className="flex shrink-0 items-center justify-between px-1">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
          {column.label}
        </h3>
        <span className="rounded-md bg-[var(--color-surface-alt)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-text-muted)]">
          {items.length}
        </span>
      </div>

      <div className="relative min-h-0 flex-1">
        <div
          ref={scrollRef}
          onScroll={updateScrollFades}
          className="h-full overflow-y-auto rounded-xl scrollbar-cadence pr-1"
        >
          <div className="flex flex-col gap-3 pb-2">
            {items.length === 0 ? (
              <p className="px-1 py-6 text-center text-xs text-[var(--color-text-muted)]">Nothing here.</p>
            ) : (
              items.map((item) => (
                <BoardCard key={item.id} item={item} onEdit={onEdit} onStatusChange={onStatusChange} />
              ))
            )}
          </div>
        </div>

        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-x-0 top-0 z-10 h-8 bg-gradient-to-b from-[var(--color-surface)] to-transparent transition-opacity duration-200 ${showTopFade ? "opacity-100" : "opacity-0"}`}
        />
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-x-0 bottom-0 z-10 h-10 bg-gradient-to-t from-[var(--color-surface)] to-transparent transition-opacity duration-200 ${showBottomFade ? "opacity-100" : "opacity-0"}`}
        />
      </div>
    </div>
  );
}

export default function HomeworkBoard({ homework, onEdit, onStatusChange }) {
  const columns = COLUMNS.map((col) => ({
    ...col,
    items: homework
      .filter((h) => h.status === col.key)
      .slice()
      .sort((a, b) => new Date(a.due_date) - new Date(b.due_date)),
  }));

  return (
    <div className="flex h-full min-h-0 gap-3 overflow-x-auto scrollbar-cadence pb-1">
      {columns.map((col) => (
        <BoardColumn key={col.key} column={col} items={col.items} onEdit={onEdit} onStatusChange={onStatusChange} />
      ))}
    </div>
  );
}
