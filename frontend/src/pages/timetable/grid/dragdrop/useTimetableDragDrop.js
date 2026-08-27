import { useEffect, useRef, useState } from "react";
import { PointerSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";
import { getSpanCount, computeMaxFreeSpan } from "../layout/slotSpanUtils";
import { computeDragChipDimensions } from "../overlay/overlayGeometry";
import {
  CANCEL_FADE_ANIMATION,
  DROP_SCALE_FADE_ANIMATION,
  lockPageScroll,
  unlockPageScroll,
} from "./dragAnimations";

export const DRAG_CHIP_MARGIN_PX = 10;

export function useTimetableDragDrop({ orderedSlots, orderedDays, entries, onDrop }) {
  const [draggingSubject, setDraggingSubject] = useState(null);

  const [baseChipSize, setBaseChipSize] = useState(null);

  const [singleRowHeight, setSingleRowHeight] = useState(null);

  const [dropAnimation, setDropAnimation] = useState(() => CANCEL_FADE_ANIMATION);
  const [landing, setLanding] = useState(null);
  const landingTimeoutRef = useRef(null);

  const [dragSpan, setDragSpan] = useState(1);

  const [dragSourceEntryId, setDragSourceEntryId] = useState(null);

  const [overCell, setOverCell] = useState(null);

  useEffect(() => {
    return () => window.clearTimeout(landingTimeoutRef.current);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 5 },
    })
  );

  function parseOverId(overId) {
    if (typeof overId !== "string") return null;
    const parts = overId.split("::");
    const cellKey = parts[1];
    if (!cellKey) return null;
    const groupTag = parts[2] || "all";
    const [slotIdStr, dayOfWeekStr] = cellKey.split("-");
    const slotId = Number(slotIdStr);
    const dayOfWeek = Number(dayOfWeekStr);
    if (Number.isNaN(slotId) || Number.isNaN(dayOfWeek)) return null;
    return { slotId, dayOfWeek, groupTag };
  }

  function handleDragStart(event) {
    const data = event.active?.data?.current;
    if (data) {
      setDraggingSubject({
        id: data.subjectId,
        name: data.subjectName,
        color: data.subjectColor,
        teacher: data.subjectTeacher,
      });
    }

    let span = 1;
    let sourceEntryId = null;
    if (data?.source === "cell") {
      const sourceEntry = (entries || []).find(
        (e) =>
          e.start_slot_id === data.sourceSlotId &&
          e.day_of_week === data.sourceDayOfWeek &&
          e.group_tag === data.sourceGroupTag
      );
      if (sourceEntry) {
        span = getSpanCount(sourceEntry, orderedSlots);
        sourceEntryId = sourceEntry.id ?? null;
      }
    }

    const cellEl =
      (data?.source === "cell" &&
        document.querySelector(
          `[data-cell-full-key="${data.sourceSlotId}-${data.sourceDayOfWeek}"]`
        )) ||
      document.querySelector("[data-cell-full-key]");

    if (cellEl) {
      const rect = cellEl.getBoundingClientRect();
      setBaseChipSize({ width: rect.width, height: rect.height });
    } else {
      setBaseChipSize(null);
    }

    const rowRefEl = document.querySelector("[data-row-height-ref]");
    if (rowRefEl) {
      setSingleRowHeight(rowRefEl.getBoundingClientRect().height);
    } else if (cellEl) {
      const rect = cellEl.getBoundingClientRect();
      setSingleRowHeight(rect.height / Math.max(1, span));
    } else {
      setSingleRowHeight(null);
    }

    setDragSpan(Math.max(1, span));
    setDragSourceEntryId(sourceEntryId);
    setOverCell(null);

    setDropAnimation(() => CANCEL_FADE_ANIMATION);
    lockPageScroll();
  }

  function handleDragMove(event) {
    setOverCell(parseOverId(event.over?.id));
  }

  function handleDragCancel() {
    setDropAnimation(() => CANCEL_FADE_ANIMATION);
    setDraggingSubject(null);
    setBaseChipSize(null);
    setDragSpan(1);
    setDragSourceEntryId(null);
    setOverCell(null);
    setSingleRowHeight(null);
    unlockPageScroll();
  }

  function handleDragEnd(event) {
    const { active, over } = event;
    let dropped = false;

    if (over) {
      const data = active?.data?.current;
      const subjectId = data?.subjectId;

      if (subjectId) {
        const parts = over.id.split("::");
        const cellKey = parts[1];
        const groupTag = parts[2] || "all";
        const [slotIdStr, dayOfWeekStr] = cellKey.split("-");
        const slotId = Number(slotIdStr);
        const dayOfWeek = Number(dayOfWeekStr);

        const slot = orderedSlots.find((s) => s.id === slotId);
        const day = orderedDays.find((d) => d.day_of_week === dayOfWeek);

        if (slot && day) {
          dropped = true;

          const landingKey = `${slotId}-${dayOfWeek}-${groupTag}`;
          setLanding({ key: landingKey, color: data.subjectColor });
          window.clearTimeout(landingTimeoutRef.current);
          landingTimeoutRef.current = window.setTimeout(() => setLanding(null), 650);

          const sourceCell =
            data.source === "cell"
              ? {
                  slotId: data.sourceSlotId,
                  dayOfWeek: data.sourceDayOfWeek,
                  groupTag: data.sourceGroupTag,
                  room: data.sourceRoom,
                }
              : null;

          onDrop({ subjectId, slotId, dayOfWeek, groupTag, sourceCell });
        }
      }
    }

    const animation = dropped ? DROP_SCALE_FADE_ANIMATION : CANCEL_FADE_ANIMATION;
    setDropAnimation(() => animation);
    window.setTimeout(unlockPageScroll, animation.duration + 20);
    setDraggingSubject(null);
    setBaseChipSize(null);
    setDragSpan(1);
    setDragSourceEntryId(null);
    setOverCell(null);
    setSingleRowHeight(null);
  }

  let effectiveDragSpan = dragSpan;
  if (overCell) {
    const rowIdx = orderedSlots.findIndex((s) => s.id === overCell.slotId);
    if (rowIdx !== -1) {
      effectiveDragSpan = computeMaxFreeSpan({
        entries,
        orderedSlots,
        startIdx: rowIdx,
        dayOfWeek: overCell.dayOfWeek,
        groupTag: overCell.groupTag,
        excludeEntryId: dragSourceEntryId,
        maxSpan: dragSpan,
      });
    }
  }
  const { dragChipSize, dragChipOffsetY } = computeDragChipDimensions({
    baseChipSize,
    singleRowHeight,
    effectiveDragSpan,
    marginPx: DRAG_CHIP_MARGIN_PX,
  });

  return {
    sensors,
    draggingSubject,
    dragChipSize,
    dragChipOffsetY,
    dropAnimation,
    landing,
    dragSpan,
    effectiveDragSpan,
    overCell,
    handleDragStart,
    handleDragMove,
    handleDragCancel,
    handleDragEnd,
  };
}
