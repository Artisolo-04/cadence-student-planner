// Single source of truth for translating timetable day/slot indices into
// CSS grid track coordinates. Every component that places something on the
// grid (header, cells, drag-preview overlay, covered-row targets) must go
// through these functions instead of re-deriving the formula.

export const GRID_TIME_COLUMN = 1;
export const GRID_HEADER_ROW = 1;
export const FIRST_DAY_COLUMN = 2;
export const FIRST_SLOT_ROW = 2;

/**
 * Given a 0-based day index (position within orderedDays), returns the
 * 1-based CSS grid column for that day's g1 lane, g2 lane, and the
 * "span both" column-start used when a slot isn't split.
 */
export function dayIndexToColumns(dayIdx) {
  const g1Column = FIRST_DAY_COLUMN + dayIdx * 2;
  const g2Column = g1Column + 1;
  return { g1Column, g2Column, spanBothColumn: g1Column };
}

/**
 * Given a 0-based slot/row index (position within orderedSlots), returns
 * the 1-based CSS grid row.
 */
export function slotIndexToGridRow(rowIdx) {
  return FIRST_SLOT_ROW + rowIdx;
}

/**
 * Builds a gridColumn CSS value for a given group tag ("g1" | "g2" | "all").
 */
export function groupTagToGridColumn(dayIdx, groupTag) {
  const { g1Column, g2Column } = dayIndexToColumns(dayIdx);
  if (groupTag === "g1") return `${g1Column}`;
  if (groupTag === "g2") return `${g2Column}`;
  return `${g1Column} / span 2`;
}

/**
 * Builds a gridRow CSS value for a given slot index and span count.
 */
export function spanToGridRow(rowIdx, span) {
  return `${slotIndexToGridRow(rowIdx)} / span ${Math.max(1, span || 1)}`;
}

/**
 * Computes the floating drag-chip's rendered size and vertical offset
 * while dragging a subject across multiple slots. The chip grows to cover
 * `effectiveDragSpan` rows (based on the single-row height measured at
 * drag start) and is re-centered vertically via dragChipOffsetY so it
 * grows symmetrically around the pointer instead of only downward.
 */
export function computeDragChipDimensions({ baseChipSize, singleRowHeight, effectiveDragSpan, marginPx }) {
  if (!baseChipSize) {
    return { dragChipSize: null, dragChipOffsetY: 0 };
  }

  const grownHeight = Math.max(
    0,
    (singleRowHeight ?? baseChipSize.height) * effectiveDragSpan - marginPx * 2
  );

  const dragChipSize = {
    width: Math.max(0, baseChipSize.width - marginPx * 2),
    height: grownHeight,
  };

  const dragChipOffsetY = -((grownHeight - Math.max(0, baseChipSize.height - marginPx * 2)) / 2);

  return { dragChipSize, dragChipOffsetY };
}
