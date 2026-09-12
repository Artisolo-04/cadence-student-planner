import { BookOpen, Calendar, ListChecks, CalendarDays } from "lucide-react";
import { AccentHeaderShell, AccentIconBox, HeaderCloseButton } from "../../../components/ui/AccentHeader";

function MetricBadge({ icon: Icon, label }) {
  return (
    <span className="flex shrink-0 items-center gap-1.5 rounded-md border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-surface)_55%,transparent)] px-3 py-1.5 text-xs font-medium text-[var(--color-text)] backdrop-blur-md">
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
    <AccentHeaderShell accent={subject.color}>
      <div className="relative z-10 flex min-w-0 flex-1 items-center gap-3">
        <AccentIconBox accent={subject.color} icon={BookOpen} />
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

      <div className="relative z-10 flex flex-1 items-center justify-end gap-2 overflow-x-auto">
        <MetricBadge icon={Calendar} label={`${weeklySlots} Weekly Slot${weeklySlots === 1 ? "" : "s"}`} />
        <MetricBadge icon={ListChecks} label={`${activeTasks} Active Task${activeTasks === 1 ? "" : "s"}`} />
        <MetricBadge icon={CalendarDays} label={`${daysPerWeek} Day${daysPerWeek === 1 ? "" : "s"}/Week`} />
      </div>

      <HeaderCloseButton onClose={onClose} />
    </AccentHeaderShell>
  );
}
