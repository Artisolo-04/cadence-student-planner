import { CalendarRange } from "lucide-react";

export default function WeekLoadTile({ total, busiestDay }) {
  return (
    <div
      className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 p-4 backdrop-blur-xl"
      style={{
        backgroundImage:
          "linear-gradient(150deg, color-mix(in srgb, var(--color-primary) 16%, transparent) 0%, transparent 70%)",
      }}
    >
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--color-primary)]">
        <CalendarRange size={12} />
        This Week
      </div>
      <p className="mt-2 text-3xl font-bold leading-none text-[var(--color-text)]">
        {total}
        <span className="ml-1 text-xs font-medium text-[var(--color-text-muted)]">sessions</span>
      </p>
      <p className="mt-auto pt-3 text-xs text-[var(--color-text-muted)]">
        {busiestDay ? (
          <>
            Busiest:{" "}
            <span className="font-medium text-[var(--color-text)]">
              {busiestDay.label}
            </span>{" "}
            ({busiestDay.count})
          </>
        ) : (
          "No sessions scheduled"
        )}
      </p>
    </div>
  );
}
