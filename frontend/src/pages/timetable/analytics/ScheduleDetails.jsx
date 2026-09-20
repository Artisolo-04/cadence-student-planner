import { DAY_LABELS_FULL, entrySortValue, entryTimeLabel } from "./chartTokens";

export default function ScheduleDetails({ entries = [], slots = [] }) {
  const sortedEntries = [...entries].sort((a, b) =>
    entrySortValue(a, slots).localeCompare(entrySortValue(b, slots))
  );

  if (!sortedEntries.length) {
    return (
      <p className="py-base text-sm text-[var(--color-text-muted)]">
        No scheduled classes found.
      </p>
    );
  }

  return (
    <div className="space-y-base">
      {sortedEntries.map((entry) => (
        <article
          key={entry.id}
          className="flex items-center gap-comfy rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-alt)]/45 px-comfy py-cozy"
        >
          <span
            className="h-9 w-1 shrink-0 rounded"
            style={{ backgroundColor: entry.subject_color || "#5eead4" }}
          />

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-[var(--color-text)]">
              {entry.subject_name}
            </p>
            <p className="mt-hair text-xs text-[var(--color-text-muted)]">
              {DAY_LABELS_FULL[entry.day_of_week]} · {entryTimeLabel(entry, slots)}
            </p>
          </div>

          <span
            className="shrink-0 rounded-md border border-[var(--color-border)] px-chip-x py-chip-y text-[11px] text-[var(--color-text-muted)]"
            title={entry.room || "No room assigned"}
          >
            {entry.room || "No room"}
          </span>
        </article>
      ))}
    </div>
  );
}
