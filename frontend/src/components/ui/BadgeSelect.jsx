import { Check, ChevronDown } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const TONES = {
  danger: {
    badge: "bg-[var(--color-danger)]/15 text-[var(--color-danger)]",
    button: "border-[var(--color-danger)] bg-[var(--color-danger)]/10 text-[var(--color-danger)]",
  },
  primary: {
    badge: "bg-[var(--color-primary)]/15 text-[var(--color-primary)]",
    button: "border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]",
  },
  muted: {
    badge: "bg-[var(--color-border)]/40 text-[var(--color-text-muted)]",
    button: "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]",
  },
};

function Badge({ count, tone }) {
  const cls = count === 0 ? TONES.muted.badge : (TONES[tone]?.badge ?? TONES.muted.badge);
  return (
    <span className={`inline-flex min-w-[22px] items-center justify-center rounded-md px-1.5 py-0.5 text-[11px] font-bold tabular-nums ${cls}`}>
      {count}
    </span>
  );
}

export default function BadgeSelect({ options, value, onChange, ariaLabel, className = "w-44" }) {
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
    const menuHeight = menuRef.current ? menuRef.current.scrollHeight : 160;
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

  const current = options.find((o) => o.value === value) ?? options[0];
  const menuStyle = pos
    ? { position: "fixed", top: pos.top, left: pos.left, width: pos.width, maxHeight: pos.maxHeight }
    : { position: "fixed", top: 0, left: 0, visibility: "hidden" };

  return (
    <div className={`relative shrink-0 ${className}`}>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        className={`flex w-full items-center justify-between gap-2 whitespace-nowrap rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors duration-200 ${
          TONES[current.tone]?.button ?? TONES.muted.button
        }`}
      >
        <span className="min-w-0 flex-1 truncate text-left">{current.label}</span>
        <span className="flex shrink-0 items-center gap-2">
          <Badge count={current.count} tone={current.tone} />
          <ChevronDown size={13} className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
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
                    className={`flex w-full items-center justify-between gap-3 rounded-md px-2.5 py-2 text-xs transition-colors hover:bg-[var(--color-fill-4)] ${
                      selected ? "text-[var(--color-primary)]" : "text-[var(--color-text)]"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Check size={12} className={selected ? "opacity-100" : "opacity-0"} />
                      {o.label}
                    </span>
                    <Badge count={o.count} tone={o.tone} />
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
