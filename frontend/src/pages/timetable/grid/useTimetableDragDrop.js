import { useEffect, useRef, useState } from "react";
import { PointerSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";
import {
  CANCEL_FADE_ANIMATION,
  DROP_SCALE_FADE_ANIMATION,
  lockPageScroll,
  unlockPageScroll,
} from "./dragAnimations";

const DRAG_CHIP_FIT = 0.75;

export function useTimetableDragDrop({ orderedSlots, orderedDays, onDrop }) {
  const [draggingSubject, setDraggingSubject] = useState(null);
  const [dragChipSize, setDragChipSize] = useState(null);
  const [dropAnimation, setDropAnimation] = useState(() => CANCEL_FADE_ANIMATION);
  const [landing, setLanding] = useState(null);
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

    const cellEl = document.querySelector("[data-cell-key]");
    if (cellEl) {
      const rect = cellEl.getBoundingClientRect();
      setDragChipSize({
        width: rect.width * DRAG_CHIP_FIT,
        height: rect.height * DRAG_CHIP_FIT,
      });
    } else {
      setDragChipSize(null);
    }

    setDropAnimation(() => CANCEL_FADE_ANIMATION);
    lockPageScroll();
  }

  function handleDragCancel() {
    setDropAnimation(() => CANCEL_FADE_ANIMATION);
    setDraggingSubject(null);
    setDragChipSize(null);
    unlockPageScroll();
  }

  function handleDragEnd(event) {
    const { active, over } = event;
    let dropped = false;

    if (over) {
      const subjectId = active?.data?.current?.subjectId;

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
          setLanding({ key: landingKey, color: active.data.current.subjectColor });
          window.clearTimeout(landingTimeoutRef.current);
          landingTimeoutRef.current = window.setTimeout(() => setLanding(null), 650);

          onDrop({ subjectId, slotId, dayOfWeek, groupTag });
        }
      }
    }

    const animation = dropped ? DROP_SCALE_FADE_ANIMATION : CANCEL_FADE_ANIMATION;
    setDropAnimation(() => animation);
    window.setTimeout(unlockPageScroll, animation.duration + 20);
    setDraggingSubject(null);
    setDragChipSize(null);
  }

  return {
    sensors,
    draggingSubject,
    dragChipSize,
    dropAnimation,
    landing,
    handleDragStart,
    handleDragCancel,
    handleDragEnd,
  };
}
