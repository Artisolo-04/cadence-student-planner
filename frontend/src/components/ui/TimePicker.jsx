import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Clock3 } from "lucide-react";

const ITEM = 32; // row height
const VISIBLE = 4; // visible rows
const WHEEL_H = ITEM * VISIBLE;
const POP_W = 200;
const POP_H = 244;

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);
const pad = (n) => String(n).padStart(2, "0");

// selected row at the top, fade out toward the bottom
const MASK = "linear-gradient(to bottom, #000 0%, #000 45%, transparent 100%)";

function parse(v) {
  const m = /^(\d{1,2}):(\d{2})/.exec(v || "");
  return m ? { h: +m[1], m: +m[2] } : null;
}

function useIsDesktop() {
  const query = "(min-width: 640px)";
  const [yes, setYes] = useState(
    () => typeof window !== "undefined" && window.matchMedia(query).matches,
  );
  useEffect(() => {
    const mq = window.matchMedia(query);
    const handler = () => setYes(mq.matches);
    handler();
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return yes;
}

/* ---------- one scroll wheel (magnetic steps + snap + fade mask + keyboard) ---------- */
function Wheel({ items, value, onChange, label }) {
  const ref = useRef(null);
  const timer = useRef(null);
  const latest = useRef({});
  const target = useRef(0); // index we are heading to (avoids stale reads on fast input)
  const mode = useRef("smooth"); // how the next programmatic scroll should move
  const idx = Math.max(0, items.indexOf(value));
  latest.current = { idx, items, onChange };
  target.current = idx;

  useLayoutEffect(() => {
    if (ref.current) ref.current.scrollTop = idx * ITEM;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // follow value changes: smooth for single steps, instant for key-repeat / wrap
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const top = idx * ITEM;
    if (Math.abs(el.scrollTop - top) > 1) el.scrollTo({ top, behavior: mode.current });
    mode.current = "smooth";
  }, [idx]);

  useEffect(() => () => clearTimeout(timer.current), []);

  // magnetic mouse wheel / trackpad: one notch = one value
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let acc = 0;
    let lastEvent = 0;
    let lastStep = 0;
    function onWheel(e) {
      e.preventDefault();
      const now = performance.now();
      if (now - lastEvent > 160) acc = 0;
      lastEvent = now;
      acc += e.deltaMode === 1 ? e.deltaY * 40 : e.deltaY;
      if (Math.abs(acc) < 40) return;
      if (now - lastStep < 60) {
        acc = Math.max(-80, Math.min(80, acc));
        return;
      }
      const dir = acc > 0 ? 1 : -1;
      acc = 0;
      const { items: list, onChange: change } = latest.current;
      const next = Math.min(list.length - 1, Math.max(0, target.current + dir));
      if (next === target.current) return;
      lastStep = now;
      target.current = next;
      mode.current = "smooth";
      change(list[next]);
    }
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  // touch / drag: commit the value once native snap settles
  function onScroll() {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const el = ref.current;
      if (!el) return;
      const { idx: cur, items: list, onChange: change } = latest.current;
      const i = Math.min(list.length - 1, Math.max(0, Math.round(el.scrollTop / ITEM)));
      if (i !== cur) change(list[i]);
    }, 80);
  }

  function onKeyDown(e) {
    const n = items.length;
    const base = target.current;
    let ni = null;
    let wrap = false;
    if (e.key === "ArrowUp") {
      ni = base - 1;
      if (ni < 0) { ni = n - 1; wrap = true; }
    } else if (e.key === "ArrowDown") {
      ni = base + 1;
      if (ni > n - 1) { ni = 0; wrap = true; }
    } else if (e.key === "PageUp") ni = Math.max(0, base - 5);
    else if (e.key === "PageDown") ni = Math.min(n - 1, base + 5);
    else if (e.key === "Home") ni = 0;
    else if (e.key === "End") ni = n - 1;
    if (ni === null) return;
    e.preventDefault();
    if (ni === base) return;
    target.current = ni;
    mode.current = e.repeat || wrap || Math.abs(ni - base) > 1 ? "auto" : "smooth";
    onChange(items[ni]);
  }

  return (
    <div
      ref={ref}
      data-wheel
      role="listbox"
      aria-label={label}
      tabIndex={0}
      onScroll={onScroll}
      onKeyDown={onKeyDown}
      className="scrollbar-hidden relative z-10 flex-1 snap-y snap-mandatory overflow-y-auto overscroll-contain outline-none"
      style={{
        height: WHEEL_H,
        paddingBottom: WHEEL_H - ITEM, // lets the last value reach the top
        maskImage: MASK,
        WebkitMaskImage: MASK,
      }}
    >
      {items.map((item) => {
        const sel = item === value;
        return (
          <button
            key={item}
            type="button"
            role="option"
            aria-selected={sel}
            tabIndex={-1}
            onClick={() => { mode.current = "smooth"; onChange(item); }}
            style={{ height: ITEM }}
            className={`flex w-full snap-start items-center justify-center text-sm tabular-nums transition-colors ${
              sel
                ? "font-semibold text-[var(--color-primary)]"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            }`}
          >
            {pad(item)}
          </button>
        );
      })}
    </div>
  );
}

