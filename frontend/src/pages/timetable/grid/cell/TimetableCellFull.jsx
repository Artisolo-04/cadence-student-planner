import { useDndContext } from "@dnd-kit/core";
import { DropZone } from "../dragdrop/DropZone";
import { DragIntentTargets } from "../dragdrop/DragIntentTargets";
import { pulseFor } from "./cellViewHelpers";
import SubjectLabel from "../subjects/SubjectLabel";

export function TimetableCellFull({
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
  gridRow,
  rowSpan,
  isLastRowForBlock,
  orderedSlots,
  resizeEntry,
}) {
  const { showTeacher = false, showRoom = false } = viewOptions || {};
  const isEmpty =
    display.mode === "empty" ||
    (display.mode === "filtered" && !display.entry);

  const cellKey = `${slotId}-${dayOfWeek}`;
  const { active: activeDrag } = useDndContext();
  const isDragging = Boolean(activeDrag);

  return (
    <div
      data-cell-key={cellKey}
      data-cell-full-key={cellKey}
      style={{ gridColumn: `${g1Column} / span 2`, gridRow: `${gridRow} / span ${rowSpan}` }}
      className={`group relative overflow-hidden border-[var(--color-border)] ${
        isLastCol ? "" : "border-r"
      } ${isLastRowForBlock ? "" : "border-b"} p-0 text-center align-middle transition-[background-color,border-color,box-shadow] duration-200 ease-out ${
        isToday && isEmpty ? "bg-[var(--color-accent)]/[0.05]" : ""
      }`}
    >
      {isLive && (
        <span className="pointer-events-none absolute inset-1 z-10 rounded-lg ring-1 ring-[var(--color-accent)]/50 shadow-[0_0_0_3px_rgba(var(--color-accent-rgb),0.08)]" />
      )}

      <DropZone
        id={`cell::${cellKey}::${display.groupTag || "all"}::self`}
        disabled={!isEditMode || isDragging}
        isFilled={!isEmpty}
        className={`flex h-full min-h-[56px] items-center justify-center ${
          isEditMode ? "cursor-pointer" : ""
        } ${isEditMode && isEmpty ? "hover:bg-[var(--color-surface-alt)]" : ""}`}
        onClick={isEditMode ? () => onOpen(display.groupTag || "all") : undefined}
      >
        {display.mode === "full" || display.mode === "filtered" ? (
          display.entry ? (
            <SubjectLabel
              entry={display.entry}
              groupTag={display.mode === "filtered" ? display.groupTag : null}
              showTeacher={showTeacher}
              showRoom={showRoom}
              pulseColor={pulseFor(landing, cellKey, display.groupTag || "all")}
              slotId={slotId}
              dayOfWeek={dayOfWeek}
              dragGroupTag={display.mode === "filtered" ? display.groupTag : "all"}
              isEditMode={isEditMode}
              orderedSlots={orderedSlots}
              resizeEntry={resizeEntry}
            />
          ) : (
            <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]/40">
              {display.groupTag?.toUpperCase()}
            </span>
          )
        ) : (
          <span className="h-1 w-1 rounded-full bg-[var(--color-text-muted)]/30 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
        )}
      </DropZone>

      {isEditMode && isDragging && (
        <DragIntentTargets cellKey={cellKey} />
      )}
    </div>
  );
}
