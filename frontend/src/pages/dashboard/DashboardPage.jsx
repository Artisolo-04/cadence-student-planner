import { useAuth } from "../../hooks/useAuth";
import { useDashboardData } from "./useDashboardData";
import { useDueSoonHomework } from "./useDueSoonHomework";
import StudentCard from "./StudentCard";
import FocusTimeline from "./FocusTimeline";
import InterceptVaultStack from "./InterceptVaultStack";
import NextUpTile from "./NextUpTile";
import VelocityRingTile from "./VelocityRingTile";
import WeeklyIntensityTile from "./WeeklyIntensityTile";

export default function DashboardPage() {
  const { user, profile } = useAuth();

  const {
    loading,
    timetables,
    workspace,
    todaySessions,
    weeklyIntensity,
    weekAgenda,
    nextSession,
  } = useDashboardData();

  const { buckets, stats: homeworkStats, loading: dueSoonLoading } = useDueSoonHomework(5);

  if (loading && timetables.length === 0) return null;

  const groupTag = workspace?.my_group ?? workspace?.myGroup ?? null;

  return (
    <div className="grid grid-cols-1 gap-4 lg:h-full lg:min-h-0 lg:grid-cols-[360px_minmax(0,1fr)_380px] lg:overflow-hidden">
      <aside className="flex flex-col gap-4 lg:min-h-0 lg:overflow-hidden">
        <div className="shrink-0">
          <StudentCard user={user} profile={profile} groupTag={groupTag} />
        </div>

          <div className="min-h-[9rem] flex-1">
          <VelocityRingTile
            total={homeworkStats.total}
            done={homeworkStats.done}
            overdue={homeworkStats.overdue}
            loading={dueSoonLoading}
          />
        </div>

          <div className="min-h-[9rem] flex-1">
          <WeeklyIntensityTile data={weeklyIntensity} />
        </div>
      </aside>

      <main className="flex flex-col gap-4 min-h-0 lg:overflow-hidden">
        <div className="shrink-0">
          <NextUpTile session={nextSession} />
        </div>

        <div className="flex-1 min-h-0">
          <InterceptVaultStack buckets={buckets} loading={dueSoonLoading} />
        </div>
      </main>

      <aside className="min-h-[28rem] lg:min-h-0 lg:overflow-hidden">
        <FocusTimeline week={weekAgenda} />
      </aside>
    </div>
  );
}
