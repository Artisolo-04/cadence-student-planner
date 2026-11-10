import { formatLongDate, todayIso } from "./analyticsUtils";
import { Empty, Pill, Stat } from "./DetailBits";
import ScrollArea from "./ScrollArea";

const P = "var(--color-primary)";
const tint = (color, pct) => `color-mix(in srgb, ${color} ${pct}%, transparent)`;
const TODO = tint("var(--color-text-muted)", 85);
const PROGRESS = tint("var(--color-warning)", 80);

function parseKey(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export default function DeadlinesDetail({ homework, days }) {
  const today = todayIso();
  const overdue = homework?.overdue ?? 0;

  const all = (homework?.dueByDate ?? []).map((d) => {
    const todo = d.todo ?? 0;
    const progress = d.inProgress ?? 0;
    return { date: d.date, todo, progress, done: d.done ?? 0, open: todo + progress };
  });

  const open = all.reduce((sum, r) => sum + r.open, 0);
  const dueToday = all.find((r) => r.date === today)?.open ?? 0;
  const max = Math.max(1, ...all.map((r) => r.open));
  const busiest = all.reduce((a, b) => (b.open > (a?.open ?? 0) ? b : a), null);
  const activeDays = all.filter((r) => r.open > 0).length;

  // 7 days: show the whole week. 30/90 days: only days that have open tasks.
  const rows = all.length <= 14 ? all : all.filter((r) => r.open > 0);

  if (all.length === 0) return <Empty>Nothing is due in the next {days} days.</Empty>;

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <section className="grid shrink-0 grid-cols-3 gap-2">
        <Stat label="Overdue" value={overdue} color={overdue > 0 ? "var(--color-danger)" : undefined} />
        <Stat label="Open" value={open} color={open > 0 ? P : undefined} />
        <Stat label="Due today" value={dueToday} />
      </section>

      <div className="flex shrink-0 items-center justify-between text-xs text-[var(--color-text-muted)]">
        <span className="font-medium">Due by date</span>
        <span className="font-mono text-[10px]">
          {activeDays} {activeDays === 1 ? "day" : "days"} with tasks
        </span>
      </div>

      <ScrollArea watch={rows.length}>
        <ul className="flex flex-col gap-2 py-1">
          {rows.map((r) => {
            const free = r.open === 0;
            const isToday = r.date === today;
            const top = !free && busiest && r.date === busiest.date && activeDays > 1;
            const d = parseKey(r.date);
            return (
              <li
                key={r.date}
                className={`flex flex-col gap-2.5 rounded-xl border px-3.5 py-3 ${
                  free
                    ? "border-dashed border-[var(--color-line)]"
                    : isToday
                      ? "border-[var(--color-primary)]"
                      : "border-transparent"
                }`}
                style={{
                  background: free
                    ? "var(--color-fill-1)"
                    : `linear-gradient(120deg, ${tint(P, top ? 20 : 12)} 0%, ${tint(P, 4)} 100%)`,
                }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-10 w-10 shrink-0 flex-col items-center justify-center gap-0.5 rounded-lg leading-none"
                    style={{
                      color: free ? "var(--color-text-muted)" : P,
                      backgroundColor: free ? "var(--color-fill-3)" : tint(P, 20),
                    }}
                  >
                    <span className="text-[9px] font-semibold uppercase tracking-wide">
                      {d.toLocaleDateString("en-US", { weekday: "short" })}
                    </span>
                    <span className="text-sm font-bold tabular-nums">{d.getDate()}</span>
                  </span>

                  <div className="min-w-0 flex-1">
                    <h4 className="flex items-center gap-2 truncate text-[13px] font-semibold text-[var(--color-text)]">
                      {formatLongDate(r.date)}
                      {isToday && <Pill color={P}>Today</Pill>}
                    </h4>
                    <p className="mt-0.5 truncate text-[11px] text-[var(--color-text-muted)]">
                      {free ? (
                        "Nothing due"
                      ) : (
                        <>
                          {r.todo > 0 && <span>{r.todo} to do</span>}
                          {r.todo > 0 && r.progress > 0 && " · "}
                          {r.progress > 0 && (
                            <span style={{ color: "var(--color-warning)" }}>{r.progress} in progress</span>
                          )}
                          {top && " · busiest"}
                        </>
                      )}
                    </p>
                  </div>

                  <span
                    className={`shrink-0 font-mono text-sm font-bold tabular-nums ${
                      free ? "text-[var(--color-text-muted)]" : "text-[var(--color-text)]"
                    }`}
                  >
                    {free ? "Free" : r.open}
                  </span>
                </div>

                {!free && (
                  <div
                    className="h-1.5 overflow-hidden rounded-md"
                    style={{ width: "100%", backgroundColor: tint(P, 14) }}
                  >
                    <div className="flex h-full gap-px" style={{ width: `${(r.open / max) * 100}%` }}>
                      {r.todo > 0 && <div className="h-full" style={{ flex: r.todo, backgroundColor: TODO }} />}
                      {r.progress > 0 && <div className="h-full" style={{ flex: r.progress, backgroundColor: PROGRESS }} />}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </ScrollArea>
    </div>
  );
}
