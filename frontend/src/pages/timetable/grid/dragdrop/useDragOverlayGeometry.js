import { useMemo } from "react";

export function useDragOverlayGeometry({ draggingSubject, overCell, effectiveDragSpan, orderedSlots, orderedDays }) {
  return useMemo(() => {
    if (!draggingSubject || !overCell) return null;
    const rowIdx = orderedSlots.findIndex((s) => s.id === overCell.slotId);
    const dayIdx = orderedDays.findIndex((d) => d.day_of_week === overCell.dayOfWeek);
    if (rowIdx === -1 || dayIdx === -1) return null;
    const span = Math.max(1, effectiveDragSpan || 1);
    const g1Column = 2 + dayIdx * 2;
    const gridColumn =
      overCell.groupTag === "g1"
        ? `${g1Column}`
        : overCell.groupTag === "g2"
          ? `${g1Column + 1}`
          : `${g1Column} / span 2`;
    const gridRow = `${2 + rowIdx} / span ${span}`;
    return { gridColumn, gridRow };
  }, [draggingSubject, overCell, effectiveDragSpan, orderedSlots, orderedDays]);
}
