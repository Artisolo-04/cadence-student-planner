import { BarChart3 } from "lucide-react";
import EmptyState from "../../components/ui/EmptyState";

export default function AnalyticsPage() {
  return (
    <div className="flex h-full w-full min-h-0 flex-col gap-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 shrink-0">
        <div>
          <h1 className="text-lg font-semibold text-[var(--color-text)]">Analytics</h1>
          <p className="mt-1 hidden text-sm text-[var(--color-text-muted)] sm:block">
            Insights for My workspace
          </p>
        </div>
      </header>

      <section className="relative flex min-h-0 flex-1 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-2 sm:p-4">
        <EmptyState
          className="h-full w-full"
          icon={BarChart3}
          title="Your analytics workspace is ready"
          body="This page has been freshly initialized. New insights will appear here once they are built."
        />
      </section>
    </div>
  );
}
