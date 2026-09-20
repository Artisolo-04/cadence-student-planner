import { useEffect, useRef, useState } from "react";
import { CalendarDays, Check, ChevronDown } from "lucide-react";
import ThemeToggle from "../ui/ThemeToggle";
import UserMenu from "./UserMenu";
import { useWorkspace } from "../../hooks/useWorkspace";

function MobileWorkspaceButton() {
  const { timetables, activeId, activeWorkspace, selectWorkspace, loading } = useWorkspace();

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
      const t = setTimeout(() => setMounted(false), 150);
      return () => clearTimeout(t);
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

  if (loading || timetables.length === 0) return null;

  function handleSelect(id) {
    selectWorkspace(id);
    setOpen(false);
  }

  const label = activeWorkspace?.name ?? "Select workspace";

  return (
    <div className="relative flex md:hidden" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-snug h-9 max-w-[140px] px-cozy rounded-md shrink-0
          border border-[var(--color-border)] bg-[var(--color-surface)]
          hover:bg-[var(--color-surface-alt)] hover:border-[var(--color-primary)]/60
          transition-colors duration-200
          focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
      >
        <CalendarDays size={15} className="shrink-0 text-[var(--color-primary)]" />
        <span className="truncate text-[13px] font-medium text-[var(--color-text)]">
          {label}
        </span>
        <ChevronDown
          size={14}
          className="shrink-0 text-[var(--color-text-muted)] transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>

      {mounted && (
        <div
          role="menu"
          className={`absolute right-0 top-full mt-base w-56 rounded-lg border border-[var(--color-border)]
            bg-[var(--color-surface)] shadow-lg p-tight z-30 origin-top-right
            transition-all duration-150 ease-out
            ${visible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 -translate-y-1"}`}
        >
          <div className="px-comfy py-base border-b mb-tight border-[var(--color-border)]">
            <p className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide">
              Your timetables
            </p>
          </div>
          <ul role="listbox" className="max-h-64 overflow-y-auto scrollbar-cadence">
            {timetables.map((t) => {
              const isSelected = String(t.id) === String(activeId);
              return (
                <li key={t.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(t.id)}
                    className={`w-full flex items-center justify-between gap-inline px-comfy py-base text-sm text-left rounded-sm
                      hover:bg-[var(--color-surface-alt)] transition-colors
                      ${isSelected ? "text-[var(--color-primary)] font-medium" : "text-[var(--color-text)]"}`}
                  >
                    <span className="truncate">{t.name}</span>
                    {isSelected && <Check size={16} className="shrink-0" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function TopBar() {
  return (
    <header className="flex items-center justify-between px-roomy md:px-8 py-base border-b border-[var(--color-border)]">
      <span className="text-lg font-semibold text-[var(--color-primary)]">Cadence</span>
      <div className="flex items-center gap-inline md:gap-comfy">
        <ThemeToggle />
        <MobileWorkspaceButton />
        <UserMenu />
      </div>
    </header>
  );
}
