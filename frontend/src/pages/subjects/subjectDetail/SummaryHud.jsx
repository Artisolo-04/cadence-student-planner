import EmptyState from "../../../components/ui/EmptyState";
import { Sk } from "./DrawerSkeletonBits";
import { Clock as EmptyNextIcon } from "lucide-react";
import { CalendarClock, Gauge, ListChecks } from "lucide-react";

function NextSessionCard({ nextSession, loading = false, nextLines = 2 }) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-text)_4%,transparent)] px-3 py-3 backdrop-blur-md">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
        <CalendarClock size={12} />
        Next Session
      </div>
      {loading ? (
        <div aria-hidden="true" className="mt-1.5 text-sm font-medium leading-snug">
          <p><Sk className="h-[0.72em] w-11/12 rounded-[3px]" /></p>
          {nextLines > 1 && (
            <p><Sk className="h-[0.72em] w-1/2 rounded-[3px]" delay={0.2} /></p>
          )}
        </div>
      ) : nextSession ? (
        <p className="mt-1.5 text-sm font-medium leading-snug text-[var(--color-text)]">
          {nextSession.dayLabel} at {nextSession.time}
          {nextSession.room && (
            <span className="text-[var(--color-text-muted)]"> · Room {nextSession.room}</span>
          )}
        </p>
      ) : (
        <EmptyState variant="tight" className="mt-1" icon={EmptyNextIcon} title="No upcoming sessions" body="Nothing planned for this subject." />
      )}
    </div>
  );
}

function TimeFootprintBar({ footprintPercent, accentColor, loading = false }) {
  const clamped = Math.max(0, Math.min(100, footprintPercent));
  const fill = loading ? 0 : clamped;
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-text)_4%,transparent)] px-3 py-3 backdrop-blur-md">
      <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
        <span className="flex items-center gap-1.5">
          <Gauge size={12} />
          Weekly Footprint
        </span>
        <span>{loading ? <Sk className="h-[0.72em] w-6 rounded-[3px]" /> : clamped + "%"}</span>
      </div>
      <svg
        viewBox="0 0 100 4"
        preserveAspectRatio="none"
        className="mt-2 h-1 w-full overflow-visible"
        aria-hidden="true"
      >
        <rect x="0" y="0" width="100" height="4" rx="2" fill="var(--color-border)" />
        <rect x="0" y="0" width={fill} height="4" rx="2" fill={accentColor} />
      </svg>
      <p className="mt-1.5 text-[11px] leading-snug text-[var(--color-text-muted)]">
        Occupies {loading ? <Sk className="h-[0.72em] w-6 rounded-[3px]" /> : clamped + "%"} of your weekly academic track
      </p>
    </div>
  );
}

function TaskVelocityLine({ completed, total, loading = false }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-text)_4%,transparent)] px-3 py-2.5 backdrop-blur-md">
      <span className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-text)]">
        <ListChecks size={13} className="text-[var(--color-text-muted)]" />
        Task Velocity
      </span>
      <span className="text-xs font-semibold text-[var(--color-text)]">
        {loading ? <Sk className="h-[0.72em] w-8 rounded-[3px]" /> : completed + " / " + total} Completed
      </span>
    </div>
  );
}

export default function SummaryHud({ nextSession, footprintPercent, accentColor, tasksCompleted, tasksTotal, loading = false, skeletonNextLines, knownNoSessions = false, knownNoTasks = false }) {
  return (
    <div className="flex flex-col gap-2.5">
      <NextSessionCard nextSession={nextSession} loading={loading && !knownNoSessions} nextLines={skeletonNextLines} />
      <TimeFootprintBar footprintPercent={footprintPercent} accentColor={accentColor} loading={loading && !knownNoSessions} />
      <TaskVelocityLine completed={tasksCompleted} total={tasksTotal} loading={loading && !knownNoTasks} />
    </div>
  );
}
