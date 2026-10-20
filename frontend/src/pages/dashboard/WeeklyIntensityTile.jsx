import { useEffect, useState } from "react";
import { BarChart3 } from "lucide-react";

function formatHours(totalMinutes) {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

const TRACK_STYLE = {
  backgroundColor: "color-mix(in srgb, var(--color-primary) 13%, transparent)",
  borderColor: "color-mix(in srgb, var(--color-primary) 22%, transparent)",
};

export default function WeeklyIntensityTile({ data }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const maxMinutes = Math.max(1, ...data.map((d) => d.minutes));
  const totalMinutes = data.reduce((sum, d) => sum + d.minutes, 0);

  return (
    <div
      className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5 backdrop-blur-xl"
      style={{
        backgroundImage:
          "linear-gradient(150deg, color-mix(in srgb, var(--color-tint) 14%, transparent) 0%, transparent 70%)",
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--color-primary)]">
          <BarChart3 size={12} />
          Weekly Intensity
        </div>
        <span className="text-[10px] font-mono text-[var(--color-text-muted)]">
          {formatHours(totalMinutes)} total
        </span>
      </div>

      <div className="mt-3 flex min-h-0 flex-1 items-stretch justify-between gap-2">
        {data.map((d) => {
          const pct = (d.minutes / maxMinutes) * 100;
          return (
            <div
              key={d.label}
              title={`${d.label}: ${formatHours(d.minutes)}`}
              className="flex min-w-0 flex-1 flex-col items-center gap-1.5"
            >
              <div
                className="relative w-full flex-1 overflow-hidden rounded-[5px] border"
                style={TRACK_STYLE}
              >
                <div
                  className="absolute inset-x-0 bottom-0 rounded-[4px] bg-[var(--color-primary)] transition-[height] duration-[550ms] ease-out"
                  style={{ height: mounted ? `${pct}%` : "0%" }}
                />
              </div>
              <span className="text-[9px] leading-none text-[var(--color-text-muted)]">
                {d.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
