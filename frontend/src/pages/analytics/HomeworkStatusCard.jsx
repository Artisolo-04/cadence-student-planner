import { Gauge } from "lucide-react";
import AnalyticsTile from "./AnalyticsTile";
import useIsDesktop from "./useIsDesktop";

const STATUS = [
  { key: "todo", label: "To do", color: "var(--color-text-muted)" },
  { key: "inProgress", label: "In progress", color: "var(--color-warning)" },
  { key: "done", label: "Done", color: "var(--color-primary)" },
];

const PRIORITY = [
  { key: "high", label: "High", color: "var(--color-danger)" },
  { key: "normal", label: "Normal", color: "var(--color-primary)" },
  { key: "low", label: "Low", color: "var(--color-text-muted)" },
];

const tint = (color, pct) => `color-mix(in srgb, ${color} ${pct}%, transparent)`;

export default function HomeworkStatusCard({ homework }) {
  const desktop = useIsDesktop();
  const total = homework?.total ?? 0;
  const status = homework?.byStatus ?? {};
  const priority = Object.fromEntries((homework?.byPriority ?? []).map((p) => [p.priority, p.count]));
  const pct = (v) => (total > 0 ? Math.round((v / total) * 100) : 0);

  return (
    <AnalyticsTile
      icon={Gauge}
      title="Homework status"
      scroll={!desktop}
      meta={`${total} ${total === 1 ? "task" : "tasks"}`}
    >
      {total === 0 ? (
        <p className="text-xs text-[var(--color-text-muted)]">No homework yet. Add a task to see your progress here.</p>
      ) : (
        <div className="flex h-full min-h-0 flex-col justify-between">
          {/* Status: split bar + tinted tiles */}
          <div className="flex flex-col gap-2.5">
            <div className="flex h-2.5 w-full gap-[2px] overflow-hidden rounded-full">
              {STATUS.map((s) => {
                const n = status[s.key] ?? 0;
                if (n === 0) return null;
                return (
                  <div
                    key={s.key}
                    title={`${s.label}: ${n} (${pct(n)}%)`}
                    className="h-full min-w-[3px] transition-[flex-grow] duration-700"
                    style={{ flexGrow: n, flexBasis: 0, backgroundColor: s.color }}
                  />
                );
              })}
            </div>

            <div className="grid grid-cols-3 gap-2">
              {STATUS.map((s) => {
                const n = status[s.key] ?? 0;
                return (
                  <div
                    key={s.key}
                    className="flex flex-col gap-2 rounded-xl px-2.5 py-1.5"
                    style={{ backgroundColor: tint(s.color, 10) }}
                  >
                    <span className="truncate text-[10px] font-medium" style={{ color: s.color }}>
                      {s.label}
                    </span>
                    <span className="font-mono text-base font-semibold leading-none text-[var(--color-text)]">
                      {n}
                      <span className="ml-1.5 text-[10px] font-normal text-[var(--color-text-muted)]">{pct(n)}%</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Priority: label, bar, count */}
          <div className="flex flex-col gap-2">
            <p className="text-[11px] font-medium text-[var(--color-text-muted)]">By priority</p>
            <ul className="flex flex-col gap-2">
              {PRIORITY.map((p) => {
                const n = priority[p.key] ?? 0;
                return (
                  <li key={p.key} className="flex items-center gap-4 text-xs">
                    <span className="w-14 shrink-0 text-[var(--color-text)]">{p.label}</span>
                    <div className="h-1.5 min-w-8 flex-1 overflow-hidden rounded-full bg-[var(--color-fill-3)]">
                      <div
                        className="h-full rounded-full transition-[width] duration-700"
                        style={{ width: `${(n / total) * 100}%`, backgroundColor: p.color }}
                      />
                    </div>
                    <span className="w-7 shrink-0 text-right font-mono text-[var(--color-text)]">{n}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </AnalyticsTile>
  );
}
