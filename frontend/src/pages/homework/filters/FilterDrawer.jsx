import { Sparkles, X } from "lucide-react";
import DueSelect from "./DueSelect";
import FilterChip from "./FilterChip";
import SectionLabel from "./SectionLabel";
import SubjectsField from "./SubjectsField";

const PRIORITY_OPTIONS = [
  { value: "high", label: "High" },
  { value: "normal", label: "Normal" },
  { value: "low", label: "Low" },
];

const STATUS_OPTIONS_FILTER = [
  { value: "todo", label: "To do" },
  { value: "in_progress", label: "In progress" },
  { value: "done", label: "Done" },
];

export default function FilterDrawer({
  open,
  onClose,
  filters,
  setFilter,
  toggleInList,
  reset,
  activeCount,
  subjects,
  dueCounts,
}) {
  return (
    <>
      <div
        aria-hidden="true"
        onClick={onClose}
        className={`absolute inset-0 z-30 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 ease-out ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <div
        role="dialog"
        aria-label="Homework filters"
        aria-hidden={!open}
        className={`absolute inset-0 z-40 w-full p-1.5 sm:p-3 transition-[opacity,transform] duration-300 ease-out sm:left-auto sm:max-w-sm ${open ? "opacity-100 sm:translate-x-0" : "pointer-events-none opacity-0 sm:translate-x-full sm:opacity-100"}`}
      >
          <div className={`relative flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[var(--color-drawer)] transition-shadow duration-300 ${open ? "drawer-elevated" : ""}`}>
          <div className="relative z-10 flex shrink-0 items-center justify-between border-b border-[var(--color-line)] px-3 pb-3 pt-3 sm:px-5 sm:pb-4 sm:pt-5">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-[var(--color-primary)]" />
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-primary)]">
                Refine your homework
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={reset}
                tabIndex={activeCount > 0 ? 0 : -1}
                aria-hidden={activeCount === 0}
                className={`whitespace-nowrap rounded-lg border border-[var(--color-primary)] px-2.5 py-1 text-xs font-medium text-[var(--color-primary)] transition-opacity duration-200 ease-out hover:bg-[var(--color-primary)]/10 ${
                  activeCount > 0 ? "opacity-100" : "pointer-events-none opacity-0"
                }`}
              >
                Clear all filters
              </button>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close filters"
                className="rounded-md p-1 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-fill-4)] hover:text-[var(--color-text)]"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          <div className="relative flex min-h-0 flex-1">
<div className="scrollbar-hidden min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3 sm:px-5 sm:py-5">
            <div className="flex flex-col gap-5 sm:gap-0 sm:divide-y divide-[var(--color-line)] w-full min-h-full items-center justify-between">
              <div className="pb-0 sm:pb-4 w-full">
                <SubjectsField
                  subjects={subjects}
                  selectedIds={filters.subjectIds}
                  onToggle={(id) => toggleInList("subjectIds", id)}
                />
              </div>

              <div className="py-0 sm:py-4 w-full">
                <SectionLabel>Priority</SectionLabel>
                <div className="flex flex-wrap gap-2">
                  {PRIORITY_OPTIONS.map((p) => (
                    <FilterChip
                      key={p.value}
                      active={filters.priorities.includes(p.value)}
                      onClick={() => toggleInList("priorities", p.value)}
                    >
                      {p.label}
                    </FilterChip>
                  ))}
                </div>
              </div>

              <div className="py-0 sm:py-4 w-full">
                <SectionLabel>Status</SectionLabel>
                <div className="flex flex-wrap gap-2">
                  {STATUS_OPTIONS_FILTER.map((s) => (
                    <FilterChip
                      key={s.value}
                      active={filters.statuses.includes(s.value)}
                      onClick={() => toggleInList("statuses", s.value)}
                    >
                      {s.label}
                    </FilterChip>
                  ))}
                </div>
              </div>

              <div className="pt-0 sm:hidden w-full">
                <SectionLabel>Due date</SectionLabel>
                <DueSelect inline value={filters.due} onChange={(v) => setFilter("due", v)} counts={dueCounts} />
              </div>
            </div>
          </div>
</div>
        </div>
      </div>
    </>
  );
}
