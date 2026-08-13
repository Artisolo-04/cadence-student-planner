import { useAuth } from "../../hooks/useAuth";
import { useDashboardData } from "./useDashboardData";
import TodaySchedule from "./TodaySchedule";
import EmptyState from "./EmptyState";
import WorkspaceSwitcher from "./WorkspaceSwitcher";

export default function DashboardPage() {
  const { user } = useAuth();
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
    todayLabel,
  } = useDashboardData();

  const firstName =
    user?.name?.split(" ")[0] ?? user?.full_name?.split(" ")[0] ?? "there";

  if (loading && timetables.length === 0) return null;

  return (
    <>
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-text)]">
            Welcome, {firstName}
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">{todayLabel}</p>
        </div>

        <WorkspaceSwitcher
          timetables={timetables}
          activeId={activeId}
          onSelect={selectWorkspace}
        />
      </div>

      {error && (
        <div className="rounded-lg border border-[var(--color-danger)] bg-[var(--color-surface)] p-4 text-sm text-[var(--color-danger)]">
          {error}
        </div>
      )}

      {!error && !workspace && (
        <EmptyState
          title="No timetable yet"
          body="Create a workspace to see today's schedule here."
        />
      )}

      {!error && workspace && todaySessions.length === 0 && (
        <EmptyState
          title="No classes today"
          body="Nothing scheduled — enjoy the break."
        />
      )}

      {!error && todaySessions.length > 0 && (
        <div className="max-w-xl">
          {nextSession && (
            <p className="text-sm text-[var(--color-primary)] mb-2">
              Next up: {nextSession.subjectName} at {nextSession.start.slice(0, 5)}
            </p>
          )}
          <TodaySchedule sessions={todaySessions} currentKey={currentKey} />
        </div>
      )}
    </>
  );
}
