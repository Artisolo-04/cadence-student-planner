import { useAuth } from "../../hooks/useAuth";
import { useDashboardData } from "./useDashboardData";
import TodaySchedule from "./TodaySchedule";
import EmptyState from "./EmptyState";
import WorkspaceSwitcher from "./WorkspaceSwitcher";
import StudentCard from "./StudentCard";
import TodayOverviewCard from "./TodayOverviewCard";

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

  if (loading && timetables.length === 0) return null;

  const groupTag = workspace?.my_group ?? workspace?.myGroup ?? null;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
      <div className="flex flex-col gap-6 min-w-0">
        <div className="max-w-md w-full">
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
      </div>

      <div className="flex flex-col gap-4">
        <TodayOverviewCard
          todayLabel={todayLabel}
          nextSession={nextSession}
          weekTotal={weekStats.total}
          busiestDay={weekStats.busiestDay}
        />

        <WorkspaceSwitcher
          timetables={timetables}
          activeId={activeId}
          onSelect={selectWorkspace}
        />
      </div>
    </div>
  );
}
