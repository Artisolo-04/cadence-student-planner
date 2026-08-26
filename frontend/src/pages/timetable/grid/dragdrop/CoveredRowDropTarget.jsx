import { useDndContext } from "@dnd-kit/core";
import { DragIntentTargets } from "./DragIntentTargets";

export function CoveredRowDropTarget({ slotId, dayOfWeek, isEditMode, g1Column, gridRow }) {
  const { active: activeDrag } = useDndContext();
  const isDragging = Boolean(activeDrag);
  if (!isEditMode || !isDragging) return null;

  const cellKey = `${slotId}-${dayOfWeek}`;
  return (
    <div
      style={{ gridColumn: `${g1Column} / span 2`, gridRow: `${gridRow} / span 1` }}
      className="relative"
    >
      <DragIntentTargets cellKey={cellKey} />
    </div>
  );
}
