import { WEEKDAY_FULL } from "./weekdayConstants";
import { dayShortLabel } from "../../../../lib/days";
import { dayIndexToColumns } from "../overlay/overlayGeometry";

export function GridHeaderRow({ orderedDays, nowDow, headerCellRef }) {
  return (
    <>
      <div
        className="sticky top-0 left-0 z-40 border-b border-r border-[var(--color-border)] bg-[var(--color-surface)] px-base py-comfy text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]"
        ref={headerCellRef}
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
            className={`sticky top-0 z-30 relative border-b border-[var(--color-border)] ${
              isLastCol ? "" : "border-r"
            } bg-[var(--color-surface)] px-base py-comfy text-center text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors ${
              isToday ? "text-[var(--color-accent)]" : "text-[var(--color-text-muted)]"
            }`}
          >
            <span className="hidden sm:inline">{WEEKDAY_FULL[day.day_of_week]}</span>
              <span className="sm:hidden">{dayShortLabel(day.day_of_week)}</span>
            {isToday && (
              <span className="absolute bottom-0 left-4 right-4 h-[2px] rounded-full bg-[var(--color-accent)]" />
            )}
          </div>
        );
      })}
    </>
  );
}
