import { useEffect, useRef, useState } from "react";
import { Check, Coffee, Moon, Target } from "lucide-react";

const FADE_SIZE = 28;

function toMinutes(hhmm) {
  if (!hhmm) return null;
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + (m || 0);
}

function formatGap(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

export default function FocusTimeline({ sessions }) {
  const [now, setNow] = useState(() => new Date());
  const scrollRef = useRef(null);
  const [showTopFade, setShowTopFade] = useState(false);
  const [showBottomFade, setShowBottomFade] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  function updateScrollFades() {
    const element = scrollRef.current;
    if (!element) return;
    setShowTopFade(element.scrollTop > 4);
    setShowBottomFade(
      element.scrollTop + element.clientHeight < element.scrollHeight - 4
    );
  }

  useEffect(() => {
    const frame = requestAnimationFrame(updateScrollFades);
    window.addEventListener("resize", updateScrollFades);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", updateScrollFades);
    };
  }, [sessions]);

  const nowMin = now.getHours() * 60 + now.getMinutes();
  const hasSessions = sessions && sessions.length > 0;

  const dayStart = hasSessions ? toMinutes(sessions[0].start) : null;
  const dayEnd = hasSessions ? toMinutes(sessions[sessions.length - 1].end) : null;
  const dayTotal = hasSessions ? Math.max(1, dayEnd - dayStart) : 1;

  const doneCount = hasSessions
    ? sessions.filter((s) => toMinutes(s.end) <= nowMin).length
    : 0;

  let freeMinutes = 0;
  const scrubberSegments = [];
  if (hasSessions) {
    sessions.forEach((session, i) => {
      const start = toMinutes(session.start);
      const end = toMinutes(session.end);
      scrubberSegments.push({
        type: "session",
        key: session.key,
        color: session.color,
        widthPct: ((end - start) / dayTotal) * 100,
      });
      const next = sessions[i + 1];
      if (next) {
        const gapMin = toMinutes(next.start) - end;
        if (gapMin > 0) {
          freeMinutes += gapMin;
          scrubberSegments.push({
            type: "gap",
            key: `${session.key}-gap`,
            widthPct: (gapMin / dayTotal) * 100,
          });
        }
      }
    });
  }

  const nowPct =
    hasSessions && nowMin >= dayStart && nowMin <= dayEnd
      ? ((nowMin - dayStart) / dayTotal) * 100
      : null;

  const maskImage = hasSessions
    ? `linear-gradient(to bottom, ${
        showTopFade ? `transparent 0, black ${FADE_SIZE}px` : "black 0"
      }, ${
        showBottomFade
          ? `black calc(100% - ${FADE_SIZE}px), transparent 100%`
          : "black 100%"
      })`
    : undefined;

  const timelineGroups = [];
  if (hasSessions) {
    sessions.forEach((session) => {
      const lastGroup = timelineGroups[timelineGroups.length - 1];
      if (lastGroup && lastGroup.start === session.start && lastGroup.end === session.end) {
        lastGroup.items.push(session);
      } else {
        timelineGroups.push({ start: session.start, end: session.end, items: [session] });
      }
    });
  }

  return (
    <div
      className="relative flex h-full w-full flex-col overflow-hidden rounded-2xl border border-white/10 p-5 backdrop-blur-xl"
      style={{
        backgroundImage:
          "linear-gradient(150deg, color-mix(in srgb, var(--color-primary) 18%, transparent) 0%, color-mix(in srgb, var(--color-accent) 8%, transparent) 60%, transparent 100%)",
      }}
    >
      <div className="relative z-10 flex h-full flex-col">
        <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--color-primary)]">
          <Target size={12} />
          Focus
        </div>

        {hasSessions && (
          <div className="mt-3">
            <div className="flex items-center justify-between font-mono text-[10px] text-[var(--color-text-muted)]">
              <span>
                {doneCount}/{sessions.length} done
              </span>
              {freeMinutes > 0 && <span>{formatGap(freeMinutes)} free</span>}
            </div>
            <div className="relative mt-1.5 flex h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
              {scrubberSegments.map((seg) =>
                seg.type === "session" ? (
                  <div
                    key={seg.key}
                    className="h-full"
                    style={{ width: `${seg.widthPct}%`, backgroundColor: seg.color }}
                  />
                ) : (
                  <div
                    key={seg.key}
                    className="h-full bg-white/10"
                    style={{ width: `${seg.widthPct}%` }}
                  />
                )
              )}
              {nowPct != null && (
                <div
                  className="absolute top-1/2 h-3 w-[2px] -translate-y-1/2 rounded-full bg-[var(--color-text)]"
                  style={{ left: `${nowPct}%` }}
                />
              )}
            </div>
          </div>
        )}

        {!hasSessions && (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
            <Target size={22} className="text-[var(--color-text-muted)]" />
            <p className="text-sm font-medium text-[var(--color-text)]">Nothing scheduled today</p>
            <p className="text-xs text-[var(--color-text-muted)]">Enjoy the free time.</p>
          </div>
        )}

        {hasSessions && (
          <div
            ref={scrollRef}
            onScroll={updateScrollFades}
            style={
              maskImage ? { maskImage, WebkitMaskImage: maskImage } : {}
            }
            className="scrollbar-cadence relative mt-4 flex-1 min-h-0 overflow-y-auto border-t border-white/10 pl-1 pr-1 pt-4 transition-[mask-image] duration-150"
          >
            {timelineGroups.map((group, gi) => {
              const start = toMinutes(group.start);
              const end = toMinutes(group.end);
              const isCurrent = nowMin >= start && nowMin < end;
              const isPast = end <= nowMin;
              const progress = isCurrent
                ? Math.min(100, Math.max(0, ((nowMin - start) / (end - start)) * 100))
                : 0;
              const minutesLeft = isCurrent ? Math.max(0, end - nowMin) : 0;
              const isLast = gi === timelineGroups.length - 1;
              const isSplit = group.items.length > 1;

              const nextGroup = timelineGroups[gi + 1];
              const gap = nextGroup ? toMinutes(nextGroup.start) - end : null;

              const nodeAccent = isSplit ? "var(--color-primary)" : group.items[0].color;

              const nodeStyle = isCurrent
                ? {
                    backgroundColor: nodeAccent,
                    borderColor: nodeAccent,
                    color: "#fff",
                    boxShadow: `0 0 0 4px color-mix(in srgb, ${nodeAccent} 25%, transparent)`,
                  }
                : isPast
                ? {
                    backgroundColor: "var(--color-primary)",
                    borderColor: "var(--color-primary)",
                    color: "var(--color-primary-fg)",
                  }
                : {
                    backgroundColor: "transparent",
                    borderColor: "rgba(255,255,255,0.16)",
                    color: "var(--color-text-muted)",
                  };

              return (
                <div key={`${group.start}-${group.end}`} className="flex gap-2">
                  <div className="flex flex-col items-center">
                    <span
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 font-mono text-[9px] font-bold transition-colors duration-300"
                      style={nodeStyle}
                    >
                      {isPast ? <Check size={10} strokeWidth={3} /> : `S${gi + 1}`}
                    </span>

                    {!isLast && (
                      <div className="relative my-1 w-[2px] flex-1 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="absolute inset-x-0 top-0 rounded-full transition-[height] duration-500"
                          style={{
                            height: isPast ? "100%" : isCurrent ? `${progress}%` : "0%",
                            backgroundColor: isCurrent ? nodeAccent : "var(--color-primary)",
                          }}
                        />
                      </div>
                    )}
                  </div>

                  <div className={`min-w-0 flex-1 ${isLast ? "pb-0.5" : "pb-4"}`}>
                    {}
                    <div
                      className={
                        isSplit
                          ? "flex flex-col gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-2"
                          : ""
                      }
                    >
                      {group.items.map((session, idx) => {
                        const badgeLabel = session.groupTag || (isSplit ? `G${idx + 1}` : "All");
                        const isNotLastInGroup = isSplit && idx < group.items.length - 1;

                        return (
                          <div key={session.key}>
                            <div
                              className={`min-w-0 w-full rounded-lg ${isCurrent ? "px-2 py-1.5" : "py-0.5"} ${
                                isPast ? "opacity-50" : ""
                              }`}
                              style={
                                isCurrent
                                  ? {
                                      backgroundColor: "rgba(255,255,255,0.06)",
                                      boxShadow: [
                                        `inset 0 0 24px -6px color-mix(in srgb, ${session.color} 55%, transparent)`,
                                        `inset 0 0 0 1px color-mix(in srgb, ${session.color} 30%, transparent)`,
                                      ].join(", "),
                                    }
                                  : undefined
                              }
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="flex items-center gap-1.5">
                                  {isSplit && (
                                    <span
                                      className="h-1.5 w-1.5 shrink-0 rounded-full"
                                      style={{ backgroundColor: session.color }}
                                    />
                                  )}
                                  <p className="font-mono text-[11px] text-[var(--color-text-muted)]">
                                    {group.start.slice(0, 5)}–{group.end.slice(0, 5)}
                                  </p>
                                </span>
                                <span className="flex shrink-0 items-center gap-1">
                                  <span
                                    className="inline-flex items-center rounded-md border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide"
                                    style={
                                      isSplit
                                        ? {
                                            borderColor: `color-mix(in srgb, ${session.color} 40%, transparent)`,
                                            backgroundColor: `color-mix(in srgb, ${session.color} 14%, transparent)`,
                                            color: session.color,
                                          }
                                        : {
                                            borderColor: "rgba(255,255,255,0.15)",
                                            backgroundColor: "rgba(255,255,255,0.04)",
                                            color: "var(--color-text-muted)",
                                          }
                                    }
                                  >
                                    {badgeLabel}
                                  </span>
                                  {isCurrent && (
                                    <span
                                      className="inline-flex items-center rounded-md border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide"
                                      style={{
                                        borderColor: `color-mix(in srgb, ${session.color} 45%, transparent)`,
                                        backgroundColor: `color-mix(in srgb, ${session.color} 18%, transparent)`,
                                        color: session.color,
                                      }}
                                    >
                                      now
                                    </span>
                                  )}
                                </span>
                              </div>

                              <p
                                className={`mt-0.5 truncate text-sm ${
                                  isCurrent ? "font-semibold text-[var(--color-text)]" : "text-[var(--color-text-muted)]"
                                }`}
                              >
                                {session.subjectName}
                              </p>

                              {(session.teacher || session.room) && (
                                <p className="truncate text-[11px] text-[var(--color-text-muted)]">
                                  {session.teacher}
                                  {session.room ? ` · ${session.room}` : ""}
                                </p>
                              )}

                              {isCurrent && (
                                <>
                                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                                    <div
                                      className="h-full rounded-full"
                                      style={{ width: `${progress}%`, backgroundColor: session.color }}
                                    />
                                  </div>
                                  <p className="mt-1 font-mono text-[11px] font-medium" style={{ color: session.color }}>
                                    {minutesLeft}m left
                                  </p>
                                </>
                              )}
                            </div>

                            {isNotLastInGroup && (
                              <div className="mx-1 border-t border-white/[0.08]" />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {gap != null && gap >= 15 && (
                      <div className="mt-2 inline-flex items-center gap-1 rounded-md border border-dashed border-white/15 px-2 py-1 font-mono text-[10px] text-[var(--color-text-muted)]">
                        {gap >= 180 ? <Moon size={10} /> : <Coffee size={10} />}
                        {formatGap(gap)} free
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
