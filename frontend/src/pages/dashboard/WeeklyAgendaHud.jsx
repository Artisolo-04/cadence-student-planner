import { useState } from "react";
import { CalendarDays } from "lucide-react";

export default function WeeklyAgendaHud({ week }) {
  const [selectedDay, setSelectedDay] = useState(null);

  const selected = selectedDay ? week.find((d) => d.day === selectedDay) : null;

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-white/10 p-5 backdrop-blur-xl"
      style={{
        backgroundImage:
          "linear-gradient(150deg, color-mix(in srgb, var(--color-primary) 16%, transparent) 0%, transparent 70%)",
      }}
    >
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--color-primary)]">
        <CalendarDays size={12} />
        Chronos
      </div>

      <div className="mt-3 grid grid-cols-7 gap-2">
        {week.map((d) => {
          const isSelected = d.day === selected?.day;
          return (
            <button
              key={d.day}
              type="button"
              onClick={() => setSelectedDay((prev) => (prev === d.day ? null : d.day))}
              className={`flex flex-col items-center gap-1.5 rounded-xl border px-1.5 py-2.5 transition-colors ${
                isSelected
                  ? "border-[var(--color-primary)]/50 bg-[var(--color-primary)]/10"
                  : "border-white/10 bg-white/[0.02] hover:bg-white/[0.05]"
              }`}
            >
              <span
                className={`text-[10px] font-semibold uppercase tracking-wide ${
                  d.isToday ? "text-[var(--color-primary)]" : "text-[var(--color-text-muted)]"
                }`}
              >
                {d.label}
              </span>
              <span
                className={`text-sm font-bold ${
                  d.isToday ? "text-[var(--color-primary)]" : "text-[var(--color-text)]"
                }`}
              >
                {d.dateNum}
              </span>

              <div className="flex h-2.5 flex-wrap items-center justify-center gap-0.5">
                {d.sessions.length === 0 ? (
                  <span className="h-1.5 w-1.5 rounded-full bg-white/10" />
                ) : (
                  d.sessions.slice(0, 6).map((s) => (
                    <span
                      key={s.key}
                      className="h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: s.color }}
                    />
                  ))
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div
        className="mt-4 overflow-hidden transition-[max-height] duration-300 ease-out"
        style={{ maxHeight: selected ? "280px" : "0px" }}
      >
        <div className="scrollbar-cadence max-h-[280px] overflow-y-auto border-t border-white/10 pt-3">
          {selected && selected.sessions.length > 0 ? (
            <div className="flex flex-col divide-y divide-white/[0.06]">
              {selected.sessions.map((s) => (
                <div key={s.key} className="flex items-center gap-3 py-2 first:pt-0">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: s.color }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[var(--color-text)]">
                      {s.subjectName}
                    </p>
                    <p className="truncate text-xs text-[var(--color-text-muted)]">
                      {s.teacher}
                      {s.room ? ` · ${s.room}` : ""}
                    </p>
                  </div>
                  <span className="shrink-0 font-mono text-xs text-[var(--color-text-muted)]">
                    {s.start?.slice(0, 5)}–{s.end?.slice(0, 5)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-2 text-xs text-[var(--color-text-muted)]">
              Nothing scheduled this day.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
