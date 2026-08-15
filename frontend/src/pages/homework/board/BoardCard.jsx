import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { AlertTriangle, Flag, Pencil, Trash2 } from "lucide-react";
import Button from "../../../components/ui/Button";
import Dropdown from "../../../components/ui/Dropdown";
import { PRIORITY_STYLES, STATUS_OPTIONS, formatDueDate, isOverdue } from "../homeworkUtils";

const EXIT_DURATION = 0.55;
const ENTER_DELAY = 0.12;
const HIDDEN_STATE = { opacity: 0, scale: 0.82, filter: "blur(10px)" };
const VISIBLE_STATE = { opacity: 1, scale: 1, filter: "blur(0px)" };
const EASE = [0.22, 1, 0.36, 1];
const GLOW_DURATION = 1.1;

const GLOW_OFF = {
  borderColor: "color-mix(in srgb, var(--color-primary) 0%, transparent)",
  boxShadow: "inset 0 0 0px 0px color-mix(in srgb, var(--color-primary) 0%, transparent)",
};
const GLOW_KEYFRAMES = {
  borderColor: [
    "color-mix(in srgb, var(--color-primary) 0%, transparent)",
    "color-mix(in srgb, var(--color-primary) 95%, transparent)",
    "color-mix(in srgb, var(--color-primary) 0%, transparent)",
  ],
  boxShadow: [
    "inset 0 0 0px 0px color-mix(in srgb, var(--color-primary) 0%, transparent)",
    "inset 0 0 22px 3px color-mix(in srgb, var(--color-primary) 55%, transparent)",
    "inset 0 0 0px 0px color-mix(in srgb, var(--color-primary) 0%, transparent)",
  ],
};

export default function BoardCard({ item, onEdit, onDelete, onStatusChange, revealed = true, justArrived = false }) {
  const [isLeaving, setIsLeaving] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const overdue = isOverdue(item.due_date, item.status);
  const priority = PRIORITY_STYLES[item.priority] || PRIORITY_STYLES.normal;
  const hasTags = Boolean(item.subject_name) || item.priority !== "normal";

  function handleStatusChange(e) {
    const newStatus = e.target.value;
    if (newStatus === item.status || isLeaving) return;
    setIsLeaving(true);
    setTimeout(
      () => {
        onStatusChange(item.id, newStatus);
      },
      shouldReduceMotion ? 0 : EXIT_DURATION * 1000,
    );
  }

  const showVisible = !isLeaving && revealed;

  const transition = shouldReduceMotion
    ? { duration: 0 }
    : isLeaving
    ? { duration: EXIT_DURATION, ease: EASE }
    : revealed
    ? { type: "spring", stiffness: 300, damping: 20, mass: 0.8, delay: ENTER_DELAY }
    : { duration: 0 };

  return (
    <motion.article
      layout="position"
      initial={HIDDEN_STATE}
      animate={showVisible ? VISIBLE_STATE : HIDDEN_STATE}
      transition={transition}
      style={{
        backgroundImage:
          "linear-gradient(155deg, color-mix(in srgb, var(--color-primary) 14%, transparent) 0%, color-mix(in srgb, var(--color-accent) 6%, transparent) 55%, transparent 100%)",
        pointerEvents: isLeaving ? "none" : "auto",
        willChange: "transform, filter, opacity",
      }}
      className="group relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-3.5 backdrop-blur-xl transition-colors duration-300 ease-out hover:border-[color-mix(in_srgb,var(--color-primary)_55%,transparent)] hover:shadow-[0_0_28px_-8px_color-mix(in_srgb,var(--color-primary)_40%,transparent)]"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-8 -top-10 h-24 w-24 rounded-full bg-[var(--color-primary)] opacity-10 blur-3xl transition-opacity duration-300 group-hover:opacity-20"
      />

      {!shouldReduceMotion && (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-30 rounded-2xl border-2"
          initial={false}
          animate={justArrived ? GLOW_KEYFRAMES : GLOW_OFF}
          transition={{ duration: GLOW_DURATION, ease: "easeOut", times: [0, 0.35, 1] }}
        />
      )}

      <div className="relative z-10 flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
          {hasTags && item.subject_name && (
            <span
              className="inline-flex h-[26px] max-w-[150px] items-center gap-1.5 rounded-lg border px-2 text-[11px] font-medium"
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
              <span className="truncate">{item.subject_name}</span>
            </span>
          )}
          {item.priority !== "normal" && (
            <span
              className="inline-flex h-[26px] w-fit items-center gap-1 whitespace-nowrap rounded-lg border border-white/10 bg-white/[0.03] px-2 text-[11px] font-medium"
              style={{ color: priority.color }}
            >
              <Flag size={11} />
              {priority.label}
            </span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <Button
          variant="ghost"
          size="icon"
          onClick={() => onEdit(item)}
          style={{ height: "26px", width: "26px" }}
          className="shrink-0 rounded-lg border border-white/10 bg-white/[0.03] backdrop-blur-md hover:border-[var(--color-primary)]/40 hover:bg-[var(--color-primary)]/10 hover:text-[var(--color-primary)]"
          aria-label={`Edit ${item.title}`}
          title="Edit"
        >
          <Pencil size={11} />
        </Button>
        {onDelete && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              onDelete(item);
            }}
            style={{ height: "26px", width: "26px" }}
            className="shrink-0 rounded-lg border border-white/10 bg-white/[0.03] backdrop-blur-md hover:border-[var(--color-danger)]/40 hover:bg-[var(--color-danger)]/10 hover:text-[var(--color-danger)]"
            aria-label={`Delete ${item.title}`}
            title="Delete"
          >
            <Trash2 size={11} />
          </Button>
        )}
      </div>
      </div>

      <h3 className="relative z-10 text-sm font-semibold text-[var(--color-text)]">{item.title}</h3>

      {item.notes && (
        <p className="relative z-10 text-xs text-[var(--color-text-muted)] line-clamp-2">{item.notes}</p>
      )}

      <div className="relative z-10 flex items-center justify-between gap-2">
        <span
          className={`inline-flex h-[26px] w-fit items-center whitespace-nowrap rounded-lg border px-2 text-[11px] font-medium ${
            overdue
              ? "border-[var(--color-danger)]/40 bg-[var(--color-danger)]/10 text-[var(--color-danger)]"
              : "border-white/10 bg-white/[0.03] text-[var(--color-text-muted)]"
          }`}
        >
          {overdue && <AlertTriangle size={11} className="mr-1" />}
          {formatDueDate(item.due_date)}
        </span>
        <div
          className="relative z-20 flex h-[26px] items-center"
          onClick={(e) => e.stopPropagation()}
        >
          <Dropdown
            id={`board-status-${item.id}`}
            value={item.status}
            onChange={handleStatusChange}
            options={STATUS_OPTIONS}
            size="sm"
          />
        </div>
      </div>
    </motion.article>
  );
}
