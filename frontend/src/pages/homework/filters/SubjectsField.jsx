import { useEffect, useRef, useState, useLayoutEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Search } from "lucide-react";
import Checkbox from "../../../components/ui/Checkbox";
import SectionLabel from "./SectionLabel";

const ITEM_HEIGHT = 36;
const LIST_PADDING = 8;
const VISIBLE_ITEMS = 6;
const SEARCH_BAR_HEIGHT = 44;
const FADE_THRESHOLD = 4;

export default function SubjectsField({ subjects, selectedIds, onToggle }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [search, setSearch] = useState("");
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, openUp: false });
  const [showTopFade, setShowTopFade] = useState(false);
  const [showBottomFade, setShowBottomFade] = useState(false);
  const triggerRef = useRef(null);
  const panelRef = useRef(null);
  const scrollRef = useRef(null);

  const filtered = subjects.filter((s) =>
    s.name.toLowerCase().includes(search.trim().toLowerCase())
  );

  const selectedNames = subjects
    .filter((s) => selectedIds.includes(s.id))
    .map((s) => s.name);

  let summary = "All subjects";
  if (selectedNames.length === 1) summary = selectedNames[0];
  else if (selectedNames.length > 1) summary = `${selectedNames.length} subjects selected`;

  const listHeight =
    filtered.length > VISIBLE_ITEMS
      ? VISIBLE_ITEMS * ITEM_HEIGHT + LIST_PADDING
      : undefined;
  const estimatedListHeight = filtered.length * ITEM_HEIGHT + LIST_PADDING;
  const panelHeight = SEARCH_BAR_HEIGHT + (listHeight ?? estimatedListHeight);

  const updateScrollFades = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setShowTopFade(el.scrollTop > FADE_THRESHOLD);
    setShowBottomFade(
      el.scrollHeight - el.scrollTop - el.clientHeight > FADE_THRESHOLD
    );
  }, []);

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
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUp = spaceBelow < panelHeight + 12 && rect.top > panelHeight + 12;

      setCoords({
        top: openUp ? rect.top - panelHeight - 8 : rect.bottom + 8,
        left: rect.left,
        width: rect.width,
        openUp,
      });
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    return () => window.removeEventListener("resize", updatePosition);
  }, [open, panelHeight]);

  useLayoutEffect(() => {
    if (!open) return;
    updateScrollFades();
  }, [open, filtered.length, updateScrollFades]);

  useEffect(() => {
    if (!open) return;
    function onScroll(e) {
      if (panelRef.current && panelRef.current.contains(e.target)) return;
      setOpen(false);
    }
    window.addEventListener("scroll", onScroll, true);
    return () => window.removeEventListener("scroll", onScroll, true);
  }, [open]);

  useEffect(() => {
    function onClickOutside(e) {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target) &&
        panelRef.current && !panelRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div className="flex w-full flex-col gap-2">
      <SectionLabel>Subjects</SectionLabel>

      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-left text-sm text-[var(--color-text)] transition-shadow duration-150 focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-ring)]"
      >
        <span className={selectedNames.length ? "" : "text-[var(--color-text-muted)]"}>
          {summary}
        </span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-[var(--color-text-muted)] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {mounted &&
        createPortal(
          <div
            ref={panelRef}
            style={{ position: "fixed", top: coords.top, left: coords.left, width: coords.width }}
            className={`z-[100] flex flex-col overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg
              transition-all duration-150 ease-out
              ${coords.openUp ? "origin-bottom" : "origin-top"}
              ${
                visible
                  ? "opacity-100 scale-100 translate-y-0"
                  : `opacity-0 scale-95 ${coords.openUp ? "translate-y-1" : "-translate-y-1"}`
              }`}
          >
            <div className="relative shrink-0 border-b border-[var(--color-border)] p-1.5">
              <Search
                size={13}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
              />
              <input
                type="text"
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search subjects..."
                className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface-alt)] py-1.5 pl-7 pr-2 text-xs text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none"
              />
            </div>

            <div className="relative p-1">
              <div
                ref={scrollRef}
                onScroll={updateScrollFades}
                style={{ maxHeight: listHeight }}
                className="scrollbar-cadence overflow-y-auto p-1"
              >
                {filtered.length === 0 ? (
                  <p className="px-2 py-2 text-xs text-[var(--color-text-muted)]">No subjects found.</p>
                ) : (
                  filtered.map((s) => (
                    <div
                      key={s.id}
                      style={{ height: ITEM_HEIGHT }}
                      className="flex items-center rounded-md px-2 hover:bg-[var(--color-surface-alt)]"
                    >
                      <Checkbox
                        id={`filter-subject-${s.id}`}
                        label={s.name}
                        checked={selectedIds.includes(s.id)}
                        onChange={() => onToggle(s.id)}
                      />
                    </div>
                  ))
                )}
              </div>

              <div
                aria-hidden="true"
                className={`pointer-events-none absolute inset-x-0 top-0 z-10 h-5 bg-gradient-to-b from-[var(--color-surface)] to-transparent transition-opacity duration-200 ${showTopFade ? "opacity-100" : "opacity-0"}`}
              />
              <div
                aria-hidden="true"
                className={`pointer-events-none absolute inset-x-0 bottom-0 z-10 h-5 bg-gradient-to-t from-[var(--color-surface)] to-transparent transition-opacity duration-200 ${showBottomFade ? "opacity-100" : "opacity-0"}`}
              />
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
