import { useEffect, useState } from "react";
import { BarChart3, BookOpen, CalendarDays, Clock, Gauge } from "lucide-react";
import { useWorkspace } from "../../hooks/useWorkspace";
import SegmentedControl from "../../components/ui/SegmentedControl";
import Dropdown from "../../components/ui/Dropdown";
import EmptyState from "../../components/ui/EmptyState";
import AnalyticsTile from "./AnalyticsTile";
import StatTile from "./StatTile";
import SubjectTimeCard from "./SubjectTimeCard";
import DayTimeCard from "./DayTimeCard";
import HomeworkStatusCard from "./HomeworkStatusCard";
import useAnalyticsData from "./useAnalyticsData";
import { GROUP_LABELS, findSchedule, findWorkspace, formatMinutes } from "./analyticsUtils";

const RANGE_OPTIONS = [
  { id: 7, label: "7 days" },
  { id: 30, label: "30 days" },
  { id: 90, label: "90 days" },
];

function Placeholder({ icon, title }) {
  return (
    <AnalyticsTile icon={icon} title={title}>
      <p className="text-xs text-[var(--color-text-muted)]">Coming in the next step.</p>
    </AnalyticsTile>
  );
}

export default function AnalyticsPage() {
  const { activeId, activeWorkspace } = useWorkspace();
  const [days, setDays] = useState(30);
  const [groupTag, setGroupTag] = useState(null);
  const { data, loading, error, reload } = useAnalyticsData(days);

  useEffect(() => {
    setGroupTag(null);
  }, [activeId]);

  if (!data && loading) return null;

  if (!data) {
    return (
      <EmptyState
        className="h-full"
        icon={BarChart3}
        title="Analytics couldn't load"
        body={error ?? "Something went wrong. Try again in a moment."}
        action={
          <button
            type="button"
            onClick={reload}
            className="rounded-lg bg-[var(--color-primary)] px-3 py-1.5 text-xs font-medium text-[var(--color-primary-fg)] hover:bg-[var(--color-primary-hover)]"
          >
            Try again
          </button>
        }
      />
    );
  }

  const workspace = findWorkspace(data, activeId);
  const schedule = findSchedule(workspace, groupTag ?? activeWorkspace?.my_group ?? null);
  const schedules = workspace?.schedules ?? [];
  const hw = data.homework;

  return (
    <div className="flex flex-col gap-4 lg:h-full lg:min-h-0 lg:overflow-hidden">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-lg font-semibold text-[var(--color-text)]">Analytics</h1>
          <p className="mt-0.5 truncate text-sm text-[var(--color-text-muted)]">
            Insights for {workspace?.name ?? activeWorkspace?.name ?? "your workspace"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {schedules.length > 1 && (
            <Dropdown
              size="sm"
              value={schedule?.groupTag}
              onChange={(e) => setGroupTag(e.target.value)}
              options={schedules.map((s) => ({ value: s.groupTag, label: GROUP_LABELS[s.groupTag] ?? s.groupTag }))}
            />
          )}
          <SegmentedControl size="sm" ariaLabel="Time range" options={RANGE_OPTIONS} value={days} onChange={setDays} />
        </div>
      </header>

      <div className="grid shrink-0 grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile icon={Gauge} label="Completed" value={`${hw.completionPercent}%`} sub={`${hw.byStatus.done} of ${hw.total} tasks`} />
        <StatTile
          icon={Clock}
          label="Overdue"
          value={hw.overdue}
          valueColor={hw.overdue > 0 ? "var(--color-danger)" : undefined}
          sub={hw.overdue > 0 ? "Past their due date" : "You are all caught up"}
        />
        <StatTile
          icon={CalendarDays}
          label="Due in 7 days"
          value={hw.dueNext7Days}
          sub={hw.dueToday > 0 ? `${hw.dueToday} due today` : "Nothing due today"}
        />
        <StatTile
          icon={BookOpen}
          label="Class time"
          value={schedule ? formatMinutes(schedule.weeklyMinutes) : "0m"}
          sub={schedule ? `${schedule.classCount} classes over ${schedule.activeDays} days` : "No schedule yet"}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:min-h-0 lg:flex-1 lg:grid-cols-3 lg:grid-rows-[repeat(2,minmax(0,1fr))]">
        <SubjectTimeCard schedule={schedule} />
        <DayTimeCard schedule={schedule} />
        <HomeworkStatusCard homework={hw} />
        <Placeholder icon={CalendarDays} title="Deadlines ahead" />
        <Placeholder icon={Clock} title="Activity" />
        <Placeholder icon={BookOpen} title="Vault" />
      </div>
    </div>
  );
}
