import { useEffect, useMemo, useState } from "react";
import { DndContext, DragOverlay, pointerWithin } from "@dnd-kit/core";
import { sortDaysByWeekOrder } from "../../../../lib/days";
import SubjectPickerModal from "../subjects/SubjectPickerModal";
import SubjectsDrawer from "../subjects/SubjectsDrawer";
import { SubjectChipContent } from "../subjects/SubjectChip";
import ActionNoticeBanner from "../ActionNoticeBanner";
import { toMinutes, entryKey } from "../cell/cellDisplayUtils";
import { buildSpanLayout } from "./slotSpanUtils";
import { buildOverlayMatrix } from "../overlay/overlayMatrixBuilder";
import { createMagneticModifier } from "../dragdrop/dragAnimations";
import { useTimetableDragDrop } from "../dragdrop/useTimetableDragDrop";
import { useTimetableEntries } from "../entries/useTimetableEntries";
import { useDragOverlayGeometry } from "../dragdrop/useDragOverlayGeometry";
import { WEEKDAY_FULL } from "./weekdayConstants";
import { slotIndexToGridRow } from "../overlay/overlayGeometry";
import { GridHeaderRow } from "./GridHeaderRow";
import { TimeSlotRow } from "./TimeSlotRow";

const magneticModifier = createMagneticModifier();

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
      const key = entryKey(entry.start_slot_id, entry.day_of_week);
      if (!map[key]) map[key] = [];
      map[key].push(entry);
    }
    return map;
  }, [entries]);

  const spanLayout = useMemo(
    () => buildSpanLayout(entries, orderedSlots),
    [entries, orderedSlots]
  );

  const overlayMatrix = useMemo(
    () => buildOverlayMatrix({ orderedDays, orderedSlots, spanLayout }),
    [orderedDays, orderedSlots, spanLayout]
  );

  const {
    subjects,
    activeCell,
    activeEntry,
    saveError,
    clearSaveError,
    actionNotice,
    clearActionNotice,
    openCell,
    closePicker,
    handleSelect,
    handleClear,
    saveDraggedSubject,
    resizeEntry,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useTimetableEntries({ timetable, entriesByCell, entries, onWorkspaceChange, isEditMode, orderedSlots });

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
    effectiveDragSpan,
    overCell,
    handleDragStart,
    handleDragMove,
    handleDragCancel,
    handleDragEnd,
  } = useTimetableDragDrop({
    orderedSlots,
    orderedDays,
    entries,
    onDrop: ({ subjectId, slotId, dayOfWeek, groupTag, sourceCell }) =>
      saveDraggedSubject({ subjectId, slotId, dayOfWeek }, groupTag, sourceCell),
  });

  const dragOverlayGeometry = useDragOverlayGeometry({
    draggingSubject,
    overCell,
    effectiveDragSpan,
    orderedSlots,
    orderedDays,
  });

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      autoScroll={false}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragCancel={handleDragCancel}
      onDragEnd={handleDragEnd}
    >
      <div className={`flex h-full min-h-0 w-full transition-all duration-500 ${isEditMode ? "gap-3" : "gap-0"}`}>
        <div className="flex h-full min-h-0 min-w-0 w-full flex-1 flex-col overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_1px_0_0_rgba(255,255,255,0.02)_inset,0_20px_40px_-24px_rgba(0,0,0,0.6)]">
          {saveError && (
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 px-4 py-2 text-sm text-[var(--color-danger)]">
              <span>{saveError.message}</span>
              <button
                type="button"
                onClick={clearSaveError}
                className="shrink-0 rounded-md px-2 py-0.5 text-xs font-medium hover:bg-[var(--color-danger)]/10"
              >
                Dismiss
              </button>
            </div>
          )}
            <ActionNoticeBanner
              notice={actionNotice}
              onUndo={() => {
                clearActionNotice();
                undo();
              }}
              onDismiss={clearActionNotice}
            />

          <div data-timetable-grid-root className="min-h-0 flex-1 overflow-y-auto scrollbar-cadence" style={{ scrollbarGutter: "auto" }}>
          <div
            className="grid h-full w-full text-sm"
            style={{
              gridTemplateColumns: `150px repeat(${orderedDays.length * 2}, minmax(0, 1fr))`,
              gridTemplateRows: `auto repeat(${orderedSlots.length}, minmax(min-content, 1fr))`,
            }}
          >
            <GridHeaderRow orderedDays={orderedDays} nowDow={nowDow} />

            {orderedSlots.map((slot, rowIdx) => {
              const isLastRow = rowIdx === orderedSlots.length - 1;
              const gridRow = slotIndexToGridRow(rowIdx);
              return (
                <TimeSlotRow
                  key={slot.id}
                  slot={slot}
                  rowIdx={rowIdx}
                  isLastRow={isLastRow}
                  gridRow={gridRow}
                  orderedDays={orderedDays}
                  orderedSlots={orderedSlots}
                  overlayMatrix={overlayMatrix}
                  entriesByCell={entriesByCell}
                  nowDow={nowDow}
                  isCurrentSlot={isCurrentSlot}
                  isEditMode={isEditMode}
                  resizeEntry={resizeEntry}
                  landing={landing}
                  myGroup={myGroup}
                  viewOptions={viewOptions}
                  openCell={openCell}
                />
              );
            })}
            {dragOverlayGeometry && (
                <div
                  aria-hidden="true"
                  className="pointer-events-none relative z-40 overflow-hidden rounded-md border-2 border-orange-400 shadow-[0_0_0_1px_rgba(251,146,60,0.4),0_0_24px_-4px_rgba(251,146,60,0.65),inset_0_0_0_1px_rgba(255,255,255,0.08)]"
                  style={{ gridColumn: dragOverlayGeometry.gridColumn, gridRow: dragOverlayGeometry.gridRow }}
                >
                  {draggingSubject && (
                    <SubjectChipContent
                      subject={draggingSubject}
                      size={{ width: "100%", height: "100%" }}
                      bare
                    />
                  )}
                </div>
              )}
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
                ? (() => {
                    const startSlot = activeEntry
                      ? orderedSlots.find((s) => s.id === activeEntry.start_slot_id) || activeCell.slot
                      : activeCell.slot;
                    const endSlot = activeEntry
                      ? orderedSlots.find((s) => s.id === activeEntry.end_slot_id) || activeCell.slot
                      : activeCell.slot;
                    return `${WEEKDAY_FULL[activeCell.dayOfWeek]} · ${startSlot.start_time.slice(0, 5)}–${endSlot.end_time.slice(0, 5)}`;
                  })()
                : ""
            }
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
            <div style={{ opacity: overCell ? 0 : 1, transition: "opacity 120ms ease-out" }}>
              <SubjectChipContent subject={draggingSubject} lifted size={dragChipSize} />
            </div>
          ) : null}
        </DragOverlay>
    </DndContext>
  );
}
