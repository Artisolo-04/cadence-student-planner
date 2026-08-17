export const PRIORITY_STYLES = {
  high: { label: "High", color: "var(--color-danger)" },
  normal: { label: "Normal", color: "var(--color-text-muted)" },
  low: { label: "Low", color: "var(--color-primary)" },
};

export const STATUS_STYLES = {
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

export const STATUS_OPTIONS = [
  { value: "todo", label: "To do" },
  { value: "in_progress", label: "In progress" },
  { value: "done", label: "Done" },
];

export const DUE_FILTERS = [
  { value: "all", label: "Any due date" },
  { value: "overdue", label: "Overdue" },
  { value: "today", label: "Due today" },
  { value: "week", label: "Due this week" },
  { value: "none", label: "No due date" },
];

export const SORT_OPTIONS = [
  { value: "due_date-asc", label: "Due date (soonest)" },
  { value: "due_date-desc", label: "Due date (latest)" },
  { value: "priority-desc", label: "Priority (high first)" },
  { value: "subject-asc", label: "Subject (A-Z)" },
  { value: "created-desc", label: "Recently added" },
];

const PRIORITY_RANK = { high: 3, normal: 2, low: 1 };

export function comparePriority(a, b) {
  return (PRIORITY_RANK[a.priority] || 0) - (PRIORITY_RANK[b.priority] || 0);
}

export function formatDueDate(dueDate) {
  const isoDate = String(dueDate).slice(0, 10);
  const date = new Date(`${isoDate}T00:00:00`);
  return date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

export function isOverdue(dueDate, status) {
  if (status === "done") return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isoDate = String(dueDate).slice(0, 10);
  const due = new Date(`${isoDate}T00:00:00`);
  return due < today;
}
