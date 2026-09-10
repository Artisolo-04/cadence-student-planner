import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Folder, FolderPlus, Search } from "lucide-react";
import { ITEM_HEIGHT, LIST_PADDING, VISIBLE_ITEMS } from "../constants";
import useDropdownPosition from "./useDropdownPosition";

export default function FolderCombobox({ value, onChange, options }) {
  const [query, setQuery] = useState(value || "");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((name) => name.toLowerCase().includes(q));
  }, [query, options]);

  const exactMatch = options.some((name) => name.toLowerCase() === query.trim().toLowerCase());
  const showCreateOption = query.trim().length > 0 && !exactMatch;
  const rowCount = filtered.length + (showCreateOption ? 1 : 0);

  const { wrapperRef, listRef, mounted, visible, coords, listHeight } = useDropdownPosition({
    open,
    rowCount,
    itemHeight: ITEM_HEIGHT,
    listPadding: LIST_PADDING,
    visibleItems: VISIBLE_ITEMS,
    onRequestClose: () => setOpen(false),
  });

  function selectFolder(name) {
    onChange(name);
    setQuery(name);
    setOpen(false);
  }

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <Search
          size={15}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
        />
        <input
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange(e.target.value);
            setOpen(true);
          }}
          placeholder="Search or create a folder…"
          className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] py-2 pl-9 pr-3 text-sm text-[var(--color-text)]
            placeholder:text-[var(--color-text-muted)] transition-shadow duration-150
            focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-ring)] focus-visible:border-[var(--color-ring)]"
        />
      </div>

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
            {showCreateOption && (
              <li className="mb-1 border-b border-[var(--color-border)] pb-1">
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => selectFolder(query.trim())}
                  className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-left text-sm font-medium
                    text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary)]/10"
                >
                  <FolderPlus size={16} className="shrink-0" />
                  <span className="shrink-0">Create folder</span>
                  <span
                    className="ml-auto flex max-w-[55%] items-center justify-center truncate rounded-md px-2.5 py-1 text-xs font-semibold leading-none"
                    style={{
                      backgroundColor: "color-mix(in srgb, var(--color-primary) 16%, transparent)",
                      color: "var(--color-primary)",
                    }}
                  >
                    {query.trim()}
                  </span>
                </button>
              </li>
            )}

            {filtered.length === 0 && !showCreateOption && (
              <li className="px-3 py-2 text-sm text-[var(--color-text-muted)]">
                Start typing to create a folder
              </li>
            )}

            {filtered.map((name) => {
              const isSelected = name === value;
              return (
                <li key={name}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => selectFolder(name)}
                    className={`flex w-full items-center justify-between gap-2 rounded-sm px-3 py-2 text-left text-sm
                      transition-colors hover:bg-[var(--color-surface-alt)]
                      ${isSelected ? "font-medium text-[var(--color-primary)]" : "text-[var(--color-text)]"}`}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <Folder size={15} className="shrink-0 text-[var(--color-text-muted)]" />
                      <span className="truncate">{name}</span>
                    </span>
                    {isSelected && <Check size={16} className="shrink-0" />}
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
