import { BookOpen, Calendar, ListChecks, CalendarDays } from "lucide-react";
import { AccentHeaderShell, HeaderCloseButton } from "../../../components/ui/AccentHeader";
import IconTile from "../../../components/ui/IconTile";

function Sk({ className = "" }) {
  return (
    <span
      aria-hidden="true"
      className={`sk inline-block align-baseline ${className}`}
    />
  );
}

function MetricBadge({ icon: Icon, count, singular, plural, loading = false }) {
  return (
    <span className="flex shrink-0 items-center gap-1.5 rounded-md border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-surface)_55%,transparent)] px-3 py-1.5 text-xs font-medium text-[var(--color-text)] backdrop-blur-md">
      <Icon size={13} className="text-[var(--color-text-muted)]" />
      {loading ? <Sk className="h-[0.72em] w-3 rounded-[3px]" /> : count}{" "}
        {!loading && count === 1 ? singular : plural}
    </span>
  );
}

export default function DrawerHeader({
  subject,
  onClose,
  weeklySlots,
  activeTasks,
  daysPerWeek,
  loading = false,
  knownNoSessions = false,
  knownNoTasks = false,
}) {
  return (
    <AccentHeaderShell accent={subject.color}>
      <div className="relative z-10 flex min-w-0 flex-1 items-center gap-3">
        <IconTile icon={BookOpen} color={subject.color} />
        <div className="min-w-0 flex-1">
          <h3
            title={subject.name}
            className="truncate text-sm font-semibold text-[var(--color-text)]"
          >
            {subject.name}
          </h3>
          {subject.teacher && (
            <p
              title={subject.teacher}
              className="truncate text-xs text-[var(--color-text-muted)]"
            >
              {subject.teacher}
            </p>
          )}
        </div>
      </div>

      <div
        aria-busy={loading || undefined}
        className="relative z-10 hidden flex-1 items-center justify-end gap-2 overflow-x-auto scrollbar-hidden md:flex"
      >
        <MetricBadge icon={Calendar} count={weeklySlots} singular="Weekly Slot" plural="Weekly Slots" loading={loading && !knownNoSessions} />
        <MetricBadge icon={ListChecks} count={activeTasks} singular="Active Task" plural="Active Tasks" loading={loading && !knownNoTasks} />
        <MetricBadge icon={CalendarDays} count={daysPerWeek} singular="Day/Week" plural="Days/Week" loading={loading && !knownNoSessions} />
      </div>

      <HeaderCloseButton onClose={onClose} />
    </AccentHeaderShell>
  );
}
