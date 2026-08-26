import { memo } from "react";
import { getDisplayForView } from "./cellViewHelpers";
import { TimetableCellFull } from "./TimetableCellFull";
import { TimetableCellSplitLane } from "./TimetableCellSplitLane";

function TimetableCell({
  entriesForCell,
  isToday,
  isLive,
  isLastCol,
  onOpen,
  myGroup,
  viewOptions,
  slotId,
  dayOfWeek,
  isEditMode,
  landing,
  g1Column,
  g2Column,
  gridRow,
  allSpan,
  allIsLastRow,
  g1Span,
  g1IsLastRow,
  g1Hidden,
  g2Span,
  g2IsLastRow,
  g2Hidden,
  orderedSlots,
  resizeEntry,
}) {
  const { groupVisibility = "both" } = viewOptions || {};

  const display = getDisplayForView(
    entriesForCell,
    isEditMode ? "both" : groupVisibility,
    myGroup
  );

  const forceSplit = display.mode === "split" || ((g1Hidden || g2Hidden) && display.mode === "empty");

  if (forceSplit) {
    return (
      <TimetableCellSplitLane
        display={display}
        isToday={isToday}
        isLive={isLive}
        isLastCol={isLastCol}
        onOpen={onOpen}
        viewOptions={viewOptions}
        slotId={slotId}
        dayOfWeek={dayOfWeek}
        isEditMode={isEditMode}
        landing={landing}
        g1Column={g1Column}
        g2Column={g2Column}
        gridRow={gridRow}
        g1Span={g1Span}
        g2Span={g2Span}
        g1IsLastRow={g1IsLastRow}
        g2IsLastRow={g2IsLastRow}
        g1Hidden={g1Hidden}
        g2Hidden={g2Hidden}
        orderedSlots={orderedSlots}
        resizeEntry={resizeEntry}
      />
    );
  }

  const isFilteredG1 = display.mode === "filtered" && display.groupTag === "g1";
  const isFilteredG2 = display.mode === "filtered" && display.groupTag === "g2";
  const rowSpan = isFilteredG1 ? g1Span : isFilteredG2 ? g2Span : allSpan;
  const isLastRowForBlock = isFilteredG1 ? g1IsLastRow : isFilteredG2 ? g2IsLastRow : allIsLastRow;

  return (
    <TimetableCellFull
      display={display}
      isToday={isToday}
      isLive={isLive}
      isLastCol={isLastCol}
      onOpen={onOpen}
      viewOptions={viewOptions}
      slotId={slotId}
      dayOfWeek={dayOfWeek}
      isEditMode={isEditMode}
      landing={landing}
      g1Column={g1Column}
      gridRow={gridRow}
      rowSpan={rowSpan}
      isLastRowForBlock={isLastRowForBlock}
      orderedSlots={orderedSlots}
      resizeEntry={resizeEntry}
    />
  );
}

export default memo(TimetableCell);
