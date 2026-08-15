import { useEffect, useRef, useState, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check } from "lucide-react";

const ITEM_HEIGHT = 36;
const LIST_PADDING = 8;
const VISIBLE_ITEMS = 5;

export default function Dropdown({
  label,
  id,
  value,
  onChange,
  options = [],
  placeholder = "Select...",
  className = "",
  size = "md",
  height,
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({
    top: 0,
    left: 0,
    width: 0,
    openUp: false,
  });
  const triggerRef = useRef(null);
  const listRef = useRef(null);
  const isSm = size === "sm";

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
      const trigger = triggerRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      const listHeight =
        options.length > VISIBLE_ITEMS
          ? VISIBLE_ITEMS * ITEM_HEIGHT + LIST_PADDING
          : undefined;
      const effectiveHeight =
        listHeight ?? options.length * ITEM_HEIGHT + LIST_PADDING;
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUp =
        spaceBelow < effectiveHeight + 12 && rect.top > effectiveHeight + 12;

      setCoords({
        top: openUp ? rect.top - effectiveHeight - 8 : rect.bottom + 8,
        left: isSm ? rect.right - Math.max(rect.width, 140) : rect.left,
        width: isSm ? Math.max(rect.width, 140) : rect.width,
        openUp,
      });
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    return () => window.removeEventListener("resize", updatePosition);
  }, [open, options.length, isSm]);

  useEffect(() => {
    if (!open) return;
    function onScroll(e) {
      if (listRef.current && listRef.current.contains(e.target)) return;
      setOpen(false);
    }
    window.addEventListener("scroll", onScroll, true);
    return () => window.removeEventListener("scroll", onScroll, true);
  }, [open]);

  useEffect(() => {
    function onClickOutside(e) {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(e.target) &&
        listRef.current &&
        !listRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const selected = options.find((o) => o.value === value);
  const listHeight =
    options.length > VISIBLE_ITEMS
      ? VISIBLE_ITEMS * ITEM_HEIGHT + LIST_PADDING
      : undefined;

  function select(opt) {
    onChange?.({ target: { value: opt.value } });
    setOpen(false);
  }

  const triggerClasses = isSm
    ? "w-auto inline-flex items-center gap-8 whitespace-nowrap rounded-lg border border-white/10 bg-white/[0.03] px-2 text-[11px] font-medium text-[var(--color-text-muted)] focus:outline-none transition-shadow duration-150 focus-visible:ring-1 focus-visible:ring-[var(--color-ring)]"
    : "w-full flex items-center justify-between rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none transition-shadow duration-150 focus-visible:ring-1 focus-visible:ring-[var(--color-ring)]";

  const triggerStyle = isSm
    ? {
        height: height || "26px",
        display: "flex",
        lineHeight: "1",
        boxSizing: "border-box",
        padding: "0 8px",
      }
    : undefined;

  return (
    <div className={isSm ? "flex" : "flex flex-col gap-2"}>
      {label && (
        <label
          htmlFor={id}
          className="text-sm font-medium text-[var(--color-text)]"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          id={id}
          ref={triggerRef}
          onClick={() => setOpen((o) => !o)}
          style={triggerStyle}
          className={`${triggerClasses} ${className}`}
        >
          <span className={selected ? "" : "text-[var(--color-text-muted)]"}>
            {selected ? selected.label : placeholder}
          </span>
          <ChevronDown
            size={isSm ? 11 : 18}
            className={`text-[var(--color-text-muted)] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        </button>

        {mounted &&
          createPortal(
            <ul
              ref={listRef}
              role="listbox"
              style={{
                position: "fixed",
                top: coords.top,
                left: coords.left,
                width: coords.width,
                maxHeight: listHeight,
              }}
              className={`z-[100] overflow-y-auto scrollbar-cadence p-1
                rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg
                transition-all duration-150 ease-out
                ${coords.openUp ? "origin-bottom" : "origin-top"}
                ${
                  visible
                    ? "opacity-100 scale-100 translate-y-0"
                    : `opacity-0 scale-95 ${coords.openUp ? "translate-y-1" : "-translate-y-1"}`
                }`}
            >
              {options.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <li key={opt.value}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => select(opt)}
                      className={`w-full flex items-center justify-between px-3 py-2 text-sm text-left rounded-sm
                        hover:bg-[var(--color-surface-alt)] transition-colors
                        ${isSelected ? "text-[var(--color-primary)] font-medium" : "text-[var(--color-text)]"}`}
                    >
                      {opt.label}
                      {isSelected && <Check size={16} />}
                    </button>
                  </li>
                );
              })}
            </ul>,
            document.body,
          )}
      </div>
    </div>
  );
}
