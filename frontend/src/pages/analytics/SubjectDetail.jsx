import { formatMinutes } from "./analyticsUtils";

export default function SubjectDetail({ schedule }) {
  const subjects = schedule?.bySubject ?? [];
  const total = schedule?.weeklyMinutes ?? 0;

  if (subjects.length === 0) {
    return <p className="text-sm text-[var(--color-text-muted)]">No classes scheduled for this group yet.</p>;
  }

  return (
    <ul className="flex flex-col divide-y divide-[var(--color-line)]">
      {subjects.map((s) => {
        const share = total > 0 ? Math.round((s.scheduledMinutes / total) * 100) : 0;
        return (
          <li key={s.subjectId} className="flex flex-col gap-2 py-3 first:pt-0">
            <div className="flex items-center justify-between gap-3">
              <span className="flex min-w-0 items-center gap-2 text-sm text-[var(--color-text)]">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="truncate" title={s.name}>{s.name}</span>
              </span>
              <span className="shrink-0 font-mono text-sm text-[var(--color-text)]">
                {formatMinutes(s.scheduledMinutes)}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-fill-3)]">
              <div className="h-full rounded-full" style={{ width: `${share}%`, backgroundColor: s.color }} />
            </div>
            <p className="text-[11px] text-[var(--color-text-muted)]">
              {s.classCount} {s.classCount === 1 ? "class" : "classes"} per week · {share}% of your week
            </p>
          </li>
        );
      })}
    </ul>
  );
}
