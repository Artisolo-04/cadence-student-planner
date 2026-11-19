import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Calendar, ChevronLeft, ChevronRight, X } from "lucide-react";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const pad = (n) => String(n).padStart(2, "0");
const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function parseISO(v) {
  if (!v) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(v);
  return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
}
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
function addMonths(d, n) {
  const target = new Date(d.getFullYear(), d.getMonth() + n, 1);
  const last = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  return new Date(target.getFullYear(), target.getMonth(), Math.min(d.getDate(), last));
}
const sameDay = (a, b) => !!a && !!b && toISO(a) === toISO(b);

function useIsDesktop() {
  const query = "(min-width: 768px)";
  const [yes, setYes] = useState(
    () => typeof window !== "undefined" && window.matchMedia(query).matches,
  );
  useEffect(() => {
    const m = window.matchMedia(query);
    const handler = () => setYes(m.matches);
    handler();
    m.addEventListener("change", handler);
    return () => m.removeEventListener("change", handler);
  }, []);
  return yes;
}

/* ---------- the calendar itself ---------- */
function CalendarPanel({ value, onPick, fill = false, autoFocus = false, className = "" }) {
  const selected = parseISO(value);
  const [focusDate, setFocusDate] = useState(() => selected || new Date());
  const rootRef = useRef(null);
  const keyNav = useRef(autoFocus);
  const today = new Date();

  useEffect(() => {
    const s = parseISO(value);
    if (s) setFocusDate(s);
  }, [value]);

  useEffect(() => {
    if (!keyNav.current) return;
    keyNav.current = false;
    rootRef.current
      ?.querySelector(`[data-iso="${toISO(focusDate)}"]`)
      ?.focus({ preventScroll: true });
  }, [focusDate]);

  function onGridKeyDown(e) {
    const moves = {
      ArrowLeft: () => addDays(focusDate, -1),
      ArrowRight: () => addDays(focusDate, 1),
      ArrowUp: () => addDays(focusDate, -7),
      ArrowDown: () => addDays(focusDate, 7),
      PageUp: () => addMonths(focusDate, -1),
      PageDown: () => addMonths(focusDate, 1),
    };
    if (moves[e.key]) {
      e.preventDefault();
      keyNav.current = true;
      setFocusDate(moves[e.key]());
    }
  }

  const first = new Date(focusDate.getFullYear(), focusDate.getMonth(), 1);
  const start = addDays(first, -first.getDay());
  const cells = Array.from({ length: 42 }, (_, i) => addDays(start, i));

  const arrowBtn =
    "flex h-7 w-7 items-center justify-center rounded-md text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--color-text)] focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-ring)]";
  const footBtn =
    "rounded-md px-2 py-1 text-xs font-medium transition-colors hover:bg-[var(--color-surface-alt)] focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-ring)]";

  return (
    <div
      ref={rootRef}
      className={`flex flex-col rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 ${fill ? "h-full" : ""} ${className}`}
    >
      {/* header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-baseline gap-1.5">
          <span className="text-base font-semibold tracking-tight text-[var(--color-text)]">
            {MONTHS[focusDate.getMonth()]}
          </span>
          <span className="text-base font-normal text-[var(--color-text-muted)]">
            {focusDate.getFullYear()}
          </span>
        </div>
        <div className="flex items-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-0.5">
          <button type="button" aria-label="Previous month" onClick={() => setFocusDate(addMonths(focusDate, -1))} className={arrowBtn}>
            <ChevronLeft size={16} />
          </button>
          <button type="button" aria-label="Next month" onClick={() => setFocusDate(addMonths(focusDate, 1))} className={arrowBtn}>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* weekdays */}
      <div className="grid grid-cols-7">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="flex h-7 items-center justify-center text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]"
          >
            {d}
          </div>
        ))}
      </div>

      {/* days */}
      <div
        onKeyDown={onGridKeyDown}
        className={`grid grid-cols-7 gap-1 ${fill ? "min-h-[240px] flex-1 grid-rows-6" : ""}`}
      >
        {cells.map((d) => {
          const inMonth = d.getMonth() === focusDate.getMonth();
          const isSel = sameDay(d, selected);
          const isToday = sameDay(d, today);
          const isFocus = sameDay(d, focusDate);
          return (
            <button
              key={toISO(d)}
              type="button"
              data-iso={toISO(d)}
              tabIndex={isFocus ? 0 : -1}
              aria-pressed={isSel}
              aria-current={isToday ? "date" : undefined}
              onClick={() => onPick(d)}
              className={`flex items-center justify-center self-center justify-self-center rounded-lg text-sm transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-ring)]
                ${fill ? "h-full min-h-9 max-h-11 w-full max-w-11" : "h-10 w-10"}
                ${
                  isSel
                    ? "bg-[var(--color-primary)] font-semibold text-[var(--color-surface)]"
                    : isToday
                    ? "border border-[var(--color-primary)] font-medium text-[var(--color-primary)] hover:bg-[var(--color-surface-alt)]"
                    : `hover:bg-[var(--color-surface-alt)] ${
                        inMonth
                          ? "text-[var(--color-text)]"
                          : "text-[var(--color-text-muted)] opacity-40"
                      }`
                }`}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>

      {/* footer */}
      <div className="mt-3 flex items-center justify-between border-t border-[var(--color-border)] pt-2">
        <button type="button" onClick={() => onPick(null)} className={`${footBtn} text-[var(--color-text-muted)] hover:text-[var(--color-text)]`}>
          Clear
        </button>
        <button type="button" onClick={() => onPick(new Date())} className={`${footBtn} text-[var(--color-primary)]`}>
          Today
        </button>
      </div>
    </div>
  );
}

/* ---------- public component ---------- */
export default function DatePicker({
  label,
  id,
  value,
  onChange,
  placeholder = "Select date",
  className = "",
  inline = true, // desktop: show calendar directly. false = always use the sheet
}) {
  const isDesktop = useIsDesktop();
  const showInline = inline && isDesktop;

  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const triggerRef = useRef(null);

  const selected = parseISO(value);
  const display = selected
    ? selected.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "";

  // sheet mount / animate
  useEffect(() => {
    let raf1, raf2;
    if (open) {
      setMounted(true);
      raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => setVisible(true));
      });
    } else {
      setVisible(false);
      const t = setTimeout(() => setMounted(false), 200);
      return () => clearTimeout(t);
    }
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [open]);

  // switching to desktop layout closes any open sheet
  useEffect(() => {
    if (showInline) setOpen(false);
  }, [showInline]);

  // Esc closes only the sheet (not the modal behind it)
  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === "Escape") {
        e.stopPropagation();
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [open]);

  function pick(date) {
    onChange?.({ target: { value: date ? toISO(date) : "" } });
    if (!showInline) {
      setOpen(false);
      triggerRef.current?.focus();
    }
  }

  /* desktop: always-open calendar filling the column */
  if (showInline) {
    return (
      <div className="flex h-full min-h-0 flex-col gap-2">
        {label && <span data-field-label className="text-sm font-medium text-[var(--color-text)]">{label}</span>}
        <div className="min-h-0 flex-1">
          <CalendarPanel value={value} onPick={pick} fill />
        </div>
      </div>
    );
  }

  /* phone: field + bottom sheet */
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-[var(--color-text)]">
          {label}
        </label>
      )}
      <button
        type="button"
        id={id}
        ref={triggerRef}
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={`w-full flex items-center justify-between rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none transition-shadow duration-150 focus-visible:ring-1 focus-visible:ring-[var(--color-ring)] ${className}`}
      >
        <span className={display ? "" : "text-[var(--color-text-muted)]"}>
          {display || placeholder}
        </span>
        <Calendar size={16} className="text-[var(--color-text-muted)]" />
      </button>

      {mounted &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center">
            <div
              className={`absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-200 ${
                visible ? "opacity-100" : "opacity-0"
              }`}
              onClick={() => setOpen(false)}
              aria-hidden="true"
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Choose date"
              className={`relative w-full rounded-t-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-xl transition-all duration-200 ease-out sm:max-w-sm sm:rounded-xl
                ${visible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 sm:translate-y-2 sm:scale-95"}`}
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-base font-semibold text-[var(--color-text)]">
                  {label || "Choose date"}
                </h3>
                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => setOpen(false)}
                  className="rounded-md p-1 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-alt)]"
                >
                  <X size={18} />
                </button>
              </div>
              <CalendarPanel value={value} onPick={pick} autoFocus className="border-0 p-0" />
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
