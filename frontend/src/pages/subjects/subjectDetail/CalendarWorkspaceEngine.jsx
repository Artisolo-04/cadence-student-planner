import { Fragment, useEffect, useMemo, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import api from "../../../lib/api";
import { sortDaysByWeekOrder } from "../../../lib/days";
import { buildSpanLayout } from "../../timetable/grid/layout/slotSpanUtils";
import { buildOverlayMatrix } from "../../timetable/grid/overlay/overlayMatrixBuilder";
import { dayIndexToColumns, slotIndexToGridRow } from "../../timetable/grid/overlay/overlayGeometry";
import { WEEKDAY_FULL } from "../../timetable/grid/layout/weekdayConstants";
import SubjectLabel from "../../timetable/grid/subjects/SubjectLabel";

const ROW_HEIGHT = 56;
const HEADER_HEIGHT = 40;
const DEFAULT_FOCUS_LEVEL = 0.8;

function timeRangeLabel(startTime, endTime) {
  const start = startTime?.slice(0, 5) ?? "--:--";
  const end = endTime?.slice(0, 5) ?? "--:--";
  return `${start} - ${end}`;
}

function OpacityRangeControl({ value, onChange }) {
  const pct = Math.round(value * 100);

  return (
    <div className="flex items-center gap-2.5 w-full max-w-[220px]">
      <SlidersHorizontal size={12} className="shrink-0 text-[var(--color-text-muted)]" />
      <span className="shrink-0 text-[11px] font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
        Focus
      </span>

      <div className="relative flex-1 flex items-center h-5">
        <div className="absolute inset-x-0 h-1.5 rounded-full bg-[var(--color-border)]" />
        <div
          className="absolute h-1.5 rounded-full bg-[var(--color-primary)]"
          style={{ width: `${pct}%` }}
        />
        <input
          type="range"
          min={0}
          max={1}
          step={0.1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="zoom-slider relative w-full appearance-none bg-transparent cursor-pointer"
          aria-label="Non-active subject opacity"
        />
      </div>

      <span className="shrink-0 w-9 text-right text-[11px] font-semibold tabular-nums text-[var(--color-text)]">
        {pct}%
      </span>
    </div>
  );
}

export default function CalendarWorkspaceEngine({ subject, timetableId, enabled }) {
  const [workspace, setWorkspace] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [focusLevel, setFocusLevel] = useState(DEFAULT_FOCUS_LEVEL);
  const dimOpacity = 1 - focusLevel;

  useEffect(() => {
    if (!enabled || !timetableId) return;

    let cancelled = false;
    setLoading(true);
    setError("");

    api
      .get(`/timetables/${timetableId}`)
      .then(({ data }) => {
        if (!cancelled) setWorkspace(data);
      })
      .catch((err) => {
        console.error("Load timetable workspace error:", err);
        if (!cancelled) setError("Couldn't load the timetable grid.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, timetableId]);

  const orderedDays = useMemo(
    () => (workspace?.days ? sortDaysByWeekOrder(workspace.days) : []),
    [workspace?.days]
  );

  const orderedSlots = useMemo(
    () =>
      workspace?.slots
        ? [...workspace.slots].sort((a, b) => a.sort_order - b.sort_order)
        : [],
    [workspace?.slots]
  );

  const entries = workspace?.entries || [];

  const spanLayout = useMemo(
    () => buildSpanLayout(entries, orderedSlots),
    [entries, orderedSlots]
  );

  const overlayMatrix = useMemo(
    () => buildOverlayMatrix({ orderedDays, orderedSlots, spanLayout }),
    [orderedDays, orderedSlots, spanLayout]
  );

  if (!enabled) return null;

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      {!loading && !error && orderedDays.length > 0 && (
        <div className="flex shrink-0 items-center justify-between gap-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-3 py-2.5">
          <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
            Controls
          </span>
          <OpacityRangeControl value={focusLevel} onChange={setFocusLevel} />
        </div>
      )}

      {loading && (
        <p className="p-4 text-sm text-[var(--color-text-muted)]">Loading timetable…</p>
      )}
      {!loading && error && (
        <p className="p-4 text-sm text-[var(--color-danger)]">{error}</p>
      )}
      {!loading && !error && orderedDays.length === 0 && (
        <p className="p-4 text-sm text-[var(--color-text-muted)]">No schedule set up yet.</p>
      )}

      {!loading && !error && orderedDays.length > 0 && (
        <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] scrollbar-cadence">
          <div
            className="grid h-full text-sm"
            style={{
              gridTemplateColumns: `88px repeat(${orderedDays.length * 2}, minmax(0, 1fr))`,
              gridTemplateRows: `${HEADER_HEIGHT}px repeat(${orderedSlots.length}, minmax(${ROW_HEIGHT}px, 1fr))`,
            }}
          >
            <div
              style={{ gridColumn: 1, gridRow: 1 }}
              className="sticky top-0 left-0 z-20 border-b border-r border-[var(--color-border)] bg-[var(--color-surface-alt)] px-1 py-2 text-center text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]"
            >
              Time
            </div>
            {orderedDays.map((day, dayIdx) => {
              const { g1Column } = dayIndexToColumns(dayIdx);
              const isLastCol = dayIdx === orderedDays.length - 1;
              return (
                <div
                  key={day.id}
                  style={{ gridColumn: `${g1Column} / span 2`, gridRow: 1 }}
                  className={`sticky top-0 z-10 border-b border-[var(--color-border)] ${
                    isLastCol ? "" : "border-r"
                  } bg-[var(--color-surface-alt)] px-1 py-2 text-center text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]`}
                >
                  {WEEKDAY_FULL[day.day_of_week]}
                </div>
              );
            })}

            {orderedSlots.map((slot, rowIdx) => {
              const gridRow = slotIndexToGridRow(rowIdx);
              const isLastRow = rowIdx === orderedSlots.length - 1;
              return (
                <Fragment key={slot.id}>
                  <div
                    style={{ gridColumn: 1, gridRow }}
                    className={`sticky left-0 z-10 flex items-center justify-center border-r border-[var(--color-border)] bg-[var(--color-surface-alt)] ${
                      isLastRow ? "" : "border-b"
                    } px-1.5 text-center text-[10px] font-medium tabular-nums tracking-tight text-[var(--color-text-muted)]`}
                  >
                    {timeRangeLabel(slot.start_time, slot.end_time)}
                  </div>

                  {orderedDays.map((day, dayIdx) => {
                    const { g1Column, g2Column } = dayIndexToColumns(dayIdx);
                    const isLastCol = dayIdx === orderedDays.length - 1;
                    const matrixRow = overlayMatrix[day.day_of_week]?.[rowIdx];
                    const dayLayout = spanLayout[day.day_of_week];

                    if (!matrixRow || matrixRow.isCoveredRow) {
                      return null;
                    }

                    const allInfo = dayLayout?.all[rowIdx] || null;

                    if (allInfo?.type === "start") {
                      const isMatch = allInfo.entry.subject_id === subject.id;
                      return (
                        <div
                          key={day.id}
                          style={{
                            gridColumn: `${g1Column} / span 2`,
                            gridRow: `${gridRow} / span ${matrixRow.allSpan}`,
                          }}
                          className={`relative border-[var(--color-border)] ${
                            isLastCol ? "" : "border-r"
                          } ${matrixRow.allIsLastRow ? "" : "border-b"}`}
                        >
                          <div
                            className="h-full w-full"
                            style={{
                              opacity: isMatch ? 1 : dimOpacity,
                              transition: "none",
                            }}
                          >
                            <SubjectLabel
                              entry={allInfo.entry}
                              slotId={slot.id}
                              dayOfWeek={day.day_of_week}
                              dragGroupTag="all"
                              isEditMode={false}
                              orderedSlots={orderedSlots}
                              showRoom
                              dimmed={false}
                            />
                          </div>
                        </div>
                      );
                    }

                    const g1Info = dayLayout?.g1[rowIdx] || null;
                    const g2Info = dayLayout?.g2[rowIdx] || null;

                    return (
                      <Fragment key={day.id}>
                        {!matrixRow.g1Hidden && (
                          <div
                            style={{
                              gridColumn: g1Column,
                              gridRow:
                                g1Info?.type === "start"
                                  ? `${gridRow} / span ${matrixRow.g1Span}`
                                  : gridRow,
                            }}
                            className={`relative border-r border-[var(--color-border)] ${
                              matrixRow.g1IsLastRow ? "" : "border-b"
                            }`}
                          >
                            {g1Info?.type === "start" && (
                              <div
                                className="h-full w-full"
                                style={{
                                  opacity:
                                    g1Info.entry.subject_id === subject.id ? 1 : dimOpacity,
                                  transition: "none",
                                }}
                              >
                                <SubjectLabel
                                  entry={g1Info.entry}
                                  groupTag="g1"
                                  slotId={slot.id}
                                  dayOfWeek={day.day_of_week}
                                  dragGroupTag="g1"
                                  isEditMode={false}
                                  orderedSlots={orderedSlots}
                                  showRoom
                                  dimmed={false}
                                />
                              </div>
                            )}
                          </div>
                        )}
                        {!matrixRow.g2Hidden && (
                          <div
                            style={{
                              gridColumn: g2Column,
                              gridRow:
                                g2Info?.type === "start"
                                  ? `${gridRow} / span ${matrixRow.g2Span}`
                                  : gridRow,
                            }}
                            className={`relative ${isLastCol ? "" : "border-r"} border-[var(--color-border)] ${
                              matrixRow.g2IsLastRow ? "" : "border-b"
                            }`}
                          >
                            {g2Info?.type === "start" && (
                              <div
                                className="h-full w-full"
                                style={{
                                  opacity:
                                    g2Info.entry.subject_id === subject.id ? 1 : dimOpacity,
                                  transition: "none",
                                }}
                              >
                                <SubjectLabel
                                  entry={g2Info.entry}
                                  groupTag="g2"
                                  slotId={slot.id}
                                  dayOfWeek={day.day_of_week}
                                  dragGroupTag="g2"
                                  isEditMode={false}
                                  orderedSlots={orderedSlots}
                                  showRoom
                                  dimmed={false}
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </Fragment>
                    );
                  })}
                </Fragment>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
