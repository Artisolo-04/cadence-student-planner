import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { BookOpen, ChevronRight } from "lucide-react";
import AnalyticsTile from "./AnalyticsTile";
import { formatMinutes } from "./analyticsUtils";

const MIN_ROW_H = 26; // px: smallest comfortable row
const ROW_GAP = 6; // px, matches gap-1.5
const MIN_ROWS = 3;
const DESKTOP_QUERY = "(min-width: 1024px)"; // same as Tailwind lg

function useIsDesktop() {
  const [desktop, setDesktop] = useState(
    () => typeof window !== "undefined" && window.matchMedia(DESKTOP_QUERY).matches
  );
  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_QUERY);
    const onChange = () => setDesktop(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return desktop;
}

function SubjectRow({ s, i, max, pct, className }) {
  return (
    <li className={`flex items-center gap-3 text-xs ${className}`}>
      <span
        className="h-2 w-2 shrink-0 rounded-full"
        style={{ backgroundColor: s.color, boxShadow: `0 0 8px -1px ${s.color}` }}
      />
      <span
        className={`min-w-0 flex-[5] truncate text-[var(--color-text)] ${i === 0 ? "font-semibold" : ""}`}
        title={s.name}
      >
        {s.name}
      </span>
      <div className="h-1.5 min-w-8 flex-[2] overflow-hidden rounded-full bg-[var(--color-fill-3)]">
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{ width: `${(s.scheduledMinutes / max) * 100}%`, backgroundColor: s.color }}
        />
      </div>
      <span className="w-14 shrink-0 text-right font-mono text-[var(--color-text)]">
        {formatMinutes(s.scheduledMinutes)}
      </span>
      <span className="w-8 shrink-0 text-right font-mono text-[10px] text-[var(--color-text-muted)]">
        {pct(s.scheduledMinutes)}%
      </span>
    </li>
  );
}

export default function SubjectTimeCard({ schedule, onExpand }) {
  const desktop = useIsDesktop();

  const subjects = [...(schedule?.bySubject ?? [])].sort(
    (a, b) => b.scheduledMinutes - a.scheduledMinutes
  );
  const sum = subjects.reduce((acc, s) => acc + s.scheduledMinutes, 0);
  const total = schedule?.weeklyMinutes || sum;
  const max = Math.max(1, ...subjects.map((s) => s.scheduledMinutes));
  const pct = (m) => (total > 0 ? Math.round((m / total) * 100) : 0);

  // Desktop only: count how many rows fit, rows then stretch to fill the height
  const areaRef = useRef(null);
  const [fit, setFit] = useState(MIN_ROWS);

  useLayoutEffect(() => {
    const el = areaRef.current;
    if (!desktop || !el) return undefined;
    const measure = () => {
      const rows = Math.floor((el.clientHeight + ROW_GAP) / (MIN_ROW_H + ROW_GAP));
      setFit(Math.max(MIN_ROWS, rows));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [subjects.length, desktop]);

  const shown = desktop ? subjects.slice(0, fit) : subjects;
  const hidden = subjects.length - shown.length;

  return (
    <AnalyticsTile
      icon={BookOpen}
      title="Time by subject"
      scroll={false}
      meta={subjects.length ? `${subjects.length} subjects` : null}
    >
      {subjects.length === 0 ? (
        <p className="text-xs text-[var(--color-text-muted)]">
          No classes scheduled for this group yet.
        </p>
      ) : (
        <div className={`flex flex-col gap-3 ${desktop ? "h-full min-h-0" : ""}`}>
          {/* Whole week at a glance */}
          <div className="shrink-0">
            <div className="flex h-2.5 w-full gap-[2px] overflow-hidden rounded-full">
              {subjects.map((s) => (
                <div
                  key={s.subjectId}
                  title={`${s.name} · ${formatMinutes(s.scheduledMinutes)} · ${pct(s.scheduledMinutes)}%`}
                  className="h-full min-w-[3px] transition-opacity hover:opacity-80"
                  style={{ flexGrow: s.scheduledMinutes, flexBasis: 0, backgroundColor: s.color }}
                />
              ))}
            </div>
            <div className="mt-1.5 flex items-baseline justify-between text-[10px] text-[var(--color-text-muted)]">
              <span>Weekly split</span>
              <span className="font-mono">{formatMinutes(total)} total</span>
            </div>
          </div>

          {desktop ? (
            <>
              {/* Desktop: rows stretch to fill the free height */}
              <div ref={areaRef} className="relative min-h-0 flex-1">
                <ul className="absolute inset-0 flex flex-col justify-between gap-1.5 overflow-hidden">
                  {shown.map((s, i) => (
                    <SubjectRow
                      key={s.subjectId}
                      s={s}
                      i={i}
                      max={max}
                      pct={pct}
                      className="max-h-9 min-h-0 flex-1"
                    />
                  ))}
                </ul>
              </div>

              {onExpand && hidden > 0 && (
                <button
                  type="button"
                  onClick={onExpand}
                  className="flex h-4 shrink-0 items-center gap-1 self-start rounded-md text-[11px] text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-primary)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-ring)]"
                >
                  +{hidden} more · See all
                  <ChevronRight size={12} />
                </button>
              )}
            </>
          ) : (
            /* Phone: ALL subjects, normal flow, no link, no side panel */
            <ul className="flex flex-col gap-2">
              {subjects.map((s, i) => (
                <SubjectRow key={s.subjectId} s={s} i={i} max={max} pct={pct} className="h-7" />
              ))}
            </ul>
          )}
        </div>
      )}
    </AnalyticsTile>
  );
}
