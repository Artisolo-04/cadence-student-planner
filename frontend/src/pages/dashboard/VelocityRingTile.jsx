import { useEffect, useState } from "react";
import { Gauge } from "lucide-react";

export default function VelocityRingTile({ total, done, overdue, loading }) {
  const [displayPct, setDisplayPct] = useState(0);

  const pending = Math.max(0, total - done - overdue);
  const donePct = total > 0 ? done / total : 0;
  const overduePct = total > 0 ? overdue / total : 0;
  const pendingPct = total > 0 ? pending / total : 0;
  const finalPct = total > 0 ? Math.round(donePct * 100) : 0;

  useEffect(() => {
    if (loading) return;

    const duration = 650;
    const start = performance.now();
    let frameId;
    function tick(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayPct(Math.round(finalPct * eased));
      if (t < 1) frameId = requestAnimationFrame(tick);
    }
    frameId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frameId);
  }, [finalPct, loading]);

  const stats = [
    { label: "Completed", value: done, pct: donePct, color: "var(--color-primary)" },
    { label: "Overdue", value: overdue, pct: overduePct, color: "var(--color-danger)" },
    { label: "Pending", value: pending, pct: pendingPct, color: "rgba(255,255,255,0.35)" },
  ];

  return (
    <div
      className="relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-white/10 p-4 backdrop-blur-xl gap-2"
      style={{
        backgroundImage:
          "linear-gradient(150deg, color-mix(in srgb, var(--color-primary) 16%, transparent) 0%, transparent 70%)",
      }}
    >
      <div className="flex shrink-0 items-center justify-between">
        <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--color-primary)]">
          <Gauge size={12} />
          Velocity Ring
        </div>
        <span className="text-[10px] font-mono text-[var(--color-text-muted)]">
          {total} {total === 1 ? "task" : "tasks"}
        </span>
      </div>

      <div className="flex flex-row items-baseline gap-2">
        <span className="text-5xl font-bold leading-none tabular-nums text-[var(--color-text)]">
          {displayPct}%
        </span>
        <span className="text-xs text-[var(--color-text-muted)]">
          of tasks done
        </span>
      </div>

      <div className="grid shrink-0 grid-cols-3 gap-1.5">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex flex-col gap-1 rounded-lg border-white/10 bg-white/[0.03] px-1.5 py-2"
          >
            <span className="flex items-center justify-center gap-1">
              <span
                className="h-1.5 w-1.5 shrink-0 rounded-[2px]"
                style={{ backgroundColor: stat.color }}
              />
              <span className="font-mono text-sm font-semibold text-[var(--color-text)]">
                {stat.value}
              </span>
            </span>
            <span className="text-center text-[8px] uppercase tracking-wide text-[var(--color-text-muted)]">
              {stat.label}
            </span>
            <div className="h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full transition-[width] duration-700"
                style={{
                  width: `${Math.round(stat.pct * 100)}%`,
                  backgroundColor: stat.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
