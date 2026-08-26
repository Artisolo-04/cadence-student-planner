import { CSS } from "@dnd-kit/utilities";

export function lockPageScroll() {
  document.documentElement.style.overflow = "hidden";
}
export function unlockPageScroll() {
  document.documentElement.style.overflow = "";
}

function getGridBounds() {
  const el = document.querySelector("[data-timetable-grid-root]");
  return el ? el.getBoundingClientRect() : null;
}

function getFullCellRect(overId) {
  if (typeof overId !== "string") return null;
  const parts = overId.split("::");
  const cellKey = parts[1];
  if (!cellKey) return null;
  const el = document.querySelector(`[data-cell-full-key="${cellKey}"]`);
  return el ? el.getBoundingClientRect() : null;
}

export function createMagneticModifier(chipSizeRef) {
  return ({ transform, draggingNodeRect, over }) => {
    if (!draggingNodeRect) return transform;

    const liveSize = chipSizeRef?.current;
    const width = liveSize?.width ?? draggingNodeRect.width;
    const height = liveSize?.height ?? draggingNodeRect.height;

    const rawCenterX = draggingNodeRect.left + transform.x + width / 2;
    const rawCenterY = draggingNodeRect.top + transform.y + height / 2;

    const cellRect = getFullCellRect(over?.id) || over?.rect || null;
    const gridRect = getGridBounds();

    let targetCenterX = cellRect ? cellRect.left + cellRect.width / 2 : rawCenterX;
    let targetCenterY = cellRect ? cellRect.top + cellRect.height / 2 : rawCenterY;

    if (cellRect && gridRect) {
      const halfW = width / 2;
      const halfH = height / 2;
      targetCenterX = Math.min(Math.max(targetCenterX, gridRect.left + halfW), gridRect.right - halfW);
      targetCenterY = Math.min(Math.max(targetCenterY, gridRect.top + halfH), gridRect.bottom - halfH);
    }

    const targetX = transform.x + (targetCenterX - rawCenterX);
    const targetY = transform.y + (targetCenterY - rawCenterY);

    return {
      ...transform,
      x: targetX,
      y: targetY,
    };
  };
}

export const DROP_SCALE_FADE_ANIMATION = {
  duration: 180,
  easing: "ease-out",
  sideEffects: null,
  keyframes({ transform }) {
    const base = CSS.Transform.toString(transform.initial);
    return [
      { opacity: 1, transform: `${base} scale(1)` },
      { opacity: 0, transform: `${base} scale(0.65)` },
    ];
  },
};

export const CANCEL_FADE_ANIMATION = {
  duration: 160,
  easing: "ease-out",
  sideEffects: null,
  keyframes({ transform }) {
    return [
      { opacity: 1, transform: CSS.Transform.toString(transform.initial) },
      { opacity: 0, transform: CSS.Transform.toString(transform.initial) },
    ];
  },
};
