import { useEffect, useLayoutEffect, useRef, useState } from "react";

export default function useDropdownPosition({
  open,
  rowCount,
  itemHeight,
  listPadding,
  visibleItems,
  onRequestClose,
}) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, openUp: false });

  const wrapperRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    let raf1, raf2;
    if (open) {
      setMounted(true);
      raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => setVisible(true));
      });
    } else {
      setVisible(false);
      const timeout = setTimeout(() => setMounted(false), 150);
      return () => clearTimeout(timeout);
    }
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [open]);

  useLayoutEffect(() => {
    if (!open) return;

    function updatePosition() {
      const trigger = wrapperRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      const effectiveHeight =
        rowCount > visibleItems ? visibleItems * itemHeight + listPadding : rowCount * itemHeight + listPadding;
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUp = spaceBelow < effectiveHeight + 12 && rect.top > effectiveHeight + 12;

      setCoords({
        top: openUp ? rect.top - effectiveHeight - 8 : rect.bottom + 8,
        left: rect.left,
        width: rect.width,
        openUp,
      });
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    return () => window.removeEventListener("resize", updatePosition);
  }, [open, rowCount, itemHeight, listPadding, visibleItems]);

  useEffect(() => {
    if (!open) return;
    function onScroll(e) {
      if (listRef.current && listRef.current.contains(e.target)) return;
      onRequestClose?.();
    }
    window.addEventListener("scroll", onScroll, true);
    return () => window.removeEventListener("scroll", onScroll, true);
  }, [open, onRequestClose]);

  useEffect(() => {
    function onClickOutside(e) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target) &&
        listRef.current &&
        !listRef.current.contains(e.target)
      ) {
        onRequestClose?.();
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [onRequestClose]);

  const listHeight = rowCount > visibleItems ? visibleItems * itemHeight + listPadding : undefined;

  return { wrapperRef, listRef, mounted, visible, coords, listHeight };
}
