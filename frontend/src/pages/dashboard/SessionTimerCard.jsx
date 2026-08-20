import { Timer } from "lucide-react";
import { useEffect, useState } from "react";

function toMinutes(hhmm) {
  if (!hhmm) return null;
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + (m || 0);
}

function pad(n) {
  return String(n).padStart(2, "0");
}

function formatHMS(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${pad(h)}:${pad(m)}:${pad(sec)}`;
}

export default function SessionTimerCard({ sessions = [], currentKey }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const nowSeconds =
    now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  const nowMin = Math.floor(nowSeconds / 60);

  const current = sessions.find((s) => s.key === currentKey);
  const next = sessions.find((s) => toMinutes(s.start) > nowMin);

  let mode = "idle";
  let target = null;
  let session = null;
  let fillPct = 0;

  if (current) {
    mode = "current";
    session = current;
    const startSec = toMinutes(current.start) * 60;
    const endSec = toMinutes(current.end) * 60;
    target = endSec;
    const total = Math.max(1, endSec - startSec);
    fillPct = Math.min(100, Math.max(0, ((target - nowSeconds) / total) * 100));
  } else if (next) {
    mode = "next";
    session = next;
    target = toMinutes(next.start) * 60;
    fillPct = 100;
  }

  const remaining = target != null ? target - nowSeconds : 0;
  const accentColor = session?.color ?? "var(--color-primary)";

  return (
    <div
      className="relative h-full w-full overflow-hidden rounded-2xl border border-white/10 p-5 backdrop-blur-xl"
      style={{
        backgroundImage:
          "linear-gradient(150deg, color-mix(in srgb, var(--color-primary) 18%, transparent) 0%, color-mix(in srgb, var(--color-accent) 8%, transparent) 60%, transparent 100%)",
      }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full opacity-20 blur-3xl"
        style={{ backgroundColor: accentColor }}
      />

      <div className="relative z-10 flex h-full flex-col">
        <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--color-primary)]">
          <Timer size={12} />
          {mode === "current" ? "In session" : mode === "next" ? "Up next" : "Timer"}
        </div>

        <div className="mt-4 flex flex-1 items-stretch gap-4 border-t border-white/10 pt-4">
          <div className="flex w-7 shrink-0 flex-col-reverse gap-[3px]">
            {Array.from({ length: 14 }).map((_, i) => {
              const rowThreshold = ((i + 1) / 14) * 100;
              const isLit = mode !== "idle" && fillPct >= rowThreshold;
              return (
                <div
                  key={i}
                  className="w-full flex-1 rounded-sm transition-colors duration-300"
                  style={
                    isLit
                      ? {
                          backgroundColor: accentColor,
                          boxShadow: `0 0 6px color-mix(in srgb, ${accentColor} 65%, transparent)`,
                        }
                      : { backgroundColor: "rgba(255,255,255,0.06)" }
                  }
                />
              );
            })}
          </div>

          <div className="flex min-w-0 flex-1 flex-col justify-center">
            <p className="truncate text-sm font-medium text-[var(--color-text)]">
              {mode !== "idle" ? session.subjectName : "Nothing scheduled"}
            </p>
            <p className="text-xs text-[var(--color-text-muted)]">
              {mode === "current" && "in progress"}
              {mode === "next" && `starts ${session.start.slice(0, 5)}`}
              {mode === "idle" && "no upcoming session"}
            </p>

            <span
              className="mt-3 font-mono text-2xl font-bold tabular-nums leading-none"
              style={{ color: mode === "idle" ? "var(--color-text)" : accentColor }}
            >
              {mode === "idle" ? formatHMS(nowSeconds) : formatHMS(remaining)}
            </span>
            <p className="mt-0.5 text-[10px] uppercase tracking-wide text-[var(--color-text-muted)]">
              {mode === "current" && "left"}
              {mode === "next" && "to go"}
              {mode === "idle" && "now"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
