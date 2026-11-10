import { useLayoutEffect, useRef, useState } from "react";
import { CustomScrollbar } from "../../components/ui/CustomScrollbar";
import { formatMinutes } from "./analyticsUtils";
import { Empty, Stat } from "./DetailBits";

const tint = (color, pct) => `color-mix(in srgb, ${color} ${pct}%, transparent)`;

export default function SubjectDetail({ schedule }) {
  const subjects = [...(schedule?.bySubject ?? [])].sort(
    (a, b) => b.scheduledMinutes - a.scheduledMinutes
  );

  // Hooks must run before any early return
  const scrollRef = useRef(null);
  const [edges, setEdges] = useState({ top: false, bottom: false });

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return undefined;
    const update = () => {
      const top = el.scrollTop > 4;
      const bottom = el.scrollTop + el.clientHeight < el.scrollHeight - 4;
      setEdges((prev) => (prev.top === top && prev.bottom === bottom ? prev : { top, bottom }));
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    if (el.firstElementChild) ro.observe(el.firstElementChild);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, [subjects.length]);

  const showTopFade = edges.top;
  const showBottomFade = edges.bottom;

  if (subjects.length === 0) {
    return <Empty>No classes scheduled for this group yet.</Empty>;
  }

  const sum = subjects.reduce((acc, s) => acc + s.scheduledMinutes, 0);
  const total = schedule?.weeklyMinutes || sum;
  const classes = subjects.reduce((acc, s) => acc + (s.classCount ?? 0), 0);
  const max = Math.max(1, ...subjects.map((s) => s.scheduledMinutes));
  const share = (m) => (total > 0 ? Math.round((m / total) * 100) : 0);

  // Real fade: mask the scroller itself (top only when scrolled, bottom only when more below)
  const stops = [
    showTopFade ? "transparent 0, rgba(0,0,0,0.15) 14px, #000 64px" : "#000 0",
    showBottomFade ? "#000 calc(100% - 90px), rgba(0,0,0,0.15) calc(100% - 14px), transparent 100%" : "#000 100%",
  ].join(", ");
  const mask = `linear-gradient(to bottom, ${stops})`;

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      {/* Fixed summary */}
      <section className="flex shrink-0 flex-col gap-3">
        <div className="grid grid-cols-3 gap-2">
          <Stat label="Per week" value={formatMinutes(total)} color="var(--color-primary)" />
          <Stat label="Subjects" value={subjects.length} />
          <Stat label="Classes" value={classes} />
        </div>
        <div className="flex h-2.5 w-full gap-[2px] overflow-hidden rounded-full">
          {subjects.map((s) => (
            <div
              key={s.subjectId}
              title={`${s.name} · ${share(s.scheduledMinutes)}%`}
              className="h-full min-w-[3px]"
              style={{ flexGrow: s.scheduledMinutes, flexBasis: 0, backgroundColor: s.color }}
            />
          ))}
        </div>
      </section>

      <div className="flex shrink-0 items-center justify-between text-xs text-[var(--color-text-muted)]">
        <span className="font-medium">Ranked by time</span>
        <span className="font-mono text-[10px]">{subjects.length} subjects</span>
      </div>

      {/* Bare list: no box, no border. Items + custom scrollbar in the gutter */}
      <div className="flex min-h-0 flex-1">
        <div
          ref={scrollRef}
          className="scrollbar-hidden min-w-0 flex-1 overflow-y-auto"
          style={{ maskImage: mask, WebkitMaskImage: mask }}
        >
          <ul className="flex flex-col gap-2 py-1">
            {subjects.map((s, i) => (
              <li
                key={s.subjectId}
                className="flex flex-col gap-2.5 rounded-xl px-3.5 py-3"
                style={{
                  background: `linear-gradient(120deg, ${tint(s.color, i === 0 ? 20 : 12)} 0%, ${tint(s.color, 4)} 100%)`,
                }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg font-mono text-sm font-bold"
                    style={{ color: s.color, backgroundColor: tint(s.color, 20) }}
                  >
                    {i + 1}
                  </span>

                  <div className="min-w-0 flex-1">
                    <h4 className="truncate text-[13px] font-semibold text-[var(--color-text)]" title={s.name}>
                      {s.name}
                    </h4>
                    <p className="mt-0.5 truncate text-[11px] text-[var(--color-text-muted)]">
                      {s.classCount ?? 0} {s.classCount === 1 ? "class" : "classes"} / week ·{" "}
                      <span style={{ color: s.color }}>{share(s.scheduledMinutes)}%</span>
                    </p>
                  </div>

                  <span className="shrink-0 font-mono text-sm font-bold tabular-nums text-[var(--color-text)]">
                    {formatMinutes(s.scheduledMinutes)}
                  </span>
                </div>

                <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ backgroundColor: tint(s.color, 14) }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(s.scheduledMinutes / max) * 100}%`,
                      background: `linear-gradient(90deg, ${tint(s.color, 60)}, ${s.color})`,
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>

        <CustomScrollbar scrollRef={scrollRef} />
      </div>
    </div>
  );
}
