import { CSS } from "@dnd-kit/utilities";

export function lockPageScroll() {
  document.documentElement.style.overflow = "hidden";
}
export function unlockPageScroll() {
  document.documentElement.style.overflow = "";
}

function getFullCellRect(over) {
  if (!over) return null;
  const cellKey = over.id.split("::")[1];
  if (!cellKey) return null;
  const el = document.querySelector(`[data-cell-key="${cellKey}"]`);
  return el ? el.getBoundingClientRect() : null;
}

export function createMagneticModifier({ lerpFactor = 0.3, fitPadding = 0.2, maxLockedScale = 0.85 } = {}) {
  let smoothedX = null;
  let smoothedY = null;
  let smoothedScale = 1;
  let lastActiveId = null;

  return ({ transform, draggingNodeRect, over, active }) => {
    if (!draggingNodeRect) return transform;

    if (active?.id !== lastActiveId) {
      lastActiveId = active?.id ?? null;
      smoothedX = transform.x;
      smoothedY = transform.y;
      smoothedScale = 1;
    }

    const rawCenterX = draggingNodeRect.left + transform.x + draggingNodeRect.width / 2;
    const rawCenterY = draggingNodeRect.top + transform.y + draggingNodeRect.height / 2;

    const cellRect = getFullCellRect(over);
    const targetCenterX = cellRect ? cellRect.left + cellRect.width / 2 : rawCenterX;
    const targetCenterY = cellRect ? cellRect.top + cellRect.height / 2 : rawCenterY;

    const targetX = transform.x + (targetCenterX - rawCenterX);
    const targetY = transform.y + (targetCenterY - rawCenterY);

    const targetScale = cellRect
      ? Math.min(
          (cellRect.width / draggingNodeRect.width) * fitPadding,
          (cellRect.height / draggingNodeRect.height) * fitPadding,
          maxLockedScale
        )
      : 1;

    smoothedX += (targetX - smoothedX) * lerpFactor;
    smoothedY += (targetY - smoothedY) * lerpFactor;
    smoothedScale += (targetScale - smoothedScale) * lerpFactor;

    return {
      ...transform,
      x: smoothedX,
      y: smoothedY,
      scaleX: (transform.scaleX ?? 1) * smoothedScale,
      scaleY: (transform.scaleY ?? 1) * smoothedScale,
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
