import { AlertTriangle, Clock, Flag, Pencil, Trash2 } from "lucide-react";
import Checkbox from "../../../components/ui/Checkbox";
import Dropdown from "../../../components/ui/Dropdown";
import { PRIORITY_STYLES, STATUS_OPTIONS, formatDueDate, isOverdue } from "../homeworkUtils";

export default function HomeworkRow({ item, gridClass, onEdit, onDelete, onToggleDone, onStatusChange }) {
  const overdue = isOverdue(item.due_date, item.status);
  const priority = PRIORITY_STYLES[item.priority] || PRIORITY_STYLES.normal;
  const accentColor = item.subject_color || "var(--color-primary)";

  return (
    <div
      style={{
        backgroundImage: `linear-gradient(155deg, color-mix(in srgb, ${accentColor} 16%, transparent) 0%, color-mix(in srgb, var(--color-accent) 5%, transparent) 55%, transparent 100%)`,
      }}
      className={`group relative grid ${gridClass} items-center gap-4 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] px-3.5 py-3 backdrop-blur-xl transition-all duration-300 ease-out hover:border-[color-mix(in_srgb,var(--color-primary)_50%,transparent)] hover:shadow-[0_10px_30px_-12px_color-mix(in_srgb,var(--color-primary)_35%,transparent)]`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 -top-12 h-24 w-24 rounded-full opacity-15 blur-3xl transition-opacity duration-300 group-hover:opacity-25"
        style={{ backgroundColor: accentColor }}
      />

      <div className="relative z-10 flex items-center">
        <Checkbox
          id={`homework-row-done-${item.id}`}
          checked={item.status === "done"}
          onChange={() => onToggleDone(item)}
          aria-label={item.status === "done" ? "Mark as not done" : "Mark as done"}
        />
      </div>

      <div className="relative z-10 flex items-center">
        <span
          className="inline-flex w-fit items-center gap-1.5 whitespace-nowrap rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1 text-[11px] font-medium backdrop-blur-md"
          style={{ color: priority.color }}
        >
          <Flag size={12} />
          {priority.label}
        </span>
      </div>

      <div className="relative z-10 flex min-w-0 flex-col justify-center gap-0.5">
        <p
          className={`truncate text-sm font-semibold text-[var(--color-text)] ${
            item.status === "done" ? "line-through opacity-50" : ""
          }`}
        >
          {item.title}
        </p>
        {item.notes && (
          <p className="truncate text-xs text-[var(--color-text-muted)]">{item.notes}</p>
        )}
      </div>

      <div className="relative z-10" />

      <div className="relative z-10 flex min-w-0 items-center">
        {item.subject_name ? (
          <span
            className="inline-flex w-fit max-w-full items-center gap-1.5 truncate rounded-lg border px-2 py-1 text-[11px] font-medium backdrop-blur-md"
            title={item.subject_name}
            style={{
              borderColor: `color-mix(in srgb, ${accentColor} 45%, transparent)`,
              backgroundColor: `color-mix(in srgb, ${accentColor} 18%, transparent)`,
              color: accentColor,
            }}
          >
            <span
              className="h-1.5 w-1.5 shrink-0 rounded-full"
              style={{ backgroundColor: accentColor }}
              aria-hidden="true"
            />
            <span className="truncate">{item.subject_name}</span>
          </span>
        ) : (
          <span className="inline-flex w-fit items-center gap-1.5 whitespace-nowrap rounded-lg border border-dashed border-white/15 bg-white/[0.02] px-2 py-1 text-[11px] font-medium text-[var(--color-text-muted)]/70">
            <span
              className="h-1.5 w-1.5 shrink-0 rounded-full border border-dashed border-current opacity-60"
              aria-hidden="true"
            />
            No subject
          </span>
        )}
      </div>

      <div className="relative z-10 flex items-center">
        <span
          className={`inline-flex w-fit items-center gap-2 whitespace-nowrap rounded-lg border px-2 py-1 text-[11px] font-medium backdrop-blur-md ${
            overdue
              ? "border-[var(--color-danger)]/40 bg-[var(--color-danger)]/10 text-[var(--color-danger)]"
              : "border-white/10 bg-white/[0.03] text-[var(--color-text-muted)]"
          }`}
        >
          {overdue ? <AlertTriangle size={12} /> : <Clock size={12} />}
          {formatDueDate(item.due_date)}
        </span>
      </div>

      <div className="relative z-20 flex items-center" onClick={(e) => e.stopPropagation()}>
        <Dropdown
          id={`row-status-${item.id}`}
          value={item.status}
          onChange={(e) => onStatusChange(item.id, e.target.value)}
          options={STATUS_OPTIONS}
          size="sm"
          height="30px"
        />
      </div>

      <div className="relative z-10 flex items-center justify-end gap-1.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100 focus-within:opacity-100">
        <button
          type="button"
          onClick={() => onEdit(item)}
          className="rounded-lg border border-white/10 bg-white/[0.03] p-1.5 text-[var(--color-text-muted)] backdrop-blur-md transition-colors hover:border-[var(--color-primary)]/40 hover:bg-[var(--color-primary)]/10 hover:text-[var(--color-primary)]"
          aria-label={`Edit ${item.title}`}
          title="Edit"
        >
          <Pencil size={13} />
        </button>
        <button
          type="button"
          onClick={() => onDelete(item)}
          className="rounded-lg border border-white/10 bg-white/[0.03] p-1.5 text-[var(--color-text-muted)] backdrop-blur-md transition-colors hover:border-[var(--color-danger)]/40 hover:bg-[var(--color-danger)]/10 hover:text-[var(--color-danger)]"
          aria-label={`Delete ${item.title}`}
          title="Delete"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}
