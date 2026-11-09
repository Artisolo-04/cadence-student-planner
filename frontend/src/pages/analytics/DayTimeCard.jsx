import { useEffect, useState } from "react";
import { BarChart3 } from "lucide-react";
import AnalyticsTile from "./AnalyticsTile";
import useIsDesktop from "./useIsDesktop";
import { DAY_ORDER, DAY_SHORT, formatMinutes } from "./analyticsUtils";

const P = "var(--color-primary)";
const tint = (pct) => `color-mix(in srgb, ${P} ${pct}%, transparent)`;

export default function DayTimeCard({ schedule, onExpand }) {
  const desktop = useIsDesktop();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const byDay = new Map((schedule?.byDay ?? []).map((d) => [Number(d.dayOfWeek) % 7, d]));
  const days = DAY_ORDER.map((n) => ({
    n,
    label: DAY_SHORT[n],
    minutes: byDay.get(n)?.scheduledMinutes ?? 0,
    classes: byDay.get(n)?.classCount ?? 0,
  }));
  const max = Math.max(1, ...days.map((d) => d.minutes));
  const busiest = days.reduce((a, b) => (b.minutes > a.minutes ? b : a), days[0]);
  const todayN = new Date().getDay();

  return (
    <AnalyticsTile
      icon={BarChart3}
      title="Time by day"
      onExpand={desktop ? onExpand : undefined}
      scroll={false}
      meta={schedule ? `${formatMinutes(schedule.weeklyMinutes)} per week` : null}
    >
      {!schedule ? (
        <p className="text-xs text-[var(--color-text-muted)]">No classes scheduled for this group yet.</p>
      ) : (
        <div className="flex h-full min-h-[9rem] items-stretch justify-between gap-2">
          {days.map((d) => {
            const free = d.minutes === 0;
            const top = !free && d.n === busiest.n;
            const isToday = d.n === todayN;
            return (
              <div
                key={d.n}
                title={`${d.label}: ${free ? "free" : formatMinutes(d.minutes)}, ${d.classes} ${d.classes === 1 ? "class" : "classes"}`}
                className="flex min-w-0 flex-1 flex-col items-center gap-1.5"
              >
                <span
                  className={`h-4 whitespace-nowrap font-mono text-[9px] leading-4 sm:text-[11px] ${
                    top ? "font-bold text-[var(--color-primary)]" : "text-[var(--color-text-muted)]"
                  }`}
                >
                  {free ? "Free" : formatMinutes(d.minutes)}
                </span>

                <div
                  className={`relative w-full flex-1 overflow-hidden rounded-lg border ${free ? "border-dashed" : ""}`}
                  style={{ backgroundColor: tint(free ? 4 : 10), borderColor: tint(free ? 18 : 20) }}
                >
                  {!free && (
                    <div
                      className="absolute inset-x-0 bottom-0 rounded-md transition-[height] duration-[550ms] ease-out"
                      style={{
                        height: mounted ? `${Math.max(6, (d.minutes / max) * 100)}%` : "0%",
                        background: top
                          ? `linear-gradient(to top, ${P}, color-mix(in srgb, ${P} 70%, white))`
                          : `linear-gradient(to top, ${tint(70)}, ${tint(45)})`,
                      }}
                    />
                  )}
                </div>

                <span
                  className={`rounded-md px-1.5 py-0.5 text-[10px] leading-none ${
                    isToday ? "font-semibold text-[var(--color-primary)]" : "text-[var(--color-text-muted)]"
                  }`}
                  style={isToday ? { backgroundColor: tint(18) } : undefined}
                >
                  {d.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </AnalyticsTile>
  );
}
