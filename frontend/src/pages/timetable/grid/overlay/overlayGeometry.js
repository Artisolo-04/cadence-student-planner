export const GRID_TIME_COLUMN = 1;
export const GRID_HEADER_ROW = 1;
export const FIRST_DAY_COLUMN = 2;
export const FIRST_SLOT_ROW = 2;

export function dayIndexToColumns(dayIdx) {
  const g1Column = FIRST_DAY_COLUMN + dayIdx * 2;
  const g2Column = g1Column + 1;
  return { g1Column, g2Column, spanBothColumn: g1Column };
}

export function slotIndexToGridRow(rowIdx) {
  return FIRST_SLOT_ROW + rowIdx;
}

export function groupTagToGridColumn(dayIdx, groupTag) {
  const { g1Column, g2Column } = dayIndexToColumns(dayIdx);
  if (groupTag === "g1") return `${g1Column}`;
  if (groupTag === "g2") return `${g2Column}`;
  return `${g1Column} / span 2`;
}

export function spanToGridRow(rowIdx, span) {
  return `${slotIndexToGridRow(rowIdx)} / span ${Math.max(1, span || 1)}`;
}

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
