import { Clock, MapPin, Users } from "lucide-react";
import { formatDuration, formatTime } from "./subjectDetailUtils";

export default function ScheduleSection({ entries, timetableId, scheduleDays, fade }) {
  return (
    <section className="flex min-h-0 flex-1 basis-0 flex-col">
      <h4 className="mb-2 shrink-0 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
        Weekly schedule
      </h4>
      <div className="relative min-h-0 flex-1">
        <div
          ref={fade.ref}
          onScroll={fade.onScroll}
          className="h-full overflow-y-auto scrollbar-cadence pr-1"
        >
          {entries.length === 0 ? (
            <p className="text-sm text-[var(--color-text-muted)]">
              {timetableId
                ? "Not scheduled in this workspace."
                : "Select a workspace to see scheduling."}
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {scheduleDays.map((day) => (
                <div
                  key={day.key}
                  className="rounded-lg border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-text)_4%,transparent)] px-3 py-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-[var(--color-text)]">
                      {day.label}
                    </span>
                    <span className="rounded-md border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-text)_7%,transparent)] px-2 py-0.5 text-[11px] font-medium tracking-tight text-[var(--color-text-muted)]">
                      {day.totalLabel}
                    </span>
                  </div>

                  <ul className="relative mt-2.5 flex flex-col gap-2.5 pl-3">
                    <span
                      aria-hidden="true"
                      className="absolute left-0 top-1 bottom-1 w-[3px] rounded-full bg-[color-mix(in_srgb,var(--color-primary)_20%,transparent)]"
                    />
                    {day.entries.map((entry) => {
                      const duration = formatDuration(entry.start_time, entry.end_time);
                      const groupLabel =
                        entry.group_tag && entry.group_tag !== "all"
                          ? entry.group_tag.toUpperCase()
                          : "All";

                      return (
                        <li key={entry.id}>
                          <div className="flex items-start justify-between gap-1.5 text-xs">
                            <span className="flex shrink-0 items-center gap-1 whitespace-nowrap text-[var(--color-text-muted)]">
                              <Clock size={11} className="shrink-0" />
                              {formatTime(entry.start_time)} - {formatTime(entry.end_time)}
                            </span>

                            <div className="flex flex-wrap items-center justify-end gap-1.5">
                              {duration && (
                                <span className="shrink-0 rounded-md border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-text)_6%,transparent)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--color-text-muted)]">
                                  {duration}
                                </span>
                              )}

                              <span className="flex shrink-0 items-center gap-1 rounded-md border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-surface)_55%,transparent)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--color-text)] backdrop-blur-md">
                                <Users size={10} />
                                {groupLabel}
                              </span>

                              {entry.room && (
                                <span className="flex max-w-[100px] items-center gap-1 rounded-md border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-surface)_55%,transparent)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--color-text)] backdrop-blur-md">
                                  <MapPin size={10} className="shrink-0" />
                                  <span className="truncate">{entry.room}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>

        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-x-0 top-0 z-10 h-8 bg-gradient-to-b from-[var(--color-surface)] to-transparent transition-opacity duration-200 ${
            fade.showTop ? "opacity-100" : "opacity-0"
          }`}
        />
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-x-0 bottom-0 z-10 h-10 bg-gradient-to-t from-[var(--color-surface)] to-transparent transition-opacity duration-200 ${
            fade.showBottom ? "opacity-100" : "opacity-0"
          }`}
        />
      </div>
    </section>
  );
}
