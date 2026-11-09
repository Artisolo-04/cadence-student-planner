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
import DeadlinesCard from "./DeadlinesCard";
import ActivityCard from "./ActivityCard";
import VaultCard from "./VaultCard";
import DetailPanel from "./DetailPanel";
import AnalyticsSkeleton from "./AnalyticsSkeleton";
import SubjectDetail from "./SubjectDetail";
import DayDetail from "./DayDetail";
import DeadlinesDetail from "./DeadlinesDetail";
import ActivityDetail from "./ActivityDetail";
import VaultDetail from "./VaultDetail";
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
  const [panel, setPanel] = useState(null);
  const { data, loading, error, reload } = useAnalyticsData(days);

  useEffect(() => {
    setGroupTag(null);
    setPanel(null);
  }, [activeId]);

  if (!data && loading) return <AnalyticsSkeleton />;

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

  const groupLabel = schedule ? GROUP_LABELS[schedule.groupTag] ?? schedule.groupTag : null;
  const weekly = schedule ? formatMinutes(schedule.weeklyMinutes) : "0m";
  const panelViews = {
    subjects: {
      title: "Time by subject",
      subtitle: `${weekly} per week${groupLabel ? ` · ${groupLabel}` : ""}`,
      body: <SubjectDetail schedule={schedule} />,
    },
    days: {
      title: "Time by day",
      subtitle: `${weekly} per week${groupLabel ? ` · ${groupLabel}` : ""}`,
      body: <DayDetail schedule={schedule} />,
    },
    deadlines: {
      title: "Deadlines ahead",
      subtitle: `Next ${days} days`,
      body: <DeadlinesDetail homework={hw} days={days} />,
    },
    activity: {
      title: "Activity",
      subtitle: `Last ${days} days`,
      body: <ActivityDetail homework={hw} timetableActivity={data.timetableActivity} days={days} />,
    },
    vault: {
      title: "Vault",
      subtitle: "Documents and links you saved",
      body: <VaultDetail vault={data.vault} />,
    },
  };
  const panelView = panel ? panelViews[panel] : null;

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

      {error && (
        <div
          role="alert"
          className="flex shrink-0 items-center justify-between gap-3 rounded-xl border border-[var(--color-danger)]/40 bg-[var(--color-danger)]/10 px-3 py-2 text-xs text-[var(--color-danger)]"
        >
          <span>{error} Showing your last results.</span>
          <button type="button" onClick={reload} className="shrink-0 font-medium underline underline-offset-2">
            Try again
          </button>
        </div>
      )}

      <div
        aria-busy={loading}
        className={`grid shrink-0 grid-cols-2 gap-4 transition-opacity duration-200 lg:grid-cols-4 ${loading ? "opacity-60" : ""}`}
      >
        <StatTile icon={Gauge} label="Completed" value={`${Math.round(hw.completionPercent)}%`} sub={`${hw.byStatus.done} of ${hw.total} tasks`} />
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

      <div
        aria-busy={loading}
        className={`grid grid-cols-1 gap-4 transition-opacity duration-200 lg:min-h-0 lg:flex-1 lg:grid-cols-3 lg:grid-rows-[repeat(2,minmax(0,1fr))] ${loading ? "opacity-60" : ""}`}
      >
        <SubjectTimeCard schedule={schedule} onExpand={() => setPanel("subjects")} />
        <DayTimeCard schedule={schedule} onExpand={() => setPanel("days")} />
        <HomeworkStatusCard homework={hw} />
        <DeadlinesCard homework={hw} days={days} onExpand={() => setPanel("deadlines")} />
        <ActivityCard homework={hw} timetableActivity={data.timetableActivity} days={days} onExpand={() => setPanel("activity")} />
        <VaultCard vault={data.vault} onExpand={() => setPanel("vault")} />
      </div>

      <DetailPanel
        open={panelView !== null}
        title={panelView?.title}
        subtitle={panelView?.subtitle}
        onClose={() => setPanel(null)}
      >
        {panelView?.body}
      </DetailPanel>
    </div>
  );
}
