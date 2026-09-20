import { Clock, MapPin, Users } from "lucide-react";
import { formatDuration, formatTime } from "./subjectDetailUtils";
import { CustomScrollbar } from "../../../components/ui/CustomScrollbar";

export default function ScheduleSection({ entries, timetableId, scheduleDays, fade }) {
  return (
    <section className="flex min-h-0 flex-1 basis-0 flex-col">
      <h4 className="mb-base shrink-0 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
        Weekly schedule
      </h4>
      <div className="relative flex min-h-0 flex-1">
        <div
          ref={fade.ref}
          onScroll={fade.onScroll}
          className="h-full min-w-0 flex-1 overflow-y-auto scrollbar-hidden"
        >
          {entries.length === 0 ? (
            <p className="text-sm text-[var(--color-text-muted)]">
              {timetableId
                ? "Not scheduled in this workspace."
                : "Select a workspace to see scheduling."}
            </p>
          ) : (
            <div className="flex flex-col gap-comfy">
              {scheduleDays.map((day) => (
                <div
                  key={day.key}
                  className="rounded-lg border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-text)_4%,transparent)] px-comfy py-comfy"
                >
                  <div className="flex items-center justify-between gap-inline">
                    <span className="text-sm font-semibold text-[var(--color-text)]">
                      {day.label}
                    </span>
                    <span className="rounded-md border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-text)_7%,transparent)] px-base py-hair text-[11px] font-medium tracking-tight text-[var(--color-text-muted)]">
                      {day.totalLabel}
                    </span>
                  </div>

                  <ul className="relative mt-cozy flex flex-col gap-cozy pl-comfy">
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
                          <div className="flex items-start justify-between gap-snug text-xs">
                            <span className="flex shrink-0 items-center gap-tight whitespace-nowrap text-[var(--color-text-muted)]">
                              <Clock size={11} className="shrink-0" />
                              {formatTime(entry.start_time)} - {formatTime(entry.end_time)}
                            </span>

                            <div className="flex flex-wrap items-center justify-end gap-snug">
                              {duration && (
                                <span className="shrink-0 rounded-md border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-text)_6%,transparent)] px-chip-sm-x py-chip-sm-y text-[10px] font-medium text-[var(--color-text-muted)]">
                                  {duration}
                                </span>
                              )}

                              <span className="flex shrink-0 items-center gap-tight rounded-md border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-surface)_55%,transparent)] px-chip-sm-x py-chip-sm-y text-[10px] font-medium text-[var(--color-text)] backdrop-blur-md">
                                <Users size={10} />
                                {groupLabel}
                              </span>

                              {entry.room && (
                                <span className="flex max-w-[100px] items-center gap-tight rounded-md border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-surface)_55%,transparent)] px-chip-sm-x py-chip-sm-y text-[10px] font-medium text-[var(--color-text)] backdrop-blur-md">
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

        <CustomScrollbar scrollRef={fade.ref} />

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
