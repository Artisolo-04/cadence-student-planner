import { useEffect, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";

export default function Dropdown({
  label,
  id,
  value,
  onChange,
  options = [],
  placeholder = "Select...",
  className = "",
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const rootRef = useRef(null);

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

  useEffect(() => {
    function onClickOutside(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const selected = options.find((o) => o.value === value);

  function select(opt) {
    onChange?.({ target: { value: opt.value } });
    setOpen(false);
  }

  return (
    <div className="flex flex-col gap-2" ref={rootRef}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-[var(--color-text)]">
          {label}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          id={id}
          onClick={() => setOpen((o) => !o)}
          className={`w-full flex items-center justify-between rounded-lg border border-[var(--color-border)]
            bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)]
            focus:outline-none transition-shadow duration-150 focus-visible:ring-1 focus-visible:ring-[var(--color-ring)]
            ${className}`}
        >
          <span className={selected ? "" : "text-[var(--color-text-muted)]"}>
            {selected ? selected.label : placeholder}
          </span>
          <ChevronDown
            size={18}
            className={`text-[var(--color-text-muted)] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        </button>

        {mounted && (
          <ul
            role="listbox"
            className={`absolute z-20 mt-2 w-full max-h-64 overflow-y-auto scrollbar-cadence
              rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg py-1
              transition-all duration-150 ease-out origin-top
              ${visible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 -translate-y-1"}`}
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
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm text-left
                      hover:bg-[var(--color-surface-alt)] transition-colors
                      ${isSelected ? "text-[var(--color-primary)] font-medium" : "text-[var(--color-text)]"}`}
                  >
                    {opt.label}
                    {isSelected && <Check size={16} />}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
