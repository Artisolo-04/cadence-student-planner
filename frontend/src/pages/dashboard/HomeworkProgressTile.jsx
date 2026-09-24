import { CheckCircle2 } from "lucide-react";

export default function HomeworkProgressTile({ total, done, loading }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div
      className="relative flex h-full flex-col justify-center overflow-hidden rounded-2xl border border-white/10 p-5 backdrop-blur-xl"
      style={{
        backgroundImage:
          "linear-gradient(150deg, color-mix(in srgb, var(--color-primary) 14%, transparent) 0%, transparent 70%)",
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--color-primary)]">
          <CheckCircle2 size={12} />
          Homework Progress
        </div>
        {!loading && (
          <span className="font-mono text-xs text-[var(--color-text-muted)]">
            {done}/{total}
          </span>
        )}
      </div>

      <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{ width: `${loading ? 0 : pct}%`, backgroundColor: "var(--color-primary)" }}
        />
      </div>

      <p className="mt-2 text-xs text-[var(--color-text-muted)]">
        {loading
          ? "Loading…"
          : total === 0
          ? "No homework tracked yet."
          : `${pct}% complete across all subjects`}
      </p>
    </div>
  );
}
