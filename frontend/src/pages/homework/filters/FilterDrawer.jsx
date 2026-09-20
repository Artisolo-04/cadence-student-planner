import { Sparkles, X } from "lucide-react";
import Dropdown from "../../../components/ui/Dropdown";
import { DUE_FILTERS, SORT_OPTIONS } from "../homeworkUtils";
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
}) {
  return (
    <>
      <div
        aria-hidden="true"
        onClick={onClose}
        className={`absolute inset-0 z-30 bg-black/40 transition-opacity duration-300 ease-out ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <div
        role="dialog"
        aria-label="Homework filters"
        aria-hidden={!open}
        className="absolute inset-y-0 right-0 z-40 w-full max-w-sm transition-transform duration-300 ease-out"
        style={{ transform: open ? "translateX(0)" : "translateX(100%)" }}
      >
          <div className="relative flex h-full flex-col overflow-hidden rounded-l-2xl border-l border-white/10 bg-[var(--color-surface)] shadow-2xl shadow-black/50">
          <div className="relative z-10 flex shrink-0 items-center justify-between border-b border-white/10 px-plush pb-roomy pt-plush">
            <div className="flex items-center gap-inline">
              <Sparkles size={14} className="text-[var(--color-primary)]" />
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-primary)]">
                Refine your homework
              </span>
            </div>

            <div className="flex items-center gap-inline">
              <button
                type="button"
                onClick={reset}
                tabIndex={activeCount > 0 ? 0 : -1}
                aria-hidden={activeCount === 0}
                className={`whitespace-nowrap rounded-lg border border-[var(--color-primary)] px-cozy py-tight text-xs font-medium text-[var(--color-primary)] transition-opacity duration-200 ease-out hover:bg-[var(--color-primary)]/10 ${
                  activeCount > 0 ? "opacity-100" : "pointer-events-none opacity-0"
                }`}
              >
                Clear all filters
              </button>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close filters"
                className="rounded-md p-tight text-[var(--color-text-muted)] transition-colors hover:bg-white/10 hover:text-[var(--color-text)]"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          <div className="relative z-10 flex-1 overflow-y-auto px-plush py-plush ">
            <div className="flex flex-col divide-y divide-white/[0.06] w-full h-full items-center justify-between">
              <div className="pb-roomy w-full">
                <SubjectsField
                  subjects={subjects}
                  selectedIds={filters.subjectIds}
                  onToggle={(id) => toggleInList("subjectIds", id)}
                />
              </div>

              <div className="py-roomy w-full">
                <SectionLabel>Priority</SectionLabel>
                <div className="flex flex-wrap gap-inline">
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

              <div className="py-roomy w-full">
                <SectionLabel>Status</SectionLabel>
                <div className="flex flex-wrap gap-inline">
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

              <div className="grid grid-cols-1 gap-roomy pt-roomy w-full">
                <div>
                  <SectionLabel>Due date</SectionLabel>
                  <Dropdown
                    id="filter-due"
                    value={filters.due}
                    onChange={(e) => setFilter("due", e.target.value)}
                    options={DUE_FILTERS}
                  />
                </div>

                <div>
                  <SectionLabel>Sort by</SectionLabel>
                  <Dropdown
                    id="filter-sort"
                    value={filters.sort}
                    onChange={(e) => setFilter("sort", e.target.value)}
                    options={SORT_OPTIONS}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
