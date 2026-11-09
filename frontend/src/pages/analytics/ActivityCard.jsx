import { useState } from "react";
import { Activity } from "lucide-react";
import AnalyticsTile from "./AnalyticsTile";
import MiniBars from "./MiniBars";
import SegmentedControl from "../../components/ui/SegmentedControl";

const VIEWS = [
  { id: "added", label: "Homework added" },
  { id: "edits", label: "Timetable edits" },
];

export default function ActivityCard({ homework, timetableActivity, days }) {
  const [view, setView] = useState("added");

  const added = (homework?.createdByDate ?? []).map((d) => ({ date: d.date, value: d.count }));
  const edits = (timetableActivity ?? []).map((d) => ({ date: d.date, value: d.snapshotCount }));
  const items = view === "added" ? added : edits;
  const total = items.reduce((sum, i) => sum + i.value, 0);
  const noun = view === "added" ? "tasks added" : "timetable edits";

  return (
    <AnalyticsTile icon={Activity} title="Activity" meta={`last ${days} days`} scroll={false}>
      <div className="flex h-full min-h-0 flex-col gap-3">
        <SegmentedControl size="sm" ariaLabel="Activity type" options={VIEWS} value={view} onChange={setView} className="shrink-0 self-start" />
        {total === 0 ? (
          <p className="text-xs text-[var(--color-text-muted)]">No {noun} in the last {days} days.</p>
        ) : (
          <>
            <p className="shrink-0 text-xs text-[var(--color-text-muted)]">
              <span className="mr-1.5 text-2xl font-bold tabular-nums text-[var(--color-text)]">{total}</span>
              {noun}
            </p>
            <div className="min-h-0 flex-1">
              <MiniBars items={items} unit={view === "added" ? "added" : "edits"} />
            </div>
          </>
        )}
      </div>
    </AnalyticsTile>
  );
}
