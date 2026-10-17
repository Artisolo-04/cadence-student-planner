import EmptyState from "../../components/ui/EmptyState";
import { CustomScrollbar } from "../../components/ui/CustomScrollbar";
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

export default function FocusTimeline({ week = [], now = new Date() }) {
  const scrollRef = useRef(null);
  const [showTopFade, setShowTopFade] = useState(false);
  const [showBottomFade, setShowBottomFade] = useState(false);

  const todayEntry = week.find((d) => d.isToday) ?? week[0] ?? null;
  const [selectedDay, setSelectedDay] = useState(() => todayEntry?.day ?? null);

  useEffect(() => {
    if (selectedDay == null && todayEntry) setSelectedDay(todayEntry.day);
  }, [todayEntry, selectedDay]);

  function updateScrollFades() {
    const element = scrollRef.current;
    if (!element) return;
    setShowTopFade(element.scrollTop > 4);
    setShowBottomFade(
      element.scrollTop + element.clientHeight < element.scrollHeight - 4
    );
  }

  const selected = week.find((d) => d.day === selectedDay) ?? todayEntry;
  const sessions = selected?.sessions ?? [];
  const showLive = !!selected?.isToday;

  useEffect(() => {
    const frame = requestAnimationFrame(updateScrollFades);
    window.addEventListener("resize", updateScrollFades);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", updateScrollFades);
    };
  }, [sessions]);

  const nowMin = showLive ? now.getHours() * 60 + now.getMinutes() : null;
  const hasSessions = sessions && sessions.length > 0;

  const orderedSessions = [...sessions].sort(
    (a, b) =>
      toMinutes(a.start) - toMinutes(b.start) ||
      toMinutes(b.end) - toMinutes(a.end)
  );

  const dayStart = hasSessions ? toMinutes(orderedSessions[0].start) : null;
  const dayEnd = hasSessions
    ? Math.max(...orderedSessions.map((session) => toMinutes(session.end)))
    : null;
  const dayTotal = hasSessions ? Math.max(1, dayEnd - dayStart) : 1;

  const doneCount =
    hasSessions && showLive
      ? orderedSessions.filter((session) => toMinutes(session.end) <= nowMin).length
      : 0;

  const timelineGroups = [];
  if (hasSessions) {
    orderedSessions.forEach((session) => {
      const lastGroup = timelineGroups[timelineGroups.length - 1];
      const sessionStart = toMinutes(session.start);
      const sessionEnd = toMinutes(session.end);
      const lastGroupEnd = lastGroup ? toMinutes(lastGroup.end) : null;

      if (lastGroup && sessionStart < lastGroupEnd) {
        lastGroup.items.push(session);
        if (sessionEnd > lastGroupEnd) lastGroup.end = session.end;
      } else {
        timelineGroups.push({
          start: session.start,
          end: session.end,
          items: [session],
        });
      }
    });
  }

  let freeMinutes = 0;
  const scrubberSegments = [];
  timelineGroups.forEach((group, index) => {
    const start = toMinutes(group.start);
    const end = toMinutes(group.end);
    const nextGroup = timelineGroups[index + 1];

    scrubberSegments.push({
      type: "session",
      key: group.items.map((session) => session.key).join("-"),
      color: group.items.length > 1 ? "var(--color-primary)" : group.items[0].color,
      widthPct: ((end - start) / dayTotal) * 100,
    });

    if (nextGroup) {
      const gapMin = toMinutes(nextGroup.start) - end;
      if (gapMin > 0) {
        freeMinutes += gapMin;
        scrubberSegments.push({
          type: "gap",
          key: `${group.end}-${nextGroup.start}-gap`,
          widthPct: (gapMin / dayTotal) * 100,
        });
      }
    }
  });

  const nowPct =
    hasSessions && showLive && nowMin >= dayStart && nowMin <= dayEnd
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

  return (
    <div
      className="focus-timeline relative flex h-full w-full flex-col overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5 backdrop-blur-xl"
      style={{
        backgroundImage:
          "linear-gradient(150deg, color-mix(in srgb, var(--color-primary) 18%, transparent) 0%, color-mix(in srgb, var(--color-tint) 8%, transparent) 60%, transparent 100%)",
      }}
    >
      <div className="relative z-10 flex h-full flex-col">
        <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--color-primary)]">
          <Target size={12} />
          Focus
        </div>

        {week.length > 0 && (
          <div className="mt-3 grid grid-cols-7 gap-1 rounded-lg border border-[var(--color-line-strong)] bg-[var(--color-fill-1)] p-1">
            {week.map((d) => {
              const isSelected = d.day === selected?.day;
              return (
                <button
                  key={d.day}
                  type="button"
                  onClick={() => setSelectedDay(d.day)}
                  className={`rounded-md py-1.5 text-[9px] font-bold uppercase tracking-wide transition-colors ${
                    isSelected
                      ? "bg-[var(--color-primary)] text-[var(--color-primary-fg)]"
                      : d.isToday
                      ? "text-[var(--color-primary)] hover:bg-[var(--color-fill-4)]"
                      : "text-[var(--color-text-muted)] hover:bg-[var(--color-fill-4)]"
                  }`}
                >
                  {d.label}
                </button>
              );
            })}
          </div>
        )}

        {hasSessions && (
          <div className="mt-3">
            <div className="flex items-center justify-between font-mono text-[10px] text-[var(--color-text-muted)]">
              <span>
                {showLive ? `${doneCount}/${sessions.length} done` : `${sessions.length} scheduled`}
              </span>
              {freeMinutes > 0 && <span>{formatGap(freeMinutes)} free</span>}
            </div>
            <div className="relative mt-1.5 flex h-2 w-full overflow-hidden rounded-full bg-[var(--color-fill-3)]">
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
                    className="h-full bg-[var(--color-fill-4)]"
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
          <EmptyState className="flex-1" icon={Target} title="Nothing scheduled today" body="Enjoy the free time." />
        )}

        {hasSessions && (
          <div className="mt-4 flex min-h-0 flex-1 border-t border-[var(--color-line)] pt-2">
            <div
              ref={scrollRef}
              onScroll={updateScrollFades}
              style={
                maskImage ? { maskImage, WebkitMaskImage: maskImage } : {}
              }
              className="scrollbar-hidden relative min-w-0 flex-1 overflow-y-auto pl-1 pr-1 pt-1 transition-[mask-image] duration-150"
            >
              {timelineGroups.map((group, gi) => {
                const start = toMinutes(group.start);
                const end = toMinutes(group.end);
                const isCurrent = showLive && nowMin >= start && nowMin < end;
                const isPast = showLive && end <= nowMin;
                const progress = isCurrent
                  ? Math.min(100, Math.max(0, ((nowMin - start) / (end - start)) * 100))
                  : 0;
                const minutesLeft = isCurrent ? Math.max(0, end - nowMin) : 0;
                const isLast = gi === timelineGroups.length - 1;
                const isSplit = group.items.length > 1;

                const nextGroup = timelineGroups[gi + 1];
                const gap = nextGroup ? toMinutes(nextGroup.start) - end : null;

                const isActiveGap = Boolean(
                  showLive &&
                    nextGroup &&
                    nowMin >= end &&
                    nowMin < toMinutes(nextGroup.start)
                );
                const gapProgress = isActiveGap
                  ? Math.min(100, Math.max(0, ((nowMin - end) / gap) * 100))
                  : 0;

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
                      borderColor: "var(--color-line-strong)",
                      color: "var(--color-text-muted)",
                    };

                const sessionsByGroup = new Map();
                group.items.forEach((session) => {
                  const groupKey = session.groupTag ?? "all";
                  if (!sessionsByGroup.has(groupKey)) sessionsByGroup.set(groupKey, []);
                  sessionsByGroup.get(groupKey).push(session);
                });
                const displaySessions = [...sessionsByGroup.values()].flatMap((lane) => {
                  const orderedLane = [...lane].sort(
                    (a, b) =>
                      toMinutes(a.start) - toMinutes(b.start) ||
                      toMinutes(a.end) - toMinutes(b.end)
                  );
                  return orderedLane.map((session, index) => ({
                    session,
                    nextSession: orderedLane[index + 1] ?? null,
                  }));
                });

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
                        <div className="relative my-1 w-[2px] flex-1 overflow-hidden rounded-full bg-[var(--color-fill-4)]">
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
                            ? "flex flex-col gap-2 rounded-xl border border-[var(--color-line)] bg-[var(--color-fill-1)] p-2"
                            : ""
                        }
                      >
                        {displaySessions.map(({ session, nextSession }, idx) => {
                          const sessionStart = toMinutes(session.start);
                          const sessionEnd = toMinutes(session.end);
                          const sessionIsCurrent =
                            showLive && nowMin >= sessionStart && nowMin < sessionEnd;
                          const sessionIsPast = showLive && sessionEnd <= nowMin;
                          const sessionProgress = sessionIsCurrent
                            ? Math.min(
                                100,
                                Math.max(
                                  0,
                                  ((nowMin - sessionStart) / (sessionEnd - sessionStart)) * 100
                                )
                              )
                            : 0;
                          const sessionMinutesLeft = sessionIsCurrent
                            ? Math.max(0, sessionEnd - nowMin)
                            : 0;
                            const badgeLabel =
                              session.groupTag && session.groupTag !== "all"
                                ? session.groupTag
                                : "All";
                          const sessionGap = nextSession
                            ? toMinutes(nextSession.start) - sessionEnd
                            : null;
                          const nextSessionStart = nextSession
                            ? toMinutes(nextSession.start)
                            : null;
                          const isActiveSessionGap = Boolean(
                            showLive &&
                              sessionGap > 0 &&
                              nowMin >= sessionEnd &&
                              nowMin < nextSessionStart
                          );
                          const sessionGapProgress = isActiveSessionGap
                            ? Math.min(
                                100,
                                Math.max(0, ((nowMin - sessionEnd) / sessionGap) * 100)
                              )
                            : 0;
                          const isNotLastInGroup = Boolean(nextSession);

                          return (
                            <div key={session.key}>
                              <div
                                className={`min-w-0 w-full rounded-lg ${sessionIsCurrent ? "px-2 py-1.5" : "py-0.5"} ${
                                  sessionIsPast ? "opacity-65" : ""
                                }`}
                                style={
                                  sessionIsCurrent
                                    ? {
                                        backgroundColor: `color-mix(in srgb, ${session.color} var(--focus-active-tint), var(--focus-active-base))`,
                                        backgroundImage: `linear-gradient(135deg, color-mix(in srgb, white var(--focus-active-sheen), transparent), transparent 58%)`,
                                        backdropFilter: "blur(10px)",
                                        boxShadow: [
                                          `inset 0 0 22px -12px color-mix(in srgb, ${session.color} var(--focus-active-glow), transparent)`,
                                          `inset 0 0 0 1px color-mix(in srgb, ${session.color} 30%, var(--color-line))`,
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
                                      {session.start.slice(0, 5)}–{session.end.slice(0, 5)}
                                    </p>
                                  </span>
                                  <span className="flex shrink-0 items-center gap-1">
                                    <span
                                      className="inline-flex shrink-0 items-center rounded-md border border-[var(--color-line-strong)] bg-[var(--color-fill-2)] px-1.5 py-0.5 font-mono text-[9px] text-[var(--color-text-muted)]"
                                      title="Session duration"
                                    >
                                      {formatGap(sessionEnd - sessionStart)}
                                    </span>
                                    <span
                                      className="inline-flex items-center rounded-md border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide"
                                      style={
                                        isSplit
                                          ? {
                                              borderColor: `color-mix(in srgb, ${session.color} 42%, var(--color-line))`,
                                              backgroundColor: `color-mix(in srgb, ${session.color} 16%, var(--focus-active-base))`,
                                              color: session.color,
                                            }
                                          : {
                                              borderColor: "var(--color-line-strong)",
                                              backgroundColor: "var(--color-fill-2)",
                                              color: "var(--color-text-muted)",
                                            }
                                      }
                                    >
                                      {badgeLabel}
                                    </span>
                                    {sessionIsCurrent && (
                                      <span
                                        className="inline-flex items-center rounded-md border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide"
                                        style={{
                                          borderColor: `color-mix(in srgb, ${session.color} 45%, var(--color-line))`,
                                          backgroundColor: `color-mix(in srgb, ${session.color} 22%, var(--focus-active-base))`,
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
                                    sessionIsCurrent ? "font-semibold text-[var(--color-text)]" : "text-[var(--color-text-muted)]"
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

                                {sessionIsCurrent && (
                                  <>
                                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--color-fill-4)]">
                                      <div
                                        className="h-full rounded-full"
                                        style={{ width: `${sessionProgress}%`, backgroundColor: session.color }}
                                      />
                                    </div>
                                    <p className="mt-1 font-mono text-[11px] font-medium" style={{ color: session.color }}>
                                      {formatGap(sessionMinutesLeft)} left
                                    </p>
                                  </>
                                )}
                              </div>

                              {sessionGap > 0 ? (
                                <div className="mt-2 w-full">
                                  <div
                                    className={`flex w-full items-center justify-between gap-3 rounded-md border border-dashed border-[var(--color-line-strong)] px-2 py-1 font-mono text-[10px] text-[var(--color-text-muted)] ${
                                      isActiveSessionGap
                                        ? "animate-cadence-focus-breathe border-[var(--color-primary)] text-[var(--color-primary)]"
                                        : ""
                                    }`}
                                  >
                                    <span className="inline-flex min-w-0 items-center gap-1">
                                      {sessionGap >= 180 ? <Moon size={10} /> : <Coffee size={10} />}
                                      <span>{isActiveSessionGap ? "Break now" : "Break"}</span>
                                    </span>
                                    <span className="shrink-0 text-right">
                                      {isActiveSessionGap
                                        ? `${formatGap(nextSessionStart - nowMin)} left · ${formatGap(sessionGap)} total`
                                        : `${formatGap(sessionGap)} free`}
                                    </span>
                                  </div>
                                  {isActiveSessionGap && (
                                    <div
                                      className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-[var(--color-fill-4)]"
                                      role="progressbar"
                                      aria-label="Break time elapsed"
                                      aria-valuemin={0}
                                      aria-valuemax={100}
                                      aria-valuenow={Math.round(sessionGapProgress)}
                                    >
                                      <div
                                        className="h-full rounded-full bg-[var(--color-primary)] transition-[width] duration-500 motion-reduce:transition-none"
                                        style={{ width: `${sessionGapProgress}%` }}
                                      />
                                    </div>
                                  )}
                                </div>
                              ) : isNotLastInGroup ? (
                                <div className="mx-1 border-t border-[var(--color-line)]" />
                              ) : null}
                            </div>
                          );
                        })}
                      </div>

                      {gap != null && gap > 0 && (
                        <div className="mt-2 w-full">
                          <div
                            className={`flex w-full items-center justify-between gap-3 rounded-md border border-dashed border-[var(--color-line-strong)] px-2 py-1 font-mono text-[10px] text-[var(--color-text-muted)] ${
                              isActiveGap
                                ? "animate-cadence-focus-breathe border-[var(--color-primary)] text-[var(--color-primary)]"
                                : ""
                            }`}
                          >
                            <span className="inline-flex min-w-0 items-center gap-1">
                              {gap >= 180 ? <Moon size={10} /> : <Coffee size={10} />}
                              <span>{isActiveGap ? "Break now" : "Break"}</span>
                            </span>
                            <span className="shrink-0 text-right">
                              {isActiveGap
                                ? `${formatGap(toMinutes(nextGroup.start) - nowMin)} left · ${formatGap(gap)} total`
                                : `${formatGap(gap)} free`}
                            </span>
                          </div>
                          {isActiveGap && (
                            <div
                              className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-[var(--color-fill-4)]"
                              role="progressbar"
                              aria-label="Break time elapsed"
                              aria-valuemin={0}
                              aria-valuemax={100}
                              aria-valuenow={Math.round(gapProgress)}
                            >
                              <div
                                className="h-full rounded-full bg-[var(--color-primary)] transition-[width] duration-500 motion-reduce:transition-none"
                                style={{ width: `${gapProgress}%` }}
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <CustomScrollbar scrollRef={scrollRef} />
          </div>
        )}
      </div>
    </div>
  );
}
