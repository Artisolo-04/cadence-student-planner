import { DAY_FULL, DAY_ORDER, DAY_SHORT, formatMinutes } from "./analyticsUtils";
import { Empty, Stat } from "./DetailBits";
import ScrollArea from "./ScrollArea";

const P = "var(--color-primary)";
const tint = (pct) => `color-mix(in srgb, ${P} ${pct}%, transparent)`;

export default function DayDetail({ schedule }) {
  if (!schedule) return <Empty>No classes scheduled for this group yet.</Empty>;

  const byDay = new Map((schedule.byDay ?? []).map((d) => [Number(d.dayOfWeek) % 7, d]));
  const rows = DAY_ORDER.map((n) => ({
    n,
    minutes: byDay.get(n)?.scheduledMinutes ?? 0,
    classes: byDay.get(n)?.classCount ?? 0,
  }));
  const sum = rows.reduce((acc, r) => acc + r.minutes, 0);
  const total = schedule.weeklyMinutes || sum;
  const max = Math.max(1, ...rows.map((r) => r.minutes));
  const busiest = rows.reduce((a, b) => (b.minutes > a.minutes ? b : a), rows[0]);
  const freeDays = rows.filter((r) => r.minutes === 0).length;
  const share = (m) => (total > 0 ? Math.round((m / total) * 100) : 0);

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <section className="grid shrink-0 grid-cols-3 gap-2">
        <Stat label="Per week" value={formatMinutes(total)} color={P} />
        <Stat label="Busiest" value={busiest.minutes > 0 ? DAY_SHORT[busiest.n] : "-"} />
        <Stat label="Free days" value={freeDays} />
      </section>

      <div className="flex shrink-0 items-center justify-between text-xs text-[var(--color-text-muted)]">
        <span className="font-medium">Week overview</span>
        <span className="font-mono text-[10px]">{7 - freeDays} active days</span>
      </div>

      <ScrollArea watch={rows.length}>
        <ul className="flex flex-col gap-2 py-1">
          {rows.map((r) => {
            const free = r.minutes === 0;
            const top = !free && r.n === busiest.n;
            return (
              <li
                key={r.n}
                className={`flex flex-col gap-2.5 rounded-xl px-3.5 py-3 ${free ? "border border-dashed border-[var(--color-line)]" : ""}`}
                style={{
                  background: free
                    ? "var(--color-fill-1)"
                    : `linear-gradient(120deg, ${tint(top ? 20 : 12)} 0%, ${tint(4)} 100%)`,
                }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold"
                    style={{
                      color: free ? "var(--color-text-muted)" : P,
                      backgroundColor: free ? "var(--color-fill-3)" : tint(20),
                    }}
                  >
                    {DAY_SHORT[r.n]}
                  </span>

                  <div className="min-w-0 flex-1">
                    <h4 className="truncate text-[13px] font-semibold text-[var(--color-text)]">{DAY_FULL[r.n]}</h4>
                    <p className="mt-0.5 truncate text-[11px] text-[var(--color-text-muted)]">
                      {free ? (
                        "No classes"
                      ) : (
                        <>
                          {r.classes} {r.classes === 1 ? "class" : "classes"} ·{" "}
                          <span style={{ color: P }}>{share(r.minutes)}%</span>
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
                    {free ? "Free" : formatMinutes(r.minutes)}
                  </span>
                </div>

                {!free && (
                  <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ backgroundColor: tint(14) }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(r.minutes / max) * 100}%`,
                        background: `linear-gradient(90deg, ${tint(60)}, ${P})`,
                      }}
                    />
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
