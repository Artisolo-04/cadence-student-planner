const EDGE_PX = 60;
const MAX_SPEED = 18;

export function startEdgeAutoScroll({ onTick } = {}) {
  const root = document.querySelector("[data-timetable-grid-root]");
  if (!root) return { stop() {} };

  let pointerY = null;
  let frame = null;
  let stopped = false;

  function trackPointer(event) {
    const touch = event.touches?.[0];
    pointerY = touch ? touch.clientY : event.clientY;
  }

  window.addEventListener("pointermove", trackPointer);
  window.addEventListener("touchmove", trackPointer, { passive: true });

  function step() {
    if (stopped) return;
    if (pointerY != null) {
      const rect = root.getBoundingClientRect();
      const headerH = root.firstElementChild?.firstElementChild?.offsetHeight ?? 0;
      const top = rect.top + headerH;
      const bottom = rect.bottom;

      let velocity = 0;
      if (pointerY < top + EDGE_PX) {
        velocity = -Math.min(1, (top + EDGE_PX - pointerY) / EDGE_PX) * MAX_SPEED;
      } else if (pointerY > bottom - EDGE_PX) {
        velocity = Math.min(1, (pointerY - (bottom - EDGE_PX)) / EDGE_PX) * MAX_SPEED;
      }

      if (velocity !== 0) {
        const before = root.scrollTop;
        const delta = Math.sign(velocity) * Math.max(1, Math.round(Math.abs(velocity)));
        root.scrollTop = before + delta;
        if (root.scrollTop !== before) onTick?.();
      }
    }
    frame = requestAnimationFrame(step);
  }

  frame = requestAnimationFrame(step);

  return {
    stop() {
      stopped = true;
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", trackPointer);
      window.removeEventListener("touchmove", trackPointer);
    },
  };
}
