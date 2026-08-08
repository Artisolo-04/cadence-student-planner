import { useEffect, useMemo, useState } from "react";
import { sortDaysByWeekOrder } from "../../../lib/days";

const WEEKDAY_FULL = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];

function toMinutes(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export default function TimetableGrid({ workspace }) {
  const { days, slots } = workspace;

  const orderedDays = sortDaysByWeekOrder(days);
  const orderedSlots = useMemo(
    () => [...slots].sort((a, b) => a.sort_order - b.sort_order),
    [slots]
  );

  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const nowDow = now.getDay();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const isCurrentSlot = (slot) =>
    nowMinutes >= toMinutes(slot.start_time) && nowMinutes < toMinutes(slot.end_time);

  return (
    <div className="w-full overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_1px_0_0_rgba(255,255,255,0.02)_inset,0_20px_40px_-24px_rgba(0,0,0,0.6)]">
      <table className="w-full table-fixed border-collapse text-sm">
        <colgroup>
          <col style={{ width: "16%" }} />
          {orderedDays.map((day) => (
            <col key={day.id} style={{ width: `${84 / orderedDays.length}%` }} />
          ))}
        </colgroup>
        <thead>
          <tr>
            <th className="border-b border-r border-[var(--color-border)] bg-[var(--color-surface-alt)] px-2 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
              Time
            </th>
            {orderedDays.map((day, i) => {
              const isToday = day.day_of_week === nowDow;
              const isLastCol = i === orderedDays.length - 1;
              return (
                <th
                  key={day.id}
                  className={`relative border-b border-[var(--color-border)] ${
                    isLastCol ? "" : "border-r"
                  } bg-[var(--color-surface-alt)] px-2 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors ${
                    isToday ? "text-[var(--color-accent)]" : "text-[var(--color-text-muted)]"
                  }`}
                >
                  {WEEKDAY_FULL[day.day_of_week]}
                  {isToday && (
                    <span className="absolute bottom-0 left-4 right-4 h-[2px] rounded-full bg-[var(--color-accent)]" />
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {orderedSlots.map((slot, rowIdx) => {
            const isLastRow = rowIdx === orderedSlots.length - 1;
            return (
              <tr key={slot.id} className="group/row">
                <td
                  className={`border-r border-[var(--color-border)] ${
                    isLastRow ? "" : "border-b"
                  } bg-[var(--color-surface)] px-8`}
                >
                  <div className="flex items-center gap-2">
                    {slot.label && (
                      <span className="shrink-0 rounded-lg bg-[var(--color-surface-alt)] p-1.5 text-[10px] font-medium leading-none text-[var(--color-text-muted)]">
                        {slot.label}
                      </span>
                    )}
                    <span className="h-0 flex-1 border-t border-dashed border-[var(--color-border)]" />
                    <span className="flex shrink-0 items-center gap-1.5 text-[12px] font-semibold leading-none text-[var(--color-text)] tabular-nums">
                      {slot.start_time.slice(0, 5)}
                      <span className="h-0 w-6 border-t border-dashed border-[var(--color-border)]" />
                      {slot.end_time.slice(0, 5)}
                    </span>
                  </div>
                </td>
                {orderedDays.map((day, i) => {
                  const isToday = day.day_of_week === nowDow;
                  const isLive = isToday && isCurrentSlot(slot);
                  const isLastCol = i === orderedDays.length - 1;
                  return (
                    <td
                      key={day.id}
                      className={`relative border-[var(--color-border)] ${
                        isLastCol ? "" : "border-r"
                      } ${isLastRow ? "" : "border-b"} px-2 py-4 text-center align-middle transition-all duration-200 ease-out ${
                        isToday ? "bg-[var(--color-accent)]/[0.05]" : ""
                      } hover:bg-[var(--color-surface-alt)]`}
                    >
                      {isLive && (
                        <span className="absolute inset-1 rounded-lg ring-1 ring-[var(--color-accent)]/50 shadow-[0_0_0_3px_rgba(var(--color-accent-rgb),0.08)] pointer-events-none" />
                      )}
                      <div className="relative flex h-full min-h-[24px] items-center justify-center">
                        {isLive && (
                          <span className="absolute -left-1 top-0 flex h-2 w-2">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-accent)] opacity-75" />
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--color-accent)]" />
                          </span>
                        )}
                        <span className="h-1 w-1 rounded-full bg-[var(--color-text-muted)]/30 opacity-0 transition-opacity duration-200 group-hover/row:opacity-100" />
                      </div>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
