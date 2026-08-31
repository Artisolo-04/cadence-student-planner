import { useCallback, useMemo, useState } from "react";
import { entryKey } from "../cell/cellDisplayUtils";
import { useTimetableHistory } from "../useTimetableHistory";
import { useSubjects } from "./useSubjects";
import { applyEntryBatch } from "./entryPersistence";
import { reconcileBatchResult } from "./liveGridState";
import { createResizeEntry } from "./resizeEntry";

function createTempId() {
  return globalThis.crypto?.randomUUID?.() ??
    `entry-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function useTimetableEntries({
  workspace,
  onWorkspaceChange,
  orderedSlots,
  maxVersion,
}) {
  const { timetable, entries = [] } = workspace;
  const subjects = useSubjects();
  const [activeCell, setActiveCell] = useState(null);
  const [saveError, setSaveError] = useState(null);

  const entriesByCell = useMemo(() => {
    const map = {};

    for (const entry of entries) {
      const startIndex = orderedSlots.findIndex(
        (slot) => slot.id === entry.start_slot_id
      );
      const endIndex = orderedSlots.findIndex(
        (slot) => slot.id === entry.end_slot_id
      );

      if (startIndex === -1 || endIndex === -1) continue;

      for (
        let index = Math.min(startIndex, endIndex);
        index <= Math.max(startIndex, endIndex);
        index += 1
      ) {
        const key = entryKey(orderedSlots[index].id, entry.day_of_week);
        if (!map[key]) map[key] = [];
        map[key].push(entry);
      }
    }

    return map;
  }, [entries, orderedSlots]);

  const replaceEntries = useCallback(
    (nextEntries, currentVersion, resetMaxVersion = false) => {
      const nextMaxVersion = resetMaxVersion
        ? currentVersion
        : workspace.maxVersion;

      onWorkspaceChange?.({
        ...workspace,
        entries: nextEntries,
        currentVersion,
        maxVersion: nextMaxVersion,
        timetable: {
          ...workspace.timetable,
          current_version: currentVersion,
        },
      });
    },
    [onWorkspaceChange, workspace]
  );

  const history = useTimetableHistory({
    timetableId: timetable.id,
    initialVersion: timetable.current_version,
    initialMaxVersion: maxVersion,
    replaceEntries,
  });

  function reportSaveError(error, fallbackMessage) {
    console.error(fallbackMessage, error);
    setSaveError({
      message: error?.response?.data?.error || fallbackMessage,
      conflicts: error?.response?.data?.conflicts || [],
    });
  }

  const submitBatch = useCallback(
    async (operations) => {
      if (!operations.length) return null;
      if (!history.acquire()) return null;

      setSaveError(null);

      try {
        const result = await applyEntryBatch(timetable.id, operations);
        const nextEntries = reconcileBatchResult(entries, result);

        replaceEntries(nextEntries, result.currentVersion, true);
        history.recordMutation(result.currentVersion);

        return result;
      } catch (error) {
        reportSaveError(error, "Something went wrong saving this change.");
        throw error;
      } finally {
        history.release();
      }
    },
    [entries, history, replaceEntries, timetable.id]
  );

  const resizeEntry = useMemo(
    () =>
      createResizeEntry({
        submitBatch,
        setSaveError,
        reportSaveError,
      }),
    [submitBatch]
  );

  function openCell(slot, day, groupTag) {
    setActiveCell({
      slotId: slot.id,
      dayOfWeek: day.day_of_week,
      slot,
      day,
      groupTag,
    });
  }

  function closePicker() {
    setActiveCell(null);
  }

  function findActiveEntry() {
    if (!activeCell) return null;

    return (
      entriesByCell[
        entryKey(activeCell.slotId, activeCell.dayOfWeek)
      ]?.find((entry) => entry.group_tag === activeCell.groupTag) ?? null
    );
  }

  async function handleSelect({ subjectId, groupTag, room }) {
    if (!activeCell) return;

    const existing = findActiveEntry();
    const operation = existing
      ? {
          op: "update",
          entryId: existing.id,
          slotId: existing.start_slot_id,
          endSlotId: existing.end_slot_id,
          dayOfWeek: existing.day_of_week,
          subjectId,
          groupTag,
          room,
        }
      : {
          op: "create",
          tempId: createTempId(),
          slotId: activeCell.slotId,
          endSlotId: activeCell.slotId,
          dayOfWeek: activeCell.dayOfWeek,
          subjectId,
          groupTag,
          room,
        };

    try {
      await submitBatch([operation]);
      closePicker();
    } catch {
      
    }
  }

  async function handleClear() {
    const existing = findActiveEntry();
    if (!existing) {
      closePicker();
      return;
    }

    try {
      await submitBatch([{ op: "delete", entryId: existing.id }]);
      closePicker();
    } catch {
      
    }
  }

  async function saveDraggedSubject({
    subjectId,
    slotId,
    dayOfWeek,
    groupTag,
    spanCount = 1,
    sourceEntryId = null,
    sourceCell = null,
  }) {
    const sourceEntry = sourceEntryId
      ? entries.find((entry) => entry.id === sourceEntryId) ?? null
      : null;

    if (
      sourceEntry &&
      sourceEntry.start_slot_id === slotId &&
      sourceEntry.day_of_week === dayOfWeek &&
      sourceEntry.group_tag === groupTag
    ) {
      return;
    }

    const startIndex = orderedSlots.findIndex((slot) => slot.id === slotId);
    if (startIndex === -1) return;

    const endIndex = Math.min(
      startIndex + Math.max(1, spanCount) - 1,
      orderedSlots.length - 1
    );

    const fields = {
      slotId,
      endSlotId: orderedSlots[endIndex].id,
      dayOfWeek,
      subjectId,
      groupTag,
      room: sourceEntry?.room ?? sourceCell?.room ?? null,
    };

    const operation = sourceEntry
      ? { op: "update", entryId: sourceEntry.id, ...fields }
      : { op: "create", tempId: createTempId(), ...fields };

    try {
      await submitBatch([operation]);
    } catch {
      
    }
  }

  async function undo() {
    try {
      await history.undo();
    } catch (error) {
      reportSaveError(error, "Something went wrong undoing the last change.");
    }
  }

  async function redo() {
    try {
      await history.redo();
    } catch (error) {
      reportSaveError(error, "Something went wrong redoing the last change.");
    }
  }

  const activeEntry = findActiveEntry();

  return {
    subjects,
    entriesByCell,
    activeCell,
    activeEntry,
    saveError,
    clearSaveError: () => setSaveError(null),
    openCell,
    closePicker,
    handleSelect,
    handleClear,
    saveDraggedSubject,
    resizeEntry,
    undo,
    redo,
    canUndo: history.canUndo,
    canRedo: history.canRedo,
  };
}
