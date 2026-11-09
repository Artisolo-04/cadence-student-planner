import { useEffect, useState } from "react";
import { BarChart3 } from "lucide-react";
import AnalyticsTile from "./AnalyticsTile";
import { DAY_ORDER, DAY_SHORT, formatMinutes } from "./analyticsUtils";

const TRACK_STYLE = {
  backgroundColor: "color-mix(in srgb, var(--color-primary) 13%, transparent)",
  borderColor: "color-mix(in srgb, var(--color-primary) 22%, transparent)",
};

export default function DayTimeCard({ schedule, onExpand }) {
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

  return (
    <AnalyticsTile
      icon={BarChart3}
      title="Time by day"
      onExpand={onExpand}
      scroll={false}
      meta={schedule ? `${formatMinutes(schedule.weeklyMinutes)} per week` : null}
    >
      {!schedule ? (
        <p className="text-xs text-[var(--color-text-muted)]">No classes scheduled for this group yet.</p>
      ) : (
        <div className="flex h-full min-h-[9rem] items-stretch justify-between gap-2">
          {days.map((d) => (
            <div
              key={d.n}
              title={`${d.label}: ${formatMinutes(d.minutes)}, ${d.classes} ${d.classes === 1 ? "class" : "classes"}`}
              className="flex min-w-0 flex-1 flex-col items-center gap-1.5"
            >
              <span className="h-3 text-[9px] font-mono leading-3 text-[var(--color-text-muted)]">
                {d.minutes > 0 ? formatMinutes(d.minutes) : ""}
              </span>
              <div className="relative w-full flex-1 overflow-hidden rounded-[5px] border" style={TRACK_STYLE}>
                <div
                  className="absolute inset-x-0 bottom-0 rounded-[4px] bg-[var(--color-primary)] transition-[height] duration-[550ms] ease-out"
                  style={{ height: mounted ? `${(d.minutes / max) * 100}%` : "0%" }}
                />
              </div>
              <span className="text-[9px] leading-none text-[var(--color-text-muted)]">{d.label}</span>
            </div>
          ))}
        </div>
      )}
    </AnalyticsTile>
  );
}
