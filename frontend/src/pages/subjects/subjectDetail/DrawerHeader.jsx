import { X, BookOpen, Calendar, ListChecks, CalendarDays } from "lucide-react";

function MetricBadge({ icon: Icon, label }) {
  return (
    <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-surface)_55%,transparent)] px-3 py-1.5 text-xs font-medium text-[var(--color-text)] backdrop-blur-md">
      <Icon size={13} className="text-[var(--color-text-muted)]" />
      {label}
    </span>
  );
}

export default function DrawerHeader({
  subject,
  onClose,
  weeklySlots,
  activeTasks,
  daysPerWeek,
}) {
  return (
    <div className="relative z-10 flex shrink-0 items-center justify-between gap-4 overflow-hidden border-b border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full opacity-25 blur-3xl"
        style={{ backgroundColor: subject.color }}
      />

      <div className="relative z-10 flex min-w-0 items-center gap-3">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[var(--color-border)]"
          style={{
            backgroundImage: `linear-gradient(155deg, color-mix(in srgb, ${subject.color} 40%, black 20%) 0%, color-mix(in srgb, ${subject.color} 15%, black 45%) 100%)`,
          }}
        >
          <BookOpen size={18} style={{ color: subject.color }} />
        </span>
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-[var(--color-text)]">
            {subject.name}
          </h3>
          {subject.teacher && (
            <p className="truncate text-xs text-[var(--color-text-muted)]">
              {subject.teacher}
            </p>
          )}
        </div>
      </div>

      <div className="relative z-10 flex flex-1 items-center justify-end gap-2 overflow-x-auto">
        <MetricBadge icon={Calendar} label={`${weeklySlots} Weekly Slot${weeklySlots === 1 ? "" : "s"}`} />
        <MetricBadge icon={ListChecks} label={`${activeTasks} Active Task${activeTasks === 1 ? "" : "s"}`} />
        <MetricBadge icon={CalendarDays} label={`${daysPerWeek} Day${daysPerWeek === 1 ? "" : "s"}/Week`} />
      </div>

      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="relative z-10 shrink-0 rounded-md p-1.5 text-[var(--color-text-muted)] transition-colors hover:bg-[color-mix(in_srgb,var(--color-text)_8%,transparent)] hover:text-[var(--color-text)]"
      >
        <X size={18} />
      </button>
    </div>
  );
}
