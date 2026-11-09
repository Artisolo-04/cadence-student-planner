import { formatShortDate } from "./analyticsUtils";

// items: [{ date: "2026-11-09", value: 3 }]
export default function MiniBars({ items, unit }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  const gap = items.length <= 14 ? "gap-1.5" : "gap-px";
  const first = items[0];
  const last = items[items.length - 1];
  const mid = items.length > 7 ? items[Math.floor(items.length / 2)] : null;

  return (
    <div className="flex h-full min-h-[6rem] flex-col gap-2">
      <div className={`flex min-h-0 flex-1 ${gap}`}>
        {items.map((i) => (
          <div
            key={i.date}
            title={`${formatShortDate(i.date)}: ${i.value} ${unit}`}
            className="relative h-full min-w-0 flex-1"
          >
            <div
              className="absolute inset-x-0 bottom-0 rounded-t-[3px]"
              style={{
                height: i.value > 0 ? `${(i.value / max) * 100}%` : "2px",
                backgroundColor: i.value > 0 ? "var(--color-primary)" : "var(--color-fill-3)",
              }}
            />
          </div>
        ))}
      </div>
      <div className="flex shrink-0 justify-between text-[9px] leading-none text-[var(--color-text-muted)]">
        <span>{first ? formatShortDate(first.date) : ""}</span>
        {mid && <span>{formatShortDate(mid.date)}</span>}
        <span>{last ? formatShortDate(last.date) : ""}</span>
      </div>
    </div>
  );
}
