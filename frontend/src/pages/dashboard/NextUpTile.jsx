import EmptyState from "../../components/ui/EmptyState";
import { Hourglass as EmptyNextIcon } from "lucide-react";
import { ArrowUpRight } from "lucide-react";

function formatMinutesUntil(minutes) {
  if (minutes <= 0) return "starting now";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `in ${h}h ${m}m`;
  if (h > 0) return `in ${h}h`;
  return `in ${m}m`;
}

function toMinutes(hhmm) {
  if (!hhmm) return null;
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + (m || 0);
}

export default function NextUpTile({ session }) {
  const minutesUntil = session
    ? toMinutes(session.start) -
      (new Date().getHours() * 60 + new Date().getMinutes())
    : null;

  const accent = session?.color || "var(--color-primary)";

  return (
    <div
      className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 p-5 backdrop-blur-xl"
      style={{
        backgroundImage: `linear-gradient(150deg, color-mix(in srgb, ${accent} 22%, transparent) 0%, color-mix(in srgb, var(--color-primary) 10%, transparent) 60%, transparent 100%)`,
      }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full opacity-20 blur-3xl"
        style={{ backgroundColor: accent }}
      />

      <div className="relative z-10 flex h-full flex-col">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--color-primary)]">
            <ArrowUpRight size={12} />
            Next Up
          </div>

          {session && (
            <div className="flex items-center gap-2">
              {!(session.concurrent?.length > 0 && !session.hasGroupFilter) && (
                <>
                  <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: accent }}
                    />
                    {session.groupTag || "All"}
                  </span>
                  <span className="inline-flex shrink-0 items-center whitespace-nowrap rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 font-mono text-[11px] font-semibold text-[var(--color-text-muted)]">
                    {session.start?.slice(0, 5)}–{session.end?.slice(0, 5)}
                  </span>
                </>
              )}
              <span
                className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-md border px-2 py-1 text-[11px] font-bold"
                style={{
                  borderColor: `color-mix(in srgb, ${accent} 40%, transparent)`,
                  backgroundColor: `color-mix(in srgb, ${accent} 15%, transparent)`,
                  color: accent,
                }}
              >
                {minutesUntil != null
                  ? formatMinutesUntil(minutesUntil)
                  : "starting now"}
              </span>
            </div>
          )}
        </div>

        {session ? (
          session.concurrent?.length > 0 && !session.hasGroupFilter ? (
            <div className="mt-3 grid flex-1 auto-rows-fr grid-cols-1 gap-4 sm:grid-cols-2">
              {[session, ...session.concurrent].map((s) => (
                <div
                  key={s.key}
                  className="flex min-w-0 flex-col gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ backgroundColor: s.color }}
                      />
                      <span className="shrink-0 rounded border border-white/10 px-1 text-[9px] font-bold uppercase tracking-wide text-[var(--color-text)]">
                        {s.groupTag || "All"}
                      </span>
                    </div>
                    <span className="font-mono text-[11px] text-[var(--color-text-muted)]">
                      {s.start?.slice(0, 5)}–{s.end?.slice(0, 5)}
                    </span>
                  </div>
                  <p className="truncate text-sm font-semibold leading-tight text-[var(--color-text)]">
                    {s.subjectName}
                  </p>
                  {(s.teacher || s.room) && (
                    <p className="truncate text-[11px] text-[var(--color-text-muted)]">
                      {s.teacher}
                      {s.room ? ` · ${s.room}` : ""}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <>
              <p className="mt-3 truncate text-xl font-semibold leading-tight text-[var(--color-text)]">
                {session.subjectName}
              </p>

              {(session.teacher || session.room) && (
                <p className="mt-1 truncate text-xs text-[var(--color-text-muted)]">
                  {session.teacher}
                  {session.room ? ` · ${session.room}` : ""}
                </p>
              )}

              <div className="mt-auto space-y-2 pt-3">
                {session.concurrent?.length > 0 && (
                  <div className="space-y-1 border-t border-white/10 pt-2">
                    <p className="text-[9px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                      Also at this time
                    </p>
                    {session.concurrent.map((extra) => (
                      <div
                        key={extra.key}
                        className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]"
                      >
                        <span
                          className="h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{ backgroundColor: extra.color }}
                        />
                        <span className="shrink-0 rounded border border-white/10 px-1 text-[9px] font-bold uppercase text-[var(--color-text)]">
                          {extra.groupTag || "All"}
                        </span>
                        <span className="truncate">{extra.subjectName}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )
        ) : (
          <EmptyState variant="tight" icon={EmptyNextIcon} title="You are free for now" body="No more sessions today." />
        )}
      </div>
    </div>
  );
}
