import { useEffect, useRef, useState } from "react";
import { PointerSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";
import { getSpanCount } from "../layout/slotSpanUtils";
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
  const [dragSpan, setDragSpan] = useState(1);
  const [dragSourceEntryId, setDragSourceEntryId] = useState(null);
  const [overCell, setOverCell] = useState(null);
  const landingTimeoutRef = useRef(null);

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

    const [, cellKey, groupTag = "all"] = overId.split("::");
    if (!cellKey) return null;

    const [slotIdText, dayOfWeekText] = cellKey.split("-");
    const slotId = Number(slotIdText);
    const dayOfWeek = Number(dayOfWeekText);

    if (Number.isNaN(slotId) || Number.isNaN(dayOfWeek)) return null;
    return { slotId, dayOfWeek, groupTag };
  }

  function resetDragState() {
    setDraggingSubject(null);
    setBaseChipSize(null);
    setSingleRowHeight(null);
    setDragSpan(1);
    setDragSourceEntryId(null);
    setOverCell(null);
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
        (entry) =>
          entry.start_slot_id === data.sourceSlotId &&
          entry.day_of_week === data.sourceDayOfWeek &&
          entry.group_tag === data.sourceGroupTag
      );

      if (sourceEntry) {
        span = getSpanCount(sourceEntry, orderedSlots);
        sourceEntryId = sourceEntry.id;
      }
    }

    const cellElement =
      (data?.source === "cell" &&
        document.querySelector(
          `[data-cell-full-key="${data.sourceSlotId}-${data.sourceDayOfWeek}"]`
        )) ||
      document.querySelector("[data-cell-full-key]");

    if (cellElement) {
      const rect = cellElement.getBoundingClientRect();
      setBaseChipSize({ width: rect.width, height: rect.height });
    } else {
      setBaseChipSize(null);
    }

    const rowReference = document.querySelector("[data-row-height-ref]");
    if (rowReference) {
      setSingleRowHeight(rowReference.getBoundingClientRect().height);
    } else if (cellElement) {
      setSingleRowHeight(
        cellElement.getBoundingClientRect().height / Math.max(1, span)
      );
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
    resetDragState();
    unlockPageScroll();
  }

  function handleDragEnd(event) {
    const { active, over } = event;
    let dropped = false;

    if (over) {
      const data = active?.data?.current;
      const subjectId = data?.subjectId;
      const target = parseOverId(over.id);
      const slot = target && orderedSlots.find((item) => item.id === target.slotId);
      const day =
        target &&
        orderedDays.find((item) => item.day_of_week === target.dayOfWeek);

      if (subjectId && target && slot && day) {
        dropped = true;

        setLanding({
          key: `${target.slotId}-${target.dayOfWeek}-${target.groupTag}`,
          color: data.subjectColor,
        });
        window.clearTimeout(landingTimeoutRef.current);
        landingTimeoutRef.current = window.setTimeout(
          () => setLanding(null),
          650
        );

        onDrop({
          subjectId,
          slotId: target.slotId,
          dayOfWeek: target.dayOfWeek,
          groupTag: target.groupTag,
          spanCount: dragSpan,
          sourceEntryId: dragSourceEntryId,
          sourceCell:
            data.source === "cell"
              ? {
                  slotId: data.sourceSlotId,
                  dayOfWeek: data.sourceDayOfWeek,
                  groupTag: data.sourceGroupTag,
                  room: data.sourceRoom,
                }
              : null,
        });
      }
    }

    const animation = dropped
      ? DROP_SCALE_FADE_ANIMATION
      : CANCEL_FADE_ANIMATION;

    setDropAnimation(() => animation);
    window.setTimeout(unlockPageScroll, animation.duration + 20);
    resetDragState();
  }

  const { dragChipSize, dragChipOffsetY } = computeDragChipDimensions({
    baseChipSize,
    singleRowHeight,
    effectiveDragSpan: dragSpan,
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
    effectiveDragSpan: dragSpan,
    overCell,
    handleDragStart,
    handleDragMove,
    handleDragCancel,
    handleDragEnd,
  };
}
