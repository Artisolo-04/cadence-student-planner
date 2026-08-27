import { dayIndexToColumns } from "./overlayGeometry";

// Builds a deterministic [dayOfWeek][rowIdx] -> cell metadata matrix.
// This is the single place that turns spanLayout (from buildSpanLayout)
// into everything a grid cell needs to render: which grid columns it
// occupies, whether it's a "covered" row (part of a spanning entry above
// it and should render a drop-target instead of a real cell), and the
// per-lane span/hidden/last-row flags for split g1/g2 rendering.
//
// TimeSlotRow (and any other consumer) should only ever read from this
// matrix — it must never recompute this metadata itself.
export function buildOverlayMatrix({ orderedDays, orderedSlots, spanLayout }) {
  const matrix = {};

  orderedDays.forEach((day, dayIdx) => {
    const { g1Column, g2Column } = dayIndexToColumns(dayIdx);
    const dayLayout = spanLayout[day.day_of_week];
    const rows = new Array(orderedSlots.length);

    for (let rowIdx = 0; rowIdx < orderedSlots.length; rowIdx++) {
      const allInfo = dayLayout?.all[rowIdx] || null;
      const g1Info = dayLayout?.g1[rowIdx] || null;
      const g2Info = dayLayout?.g2[rowIdx] || null;

      const isCoveredRow =
        allInfo?.type === "covered" || (g1Info?.type === "covered" && g2Info?.type === "covered");

      if (isCoveredRow) {
        rows[rowIdx] = { g1Column, g2Column, isCoveredRow: true };
        continue;
      }

      const allSpan = allInfo?.type === "start" ? allInfo.span : 1;
      const g1Span = g1Info?.type === "start" ? g1Info.span : 1;
      const g2Span = g2Info?.type === "start" ? g2Info.span : 1;
      const g1Hidden = g1Info?.type === "covered";
      const g2Hidden = g2Info?.type === "covered";

      const lastRowIdx = orderedSlots.length - 1;
      const allIsLastRow = rowIdx + allSpan - 1 === lastRowIdx;
      const g1IsLastRow = rowIdx + g1Span - 1 === lastRowIdx;
      const g2IsLastRow = rowIdx + g2Span - 1 === lastRowIdx;

      rows[rowIdx] = {
        g1Column,
        g2Column,
        isCoveredRow: false,
        allSpan,
        allIsLastRow,
        g1Span,
        g1IsLastRow,
        g1Hidden,
        g2Span,
        g2IsLastRow,
        g2Hidden,
      };
    }

    matrix[day.day_of_week] = rows;
  });

  return matrix;
}
