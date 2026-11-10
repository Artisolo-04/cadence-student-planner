import { formatShortDate } from "./analyticsUtils";

export function localDateKey(d = new Date()) {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function parseKey(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function columnLabel(key, count) {
  const d = parseKey(key);
  if (count <= 7) return d.toLocaleDateString("en-US", { weekday: "short" });
  return String(d.getDate());
}

const TODAY_FILL =
  "linear-gradient(to top, var(--color-primary), color-mix(in srgb, var(--color-primary) 65%, white))";
const NORMAL_FILL = "color-mix(in srgb, var(--color-primary) 55%, transparent)";

export function ChartEmpty({ icon: Icon, children }) {
  return (
    <div className="flex h-full min-h-[5rem] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--color-line)] px-4 text-center">
      {Icon && (
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] text-[var(--color-primary)]">
          <Icon size={16} />
        </span>
      )}
      <p className="text-xs text-[var(--color-text-muted)]">{children}</p>
    </div>
  );
}

// items: [{ date: "2026-11-09", value: 3 }]
export default function MiniBars({ items, unit }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  const today = localDateKey();

  // 30 / 90 day ranges: thin bars, no per-bar labels
  if (items.length > 14) {
    const first = items[0];
    const last = items[items.length - 1];
    const mid = items[Math.floor(items.length / 2)];
    return (
      <div className="flex h-full min-h-[6rem] flex-col gap-2">
        <div className="flex min-h-0 flex-1 gap-px rounded-lg border border-[var(--color-line)] bg-[var(--color-fill-1)] p-1">
          {items.map((i) => {
            const isToday = i.date === today;
            return (
              <div
                key={i.date}
                title={`${formatShortDate(i.date)}: ${i.value} ${unit}`}
                className="relative h-full min-w-0 flex-1"
              >
                <div
                  className="absolute inset-x-0 bottom-0 rounded-[2px]"
                  style={{
                    height: i.value > 0 ? `${Math.max((i.value / max) * 100, 6)}%` : "2px",
                    background: i.value > 0 ? (isToday ? TODAY_FILL : NORMAL_FILL) : "var(--color-fill-3)",
                  }}
                />
              </div>
            );
          })}
        </div>
        <div className="flex shrink-0 justify-between text-[10px] leading-none text-[var(--color-text-muted)]">
          <span>{formatShortDate(first.date)}</span>
          <span>{formatShortDate(mid.date)}</span>
          <span>{formatShortDate(last.date)}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-[6rem] gap-1.5">
      {items.map((i) => {
        const isToday = i.date === today;
        const has = i.value > 0;
        return (
          <div
            key={i.date}
            title={`${formatShortDate(i.date)}: ${i.value} ${unit}`}
            className="flex min-w-0 flex-1 flex-col items-center gap-1.5"
          >
            <span
              className={`h-3 text-[10px] font-medium leading-3 tabular-nums ${
                has ? (isToday ? "text-[var(--color-primary)]" : "text-[var(--color-text)]") : "text-transparent"
              }`}
            >
              {i.value}
            </span>
            <div
              className={`relative min-h-0 w-full flex-1 overflow-hidden rounded-lg border border-[var(--color-line)] ${
                has ? "bg-[var(--color-fill-1)]" : "border-dashed bg-transparent"
              }`}
            >
              {has && (
                <div
                  className="absolute inset-x-[3px] bottom-[3px] rounded-md transition-all duration-300"
                  style={{
                    height: `calc(${Math.max((i.value / max) * 100, 8)}% - 6px)`,
                    background: isToday ? TODAY_FILL : NORMAL_FILL,
                  }}
                />
              )}
            </div>
            <span
              className={`rounded-md px-1.5 py-0.5 text-[10px] leading-none ${
                isToday
                  ? "bg-[color-mix(in_srgb,var(--color-primary)_15%,transparent)] font-semibold text-[var(--color-primary)]"
                  : "text-[var(--color-text-muted)]"
              }`}
            >
              {columnLabel(i.date, items.length)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
