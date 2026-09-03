import { useRef, useState } from "react";
import { DAY_LABELS, DAY_LABELS_FULL, hoursToLabel } from "./chartTokens";

const VB_W = 700;
const VB_H = 248;
const BASELINE = 178;
const TOP_PAD = 28;
const GRID_STEPS = 4; 

export default function DailyLoadChart({ dailyLoad, viewMode = "all" }) {
  const containerRef = useRef(null);
  const [hoverIndex, setHoverIndex] = useState(null);

  const maxHours = Math.max(1, ...dailyLoad.map((d) => d.hours));
  const maxBarHeight = BASELINE - TOP_PAD;

  const gridLines = Array.from({ length: GRID_STEPS }, (_, i) => {
    const fraction = i / (GRID_STEPS - 1);
    return {
      y: BASELINE - fraction * maxBarHeight,
      value: fraction * maxHours,
      isBaseline: i === 0,
    };
  });

  const hoverDay = hoverIndex != null ? dailyLoad[hoverIndex] : null;

  function statusText(day) {
    if (day.hours === 0) return "No classes scheduled";
    if (day.hasParallelTracks) {
      return viewMode === "all"
        ? "Parallel tracks — two classes overlap this day"
        : "Schedule conflict — overlapping classes for this group";
    }
    if (day.gapEfficiencyPercent != null) {
      return `${day.gapEfficiencyPercent}% of the day packed with class time`;
    }
    return null;
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-2 flex shrink-0 items-baseline justify-between">
        <h3 className="text-[15px] font-medium text-[var(--color-text)]">Your Weekly Study Distribution</h3>
        <span className="text-xs text-[var(--color-text-muted)]">Hours per day</span>
      </div>

      <div ref={containerRef} className="relative min-h-[240px] flex-1 lg:min-h-0">
        <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="h-full w-full" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="dlcNormal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-success)" />
              <stop offset="100%" stopColor="var(--color-success-strong)" />
            </linearGradient>
            <linearGradient id="dlcWarn" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fcd34d" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>
          </defs>

          {gridLines.map((line) => (
            <g key={line.y}>
              <line
                x1={44} x2={VB_W - 6} y1={line.y} y2={line.y}
                stroke="var(--color-border)"
                strokeWidth={1}
                strokeOpacity={line.isBaseline ? 0.9 : 0.45}
              />
              <text x={36} y={line.y + 3.5} textAnchor="end"
                className="fill-[var(--color-text-muted)]" style={{ fontSize: 10 }}>
                {hoursToLabel(line.value)}
              </text>
            </g>
          ))}

          {dailyLoad.map((day, i) => {
            const slotX = 44 + i * ((VB_W - 44) / 7);
            const slotWidth = (VB_W - 44) / 7;
            const cx = slotX + slotWidth / 2;
            const barW = 36;
            const barX = slotX + (slotWidth - barW) / 2;
            const barH = day.hours > 0 ? Math.max(6, (day.hours / maxHours) * maxBarHeight) : 3;
            const isWarn = day.hasParallelTracks;
            const isHovered = hoverIndex === i;
            const clickable = day.hours > 0;

            return (
              <g
                key={day.day}
                onMouseEnter={() => clickable && setHoverIndex(i)}
                onMouseLeave={() => setHoverIndex((h) => (h === i ? null : h))}
              >
                <rect x={slotX} y={0} width={slotWidth} height={VB_H} fill="transparent" />

                <rect
                  x={barX}
                  y={BASELINE - barH}
                  width={barW}
                  height={barH}
                  rx={9}
                  fill={isWarn ? "url(#dlcWarn)" : "url(#dlcNormal)"}
                  opacity={day.hours > 0 ? (isHovered ? 1 : 0.92) : 0.2}
                  style={{ transition: "opacity 150ms ease" }}
                />

                {day.hours > 0 && (
                  <text x={cx} y={BASELINE - barH - 10} textAnchor="middle"
                    className="fill-[var(--color-text)]" style={{ fontSize: 13, fontWeight: 600 }}>
                    {hoursToLabel(day.hours)}
                  </text>
                )}

                <text x={cx} y={BASELINE + 22} textAnchor="middle"
                  className={isHovered ? "fill-[var(--color-text)]" : "fill-[var(--color-text-muted)]"}
                  style={{ fontSize: 12, fontWeight: 600 }}>
                  {DAY_LABELS[day.day]}
                </text>

                {isWarn ? (
                  <text x={cx} y={BASELINE + 38} textAnchor="middle"
                    className="fill-[#fbbf24]" style={{ fontSize: 10, fontWeight: 600 }}>
                    Parallel tracks
                  </text>
                ) : day.gapEfficiencyPercent != null ? (
                  <text x={cx} y={BASELINE + 38} textAnchor="middle"
                    className="fill-[var(--color-text-muted)]" style={{ fontSize: 10 }}>
                    {day.gapEfficiencyPercent}% packed
                  </text>
                ) : null}
              </g>
            );
          })}
        </svg>

        {hoverDay && (
          <div
            className="pointer-events-none absolute z-10 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs shadow-xl"
            style={{
              left: `${(44 / VB_W + ((hoverIndex + 0.5) * ((VB_W - 44) / 7)) / VB_W) * 100}%`,
              top: `${(Math.max(
                8,
                BASELINE -
                  (hoverDay.hours > 0 ? Math.max(6, (hoverDay.hours / maxHours) * maxBarHeight) : 3) -
                  34
              ) / VB_H) * 100}%`,
              minWidth: 180,
              transform: "translate(-50%, -100%)",
              transition: "left 200ms cubic-bezier(.4,0,.2,1), top 200ms cubic-bezier(.4,0,.2,1)",
            }}
          >
            <p className="font-semibold text-[var(--color-text)]">
              {DAY_LABELS_FULL[hoverDay.day]} · {hoursToLabel(hoverDay.hours)}
            </p>
            {statusText(hoverDay) && (
              <p className={`mt-1 max-w-[220px] ${hoverDay.hasParallelTracks ? "text-[#fbbf24]" : "text-[var(--color-text-muted)]"}`}>
                {statusText(hoverDay)}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
