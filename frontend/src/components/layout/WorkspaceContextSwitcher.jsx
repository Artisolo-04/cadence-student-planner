import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CalendarDays, Check, ChevronDown, Layers } from "lucide-react";
import Tooltip from "../ui/Tooltip";
import { useWorkspace } from "../../hooks/useWorkspace";
import { useSidebar } from "../../hooks/useSidebar";

const ITEM_HEIGHT = 36;
const LIST_PADDING = 8;
const VISIBLE_ITEMS = 6;

export default function WorkspaceContextSwitcher() {
  const { timetables, activeId, activeWorkspace, selectWorkspace, loading } = useWorkspace();
  const { collapsed, contentVisible } = useSidebar();

  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const [openUpward, setOpenUpward] = useState(false);

  const triggerRef = useRef(null);
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
      const t = setTimeout(() => setMounted(false), 150);
      return () => clearTimeout(t);
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
      const BORDER_WIDTH = 2; 

      const listHeight =
        timetables.length > VISIBLE_ITEMS
          ? VISIBLE_ITEMS * ITEM_HEIGHT + LIST_PADDING + BORDER_WIDTH
          : timetables.length * ITEM_HEIGHT + LIST_PADDING + BORDER_WIDTH;

        if (collapsed) {
          const spaceBelow = window.innerHeight - rect.top;
          const flip = spaceBelow < listHeight + 12;

          const top = flip
            ? Math.max(rect.bottom - listHeight, 12)
            : rect.top;

          setOpenUpward(flip);
          setCoords({ top: Math.max(top, 12), left: rect.right + 16, width: 208 });
        } else {
        const spaceBelow = window.innerHeight - rect.bottom;
        const flip = spaceBelow < listHeight + 12 && rect.top > listHeight + 12;

        const top = flip
          ? Math.max(rect.top - listHeight - 10, 12)
          : rect.bottom + 6;

        setOpenUpward(flip);
        setCoords({ top, left: rect.left, width: rect.width });
      }
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    return () => window.removeEventListener("resize", updatePosition);
  }, [open, collapsed, timetables.length]);

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

  useEffect(() => {
    setOpen(false);
  }, [collapsed]);

  if (loading || timetables.length === 0) return null;

  function handleSelect(id) {
    selectWorkspace(id);
    setOpen(false);
  }

  const label = activeWorkspace?.name ?? "Select workspace";

  const listNode = mounted && (
    <ul
      ref={listRef}
      role="listbox"
      style={{
        position: "fixed",
        top: coords.top,
        left: coords.left,
        width: coords.width,
        maxHeight:
          timetables.length > VISIBLE_ITEMS
            ? VISIBLE_ITEMS * ITEM_HEIGHT + LIST_PADDING
            : undefined,
      }}
      className={`z-[100] overflow-y-auto scrollbar-cadence p-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg transition-all duration-200 ease-out ${
        openUpward ? "origin-bottom" : "origin-top"
      } ${
        visible
          ? "opacity-100 scale-100 translate-y-0"
          : `opacity-0 scale-95 ${openUpward ? "translate-y-1" : "-translate-y-1"}`
      }`}
    >
      {timetables.map((t) => {
        const isSelected = String(t.id) === String(activeId);
        return (
          <li key={t.id}>
            <button
              type="button"
              role="option"
              aria-selected={isSelected}
              onClick={() => handleSelect(t.id)}
              className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-sm text-left rounded-sm hover:bg-[var(--color-surface-alt)] transition-colors ${
                isSelected ? "text-[var(--color-primary)] font-medium" : "text-[var(--color-text)]"
              }`}
            >
              <span className="truncate">{t.name}</span>
              {isSelected && <Check size={16} className="shrink-0" />}
            </button>
          </li>
        );
      })}
    </ul>
  );

  if (collapsed) {
    const trigger = (
      <button
        type="button"
        ref={triggerRef}
        onClick={() => setOpen((o) => !o)}
        aria-label="Switch workspace"
        aria-expanded={open}
        className={`flex items-center justify-center w-full py-1.5 rounded-lg border border-white/10 bg-white/[0.03] text-[var(--color-text-muted)] backdrop-blur-md transition-colors duration-200 hover:bg-[var(--color-border)]/40 hover:text-[var(--color-text)] ${
          open ? "text-[var(--color-primary)] border-[var(--color-primary)]/40" : ""
        }`}
      >
        <span
          className={`flex items-center justify-center w-7 h-7 shrink-0 transition-opacity duration-150 ease-in-out ${
            contentVisible ? "opacity-100" : "opacity-0"
          }`}
        >
          <Layers size={16} strokeWidth={2} />
        </span>
      </button>
    );

    return (
      <div className="mb-2">
        {open ? trigger : <Tooltip label={`Workspace: ${label}`}>{trigger}</Tooltip>}
        {mounted && createPortal(listNode, document.body)}
      </div>
    );
  }

  return (
    <div className="mb-2">
      <button
        type="button"
        ref={triggerRef}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={`w-full flex items-center py-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2 backdrop-blur-md transition-colors duration-200 hover:bg-[var(--color-border)]/40 ${
          open ? "border-[var(--color-primary)]/40" : ""
        }`}
      >
        <span
          className={`flex items-center justify-center w-7 h-7 shrink-0 rounded-md bg-[var(--color-primary)]/15 text-[var(--color-primary)] transition-opacity duration-150 ease-in-out ${
            contentVisible ? "opacity-100" : "opacity-0"
          }`}
        >
          <CalendarDays size={14} />
        </span>
        <span
          className={`flex-1 overflow-hidden whitespace-nowrap text-left text-[13px] font-medium text-[var(--color-text)] transition-all duration-150 ease-in-out ${
            collapsed ? "max-w-0 ml-0" : "max-w-[160px] ml-2"
          } ${contentVisible ? "opacity-100" : "opacity-0"}`}
        >
          <span className="block truncate">{label}</span>
        </span>
        <ChevronDown
          size={14}
          className={`shrink-0 text-[var(--color-text-muted)] transition-opacity duration-150 ease-in-out ${
            contentVisible ? "opacity-100" : "opacity-0"
          }`}
          style={{
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 200ms ease-in-out",
          }}
        />
      </button>
      {mounted && createPortal(listNode, document.body)}
    </div>
  );
}
