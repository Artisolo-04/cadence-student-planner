import { formatLongDate, todayIso } from "./analyticsUtils";
import { Empty, Pill, SectionTitle, Stat } from "./DetailBits";

export default function DeadlinesDetail({ homework, days }) {
  const today = todayIso();
  const rows = (homework?.dueByDate ?? []).filter((d) => d.total > 0);
  const open = rows.reduce((sum, d) => sum + d.todo + d.inProgress, 0);
  const overdue = homework?.overdue ?? 0;

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3">
        <Stat label="Overdue" value={overdue} color={overdue > 0 ? "var(--color-danger)" : undefined} />
        <Stat label={`Open in the next ${days} days`} value={open} />
      </div>

      <section>
        <SectionTitle>Due by date</SectionTitle>
        {rows.length === 0 ? (
          <Empty>Nothing is due in the next {days} days.</Empty>
        ) : (
          <ul className="flex flex-col divide-y divide-[var(--color-line)]">
            {rows.map((d) => (
              <li key={d.date} className="flex items-center justify-between gap-3 py-2.5 first:pt-0">
                <span className="flex items-center gap-2 text-sm text-[var(--color-text)]">
                  {formatLongDate(d.date)}
                  {d.date === today && <Pill color="var(--color-primary)">Today</Pill>}
                </span>
                <span className="flex flex-wrap items-center justify-end gap-1.5">
                  {d.todo > 0 && <Pill>{d.todo} to do</Pill>}
                  {d.inProgress > 0 && <Pill color="var(--color-warning)">{d.inProgress} in progress</Pill>}
                  {d.done > 0 && <Pill color="var(--color-primary)">{d.done} done</Pill>}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
