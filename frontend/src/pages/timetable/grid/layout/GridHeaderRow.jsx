import { WEEKDAY_FULL } from "./weekdayConstants";
import { dayIndexToColumns } from "../overlay/overlayGeometry";

export function GridHeaderRow({ orderedDays, nowDow }) {
  return (
    <>
      <div
        className="border-b border-r border-[var(--color-border)] bg-black/20 backdrop-blur-2xl px-2 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]"
        style={{ gridColumn: 1, gridRow: 1 }}
      >
        Time
      </div>
      {orderedDays.map((day, i) => {
        const isToday = day.day_of_week === nowDow;
        const isLastCol = i === orderedDays.length - 1;
        const { g1Column } = dayIndexToColumns(i);
        return (
          <div
            key={day.id}
            style={{ gridColumn: `${g1Column} / span 2`, gridRow: 1 }}
            className={`relative border-b border-[var(--color-border)] ${
              isLastCol ? "" : "border-r"
            } bg-black/20 backdrop-blur-2xl px-2 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors ${
              isToday ? "text-[var(--color-accent)]" : "text-[var(--color-text-muted)]"
            }`}
          >
            {WEEKDAY_FULL[day.day_of_week]}
            {isToday && (
              <span className="absolute bottom-0 left-4 right-4 h-[2px] rounded-full bg-[var(--color-accent)]" />
            )}
          </div>
        );
      })}
    </>
  );
}
