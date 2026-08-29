import { useCallback, useRef, useState } from "react";
import { resizeDeltaToSpan, computeEndSlotId, getSpanCount, getSlotIndex } from "../layout/slotSpanUtils";

export function useResizeHandle({ entry, orderedSlots, resizeEntry }) {
  const [previewSpan, setPreviewSpan] = useState(null);
  const [isResizing, setIsResizing] = useState(false);
  const [isRejected, setIsRejected] = useState(false);
  const [isPersisting, setIsPersisting] = useState(false);
  const [rowHeight, setRowHeight] = useState(56);
  const [cellEl, setCellEl] = useState(null);
  const dragState = useRef(null);
  const previewSpanRef = useRef(null);
  const isPersistingRef = useRef(false);

  const onPointerMove = useCallback((e) => {
    if (!dragState.current) return;
    const { startY, rowHeight: rh, originalSpan, maxSpanFromGrid } = dragState.current;
    const raw = resizeDeltaToSpan(e.clientY - startY, rh, originalSpan);
    const next = Math.min(raw, maxSpanFromGrid);
    previewSpanRef.current = next;
    setPreviewSpan(next);
  }, []);

  const onPointerUp = useCallback(async () => {
    window.removeEventListener("pointermove", onPointerMove);
    const state = dragState.current;
    dragState.current = null;
    if (!state) return;

    if (state.handleEl && state.handleEl.hasPointerCapture?.(state.pointerId)) {
      state.handleEl.releasePointerCapture(state.pointerId);
    }

    const finalSpan = previewSpanRef.current ?? state.originalSpan;
    previewSpanRef.current = null;
    setIsResizing(false);
    setPreviewSpan(null);

    if (finalSpan === state.originalSpan) return;

    const newEndSlotId = computeEndSlotId(orderedSlots, entry.start_slot_id, finalSpan);

    isPersistingRef.current = true;
    setIsPersisting(true);
    try {
      const result = await resizeEntry(entry, newEndSlotId);
      if (!result.ok) {
        setIsRejected(true);
        window.setTimeout(() => setIsRejected(false), 260);
      }
    } finally {
      isPersistingRef.current = false;
      setIsPersisting(false);
    }
  }, [entry, orderedSlots, resizeEntry, onPointerMove]);

  const onPointerDown = useCallback(
    (e) => {
      if (isPersistingRef.current) return;
      e.stopPropagation();
      e.preventDefault();
      const handleEl = e.currentTarget;
      handleEl.setPointerCapture(e.pointerId);
      const el = handleEl.closest("[data-cell-key]");
      const measuredHeight = el ? el.getBoundingClientRect().height : 56;
      const originalSpan = getSpanCount(entry, orderedSlots);
      const rh = originalSpan > 0 ? measuredHeight / originalSpan : measuredHeight;
      const startIdx = getSlotIndex(orderedSlots, entry.start_slot_id);
      const maxSpanFromGrid = startIdx === -1 ? originalSpan : orderedSlots.length - startIdx;
      dragState.current = { startY: e.clientY, rowHeight: rh, originalSpan, maxSpanFromGrid, handleEl, pointerId: e.pointerId };
      previewSpanRef.current = originalSpan;
      setCellEl(el);
      setRowHeight(rh);
      setIsResizing(true);
      setIsRejected(false);
      setPreviewSpan(originalSpan);
      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp, { once: true });
    },
    [entry, orderedSlots, onPointerMove, onPointerUp]
  );

  return {
    previewSpan,
    isResizing,
    isRejected,
    isPersisting,
    cellEl,
    rowHeight,
    handlers: { onPointerDown },
  };
}
