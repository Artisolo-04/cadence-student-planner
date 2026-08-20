import { useEffect, useState } from "react";
import { BarChart2 } from "lucide-react";

function toMinutes(hhmm) {
  if (!hhmm) return null;
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + (m || 0);
}

function pad(n) {
  return String(n).padStart(2, "0");
}

const BAR_COUNT = 40;

export default function DayTimeline({ sessions = [] }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const hasSessions = sessions.length > 0;
  const dayStart = hasSessions ? toMinutes(sessions[0].start) : 0;
  const dayEnd = hasSessions ? toMinutes(sessions[sessions.length - 1].end) : 0;
  const dayTotal = Math.max(1, dayEnd - dayStart);

  const nowMin = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
  const fillPct = hasSessions
    ? Math.min(100, Math.max(0, ((nowMin - dayStart) / dayTotal) * 100))
    : 0;

  return (
    <div
      className="relative h-full min-h-0 flex-1 overflow-hidden rounded-2xl border border-white/10 p-4 backdrop-blur-xl"
      style={{
        backgroundImage:
          "linear-gradient(150deg, color-mix(in srgb, var(--color-primary) 18%, transparent) 0%, color-mix(in srgb, var(--color-accent) 8%, transparent) 60%, transparent 100%)",
      }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full opacity-20 blur-3xl"
        style={{ backgroundColor: "var(--color-primary)" }}
      />

      <div className="relative z-10 flex h-full flex-col justify-between">
        <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--color-primary)]">
          <span className="flex items-center gap-1.5">
            <BarChart2 size={12} />
            Today
          </span>
          <span className="font-mono normal-case tracking-normal text-[var(--color-text)]">
            {pad(now.getHours())}:{pad(now.getMinutes())}:{pad(now.getSeconds())}
          </span>
        </div>

        {hasSessions ? (
          <div className="mt-4">
            <div className="flex w-full items-center gap-[3px]">
              {Array.from({ length: BAR_COUNT }).map((_, i) => {
                const colThreshold = ((i + 1) / BAR_COUNT) * 100;
                const isLit = fillPct >= colThreshold;
                return (
                  <div
                    key={i}
                    className="flex-1 rounded-full transition-colors duration-300"
                    style={
                      isLit
                        ? {
                            maxHeight: "2px",
                            height: "2px",
                            backgroundColor: "var(--color-primary)",
                            boxShadow:
                              "0 0 4px color-mix(in srgb, var(--color-primary) 55%, transparent)",
                          }
                        : {
                            maxHeight: "2px",
                            height: "2px",
                            backgroundColor: "rgba(255,255,255,0.06)",
                          }
                    }
                  />
                );
              })}
            </div>

            <div className="mt-1.5 flex justify-between font-mono text-[9px] text-[var(--color-text-muted)]">
              <span>
                {String(Math.floor(dayStart / 60)).padStart(2, "0")}:
                {String(dayStart % 60).padStart(2, "0")}
              </span>
              <span>
                {String(Math.floor(dayEnd / 60)).padStart(2, "0")}:
                {String(dayEnd % 60).padStart(2, "0")}
              </span>
            </div>
          </div>
        ) : (
          <p className="mt-4 text-center text-xs text-[var(--color-text-muted)]">
            Nothing scheduled today.
          </p>
        )}
      </div>
    </div>
  );
}
