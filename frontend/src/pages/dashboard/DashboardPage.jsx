import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useDashboardData } from "./useDashboardData";
import { useDueSoonHomework } from "./useDueSoonHomework";
import { useVaultData } from "../vault/useVaultData";
import { flattenVault } from "./vaultAccess";
import StudentCard from "./StudentCard";
import DashboardSkeleton, {
  NextUpSkeleton,
  WeeklySkeleton,
  FocusSkeleton,
} from "./DashboardSkeleton";
import FocusTimeline from "./FocusTimeline";
import InterceptVaultStack from "./InterceptVaultStack";
import NextUpTile from "./NextUpTile";
import VelocityRingTile from "./VelocityRingTile";
import WeeklyIntensityTile from "./WeeklyIntensityTile";

export default function DashboardPage() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  const { user, profile } = useAuth();

  const {
    loading,
    switching,
    workspace,
    todaySessions,
    weeklyIntensity,
    weekAgenda,
    nextSession,
  } = useDashboardData(now);

  const { buckets, stats: homeworkStats, loading: dueSoonLoading } = useDueSoonHomework(5);

  const { bySubject, byFolder, loading: vaultLoading } = useVaultData();
  const vaultFiles = useMemo(() => flattenVault(bySubject, byFolder), [bySubject, byFolder]);

  const forceSkeleton =
    import.meta.env.DEV && new URLSearchParams(window.location.search).has("skeleton");

  const readyRef = useRef(false);
  if (!loading && !dueSoonLoading && !vaultLoading) readyRef.current = true;

  if (forceSkeleton || !readyRef.current) return <DashboardSkeleton />;

  const groupTag = workspace?.my_group ?? workspace?.myGroup ?? null;

  return (
    <div className="cad-reveal grid grid-cols-1 gap-4 lg:h-full lg:min-h-0 lg:grid-cols-[360px_minmax(0,1fr)_380px] lg:overflow-hidden">
      <aside className="flex flex-col gap-4 lg:min-h-0 lg:overflow-hidden">
        <div className="shrink-0">
          <StudentCard user={user} profile={profile} groupTag={groupTag} switching={switching} />
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
          {switching ? <WeeklySkeleton /> : <WeeklyIntensityTile data={weeklyIntensity} />}
        </div>
      </aside>

      <main className="flex flex-col gap-4 min-h-0 lg:overflow-hidden">
        <div className="shrink-0">
          {switching ? <NextUpSkeleton /> : <NextUpTile session={nextSession} now={now} />}
        </div>

        <div className="lg:flex-1 lg:min-h-0">
          <InterceptVaultStack
            buckets={buckets}
            loading={dueSoonLoading}
            files={vaultFiles}
            vaultLoading={vaultLoading}
          />
        </div>
      </main>

      <aside className="min-h-[28rem] lg:min-h-0 lg:overflow-hidden">
        {switching ? <FocusSkeleton /> : <FocusTimeline week={weekAgenda} now={now} />}
      </aside>
    </div>
  );
}
