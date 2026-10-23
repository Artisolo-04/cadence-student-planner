import { Check, ChevronDown } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { DUE_FILTERS } from "../homeworkUtils";

function CountBadge({ count, danger }) {
  const tone =
    count === 0
      ? "bg-[var(--color-border)]/40 text-[var(--color-text-muted)]"
      : danger
        ? "bg-[var(--color-danger)]/15 text-[var(--color-danger)]"
        : "bg-[var(--color-primary)]/15 text-[var(--color-primary)]";
  return (
    <span
      className={`inline-flex min-w-[22px] items-center justify-center rounded-md px-1.5 py-0.5 text-xs font-bold tabular-nums ${tone}`}
    >
      {count}
    </span>
  );
}

export default function DueSelect({ value, onChange, counts, inline = false }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const btnRef = useRef(null);
  const menuRef = useRef(null);

  useLayoutEffect(() => {
    if (!open) {
      setPos(null);
      return;
    }
    const rect = btnRef.current.getBoundingClientRect();
    const menuHeight = menuRef.current ? menuRef.current.scrollHeight : 200;
    const gap = 4;
    const margin = 8;
    const below = window.innerHeight - rect.bottom - gap - margin;
    const above = rect.top - gap - margin;
    const up = below < menuHeight && above > below;
    const available = up ? above : below;
    const height = Math.min(menuHeight, available);
    setPos({
      left: rect.left,
      width: rect.width,
      top: up ? rect.top - gap - height : rect.bottom + gap,
      maxHeight: available,
    });
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const close = () => setOpen(false);
    function onDown(e) {
      if (btnRef.current?.contains(e.target) || menuRef.current?.contains(e.target)) return;
      close();
    }
    function onKey(e) {
      if (e.key === "Escape") close();
    }
    function onScroll(e) {
      if (menuRef.current?.contains(e.target)) return;
      close();
    }
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  const options = DUE_FILTERS.map((o) => ({
    value: o.value,
    name: o.value === "all" ? "All dates" : o.label,
    count: counts?.[o.value] ?? 0,
    danger: o.value === "overdue",
  }));
  const current = options.find((o) => o.value === value) ?? options[0];
  const filtered = value !== "all";

  const menuStyle = pos
    ? { position: "fixed", top: pos.top, left: pos.left, width: pos.width, maxHeight: pos.maxHeight }
    : { position: "fixed", top: 0, left: 0, visibility: "hidden" };

  return (
    <div className={inline ? "relative w-full" : "relative hidden w-48 shrink-0 sm:block"}>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex h-full w-full items-center justify-between gap-2 whitespace-nowrap rounded-lg border px-3 py-2 text-sm transition-colors duration-200 ${
          filtered
            ? current.danger
              ? "border-[var(--color-danger)] bg-[var(--color-danger)]/10 text-[var(--color-danger)]"
              : "border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
            : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]"
        }`}
      >
        <span className="min-w-0 flex-1 truncate text-left">{current.name}</span>
        <span className="flex shrink-0 items-center gap-2">
          <CountBadge count={current.count} danger={current.danger} />
          <ChevronDown
            size={14}
            className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        </span>
      </button>

      {open &&
        createPortal(
          <ul
            ref={menuRef}
            role="listbox"
            style={menuStyle}
            className="z-[60] overflow-y-auto rounded-lg border border-[var(--color-line)] bg-[var(--color-drawer)] p-1 shadow-lg"
          >
            {options.map((o) => {
              const selected = o.value === value;
              return (
                <li key={o.value} role="option" aria-selected={selected}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(o.value);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center justify-between gap-3 rounded-md px-2.5 py-2 text-sm transition-colors hover:bg-[var(--color-fill-4)] ${
                      selected ? "text-[var(--color-primary)]" : "text-[var(--color-text)]"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Check size={13} className={selected ? "opacity-100" : "opacity-0"} />
                      {o.name}
                    </span>
                    <CountBadge count={o.count} danger={o.danger} />
                  </button>
                </li>
              );
            })}
          </ul>,
          document.body,
        )}
    </div>
  );
}
