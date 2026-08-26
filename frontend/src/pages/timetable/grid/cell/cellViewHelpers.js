import { getCellDisplay } from "../layout/timetableGridUtils";

export function getDisplayForView(entriesForCell, groupVisibility, myGroup) {
  const display = getCellDisplay(entriesForCell);

  if (display.mode !== "split" || groupVisibility === "both" || !myGroup) {
    return display;
  }

  const groupTag =
    groupVisibility === "my"
      ? myGroup
      : myGroup === "g1"
        ? "g2"
        : "g1";

  return {
    mode: "filtered",
    entry: groupTag === "g1" ? display.g1Entry : display.g2Entry,
    groupTag,
  };
}

export function pulseFor(landing, cellKey, groupTag) {
  if (!landing) return null;
  return landing.key === `${cellKey}-${groupTag}` ? landing.color : null;
}
