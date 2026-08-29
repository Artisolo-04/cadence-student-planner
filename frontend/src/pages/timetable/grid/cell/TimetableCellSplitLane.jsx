import { Fragment } from "react";
import { useDndContext } from "@dnd-kit/core";
import { DropZone } from "../dragdrop/DropZone";
import { DragIntentTargets } from "../dragdrop/DragIntentTargets";
import { pulseFor } from "./cellViewHelpers";
import SubjectLabel from "../subjects/SubjectLabel";

export function TimetableCellSplitLane({
  display,
  isToday,
  isLive,
  isLastCol,
  onOpen,
  viewOptions,
  slotId,
  dayOfWeek,
  isEditMode,
  landing,
  g1Column,
  g2Column,
  gridRow,
  g1Span,
  g2Span,
  g1IsLastRow,
  g2IsLastRow,
  g1Hidden,
  g2Hidden,
  orderedSlots,
  resizeEntry,
}) {
  const { showTeacher = false, showRoom = false } = viewOptions || {};
  const cellKey = `${slotId}-${dayOfWeek}`;
  const { active: activeDrag } = useDndContext();
  const isDragging = Boolean(activeDrag);

  const laneBaseClass = `overflow-hidden border-[var(--color-border)] p-0 text-center align-middle transition-[background-color,border-color,box-shadow] duration-200 ease-out`;

  const g1Entry = display.g1Entry || null;
  const g2Entry = display.g2Entry || null;
  const overlaySpan = Math.max(g1Hidden ? 0 : g1Span, g2Hidden ? 0 : g2Span, 1);

  return (
    <Fragment>
        <div
          data-cell-key={`${cellKey}-g1`}
          style={{ gridColumn: g1Column, gridRow: `${gridRow} / span ${g1Span}` }}
          className={g1Hidden ? "relative pointer-events-none" : `${laneBaseClass} border-r ${g1IsLastRow ? "" : "border-b"}`}
        >
          <DropZone
            id={`cell::${cellKey}::g1::self`}
            disabled={!isEditMode || isDragging}
            isFilled={Boolean(g1Entry)}
            className={`group/half flex h-full min-h-[56px] items-center justify-center ${
              isEditMode && !g1Hidden ? "cursor-pointer" : ""
            }`}
            onClick={isEditMode && !g1Hidden ? () => onOpen("g1") : undefined}
          >
            {!g1Hidden && (g1Entry ? (
              <SubjectLabel
                entry={g1Entry}
                showTeacher={showTeacher}
                showRoom={showRoom}
                pulseColor={pulseFor(landing, cellKey, "g1")}
                slotId={slotId}
                dayOfWeek={dayOfWeek}
                dragGroupTag="g1"
                isEditMode={isEditMode}
                orderedSlots={orderedSlots}
                resizeEntry={resizeEntry}
              />
            ) : (
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]/40 opacity-0 transition-opacity duration-200 group-hover/half:opacity-100">
                G1
              </span>
            ))}
          </DropZone>
        </div>

        <div
          data-cell-key={`${cellKey}-g2`}
          style={{ gridColumn: g2Column, gridRow: `${gridRow} / span ${g2Span}` }}
          className={g2Hidden ? "relative pointer-events-none" : `${laneBaseClass} ${isLastCol ? "" : "border-r"} ${g2IsLastRow ? "" : "border-b"}`}
        >
          <DropZone
            id={`cell::${cellKey}::g2::self`}
            disabled={!isEditMode || isDragging}
            isFilled={Boolean(g2Entry)}
            className={`group/half flex h-full min-h-[56px] items-center justify-center ${
              isEditMode && !g2Hidden ? "cursor-pointer" : ""
            }`}
            onClick={isEditMode && !g2Hidden ? () => onOpen("g2") : undefined}
          >
            {!g2Hidden && (g2Entry ? (
              <SubjectLabel
                entry={g2Entry}
                showTeacher={showTeacher}
                showRoom={showRoom}
                pulseColor={pulseFor(landing, cellKey, "g2")}
                slotId={slotId}
                dayOfWeek={dayOfWeek}
                dragGroupTag="g2"
                isEditMode={isEditMode}
                orderedSlots={orderedSlots}
                resizeEntry={resizeEntry}
              />
            ) : (
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]/40 opacity-0 transition-opacity duration-200 group-hover/half:opacity-100">
                G2
              </span>
            ))}
          </DropZone>
        </div>

      <div
        data-cell-full-key={cellKey}
        style={{ gridColumn: `${g1Column} / span 2`, gridRow: `${gridRow} / span ${overlaySpan}` }}
        className="relative pointer-events-none"
      >
        {isLive && (
          <span className="pointer-events-none absolute inset-1 z-10 rounded-lg ring-1 ring-[var(--color-accent)]/50 shadow-[0_0_0_3px_rgba(var(--color-accent-rgb),0.08)]" />
        )}
        {isEditMode && isDragging && (
          <DragIntentTargets cellKey={cellKey} />
        )}
      </div>
    </Fragment>
  );
}
