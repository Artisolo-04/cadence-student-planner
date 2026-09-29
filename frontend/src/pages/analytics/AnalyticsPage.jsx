import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart3, Calendar, Plus } from "lucide-react";
import api from "../../lib/api";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import { useWorkspace } from "../../hooks/useWorkspace";
import AnalyticsPanel from "../timetable/analytics/AnalyticsPanel";

export default function AnalyticsPage() {
  const navigate = useNavigate();
  const { timetables, activeId, selectWorkspace, loading } = useWorkspace();

  const currentId = activeId ?? timetables[0]?.id ?? null;

  const [workspace, setWorkspace] = useState(null);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (currentId == null) {
      setWorkspace(null);
      return;
    }
    let cancelled = false;
    setFetching(true);
    setError(false);
    api
      .get(`/timetables/${currentId}`)
      .then(({ data }) => {
        if (!cancelled) setWorkspace(data);
      })
      .catch((err) => {
        console.error("Load analytics workspace error:", err);
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setFetching(false);
      });
    return () => {
      cancelled = true;
    };
  }, [currentId]);

  if (loading) return null;

  if (timetables.length === 0) {
    return (
      <EmptyState
        className="h-full"
        icon={BarChart3}
        title="No analytics yet"
        body="Create a timetable and your weekly insights will show up here."
        action={
          <Button onClick={() => navigate("/timetable")}>
            <Plus size={15} />
            Create timetable
          </Button>
        }
      />
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col" style={{ gap: "12px" }}>
      <header
        className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b pb-3"
        style={{ borderColor: "var(--color-border)" }}
      >
        <div className="min-w-0">
          <h1
            className="text-xl font-bold"
            style={{ color: "var(--color-text)" }}
          >
            Analytics
          </h1>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            Understand how your week is balanced.
          </p>
        </div>

        <label className="flex items-center gap-2">
          <Calendar size={15} style={{ color: "var(--color-text-muted)" }} />
          <select
            value={currentId ?? ""}
            onChange={(e) => selectWorkspace(e.target.value)}
            aria-label="Workspace"
            className="h-9 max-w-[200px] rounded-lg border px-3 text-sm font-semibold outline-none"
            style={{
              color: "var(--color-text)",
              borderColor: "var(--color-border)",
              background: "var(--color-surface-alt)",
            }}
          >
            {timetables.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
      </header>

      <div className="flex min-h-0 flex-1 flex-col">
        {error ? (
          <EmptyState
            className="h-full"
            icon={BarChart3}
            title="Couldn't load analytics"
            body="Something went wrong while loading this workspace."
            action={<Button onClick={() => navigate(0)}>Retry</Button>}
          />
        ) : workspace && !fetching ? (
          <AnalyticsPanel workspace={workspace} slots={workspace.slots} />
        ) : null}
      </div>
    </div>
  );
}
