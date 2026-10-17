import EmptyState from "../../components/ui/EmptyState";
import SegmentedControl from "../../components/ui/SegmentedControl";
import Tooltip from "../../components/ui/Tooltip";
import { EMPTY_PREVIEW } from "../../lib/emptyPreview";
import { useMemo, useState } from "react";
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
    badgeClass: "border-[var(--color-line)] bg-[var(--color-fill-2)] text-[var(--color-text-muted)]",
  },
];

const DISPLAY_LIMIT = 3;

const TAB_LABELS = { overdue: "Overdue", active: "Active", future: "Future" };

function limitBucketsForDisplay(buckets, max) {
  if (!buckets) return buckets;
  // per-bucket cap
  const out = { ...buckets };
  for (const key of ["overdue", "active", "future"]) {
    out[key] = (buckets[key] || []).slice(0, max);
    
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
  const grandTotal = buckets
    ? (buckets.overdueTotal ?? 0) + (buckets.activeTotal ?? 0) + (buckets.futureTotal ?? 0)
    : 0;

    const [selectedTab, setSelectedTab] = useState(null);
    // default = most urgent non-empty bucket
    const defaultTab = SECTIONS.find((s) => (buckets?.[s.key]?.length ?? 0) > 0)?.key ?? "overdue";
    const tab = selectedTab ?? defaultTab;
    const activeSection = SECTIONS.find((s) => s.key === tab) ?? SECTIONS[0];
    const tabItems = buckets?.[tab] ?? [];
    const tabTotal = buckets?.[`${tab}Total`] ?? 0;
    const tabOptions = SECTIONS.map((s) => {
      const count = buckets?.[`${s.key}Total`] ?? 0;
      return { id: s.key, label: TAB_LABELS[s.key], Icon: s.icon, count };
    });

  return (
    <div
      className="relative flex flex-col rounded-2xl lg:h-full border border-[var(--color-line)] bg-[var(--color-surface)] p-5 backdrop-blur-xl"
      style={{
        backgroundImage:
          "linear-gradient(150deg, color-mix(in srgb, var(--color-primary) 18%, transparent) 0%, color-mix(in srgb, var(--color-tint) 8%, transparent) 60%, transparent 100%)",
      }}
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
          <div
            className="absolute -right-10 -top-10 h-36 w-36 rounded-full opacity-20 blur-3xl"
            style={{ backgroundColor: "var(--color-primary)" }}
          />
        </div>

      <div className="relative z-10 flex flex-col lg:min-h-0 lg:flex-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--color-primary)]">
            <ClipboardList size={12} />
            Intercept Queue
          </div>

          {!loading && grandTotal > 0 && (
              <div className="flex items-center gap-3">
                <div
                  role="tablist"
                  aria-label="Intercept queue"
                  className="hidden items-center gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-0.5 lg:flex"
                >
                  {tabOptions.map(({ id, label, Icon, count }) => {
                    const active = tab === id;
                    return (
                      <Tooltip key={id} label={label} side="top">
                        <button
                          type="button"
                          role="tab"
                          aria-selected={active}
                          aria-label={`${label}, ${count}`}
                          onClick={() => setSelectedTab(id)}
                          className={`flex h-6 min-w-6 items-center justify-center gap-1 rounded-md px-1.5 transition-colors duration-150 ${
                            active
                              ? "bg-[var(--color-primary)] text-[var(--color-primary-fg)] shadow-sm"
                              : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]"
                          }`}
                        >
                          <Icon size={14} strokeWidth={2.25} />
                          <span className="text-[10px] font-bold tabular-nums">{count}</span>
                        </button>
                      </Tooltip>
                    );
                  })}
                </div>
            <button
              type="button"
              onClick={() => navigate("/homework")}
              className="flex items-center gap-1 text-xs font-medium text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-primary)]"
            >
              {tabTotal > tabItems.length ? `+${tabTotal - tabItems.length} more` : "View all"}
              <ArrowRight size={12} />
            </button>
              </div>
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
        ) : grandTotal === 0 || EMPTY_PREVIEW ? (
          <EmptyState variant="compact" className="flex-1" icon={CheckCircle2} title="All caught up" body="Nothing due right now." />
        ) : (
            <div className="mt-4 flex flex-col gap-3 border-t border-[var(--color-line)] pt-3.5 lg:min-h-0 lg:flex-1">
              <SegmentedControl
                size="sm"
                ariaLabel="Intercept queue"
                value={tab}
                onChange={setSelectedTab}
                options={tabOptions.map(({ id, label, count }) => ({ id, label: `${label} · ${count}` }))}
                className="w-full lg:hidden [&>button]:flex-1"
              />

              {tabItems.length === 0 ? (
                <EmptyState variant="compact" className="flex-1" icon={activeSection.icon} title={`No ${TAB_LABELS[tab].toLowerCase()} tasks`} body="Nothing in this list right now." />
              ) : (
                <div
                  className="flex flex-col gap-1.5 lg:grid lg:min-h-0 lg:flex-1"
                  style={{
                    gridTemplateRows:
                      tabItems.length > 1
                        ? `repeat(${tabItems.length}, minmax(0, 1fr))`
                        : "auto",
                    alignContent: tabItems.length > 1 ? "stretch" : "start",
                  }}
                >
                  {tabItems.map((item) => {
                    const vaultMatch = vaultMatchByItemId.get(item.id);
                    return (
                      <div
                        key={item.id}
                        className={`flex min-w-0 items-center gap-3 rounded-md px-3 py-2 ${
                            tabItems.length > 1 ? "lg:h-full lg:min-h-0" : ""
                          }`}
                        style={{
                          backgroundImage: `linear-gradient(135deg, color-mix(in srgb, ${activeSection.dot} 14%, transparent) 0%, transparent 70%)`,
                        }}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-medium leading-tight text-[var(--color-text)]" title={item.title}>
                            {item.title}
                          </p>
                          <div className="flex min-w-0 items-center gap-1.5">
                            <span className="mt-0.5 truncate text-[11px] leading-tight text-[var(--color-text-muted)]">
                              {item.subject_name || "No subject"}
                            </span>
                            <VaultMatchLink file={vaultMatch} onOpen={onOpenFile} />
                          </div>
                        </div>
                        <span
                          className={`inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded border px-2 py-0.5 text-[10px] font-bold ${activeSection.badgeClass}`}
                        >
                          {urgencyLabel(item.due_date)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
        )}
      </div>
    </div>
  );
}
