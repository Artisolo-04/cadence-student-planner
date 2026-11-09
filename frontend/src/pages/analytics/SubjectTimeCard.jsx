import { BookOpen } from "lucide-react";
import AnalyticsTile from "./AnalyticsTile";
import { formatMinutes } from "./analyticsUtils";

export default function SubjectTimeCard({ schedule }) {
  const subjects = schedule?.bySubject ?? [];
  const max = Math.max(1, ...subjects.map((s) => s.scheduledMinutes));

  return (
    <AnalyticsTile
      icon={BookOpen}
      title="Time by subject"
      meta={subjects.length ? `${subjects.length} subjects` : null}
    >
      {subjects.length === 0 ? (
        <p className="text-xs text-[var(--color-text-muted)]">No classes scheduled for this group yet.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {subjects.map((s) => (
            <li key={s.subjectId} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="flex min-w-0 items-center gap-2 text-[var(--color-text)]">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="truncate" title={s.name}>{s.name}</span>
                </span>
                <span className="shrink-0 font-mono text-[var(--color-text-muted)]">
                  {formatMinutes(s.scheduledMinutes)}
                </span>
              </div>
              <div className="h-1 w-full overflow-hidden rounded-full bg-[var(--color-fill-3)]">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${(s.scheduledMinutes / max) * 100}%`, backgroundColor: s.color }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </AnalyticsTile>
  );
}
