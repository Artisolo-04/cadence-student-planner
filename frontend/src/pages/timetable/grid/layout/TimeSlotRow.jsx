import { Fragment } from "react";
import TimetableCell from "../cell/TimetableCell";
import { CoveredRowDropTarget } from "../dragdrop/CoveredRowDropTarget";
import { entryKey } from "../cell/cellDisplayUtils";

export function TimeSlotRow({
  slot,
  rowIdx,
  isLastRow,
  gridRow,
  orderedDays,
  orderedSlots,
  overlayMatrix,
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
        const cellMeta = overlayMatrix[day.day_of_week][rowIdx];

        if (cellMeta.isCoveredRow) {
          return (
            <CoveredRowDropTarget
              key={day.id}
              slotId={slot.id}
              dayOfWeek={day.day_of_week}
              isEditMode={isEditMode}
              g1Column={cellMeta.g1Column}
              gridRow={gridRow}
            />
          );
        }

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
            g1Column={cellMeta.g1Column}
            g2Column={cellMeta.g2Column}
            gridRow={gridRow}
            allSpan={cellMeta.allSpan}
            allIsLastRow={cellMeta.allIsLastRow}
            g1Span={cellMeta.g1Span}
            g1IsLastRow={cellMeta.g1IsLastRow}
            g1Hidden={cellMeta.g1Hidden}
            g2Span={cellMeta.g2Span}
            g2IsLastRow={cellMeta.g2IsLastRow}
            g2Hidden={cellMeta.g2Hidden}
          />
        );
      })}
    </Fragment>
  );
}
