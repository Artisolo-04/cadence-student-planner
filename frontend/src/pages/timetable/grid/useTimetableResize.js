import { useCallback, useRef, useState } from "react";
import { getCellDisplay, entryKey } from "./timetableGridUtils";

function isLaneOccupied(display, groupTag) {
  if (groupTag === "all") {
    return display.mode !== "empty";
  }
  if (display.mode === "full") {
    return true;
  }
  if (display.mode === "split") {
    return groupTag === "g1" ? Boolean(display.g1Entry) : Boolean(display.g2Entry);
  }
  return false;
}

function computeCollisionLimit({ orderedSlots, entriesByCell, rowIdx, dayOfWeek, groupTag }) {
  const gridBoundLimit = orderedSlots.length - 1 - rowIdx;

  for (let j = rowIdx + 1; j < orderedSlots.length; j += 1) {
    const nextSlot = orderedSlots[j];
    const entriesForCell = entriesByCell[entryKey(nextSlot.id, dayOfWeek)];
    const display = getCellDisplay(entriesForCell);
    if (isLaneOccupied(display, groupTag)) {
      const collisionLimit = j - 1 - rowIdx;
      return Math.min(gridBoundLimit, collisionLimit);
    }
  }

  return gridBoundLimit;
}

export function useTimetableResize({ orderedSlots, entriesByCell, onCommitResize }) {
  const dragStateRef = useRef(null);
  const listenersRef = useRef(null);
  const [activeResize, setActiveResize] = useState(null);

  const computeSlotDelta = useCallback((event, state) => {
    const pixelDelta = event.clientY - state.startY;
    const rawSlotDelta = Math.round(pixelDelta / state.rowHeight);
    return Math.min(Math.max(rawSlotDelta, 0), state.maxSlotDelta);
  }, []);

  const stopResize = useCallback(() => {
    if (listenersRef.current) {
      window.removeEventListener("mousemove", listenersRef.current.onMove);
      window.removeEventListener("mouseup", listenersRef.current.onUp);
      listenersRef.current = null;
    }
    dragStateRef.current = null;
    setActiveResize(null);
  }, []);

  const startResize = useCallback(
    (event, { slotId, dayOfWeek, groupTag, rowIdx }) => {
      event.preventDefault();
      event.stopPropagation();

      const cellEl = event.currentTarget.closest("[data-cell-key]");
      if (!cellEl) return;

      const rowHeight = cellEl.getBoundingClientRect().height;
      const maxSlotDelta = computeCollisionLimit({
        orderedSlots,
        entriesByCell,
        rowIdx,
        dayOfWeek,
        groupTag,
      });

      const state = {
        startY: event.clientY,
        rowHeight,
        maxSlotDelta,
        slotId,
        dayOfWeek,
        groupTag,
        rowIdx,
        lastLoggedDelta: 0,
      };
      dragStateRef.current = state;

      console.log("[resize] start", { slotId, dayOfWeek, groupTag, rowIdx, rowHeight, maxSlotDelta });
      setActiveResize({ slotId, dayOfWeek, groupTag, rowIdx, previewSlotDelta: 0, rowHeight });

      const onMove = (moveEvent) => {
        const current = dragStateRef.current;
        if (!current) return;
        const slotDelta = computeSlotDelta(moveEvent, current);
        if (slotDelta !== current.lastLoggedDelta) {
          current.lastLoggedDelta = slotDelta;
          console.log("[resize] slotDelta", slotDelta, {
            slotId: current.slotId,
            dayOfWeek: current.dayOfWeek,
            groupTag: current.groupTag,
          });
          setActiveResize({
            slotId: current.slotId,
            dayOfWeek: current.dayOfWeek,
            groupTag: current.groupTag,
            rowIdx: current.rowIdx,
            previewSlotDelta: slotDelta,
            rowHeight: current.rowHeight,
          });
        }
      };

      const onUp = async (upEvent) => {
        const current = dragStateRef.current;
        if (!current) return;
        const finalSlotDelta = computeSlotDelta(upEvent, current);
        console.log("[resize] final slotDelta", finalSlotDelta, {
          slotId: current.slotId,
          dayOfWeek: current.dayOfWeek,
          groupTag: current.groupTag,
        });

        if (finalSlotDelta > 0 && onCommitResize) {
          try {
            await onCommitResize({
              slotId: current.slotId,
              dayOfWeek: current.dayOfWeek,
              groupTag: current.groupTag,
              rowIdx: current.rowIdx,
              slotDelta: finalSlotDelta,
            });
          } catch (err) {
            console.error("Resize commit error:", err);
          }
        }

        stopResize();
      };

      listenersRef.current = { onMove, onUp };
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [orderedSlots, entriesByCell, onCommitResize, computeSlotDelta, stopResize]
  );

  return { startResize, activeResize };
}
