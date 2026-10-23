import { Search, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useState } from "react";
import DueSelect from "./DueSelect";
import SortSelect from "./SortSelect";

function useDueInBar() {
  const query = "(min-width: 640px)";
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setMatches(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return matches;
}

export default function FilterBar({ filters, setFilter, activeCount, open, onToggle, dueCounts }) {
  const dueInBar = useDueInBar();
  const panelCount = dueInBar && filters.due !== "all" ? activeCount - 1 : activeCount;
  const highlighted = panelCount > 0 || open;

  return (
    <div className="flex shrink-0 items-stretch gap-2">
      <div className="relative min-w-0 flex-1">
        <Search
          size={15}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
        />
        <input
          type="text"
          value={filters.search}
          onChange={(e) => setFilter("search", e.target.value)}
          placeholder="Search homework..."
          className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] py-2 pl-9 pr-9 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-ring)]"
        />
        {filters.search && (
          <button
            type="button"
            onClick={() => setFilter("search", "")}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <DueSelect value={filters.due} onChange={(v) => setFilter("due", v)} counts={dueCounts} />
      <SortSelect value={filters.sort} onChange={(v) => setFilter("sort", v)} />

      <button
        type="button"
        onClick={onToggle}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label="Filters"
        className={`group relative inline-flex aspect-square items-center justify-center gap-2 rounded-lg border p-0 text-sm font-medium transition-colors duration-200 sm:aspect-auto sm:px-3 sm:py-2 ${
          highlighted
            ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
            : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
        }`}
      >
        <SlidersHorizontal size={14} className={highlighted ? "text-[var(--color-primary)]" : ""} />
        <span className="hidden sm:inline">Filters</span>
        {panelCount > 0 && (
          <span className="absolute -right-1.5 -top-1.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[var(--color-primary)] px-1 text-[10px] font-bold text-[var(--color-primary-fg)] sm:static">
            {panelCount}
          </span>
        )}
      </button>
    </div>
  );
}
