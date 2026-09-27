import { useMemo } from "react";
import { ClipboardList, AlertTriangle, ArrowRight, Radar, Clock, CheckCircle2, Flag } from "lucide-react";
import { useNavigate } from "react-router-dom";
import VaultMatchLink from "./VaultMatchLink";
import { findVaultMatch } from "./vaultAccess";
import { formatDueDate } from "../homework/homeworkUtils";

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
    icon: Flag,
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

const DISPLAY_LIMIT = 3;

function limitBucketsForDisplay(buckets, max) {
  if (!buckets) return buckets;
  let left = max;
  const out = { ...buckets };
  for (const key of ["overdue", "active", "future"]) {
    out[key] = (buckets[key] || []).slice(0, left);
    left -= out[key].length;
  }
  return out;
}

export default function DueSoonCard({ buckets: rawBuckets, loading, vaultFiles = [], onOpenFile }) {
  const navigate = useNavigate();

  const buckets = useMemo(() => limitBucketsForDisplay(rawBuckets, DISPLAY_LIMIT), [rawBuckets]);

  const vaultMatchByItemId = useMemo(() => {
    const map = new Map();
    if (!buckets) return map;
    for (const key of ["overdue", "active", "future"]) {
      for (const item of buckets[key] || []) {
        map.set(item.id, findVaultMatch(item.title, vaultFiles));
      }
    }
    return map;
  }, [buckets, vaultFiles]);

  const shownCount = buckets
    ? buckets.overdue.length + buckets.active.length + buckets.future.length
    : 0;
  const grandTotal = buckets
    ? (buckets.overdueTotal ?? 0) + (buckets.activeTotal ?? 0) + (buckets.futureTotal ?? 0)
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

      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
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
        ) : !buckets ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
            <AlertTriangle size={22} className="text-[var(--color-danger)]" />
            <p className="text-sm font-medium text-[var(--color-text)]">Couldn't load tasks</p>
            <p className="text-xs text-[var(--color-text-muted)]">Try refreshing the page.</p>
          </div>
        ) : grandTotal === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
            <CheckCircle2 size={22} className="text-[var(--color-text-muted)]" />
            <p className="text-sm font-medium text-[var(--color-text)]">All caught up</p>
            <p className="text-xs text-[var(--color-text-muted)]">Nothing due right now.</p>
          </div>
        ) : (
            <div className="mt-4 flex min-h-0 flex-1 flex-col gap-3 border-t border-white/10 pt-3.5">
              {SECTIONS.map((section) => {
                const items = buckets[section.key];
                if (!items || items.length === 0) return null;
                const Icon = section.icon;
                const accent = section.dot;

                return (
                  <div key={section.key} className="flex min-h-0 flex-1 flex-col gap-2">
                    {activeSectionCount > 1 && (
                      <div className="flex items-center gap-1.5">
                        <Icon size={11} style={{ color: accent }} />
                        <span
                          className="text-[10px] font-bold uppercase tracking-wider"
                          style={{ color: accent }}
                        >
                          {section.label}
                        </span>
                      </div>
                    )}

                    <div className="flex min-h-0 flex-1 flex-col gap-2">
                      {items.map((item) => {
                        const vaultMatch = vaultMatchByItemId.get(item.id);
                        return (
                          <div
                            key={item.id}
                            className="flex min-h-0 min-w-0 flex-1 flex-col justify-between rounded-lg border px-3 py-2.5"
                            style={{ borderColor: `color-mix(in srgb, ${accent} 35%, var(--color-border))` }}
                          >
                            <div className="flex min-w-0 items-center gap-3">
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-[var(--color-text)]" title={item.title}>
                                  {item.title}
                                </p>
                                <div className="mt-0.5 flex min-w-0 items-center gap-1.5">
                                  <span className="truncate text-xs text-[var(--color-text-muted)]">
                                    {item.subject_name || "No subject"}
                                  </span>
                                  <VaultMatchLink file={vaultMatch} onOpen={onOpenFile} />
                                </div>
                              </div>
                            </div>

                            <div className="mt-2 flex items-center justify-between gap-3 border-t border-white/[0.06] pt-2">
                              <span className="truncate font-mono text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">
                                {section.label}
                              </span>
                              <span
                                className={`inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded border px-2 py-0.5 text-[10px] font-bold ${section.badgeClass}`}
                              >
                                {urgencyLabel(item.due_date)}
                              </span>
                            </div>
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
