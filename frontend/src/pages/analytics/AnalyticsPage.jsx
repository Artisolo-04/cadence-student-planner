import { useWorkspace } from "../../hooks/useWorkspace";
import useAnalyticsData from "./useAnalyticsData";
import { findSchedule, findWorkspace, formatMinutes } from "./analyticsUtils";

// TEMPORARY page: only proves the data layer works. Replaced in the next step.
export default function AnalyticsPage() {
  const { activeId, activeWorkspace } = useWorkspace();
  const { data, loading, error } = useAnalyticsData(30);

  const workspace = findWorkspace(data, activeId);
  const schedule = findSchedule(workspace, activeWorkspace?.my_group ?? null);

  console.log("[analytics]", { activeId, data, workspace, schedule });

  return (
    <div className="p-4 text-sm text-[var(--color-text)]">
      <h1 className="text-lg font-semibold">Analytics (data check)</h1>
      <pre className="mt-3 whitespace-pre-wrap text-[var(--color-text-muted)]">
        {JSON.stringify(
          {
            loading,
            error,
            activeId,
            workspace: workspace?.name ?? null,
            group: schedule?.groupTag ?? null,
            weeklyTime: schedule ? formatMinutes(schedule.weeklyMinutes) : null,
            completionPercent: data?.homework?.completionPercent ?? null,
            overdue: data?.homework?.overdue ?? null,
          },
          null,
          2,
        )}
      </pre>
    </div>
  );
}
