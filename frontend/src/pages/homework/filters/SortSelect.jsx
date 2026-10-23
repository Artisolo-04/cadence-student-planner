import { ArrowUpDown, Check, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { SORT_OPTIONS } from "../homeworkUtils";

const SORT_PARTS = {
  "due_date-asc": { name: "Due date", hint: "Soonest" },
  "due_date-desc": { name: "Due date", hint: "Latest" },
  "priority-desc": { name: "Priority", hint: "High first" },
  "subject-asc": { name: "Subject", hint: "A–Z" },
  "created-desc": { name: "Date added", hint: "Newest" },
};

function HintBadge({ children }) {
  return (
    <span className="inline-flex items-center whitespace-nowrap rounded-md bg-[var(--color-primary)]/15 px-1.5 py-0.5 text-xs font-semibold text-[var(--color-primary)]">
      {children}
    </span>
  );
}

export default function SortSelect({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    function onDown(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const options = SORT_OPTIONS.map((o) => ({
    value: o.value,
    name: SORT_PARTS[o.value]?.name ?? o.label,
    hint: SORT_PARTS[o.value]?.hint ?? null,
  }));
  const current = options.find((o) => o.value === value) ?? options[0];

  return (
    <div ref={ref} className="relative flex shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Sort: ${current.name}${current.hint ? ` ${current.hint}` : ""}`}
        className="inline-flex aspect-square items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-0 text-sm text-[var(--color-text)] transition-colors duration-200 hover:border-[var(--color-primary)]/50 md:aspect-auto md:w-60 md:justify-between md:px-3 md:py-2"
      >
        <span className="flex min-w-0 items-center gap-2">
          <ArrowUpDown size={14} className="shrink-0 text-[var(--color-text-muted)]" />
          <span className="hidden truncate md:inline">{current.name}</span>
        </span>
        <span className="hidden shrink-0 items-center gap-2 md:flex">
          {current.hint && <HintBadge>{current.hint}</HintBadge>}
          <ChevronDown size={14} className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </span>
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute right-0 top-full z-50 mt-1 w-64 md:w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-drawer)] p-1 shadow-lg"
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
                  className={`flex w-full items-center justify-between gap-3 rounded-md px-2.5 py-2 text-left text-sm transition-colors hover:bg-[var(--color-fill-4)] ${
                    selected ? "text-[var(--color-primary)]" : "text-[var(--color-text)]"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Check size={13} className={selected ? "opacity-100" : "opacity-0"} />
                    {o.name}
                  </span>
                  {o.hint && <HintBadge>{o.hint}</HintBadge>}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
