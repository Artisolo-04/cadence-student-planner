import { useAuth } from "../../hooks/useAuth";
import { useDashboardData } from "./useDashboardData";
import { useDueSoonHomework } from "./useDueSoonHomework";
import StudentCard from "./StudentCard";
import FocusTimeline from "./FocusTimeline";
import DueSoonCard from "./DueSoonCard";

export default function DashboardPage() {
  const { user, profile } = useAuth();

  const { loading, timetables, workspace, todaySessions } = useDashboardData();

  const {
    homework: dueSoonHomework,
    loading: dueSoonLoading,
  } = useDueSoonHomework(4);

  if (loading && timetables.length === 0) return null;

  const groupTag = workspace?.my_group ?? workspace?.myGroup ?? null;

  return (
    <div className="grid grid-cols-1 gap-4 lg:h-full lg:min-h-0 lg:grid-cols-[440px_minmax(0,1fr)_320px] lg:overflow-hidden">
      <aside className="flex flex-col gap-4 lg:min-h-0 lg:overflow-hidden">
        <div className="shrink-0">
          <StudentCard user={user} profile={profile} groupTag={groupTag} />
        </div>
      </aside>

      <main className="min-h-0 lg:overflow-hidden">
        <DueSoonCard homework={dueSoonHomework} loading={dueSoonLoading} />
      </main>

      <aside className="min-h-[28rem] lg:min-h-0 lg:overflow-hidden">
        <FocusTimeline sessions={todaySessions} />
      </aside>
    </div>
  );
}
