import { useEffect, useRef, useState } from "react";
import {
  Check,
  File,
  FileSpreadsheet,
  FileText,
  Link2,
  RotateCcw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import {
  CONTENT_OPTIONS,
  DEFAULT_VAULT_FILTERS,
  SORT_OPTIONS,
  TYPE_OPTIONS,
  countActiveFilters,
} from "./vaultFilters";

const TYPE_ICONS = { link: Link2, pdf: FileText, doc: File, sheet: FileSpreadsheet };

const toggleIn = (list, id) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

function Section({ title, children }) {
  return (
    <div className="flex flex-col gap-inline">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
        {title}
      </p>
      {children}
    </div>
  );
}

function ToggleChip({ active, Icon, label, onClick }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`inline-flex items-center gap-snug rounded-lg border px-cozy py-snug text-xs font-medium transition-colors duration-150 focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-ring)] ${
        active
          ? "border-[var(--color-primary)]/60 bg-[var(--color-primary)]/15 text-[var(--color-primary)]"
          : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-text)]"
      }`}
    >
      {Icon && <Icon size={13} />}
      {label}
    </button>
  );
}

export default function VaultFilterBar({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const activeCount = countActiveFilters(value);
  const set = (patch) => onChange({ ...value, ...patch });

  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

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
    if (!open) return undefined;
    const onDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative flex shrink-0 items-center gap-inline">
      <div className="relative flex-1">
        <Search
          size={15}
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
        />
        <input
          type="text"
          value={value.query}
          onChange={(e) => set({ query: e.target.value })}
          placeholder="Search resources or folders..."
          aria-label="Search resources or folders"
          className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] py-base pl-9 pr-9 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-ring)]"
        />
        {value.query && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => set({ query: "" })}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-tight text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <div ref={rootRef}>
        <button
          ref={triggerRef}
          type="button"
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className={`inline-flex items-center gap-inline rounded-lg border px-comfy py-base text-sm font-medium transition-colors duration-200 focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-ring)] ${
            activeCount > 0 || open
              ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
              : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
          }`}
        >
          <SlidersHorizontal
            size={14}
            className={activeCount > 0 || open ? "text-[var(--color-primary)]" : ""}
          />
          Filters
          {activeCount > 0 && (
            <span className="inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[var(--color-primary)] px-tight text-[10px] font-bold text-[var(--color-primary-fg)]">
              {activeCount}
            </span>
          )}
        </button>

        {mounted && (
          <div className="absolute inset-x-0 top-full z-30 pt-roomy sm:left-auto sm:right-0 sm:w-80">
            <div
              role="dialog"
              aria-label="Vault filters"
              className={`flex max-h-[70dvh] origin-top-right flex-col gap-roomy overflow-y-auto scrollbar-cadence rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-roomy shadow-lg transition-all duration-150 ease-out ${
                visible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 -translate-y-1"
              }`}
            >
              <div className="flex h-6 items-center justify-between">
                <p className="text-sm font-semibold text-[var(--color-text)]">Filters</p>
                {activeCount > 0 && (
                  <button
                    type="button"
                    onClick={() => onChange({ ...DEFAULT_VAULT_FILTERS, query: value.query })}
                    className="inline-flex items-center gap-tight rounded-md px-snug py-tight text-xs font-medium text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
                  >
                    <RotateCcw size={12} />
                    Reset
                  </button>
                )}
              </div>

              <Section title="Resource type">
                <div className="flex flex-wrap gap-snug">
                  {TYPE_OPTIONS.map(({ id, label }) => (
                    <ToggleChip
                      key={id}
                      Icon={TYPE_ICONS[id]}
                      label={label}
                      active={value.types.includes(id)}
                      onClick={() => set({ types: toggleIn(value.types, id) })}
                    />
                  ))}
                </div>
              </Section>

              <Section title="Workspace contents">
                <div className="flex flex-wrap gap-snug">
                  {CONTENT_OPTIONS.map(({ id, label }) => (
                    <ToggleChip
                      key={id}
                      label={label}
                      active={value.contents.includes(id)}
                      onClick={() => set({ contents: toggleIn(value.contents, id) })}
                    />
                  ))}
                </div>
              </Section>

              <Section title="Sort by">
                <div role="radiogroup" aria-label="Sort order" className="flex flex-col gap-snug">
                  {SORT_OPTIONS.map(({ id, label, hint }) => {
                    const selected = value.sort === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => set({ sort: id })}
                        className={`flex items-center justify-between rounded-lg px-cozy py-base text-left text-sm transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-ring)] ${
                          selected
                            ? "bg-[var(--color-primary)]/10 text-[var(--color-text)]"
                            : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-text)]"
                        }`}
                      >
                        <span>
                          {label}
                          <span className="ml-base text-xs opacity-60">{hint}</span>
                        </span>
                        {selected && <Check size={14} className="text-[var(--color-primary)]" />}
                      </button>
                    );
                  })}
                </div>
              </Section>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
