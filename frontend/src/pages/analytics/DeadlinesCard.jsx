import { CalendarDays } from "lucide-react";
import AnalyticsTile from "./AnalyticsTile";
import MiniBars from "./MiniBars";

export default function DeadlinesCard({ homework, days, onExpand }) {
  const items = (homework?.dueByDate ?? []).map((d) => ({
    date: d.date,
    value: (d.todo ?? 0) + (d.inProgress ?? 0),
  }));
  const openTotal = items.reduce((sum, i) => sum + i.value, 0);

  return (
    <AnalyticsTile icon={CalendarDays} title="Deadlines ahead" meta={`next ${days} days`} scroll={false} onExpand={onExpand}>
      {openTotal === 0 ? (
        <p className="text-xs text-[var(--color-text-muted)]">Nothing is due in the next {days} days.</p>
      ) : (
        <div className="flex h-full min-h-0 flex-col gap-3">
          <p className="shrink-0 text-xs text-[var(--color-text-muted)]">
            <span className="mr-1.5 text-2xl font-bold tabular-nums text-[var(--color-text)]">{openTotal}</span>
            open {openTotal === 1 ? "task" : "tasks"} due
          </p>
          <div className="min-h-0 flex-1">
            <MiniBars items={items} unit="open" />
          </div>
        </div>
      )}
    </AnalyticsTile>
  );
}
