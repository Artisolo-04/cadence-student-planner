import { useAuth } from "../../hooks/useAuth";
import { useDashboardData } from "./useDashboardData";
import { useDueSoonHomework } from "./useDueSoonHomework";
import TodaySchedule from "./TodaySchedule";
import EmptyState from "./EmptyState";
import WorkspaceSwitcher from "./WorkspaceSwitcher";
import StudentCard from "./StudentCard";
import TodayOverviewCard from "./TodayOverviewCard";
import FocusTimeline from "./FocusTimeline";
import DueSoonCard from "./DueSoonCard";
import DayProgressCard from "./DayProgressCard";
import SessionTimerCard from "./SessionTimerCard";

export default function DashboardPage() {
  const { user, profile } = useAuth();
  const {
    loading,
    error,
    timetables,
    activeId,
    selectWorkspace,
    workspace,
    todaySessions,
    currentKey,
    nextSession,
    weekStats,
    todayLabel,
  } = useDashboardData();

  const { homework: dueSoonHomework, loading: dueSoonLoading } = useDueSoonHomework(4);

  if (loading && timetables.length === 0) return null;

  const groupTag = workspace?.my_group ?? workspace?.myGroup ?? null;

  return (
    <div className="grid grid-cols-1 gap-4 lg:h-full lg:min-h-0 lg:grid-cols-[440px_1fr_320px]">
      <div className="flex flex-col gap-4 min-w-0 lg:h-full lg:overflow-y-auto scrollbar-cadence">
        <div className="max-w-md w-full flex-1 min-h-0">
          <StudentCard user={user} profile={profile} groupTag={groupTag} />
        </div>

        {error && (
          <div className="max-w-md rounded-lg border border-[var(--color-danger)] bg-[var(--color-surface)] p-4 text-sm text-[var(--color-danger)]">
            {error}
          </div>
        )}

        {!error && !workspace && (
          <div className="max-w-md">
            <EmptyState
              title="No timetable yet"
              body="Create a workspace to see today's schedule here."
            />
          </div>
        )}

        {!error && workspace && todaySessions.length === 0 && (
          <div className="max-w-md">
            <EmptyState
              title="No classes today"
              body="Nothing scheduled — enjoy the break."
            />
          </div>
        )}

        {!error && todaySessions.length > 0 && (
          <div className="max-w-md">
            <TodaySchedule sessions={todaySessions} currentKey={currentKey} />
          </div>
        )}

        <div className="max-w-md">
          <WorkspaceSwitcher
            timetables={timetables}
            activeId={activeId}
            onSelect={selectWorkspace}
          />
        </div>
      </div>

      <div className="flex min-w-0 flex-col gap-4 lg:h-full lg:overflow-y-auto scrollbar-cadence">
        <DayProgressCard sessions={todaySessions} currentKey={currentKey} />
        <div className="flex min-w-0 flex-col items-stretch gap-4 lg:flex-row">
          <div className="w-full min-w-0 lg:w-1/2">
            <TodayOverviewCard
              todayLabel={todayLabel}
              nextSession={nextSession}
              weekTotal={weekStats.total}
              busiestDay={weekStats.busiestDay}
            />
          </div>
          <div className="w-full min-w-0 lg:w-1/2">
            <SessionTimerCard sessions={todaySessions} currentKey={currentKey} />
          </div>
        </div>

        <DueSoonCard homework={dueSoonHomework} loading={dueSoonLoading} />
      </div>

      <div className="flex w-full min-w-0 flex-col lg:h-full lg:min-h-0">
        <FocusTimeline sessions={todaySessions} currentKey={currentKey} />
      </div>
    </div>
  );
}