/* ---------- AM / PM segmented bar (full width) ---------- */
function Period({ value, onChange }) {
  function onKeyDown(e) {
    const k = e.key.toLowerCase();
    if (k === "arrowup" || k === "arrowdown") {
      e.preventDefault();
      onChange(value === "AM" ? "PM" : "AM");
    } else if (k === "a") onChange("AM");
    else if (k === "p") onChange("PM");
  }
  return (
    <div
      data-wheel
      role="radiogroup"
      aria-label="AM or PM"
      tabIndex={0}
      onKeyDown={onKeyDown}
      className="grid grid-cols-2 gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-0.5 outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-ring)]"
    >
      {["AM", "PM"].map((p) => (
        <button
          key={p}
          type="button"
          role="radio"
          aria-checked={value === p}
          tabIndex={-1}
          onClick={() => onChange(p)}
          className={`h-7 rounded-md text-xs font-semibold transition-colors ${
            value === p
              ? "bg-[var(--color-primary)] text-[var(--color-surface)]"
              : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
          }`}
        >
          {p}
        </button>
      ))}
    </div>
  );
}

/* ---------- public component ---------- */
export default function TimePicker({
  value,
  onChange,
  ariaLabel,
  placeholder = "Select time",
  className = "",
}) {
  const isDesktop = useIsDesktop();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, openUp: false });
  const triggerRef = useRef(null);
  const popRef = useRef(null);

  const parsed = parse(value);
  const cur = parsed || { h: 8, m: 0 };
  const h12 = cur.h % 12 || 12;
  const ap = cur.h >= 12 ? "PM" : "AM";
  const display = parsed ? `${pad(h12)}:${pad(cur.m)} ${ap}` : "";

  function commit(nh12, nap, nm) {
    const h24 = (nh12 % 12) + (nap === "PM" ? 12 : 0);
    onChange?.({ target: { value: `${pad(h24)}:${pad(nm)}` } });
  }

  function close() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  useEffect(() => {
    let raf1, raf2;
    if (open) {
      setMounted(true);
      raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => setVisible(true));
      });
    } else {
      setVisible(false);
      const t = setTimeout(() => setMounted(false), 160);
      return () => clearTimeout(t);
    }
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [open]);

  useLayoutEffect(() => {
    if (!open || !isDesktop) return;
    function update() {
      const trigger = triggerRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      const below = window.innerHeight - rect.bottom;
      const openUp = below < POP_H + 12 && rect.top > below;
      const centered = rect.left + rect.width / 2 - POP_W / 2;
      setCoords({
        top: openUp ? Math.max(8, rect.top - POP_H - 8) : rect.bottom + 8,
        left: Math.max(8, Math.min(centered, window.innerWidth - POP_W - 8)),
        openUp,
      });
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [open, isDesktop]);

  // focus the hour wheel when opened
  useEffect(() => {
    if (open && mounted) {
      popRef.current?.querySelectorAll("[data-wheel]")[1]?.focus({ preventScroll: true });
    }
  }, [open, mounted]);

  // desktop: close on outside scroll
  useEffect(() => {
    if (!open || !isDesktop) return;
    function onScroll(e) {
      if (popRef.current && popRef.current.contains(e.target)) return;
      setOpen(false);
    }
    window.addEventListener("scroll", onScroll, true);
    return () => window.removeEventListener("scroll", onScroll, true);
  }, [open, isDesktop]);

  // close on outside press (desktop and phone)
  useEffect(() => {
    if (!open) return;
    function onDown(e) {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target) &&
        popRef.current && !popRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === "Escape" || e.key === "Enter") {
        e.stopPropagation();
        e.preventDefault();
        close();
      }
    }
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [open]);

  // ← → move between AM/PM, hour, minute
  function onPopKey(e) {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    const cols = [...popRef.current.querySelectorAll("[data-wheel]")];
    const i = cols.indexOf(document.activeElement);
    if (i < 0) return;
    e.preventDefault();
    const next = (i + (e.key === "ArrowRight" ? 1 : -1) + cols.length) % cols.length;
    cols[next]?.focus({ preventScroll: true });
  }

  // phone: blur only the nearest "picker zone" (e.g. the slots panel)
  const zone =
    !isDesktop && mounted ? triggerRef.current?.closest("[data-picker-zone]") : null;

  const motion = visible
    ? "translate-y-0 scale-100 opacity-100"
    : `scale-95 opacity-0 ${coords.openUp || !isDesktop ? "translate-y-1" : "-translate-y-1"}`;

  const panel = (
    <div
      ref={popRef}
      role="dialog"
      aria-modal={!isDesktop}
      aria-label="Choose time"
      onKeyDown={onPopKey}
      style={
        isDesktop
          ? { position: "fixed", top: coords.top, left: coords.left, width: POP_W }
          : { width: POP_W, maxWidth: "100%" }
      }
      className={`${isDesktop ? "z-[100]" : "relative"} flex flex-col gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-2.5 shadow-xl
        transition-[opacity,transform] duration-150 ease-out
        ${coords.openUp && isDesktop ? "origin-bottom" : "origin-top"} ${motion}`}
    >
      <Period value={ap} onChange={(p) => commit(h12, p, cur.m)} />

      <div className="group relative flex">
        <div
          aria-hidden="true"
          style={{ top: 0, height: ITEM }}
          className="pointer-events-none absolute inset-x-0 rounded-lg border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] transition-colors group-focus-within:border-[color-mix(in_srgb,var(--color-primary)_55%,transparent)]"
        />
        <Wheel items={HOURS} value={h12} label="Hour" onChange={(h) => commit(h, ap, cur.m)} />
        <div
          aria-hidden="true"
          style={{ height: ITEM }}
          className="relative z-10 flex items-center text-sm font-semibold text-[var(--color-text-muted)]"
        >
          :
        </div>
        <Wheel items={MINUTES} value={cur.m} label="Minute" onChange={(m) => commit(h12, ap, m)} />
      </div>

      <button
        type="button"
        onClick={close}
        className="h-8 w-full rounded-md bg-[var(--color-primary)] text-xs font-medium text-[var(--color-surface)] transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
      >
        Done
      </button>
    </div>
  );

  return (
    <>
      <button
        type="button"
        ref={triggerRef}
        aria-label={ariaLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={`flex h-9 w-full items-center justify-between gap-2 whitespace-nowrap rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 text-sm tabular-nums text-[var(--color-text)] outline-none transition-colors hover:border-[color-mix(in_srgb,var(--color-primary)_45%,transparent)] focus-visible:ring-1 focus-visible:ring-[var(--color-ring)] ${className}`}
      >
        <span className={display ? "" : "text-[var(--color-text-muted)]"}>{display || placeholder}</span>
        <Clock3 size={14} className="shrink-0 text-[var(--color-text-muted)]" />
      </button>

      {mounted &&
        createPortal(
          isDesktop ? (
            panel
          ) : (
            <div
              className={`${zone ? "absolute" : "fixed"} inset-0 z-[100] flex items-center justify-center overflow-y-auto p-4`}
            >
              <div
                aria-hidden="true"
                onClick={close}
                className={`absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-150 ${
                  visible ? "opacity-100" : "opacity-0"
                }`}
              />
              {panel}
            </div>
          ),
          zone || document.body,
        )}
    </>
  );
}
