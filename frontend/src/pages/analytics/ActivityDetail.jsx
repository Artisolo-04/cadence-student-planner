import { formatLongDate } from "./analyticsUtils";
import { Empty, SectionTitle } from "./DetailBits";

function Section({ title, rows, noun, days }) {
  const active = rows.filter((r) => r.value > 0).reverse();
  const total = active.reduce((sum, r) => sum + r.value, 0);

  return (
    <section>
      <SectionTitle>{title}</SectionTitle>
      {active.length === 0 ? (
        <Empty>Nothing in the last {days} days.</Empty>
      ) : (
        <>
          <p className="mb-2 text-sm text-[var(--color-text)]">
            <span className="mr-1.5 font-mono text-xl font-semibold tabular-nums">{total}</span>
            <span className="text-[var(--color-text-muted)]">{noun} in total</span>
          </p>
          <ul className="flex flex-col divide-y divide-[var(--color-line)]">
            {active.map((r) => (
              <li key={r.date} className="flex items-center justify-between py-2 text-sm">
                <span className="text-[var(--color-text)]">{formatLongDate(r.date)}</span>
                <span className="font-mono text-[var(--color-text-muted)]">{r.value}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

export default function ActivityDetail({ homework, timetableActivity, days }) {
  const added = (homework?.createdByDate ?? []).map((d) => ({ date: d.date, value: d.count }));
  const edits = (timetableActivity ?? []).map((d) => ({ date: d.date, value: d.snapshotCount }));

  return (
    <div className="flex flex-col gap-6">
      <Section title="Homework added" rows={added} noun="tasks added" days={days} />
      <Section title="Timetable edits" rows={edits} noun="edits" days={days} />
    </div>
  );
}
