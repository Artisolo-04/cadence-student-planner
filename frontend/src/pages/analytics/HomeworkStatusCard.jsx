import { Gauge } from "lucide-react";
import AnalyticsTile from "./AnalyticsTile";

const STATUS = [
  { key: "todo", label: "To do", color: "var(--color-text-muted)" },
  { key: "inProgress", label: "In progress", color: "var(--color-warning)" },
  { key: "done", label: "Done", color: "var(--color-primary)" },
];

const PRIORITY = [
  { key: "high", label: "High", color: "var(--color-danger)" },
  { key: "normal", label: "Normal", color: "var(--color-tint)" },
  { key: "low", label: "Low", color: "var(--color-text-muted)" },
];

export default function HomeworkStatusCard({ homework }) {
  const total = homework?.total ?? 0;
  const status = homework?.byStatus ?? {};
  const priority = Object.fromEntries((homework?.byPriority ?? []).map((p) => [p.priority, p.count]));
  const pct = (v) => (total > 0 ? Math.round((v / total) * 100) : 0);

  return (
    <AnalyticsTile icon={Gauge} title="Homework status" meta={`${total} ${total === 1 ? "task" : "tasks"}`}>
      {total === 0 ? (
        <p className="text-xs text-[var(--color-text-muted)]">No homework yet. Add a task to see your progress here.</p>
      ) : (
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-3">
            <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-[var(--color-fill-3)]">
              {STATUS.map((s) => (
                <div
                  key={s.key}
                  className="h-full transition-[width] duration-700"
                  style={{ width: `${((status[s.key] ?? 0) / total) * 100}%`, backgroundColor: s.color }}
                />
              ))}
            </div>
            <ul className="flex flex-col gap-2">
              {STATUS.map((s) => {
                const n = status[s.key] ?? 0;
                return (
                  <li key={s.key} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-[var(--color-text)]">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                      {s.label}
                    </span>
                    <span className="font-mono">
                      <span className="text-[var(--color-text)]">{n}</span>{" "}
                      <span className="text-[var(--color-text-muted)]">{pct(n)}%</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-[11px] font-medium text-[var(--color-text-muted)]">By priority</p>
            {PRIORITY.map((p) => {
              const n = priority[p.key] ?? 0;
              return (
                <div key={p.key} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[var(--color-text)]">{p.label}</span>
                    <span className="font-mono text-[var(--color-text-muted)]">{n}</span>
                  </div>
                  <div className="h-1 w-full overflow-hidden rounded-full bg-[var(--color-fill-3)]">
                    <div
                      className="h-full rounded-full transition-[width] duration-700"
                      style={{ width: `${(n / total) * 100}%`, backgroundColor: p.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </AnalyticsTile>
  );
}
