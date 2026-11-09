import { useState } from "react";
import { Activity } from "lucide-react";
import AnalyticsTile from "./AnalyticsTile";
import MiniBars from "./MiniBars";
import SegmentedControl from "../../components/ui/SegmentedControl";

const VIEWS = [
  { id: "added", label: "Homework added" },
  { id: "edits", label: "Timetable edits" },
];

function countLabel(view, n) {
  if (view === "added") return n === 1 ? "task added" : "tasks added";
  return n === 1 ? "timetable edit" : "timetable edits";
}

export default function ActivityCard({ homework, timetableActivity, days, onExpand }) {
  const [view, setView] = useState("added");

  const added = (homework?.createdByDate ?? []).map((d) => ({ date: d.date, value: d.count }));
  const edits = (timetableActivity ?? []).map((d) => ({ date: d.date, value: d.snapshotCount }));
  const items = view === "added" ? added : edits;
  const total = items.reduce((sum, i) => sum + i.value, 0);

  return (
    <AnalyticsTile icon={Activity} title="Activity" meta={`last ${days} days`} scroll={false} onExpand={onExpand}>
      <div className="flex h-full min-h-0 flex-col gap-3">
        <div className="flex shrink-0 items-center justify-between gap-3">
          <SegmentedControl size="sm" ariaLabel="Activity type" options={VIEWS} value={view} onChange={setView} className="shrink-0" />
          {total > 0 && (
            <p className="truncate text-xs text-[var(--color-text-muted)]">
              <span className="mr-1.5 text-2xl font-bold tabular-nums text-[var(--color-text)]">{total}</span>
              {countLabel(view, total)}
            </p>
          )}
        </div>
        {total === 0 ? (
          <p className="text-xs text-[var(--color-text-muted)]">
            {view === "added" ? "No tasks were added" : "No timetable edits"} in the last {days} days.
          </p>
        ) : (
          <div className="min-h-0 flex-1">
            <MiniBars items={items} unit={view === "added" ? "added" : "edits"} />
          </div>
        )}
      </div>
    </AnalyticsTile>
  );
}
