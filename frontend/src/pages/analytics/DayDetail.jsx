import { DAY_FULL, DAY_ORDER, formatMinutes } from "./analyticsUtils";
import { Empty } from "./DetailBits";

export default function DayDetail({ schedule }) {
  if (!schedule) return <Empty>No classes scheduled for this group yet.</Empty>;

  const byDay = new Map((schedule.byDay ?? []).map((d) => [Number(d.dayOfWeek) % 7, d]));
  const rows = DAY_ORDER.map((n) => ({
    n,
    minutes: byDay.get(n)?.scheduledMinutes ?? 0,
    classes: byDay.get(n)?.classCount ?? 0,
  }));
  const max = Math.max(1, ...rows.map((r) => r.minutes));

  return (
    <ul className="flex flex-col divide-y divide-[var(--color-line)]">
      {rows.map((r) => (
        <li key={r.n} className="flex flex-col gap-2 py-3 first:pt-0">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-[var(--color-text)]">{DAY_FULL[r.n]}</span>
            <span className="font-mono text-[var(--color-text)]">
              {r.minutes > 0 ? formatMinutes(r.minutes) : <span className="text-[var(--color-text-muted)]">Free</span>}
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-fill-3)]">
            <div
              className="h-full rounded-full bg-[var(--color-primary)]"
              style={{ width: `${(r.minutes / max) * 100}%` }}
            />
          </div>
          <p className="text-[11px] text-[var(--color-text-muted)]">
            {r.classes > 0 ? `${r.classes} ${r.classes === 1 ? "class" : "classes"}` : "No classes"}
          </p>
        </li>
      ))}
    </ul>
  );
}
