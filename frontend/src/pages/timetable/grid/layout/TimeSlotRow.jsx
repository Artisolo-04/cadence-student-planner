import { Fragment } from "react";
import TimetableCell from "../cell/TimetableCell";
import { CoveredRowDropTarget } from "../dragdrop/CoveredRowDropTarget";
import { entryKey } from "./timetableGridUtils";

export function TimeSlotRow({
  slot,
  rowIdx,
  isLastRow,
  gridRow,
  orderedDays,
  orderedSlots,
  spanLayout,
  entriesByCell,
  nowDow,
  isCurrentSlot,
  isEditMode,
  resizeEntry,
  landing,
  myGroup,
  viewOptions,
  openCell,
}) {
  return (
    <Fragment>
      <div
        data-row-height-ref={rowIdx === 0 ? "true" : undefined}
        style={{ gridColumn: 1, gridRow }}
        className={`flex h-full items-center justify-center overflow-hidden border-r border-[var(--color-border)] ${
          isLastRow ? "" : "border-b"
        } px-3 bg-black/20 backdrop-blur-2xl transition-all duration-500 ease-in-out`}
      >
        <div className="flex items-center justify-center gap-2 py-1">
          {slot.label && (
            <span className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md border border-white/10 bg-white/[0.04] text-[11px] font-semibold text-[var(--color-text-muted)] shadow-[0_1px_0_0_rgba(255,255,255,0.08)_inset] backdrop-blur-md backdrop-saturate-150">
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent"
              />
              <span className="relative z-10">{slot.label}</span>
            </span>
          )}
          <div className="flex flex-col items-center gap-1 leading-none">
            <span className="text-[13px] font-semibold text-[var(--color-text)] tabular-nums">
              {slot.start_time.slice(0, 5)}
            </span>
            <span className="text-[11px] text-[var(--color-text-muted)] tabular-nums">
              {slot.end_time.slice(0, 5)}
            </span>
          </div>
        </div>
      </div>
      {orderedDays.map((day, i) => {
        const isToday = day.day_of_week === nowDow;
        const isLive = isToday && isCurrentSlot(slot);
        const isLastCol = i === orderedDays.length - 1;
        const g1Column = 2 + i * 2;
        const g2Column = 3 + i * 2;

        const dayLayout = spanLayout[day.day_of_week];
        const allInfo = dayLayout?.all[rowIdx] || null;
        const g1Info = dayLayout?.g1[rowIdx] || null;
        const g2Info = dayLayout?.g2[rowIdx] || null;

        if (allInfo?.type === "covered" || (g1Info?.type === "covered" && g2Info?.type === "covered")) {
          return (
            <CoveredRowDropTarget
              key={day.id}
              slotId={slot.id}
              dayOfWeek={day.day_of_week}
              isEditMode={isEditMode}
              g1Column={g1Column}
              gridRow={gridRow}
            />
          );
        }

        const allSpan = allInfo?.type === "start" ? allInfo.span : 1;
        const g1Span = g1Info?.type === "start" ? g1Info.span : 1;
        const g2Span = g2Info?.type === "start" ? g2Info.span : 1;
        const g1Hidden = g1Info?.type === "covered";
        const g2Hidden = g2Info?.type === "covered";

        const allIsLastRow = rowIdx + allSpan - 1 === orderedSlots.length - 1;
        const g1IsLastRow = rowIdx + g1Span - 1 === orderedSlots.length - 1;
        const g2IsLastRow = rowIdx + g2Span - 1 === orderedSlots.length - 1;

        return (
          <TimetableCell
            key={day.id}
            entriesForCell={entriesByCell[entryKey(slot.id, day.day_of_week)]}
            isToday={isToday}
            isLive={isLive}
            isLastCol={isLastCol}
            onOpen={(groupTag) => openCell(slot, day, groupTag)}
            myGroup={myGroup}
            viewOptions={viewOptions}
            slotId={slot.id}
            dayOfWeek={day.day_of_week}
            isEditMode={isEditMode}
            resizeEntry={resizeEntry}
            orderedSlots={orderedSlots}
            landing={landing}
            g1Column={g1Column}
            g2Column={g2Column}
            gridRow={gridRow}
            allSpan={allSpan}
            allIsLastRow={allIsLastRow}
            g1Span={g1Span}
            g1IsLastRow={g1IsLastRow}
            g1Hidden={g1Hidden}
            g2Span={g2Span}
            g2IsLastRow={g2IsLastRow}
            g2Hidden={g2Hidden}
          />
        );
      })}
    </Fragment>
  );
}
