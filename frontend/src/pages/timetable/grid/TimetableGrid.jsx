import { Fragment, useEffect, useMemo, useState } from "react";
import { DndContext, DragOverlay, pointerWithin } from "@dnd-kit/core";
import { sortDaysByWeekOrder } from "../../../lib/days";
import SubjectPickerModal from "./SubjectPickerModal";
import TimetableCell from "./TimetableCell";
import SubjectsDrawer from "./SubjectsDrawer";
import { SubjectChipContent } from "./SubjectChip";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import { toMinutes, entryKey, computeDayVisualBlocks } from "./timetableGridUtils";
import { createMagneticModifier } from "./dragAnimations";
import { useTimetableDragDrop } from "./useTimetableDragDrop";
import { useTimetableEntries } from "./useTimetableEntries";
import { useTimetableResize } from "./useTimetableResize";

const WEEKDAY_FULL = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];

const magneticModifier = createMagneticModifier({ lerpFactor: 0.3 });

export default function TimetableGrid({
  workspace,
  onWorkspaceChange,
  myGroup,
  viewOptions,
  isEditMode,
  actionsRef,
  onEditStateChange,
}) {
  const { timetable, days, slots, entries } = workspace;

  const orderedDays = sortDaysByWeekOrder(days);
  const orderedSlots = useMemo(
    () => [...slots].sort((a, b) => a.sort_order - b.sort_order),
    [slots]
  );

  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const nowDow = now.getDay();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const isCurrentSlot = (slot) =>
    nowMinutes >= toMinutes(slot.start_time) && nowMinutes < toMinutes(slot.end_time);

  const entriesByCell = useMemo(() => {
    const map = {};
    for (const entry of entries || []) {
      const key = entryKey(entry.slot_id, entry.day_of_week);
      if (!map[key]) map[key] = [];
      map[key].push(entry);
    }
    return map;
  }, [entries]);

  const blocksByDay = useMemo(() => {
    const map = {};
    for (const day of orderedDays) {
      map[day.day_of_week] = computeDayVisualBlocks(orderedSlots, day.day_of_week, entriesByCell);
    }
    return map;
  }, [orderedDays, orderedSlots, entriesByCell]);

  const {
    subjects,
    activeCell,
    pendingSave,
    activeEntry,
    dialogConfig,
    openCell,
    closePicker,
    handleSelect,
    handleClear,
    saveDraggedSubject,
    commitResize,
    commitSave,
    setPendingSave,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useTimetableEntries({ timetable, entriesByCell, onWorkspaceChange, isEditMode });

  if (actionsRef) {
    actionsRef.current = { undo, redo };
  }

  useEffect(() => {
    onEditStateChange?.({ canUndo, canRedo });
  }, [canUndo, canRedo]);

  const {
    sensors,
    draggingSubject,
    dragChipSize,
    dropAnimation,
    landing,
    handleDragStart,
    handleDragCancel,
    handleDragEnd,
  } = useTimetableDragDrop({
    orderedSlots,
    orderedDays,
    onDrop: ({ subjectId, slotId, dayOfWeek, groupTag, sourceCell }) =>
      saveDraggedSubject({ subjectId, slotId, dayOfWeek }, groupTag, sourceCell),
  });

  async function handleCommitResize({ slotId, dayOfWeek, groupTag, rowIdx, slotDelta }) {
    const targetSlotIds = [];
    for (let j = rowIdx + 1; j <= rowIdx + slotDelta; j += 1) {
      targetSlotIds.push(orderedSlots[j].id);
    }
    await commitResize({ sourceSlotId: slotId, dayOfWeek, groupTag, targetSlotIds });
  }

  const { startResize, activeResize } = useTimetableResize({ orderedSlots, entriesByCell, onCommitResize: handleCommitResize });

  const lastRowIdx = orderedSlots.length - 1;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      autoScroll={false}
      onDragStart={handleDragStart}
      onDragCancel={handleDragCancel}
      onDragEnd={handleDragEnd}
    >
      <div className={`flex h-full min-h-0 w-full transition-all duration-500 ${isEditMode ? "gap-3" : "gap-0"}`}>
        <div className="flex h-full min-h-0 min-w-0 w-full flex-1 flex-col overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_1px_0_0_rgba(255,255,255,0.02)_inset,0_20px_40px_-24px_rgba(0,0,0,0.6)]">
          <div className="min-h-0 flex-1 overflow-y-auto scrollbar-cadence" style={{ scrollbarGutter: "auto" }}>
            <div
              className="grid h-full w-full text-sm"
              style={{
                gridTemplateColumns: `150px repeat(${orderedDays.length * 2}, minmax(0, 1fr))`,
                gridTemplateRows: `auto repeat(${orderedSlots.length}, minmax(min-content, 1fr))`,
              }}
            >
              <div
                className="border-b border-r border-[var(--color-border)] bg-black/20 backdrop-blur-2xl px-2 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]"
                style={{ gridColumn: 1, gridRow: 1 }}
              >
                Time
              </div>
              {orderedDays.map((day, i) => {
                const isToday = day.day_of_week === nowDow;
                const isLastCol = i === orderedDays.length - 1;
                const g1Column = 2 + i * 2;
                return (
                  <div
                    key={day.id}
                    style={{ gridColumn: `${g1Column} / span 2`, gridRow: 1 }}
                    className={`relative border-b border-[var(--color-border)] ${
                      isLastCol ? "" : "border-r"
                    } bg-black/20 backdrop-blur-2xl px-2 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors ${
                      isToday ? "text-[var(--color-accent)]" : "text-[var(--color-text-muted)]"
                    }`}
                  >
                    {WEEKDAY_FULL[day.day_of_week]}
                    {isToday && (
                      <span className="absolute bottom-0 left-4 right-4 h-[2px] rounded-full bg-[var(--color-accent)]" />
                    )}
                  </div>
                );
              })}

              {orderedSlots.map((slot, rowIdx) => {
                const isLastRow = rowIdx === lastRowIdx;
                const gridRow = 2 + rowIdx;
                return (
                  <Fragment key={slot.id}>
                    <div
                      style={{ gridColumn: 1, gridRow }}
                      className={`flex h-full items-center justify-center overflow-hidden border-r border-[var(--color-border)] ${
                        isLastRow ? "" : "border-b"
                      } px-3 bg-black/20 backdrop-blur-2xl transition-all duration-500 ease-in-out`}
                    >
                      <div className="flex items-center justify-center gap-2 py-1">
                        {slot.label && (
                          <span className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md border border-white/10 bg-white/[0.04] text-[11px] font-semibold text-[var(--color-text-muted)] shadow-[0_1px_0_0_rgba(255,255,255,0.08)_inset] backdrop-blur-md backdrop-saturate-150">
                            <span
                              aria-hidden="true"
                              className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent"
                            />
                            <span className="relative z-10">{slot.label}</span>
                          </span>
                        )}
                        <div className="flex flex-col items-center gap-1 leading-none">
                          <span className="text-[13px] font-semibold text-[var(--color-text)] tabular-nums">
                            {slot.start_time.slice(0, 5)}
                          </span>
                          <span className="text-[11px] text-[var(--color-text-muted)] tabular-nums">
                            {slot.end_time.slice(0, 5)}
                          </span>
                        </div>
                      </div>
                    </div>
                    {orderedDays.map((day, i) => {
                      const isToday = day.day_of_week === nowDow;
                      const isLive = isToday && isCurrentSlot(slot);
                      const isLastCol = i === orderedDays.length - 1;
                      const g1Column = 2 + i * 2;
                      const g2Column = 3 + i * 2;

                      let rowPlan = blocksByDay[day.day_of_week][rowIdx];

                      if (
                        activeResize &&
                        activeResize.dayOfWeek === day.day_of_week &&
                        activeResize.previewSlotDelta > 0 &&
                        rowIdx > activeResize.rowIdx &&
                        rowIdx <= activeResize.rowIdx + activeResize.previewSlotDelta
                      ) {
                        rowPlan =
                          activeResize.groupTag === "all"
                            ? { ...rowPlan, allSkip: true }
                            : activeResize.groupTag === "g1"
                              ? { ...rowPlan, g1Skip: true }
                              : activeResize.groupTag === "g2"
                                ? { ...rowPlan, g2Skip: true }
                                : rowPlan;
                      }

                      if (rowPlan.allSkip) {
                        return null;
                      }

                      const allEndRowIdx = rowIdx + rowPlan.allSpan - 1;
                      const g1EndRowIdx = rowIdx + rowPlan.g1Span - 1;
                      const g2EndRowIdx = rowIdx + rowPlan.g2Span - 1;

                      const isLastRowAll = allEndRowIdx === lastRowIdx;
                      const isLastRowG1 = g1EndRowIdx === lastRowIdx;
                      const isLastRowG2 = g2EndRowIdx === lastRowIdx;

                      return (
                        <TimetableCell
                          key={day.id}
                          entriesForCell={entriesByCell[entryKey(slot.id, day.day_of_week)]}
                          isToday={isToday}
                          isLive={isLive}
                          isLastCol={isLastCol}
                          isLastRow={isLastRow}
                          onOpen={(groupTag) => openCell(slot, day, groupTag)}
                          myGroup={myGroup}
                          viewOptions={viewOptions}
                          slotId={slot.id}
                          dayOfWeek={day.day_of_week}
                          isEditMode={isEditMode}
                          landing={landing}
                          g1Column={g1Column}
                          g2Column={g2Column}
                          gridRow={gridRow}
                          rowIdx={rowIdx}
                          allEndRowIdx={allEndRowIdx}
                          g1EndRowIdx={g1EndRowIdx}
                          g2EndRowIdx={g2EndRowIdx}
                          onResizeStart={startResize}
                          allSpan={rowPlan.allSpan}
                          g1Span={rowPlan.g1Span}
                          g2Span={rowPlan.g2Span}
                          g1Skip={rowPlan.g1Skip}
                          g2Skip={rowPlan.g2Skip}
                          isLastRowAll={isLastRowAll}
                          isLastRowG1={isLastRowG1}
                          isLastRowG2={isLastRowG2}
                          activeResize={activeResize}
                        />
                      );
                    })}
                  </Fragment>
                );
              })}
            </div>
          </div>

          <SubjectPickerModal
            open={Boolean(activeCell)}
            onClose={closePicker}
            subjects={subjects}
            currentSubjectId={activeEntry?.subject_id ?? null}
            currentGroupTag={activeCell?.groupTag}
            currentRoom={activeEntry?.room}
            cellEntries={
              activeCell ? entriesByCell[entryKey(activeCell.slotId, activeCell.dayOfWeek)] : null
            }
            onSelect={handleSelect}
            onClear={handleClear}
            cellLabel={
              activeCell
                ? `${WEEKDAY_FULL[activeCell.dayOfWeek]} · ${activeCell.slot.start_time.slice(0, 5)}–${activeCell.slot.end_time.slice(0, 5)}`
                : ""
            }
          />

          <ConfirmDialog
            open={Boolean(pendingSave)}
            title={dialogConfig?.title || "This will change more than one thing"}
            messages={pendingSave?.warnings || []}
            confirmLabel={dialogConfig?.confirmLabel || "Continue"}
            onCancel={() => setPendingSave(null)}
            onConfirm={() => {
              const save = pendingSave;
              setPendingSave(null);
              commitSave(save.target, save);
            }}
          />

        </div>

        <div
          className={`shrink-0 overflow-hidden transition-[width,opacity] duration-500 ease-in-out ${
            isEditMode ? "opacity-100" : "opacity-0"
          }`}
          style={{ width: isEditMode ? "16rem" : "0rem" }}
        >
          <div className="h-full w-64">
            <SubjectsDrawer subjects={subjects} />
          </div>
        </div>
      </div>

      <DragOverlay dropAnimation={dropAnimation} modifiers={[magneticModifier]}>
        {draggingSubject ? (
          <SubjectChipContent subject={draggingSubject} lifted size={dragChipSize} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
