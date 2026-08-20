import { Clock, Flame, Sparkles } from "lucide-react";

function formatDate() {
  return new Date().toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
  });
}

export default function TodayOverviewCard({ todayLabel, nextSession, weekTotal, busiestDay }) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-white/10 p-5 backdrop-blur-xl"
      style={{
        backgroundImage:
          "linear-gradient(150deg, color-mix(in srgb, var(--color-primary) 18%, transparent) 0%, color-mix(in srgb, var(--color-accent) 8%, transparent) 60%, transparent 100%)",
      }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full opacity-20 blur-3xl"
        style={{ backgroundColor: "var(--color-primary)" }}
      />

      <div className="relative z-10">
        <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--color-primary)]">
          <Sparkles size={12} />
          Today
        </div>
        <p className="mt-1 text-lg font-semibold text-[var(--color-text)]">{todayLabel}</p>
        <p className="text-xs text-[var(--color-text-muted)]">{formatDate()}</p>

        <div className="mt-4 flex flex-col gap-2.5 border-t border-white/10 pt-4">
          {nextSession ? (
            <div className="flex items-start gap-2.5">
              <span
                className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
                style={{ backgroundColor: `color-mix(in srgb, ${nextSession.color} 25%, transparent)` }}
              >
                <Clock size={13} style={{ color: nextSession.color }} />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-[var(--color-text)]">
                  {nextSession.subjectName}
                </p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  {nextSession.start.slice(0, 5)} start
                </p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-[var(--color-text-muted)]">No more classes today.</p>
          )}

          {weekTotal > 0 && (
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[var(--color-primary)]/15">
                <Flame size={13} className="text-[var(--color-primary)]" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-[var(--color-text)]">
                  {weekTotal} session{weekTotal === 1 ? "" : "s"} this week
                </p>
                {busiestDay && (
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Busiest: {busiestDay.label} ({busiestDay.count})
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
