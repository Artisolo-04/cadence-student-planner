import { ClipboardList, AlertTriangle, ArrowRight, Radar, Clock, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PRIORITY_STYLES, formatDueDate } from "../homework/homeworkUtils";

function urgencyLabel(dueDate) {
  if (!dueDate) return "No date";
  const isoDate = String(dueDate).slice(0, 10);
  const due = new Date(`${isoDate}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((due - today) / 86400000);

  if (diff < 0) return `${Math.abs(diff)}d overdue`;
  if (diff === 0) return "Due today";
  if (diff === 1) return "Tomorrow";
  return formatDueDate(dueDate);
}

const SECTIONS = [
  {
    key: "overdue",
    label: "Overdue / Critical",
    icon: AlertTriangle,
    dot: "var(--color-danger)",
    badgeClass: "border-[var(--color-danger)]/40 bg-[var(--color-danger)]/15 text-[var(--color-danger)]",
  },
  {
    key: "active",
    label: "Active",
    icon: Radar,
    dot: "var(--color-primary)",
    badgeClass: "border-[var(--color-primary)]/40 bg-[var(--color-primary)]/15 text-[var(--color-primary)]",
  },
  {
    key: "future",
    label: "Future",
    icon: Clock,
    dot: "var(--color-text-muted)",
    badgeClass: "border-white/10 bg-white/[0.04] text-[var(--color-text-muted)]",
  },
];

export default function DueSoonCard({ buckets, loading }) {
  const navigate = useNavigate();

  const shownCount = buckets
    ? buckets.overdue.length + buckets.active.length + buckets.future.length
    : 0;
  const grandTotal = buckets
    ? buckets.overdueTotal + buckets.activeTotal + buckets.futureTotal
    : 0;

  const activeSectionCount = SECTIONS.filter(
    (section) => buckets && buckets[section.key] && buckets[section.key].length > 0
  ).length;

  return (
    <div
      className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 p-5 backdrop-blur-xl"
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
          <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--color-primary)]">
            <ClipboardList size={12} />
            Intercept Queue
          </div>

          {!loading && grandTotal > 0 && (
            <button
              type="button"
              onClick={() => navigate("/homework")}
              className="flex items-center gap-1 text-xs font-medium text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-primary)]"
            >
              {grandTotal > shownCount ? `+${grandTotal - shownCount} more` : "View all"}
              <ArrowRight size={12} />
            </button>
          )}
        </div>

        {loading ? (
          <p className="mt-3 text-xs text-[var(--color-text-muted)]">Loading…</p>
        ) : grandTotal === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
            <CheckCircle2 size={22} className="text-[var(--color-text-muted)]" />
            <p className="text-sm font-medium text-[var(--color-text)]">All caught up</p>
            <p className="text-xs text-[var(--color-text-muted)]">Nothing due right now.</p>
          </div>
        ) : (
          <div className="mt-4 flex flex-col gap-3.5">
            {SECTIONS.map((section) => {
              const items = buckets[section.key];
              if (!items || items.length === 0) return null;
              const Icon = section.icon;

              return (
                <div key={section.key}>
                  {activeSectionCount > 1 && (
                    <div className="mb-1.5 flex items-center gap-1.5">
                      <Icon size={11} style={{ color: section.dot }} />
                      <span
                        className="text-[10px] font-bold uppercase tracking-wider"
                        style={{ color: section.dot }}
                      >
                        {section.label}
                      </span>
                    </div>
                  )}

                  <div className="flex flex-col divide-y divide-white/[0.06] border-t border-white/10">
                    {items.map((item) => {
                      const priority = PRIORITY_STYLES[item.priority] || PRIORITY_STYLES.normal;
                      return (
                        <div key={item.id} className="flex items-center gap-3 py-2 first:pt-2.5">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-[var(--color-text)]">
                              {item.title}
                            </p>
                            <p className="mt-0.5 truncate text-xs text-[var(--color-text-muted)]">
                              {item.subject_name || "No subject"} · {priority.label} priority
                            </p>
                          </div>

                          <span
                            className={`inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-md border px-2 py-1 text-[11px] font-bold ${section.badgeClass}`}
                          >
                            {urgencyLabel(item.due_date)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
