import { useEffect, useMemo, useState } from "react";
import Modal from "../../../components/ui/Modal";
import ScheduleDetails from "./ScheduleDetails";
import { accentFor, hoursToLabel, subjectTint } from "./chartTokens";
import useScrollFade from "./useScrollFade";

const SIZE = 160;
const RADIUS = 68;
const STROKE = 15;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const CENTER = SIZE / 2;
const GAP_DEG = 12;

export default function SubjectDonut({
  subjects = [],
  totalWeeklyHours = 0,
  rawEntries = [],
  slots = [],
}) {
  const [selected, setSelected] = useState(null);
  const [mounted, setMounted] = useState(false);
  const { scrollRef, showTopFade, showBottomFade, updateScrollFades } =
    useScrollFade(subjects);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, [subjects]);

  const colorByName = useMemo(() => {
    const map = new Map();
    rawEntries.forEach((entry) => {
      if (entry.subject_name && entry.subject_color && !map.has(entry.subject_name)) {
        map.set(entry.subject_name, entry.subject_color);
      }
    });
    return map;
  }, [rawEntries]);

  const slices = useMemo(() => {
    let cursor = 0;
    return subjects.map((subject, index) => {
      const pct = Number(subject.percentOfWeek || 0);
      const start = cursor;
      cursor += pct;
      const rawColor = colorByName.get(subject.name) || accentFor(index);
      return { ...subject, start, pct, color: subjectTint(rawColor) };
    });
  }, [subjects, colorByName]);

  const maxPercent = Math.max(1, ...slices.map((s) => Number(s.percentOfWeek || 0)));

  const selectedEntries = selected
    ? rawEntries.filter((entry) => entry.subject_name === selected.name)
    : [];

  const fadeTop = showTopFade ? "20px" : "0px";
  const fadeBottom = showBottomFade ? "20px" : "0px";
  const fadeMask = `linear-gradient(to bottom, transparent 0, black ${fadeTop}, black calc(100% - ${fadeBottom}), transparent 100%)`;

  if (!subjects.length) {
    return (
      <div className="flex flex-col items-center gap-5 lg:h-full lg:flex-row">
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden="true">
          <circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            fill="none"
            stroke="var(--color-border)"
            strokeWidth={STROKE}
          />
        </svg>
        <p className="text-sm text-[var(--color-text-muted)]">No subjects scheduled yet.</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-6 lg:h-full lg:min-h-0 lg:flex-row lg:items-stretch">
        <div className="flex shrink-0 flex-col items-center justify-center">
          <div className="relative" style={{ width: SIZE, height: SIZE }}>
            <svg
              width={SIZE}
              height={SIZE}
              viewBox={`0 0 ${SIZE} ${SIZE}`}
              className="-rotate-90"
              role="img"
              aria-label="Subject weekly-time distribution"
            >
              <circle
                cx={CENTER}
                cy={CENTER}
                r={RADIUS}
                fill="none"
                stroke="var(--color-surface-alt)"
                strokeWidth={STROKE}
              />
              {slices.map((slice, index) => {
                const arcLength = (slice.pct / 100) * CIRCUMFERENCE - GAP_DEG;
                const offset = (slice.start / 100) * CIRCUMFERENCE;
                return (
                  <circle
                    key={slice.subjectId}
                    cx={CENTER}
                    cy={CENTER}
                    r={RADIUS}
                    fill="none"
                    stroke={slice.color}
                    strokeWidth={STROKE}
                    strokeLinecap="butt"
                    strokeDasharray={`${Math.max(arcLength, 0)} ${CIRCUMFERENCE}`}
                    strokeDashoffset={mounted ? -offset : CIRCUMFERENCE}
                    style={{
                      transition: "stroke-dashoffset 700ms ease-out",
                      transitionDelay: `${index * 60}ms`,
                    }}
                  />
                );
              })}
            </svg>

            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-semibold tabular-nums text-[var(--color-text)]">
                {hoursToLabel(totalWeeklyHours)}
              </span>
              <span className="text-xs text-[var(--color-text-muted)]">per week</span>
            </div>
          </div>
        </div>

        <div className="relative w-full min-w-0 lg:min-h-0 lg:flex-1">
          <div
            ref={scrollRef}
            onScroll={updateScrollFades}
            className="scrollbar-cadence overflow-visible rounded-md lg:h-full lg:overflow-y-scroll lg:pr-2"
            style={{ WebkitMaskImage: fadeMask, maskImage: fadeMask }}
          >
            <div className="flex flex-col gap-2">
              {slices.map((slice) => {
                const barPercent = Math.max(4, (slice.pct / maxPercent) * 100);

                return (
                  <button
                    key={slice.subjectId}
                    type="button"
                    onClick={() => setSelected(slice)}
                    title={`Open ${slice.name} schedule`}
                    className="group flex w-full flex-col gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-alt)]/50 px-3 py-2.5 text-left transition-colors duration-200 hover:border-[color-mix(in_srgb,var(--color-primary)_45%,transparent)] hover:bg-[var(--color-surface-alt)]/80"
                  >
                    <div className="flex min-w-0 items-center justify-between gap-3">
                      <span className="flex min-w-0 items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: slice.color }}
                        />
                        <span className="truncate text-sm font-medium text-[var(--color-text)]">
                          {slice.name}
                        </span>
                      </span>
                      <span className="shrink-0 text-xs font-medium tabular-nums text-[var(--color-text-muted)]">
                        {slice.percentOfWeek}%
                      </span>
                    </div>

                    <div className="h-1.5 overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--color-border)_60%,transparent)]">
                      <div
                        className="h-full rounded-full transition-[width] duration-500 ease-out"
                        style={{ width: `${barPercent}%`, backgroundColor: slice.color }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.name || "Subject schedule"}
        elevated
      >
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Metric label="Weekly time" value={hoursToLabel(selected.weeklyHours)} />
              <Metric label="Weekly share" value={`${selected.percentOfWeek}%`} />
            </div>

            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
                Scheduled classes
              </p>
              <ScheduleDetails entries={selectedEntries} slots={slots} />
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-alt)]/40 p-3">
      <p className="text-[11px] text-[var(--color-text-muted)]">{label}</p>
      <p className="mt-0.5 text-base font-semibold tabular-nums text-[var(--color-text)]">
        {value}
      </p>
    </div>
  );
}
