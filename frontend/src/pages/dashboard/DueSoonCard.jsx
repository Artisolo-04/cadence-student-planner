import { ClipboardList, AlertTriangle, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PRIORITY_STYLES, isOverdue } from "../homework/homeworkUtils";

function formatShortDate(dueDate) {
  const isoDate = String(dueDate).slice(0, 10);
  const date = new Date(`${isoDate}T00:00:00`);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function getUrgencyLabel(dueDate, overdue) {
  const isoDate = String(dueDate).slice(0, 10);
  const due = new Date(`${isoDate}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((due - today) / 86400000);

  if (overdue) return `${Math.abs(diffDays)}d overdue`;
  if (diffDays === 0) return "Due today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays <= 6) return `${diffDays}d left`;
  return formatShortDate(dueDate);
}

export default function DueSoonCard({ homework, loading }) {
  const navigate = useNavigate();

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-white/10 p-5 backdrop-blur-xl"
      style={{
        backgroundImage:
          "linear-gradient(150deg, color-mix(in srgb, var(--color-primary) 18%, transparent) 0%, color-mix(in srgb, var(--color-accent) 8%, transparent) 60%, transparent 100%)",
      }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full opacity-20 blur-3xl"
        style={{ backgroundColor: "var(--color-primary)" }}
      />

      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--color-primary)]">
              <ClipboardList size={12} />
              Due Soon
            </div>
            {!loading && homework.length > 0 && (
              <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[var(--color-primary)]/15 px-1.5 text-[10px] font-bold text-[var(--color-primary)]">
                {homework.length}
              </span>
            )}
          </div>

          {!loading && homework.length > 0 && (
            <button
              type="button"
              onClick={() => navigate("/homework")}
              className="flex items-center gap-1 text-xs font-medium text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-primary)]"
            >
              View all
              <ArrowRight size={12} />
            </button>
          )}
        </div>

        {loading ? (
          <p className="mt-3 text-xs text-[var(--color-text-muted)]">Loading…</p>
        ) : homework.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--color-text-muted)]">
            Nothing due — you're all caught up.
          </p>
        ) : (
          <div className="mt-4 flex flex-col divide-y divide-white/[0.06] border-t border-white/10">
            {homework.map((item) => {
              const overdue = isOverdue(item.due_date, item.status);
              const priority = PRIORITY_STYLES[item.priority] || PRIORITY_STYLES.normal;
              const accentColor = item.subject_color || "var(--color-primary)";
              const urgency = getUrgencyLabel(item.due_date, overdue);
              const isToday = urgency === "Due today";

              return (
                <div key={item.id} className="flex items-center gap-3 py-3 first:pt-3.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[var(--color-text)]">
                      {item.title}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-[var(--color-text-muted)]">
                      {item.subject_name || "No subject"} · {priority.label} priority
                    </p>
                  </div>

                  <span
                    className={`inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-md border px-2 py-1 text-[11px] font-bold ${
                      overdue
                        ? "border-[var(--color-danger)]/40 bg-[var(--color-danger)]/15 text-[var(--color-danger)]"
                        : isToday
                        ? "border-[var(--color-primary)]/40 bg-[var(--color-primary)]/15 text-[var(--color-primary)]"
                        : "border-white/10 bg-white/[0.04] text-[var(--color-text-muted)]"
                    }`}
                  >
                    {overdue && <AlertTriangle size={11} />}
                    {urgency}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
