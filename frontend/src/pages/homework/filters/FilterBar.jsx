import { Search, SlidersHorizontal } from "lucide-react";

export default function FilterBar({ filters, setFilter, activeCount, open, onToggle }) {
  return (
    <div className="flex shrink-0 items-center gap-2">
      <div className="relative flex-1">
        <Search
          size={15}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
        />
        <input
          type="text"
          value={filters.search}
          onChange={(e) => setFilter("search", e.target.value)}
          placeholder="Search homework..."
          className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] py-2 pl-9 pr-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-ring)]"
        />
      </div>

      <button
        type="button"
        onClick={onToggle}
        aria-haspopup="true"
        aria-expanded={open}
        className={`group inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors duration-200 ${
          activeCount > 0 || open
            ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
            : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
        }`}
      >
        <SlidersHorizontal size={14} className={activeCount > 0 || open ? "text-[var(--color-primary)]" : ""} />
        Filters
        {activeCount > 0 && (
          <span className="inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[var(--color-primary)] px-1 text-[10px] font-bold text-[var(--color-primary-fg)]">
            {activeCount}
          </span>
        )}
      </button>
    </div>
  );
}
