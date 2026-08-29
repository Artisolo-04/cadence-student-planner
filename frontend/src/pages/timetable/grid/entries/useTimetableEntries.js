import { useEffect, useState } from "react";
import api from "../../../../lib/api";
import { entryKey } from "../cell/cellDisplayUtils";
import { planEntrySave } from "./entryPlanning";
import {
  getSpanCount,
  findEntriesCoveringRange,
  computeMaxFreeSpan,
  clipRangeAgainstSameSubjectAll,
} from "../layout/slotSpanUtils";
import { resolveDragMove } from "../dragdrop/dragMovePlanner";
import { useUndoRedo } from "../useUndoRedo";
import { findEntryAtPosition, beforeStateFor, clearEntryAt } from "./entryPersistence";
import { useSubjects } from "./useSubjects";
import { applyChanges } from "./applyChanges";
import { createCommitSave } from "./commitSave";
import { createResizeEntry } from "./resizeEntry";

export function useTimetableEntries({ timetable, entriesByCell, entries, onWorkspaceChange, isEditMode, orderedSlots }) {
  const subjects = useSubjects();

  const [activeCell, setActiveCell] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [actionNotice, setActionNotice] = useState(null);
  const undoRedo = useUndoRedo();

  function reportSaveError(err, fallbackMessage) {
    console.error(fallbackMessage, err);
    if (err?.response?.status === 409) {
      setSaveError({
        message: err.response?.data?.error || "This overlaps with another entry.",
        conflicts: err.response?.data?.conflicts || [],
      });
    } else {
      setSaveError({
        message: err?.response?.data?.error || fallbackMessage,
        conflicts: [],
      });
    }
  }

  useEffect(() => {
    if (!isEditMode) {
      undoRedo.reset();
      setActionNotice(null);
    }
  }, [isEditMode]);

  function openCell(slot, day, groupTag) {
    setActiveCell({ slotId: slot.id, dayOfWeek: day.day_of_week, slot, day, groupTag });
  }

  function closePicker() {
    setActiveCell(null);
  }

  async function refreshWorkspace() {
    const { data } = await api.get(`/timetables/${timetable.id}`);
    onWorkspaceChange?.(data);
  }

  async function recoverFromDesync() {
    try {
      await refreshWorkspace();
    } catch (err) {
      console.error("Resync after undo/redo failure also failed:", err);
    }
    undoRedo.reset();
    setActionNotice({
      title: "History reset after a sync issue",
      warnings: [
        "The last undo/redo step couldn't be completed cleanly, so history was cleared and the board was refreshed to match what's saved.",
      ],
    });
  }

  const commitSave = createCommitSave({
    timetable,
    entriesByCell,
    entries,
    orderedSlots,
    undoRedo,
    setSaveError,
    reportSaveError,
    refreshWorkspace,
    setActionNotice,
    closePicker,
  });

  const resizeEntry = createResizeEntry({
    timetable,
    entries,
    orderedSlots,
    undoRedo,
    setSaveError,
    reportSaveError,
    refreshWorkspace,
  });

  function handleSelect({ subjectId, groupTag, room }) {
    if (!activeCell) return;
    const cellEntries = entriesByCell[entryKey(activeCell.slotId, activeCell.dayOfWeek)];
    const plan = planEntrySave({
      cellEntries,
      sourceGroupTag: activeCell.groupTag,
      targetGroupTag: groupTag,
      subjectId,
      room,
    });

    if (plan.noop) {
      closePicker();
      return;
    }

    const finalGroupTag = plan.finalGroupTag || groupTag;
    const target = { slotId: activeCell.slotId, dayOfWeek: activeCell.dayOfWeek };
    const payload = {
      subjectId,
      groupTag: finalGroupTag,
      room,
      deletions: plan.deletions.map((tag) => ({
        slotId: target.slotId,
        dayOfWeek: target.dayOfWeek,
        groupTag: tag,
      })),
      swap: plan.swap,
      actionType: plan.actionType,
      warnings: plan.warnings,
      target,
      sourceCell: { slotId: activeCell.slotId, dayOfWeek: activeCell.dayOfWeek, groupTag: activeCell.groupTag },
    };

    commitSave(target, payload);
  }

  async function handleClear() {
    if (!activeCell) return;

    if (!undoRedo.acquire()) return;
    setSaveError(null);
    try {
      const groupTag = activeCell.groupTag || "all";
      const changes = [
        {
          slotId: activeCell.slotId,
          dayOfWeek: activeCell.dayOfWeek,
          groupTag,
          before: beforeStateFor(entriesByCell, activeCell.slotId, activeCell.dayOfWeek, groupTag),
          after: null,
        },
      ];
      await clearEntryAt(timetable.id, entriesByCell, activeCell.slotId, activeCell.dayOfWeek, groupTag);
      await refreshWorkspace();
      undoRedo.push({ label: "Clear subject", changes });
      closePicker();
    } catch (err) {
      reportSaveError(err, "Something went wrong clearing this cell.");
    } finally {
      undoRedo.release();
    }
  }

  function saveDraggedSubject(drop, groupTag, sourceCell = null) {
    let spanCount = 1;
    let sourceEntry = null;
    if (sourceCell) {
      sourceEntry = findEntryAtPosition(
        entriesByCell, sourceCell.slotId, sourceCell.dayOfWeek, sourceCell.groupTag
      );
      if (sourceEntry) {
        spanCount = getSpanCount(sourceEntry, orderedSlots);
      }
    }

    let effectiveDrop = drop;
    if (groupTag !== "all") {
      const startIdx = orderedSlots.findIndex((s) => s.id === drop.slotId);
      const clip = clipRangeAgainstSameSubjectAll({
        entries,
        orderedSlots,
        startIdx,
        spanCount,
        dayOfWeek: drop.dayOfWeek,
        groupTag,
        subjectId: drop.subjectId,
        excludeEntryId: sourceEntry?.id ?? null,
      });
      if (!clip) return;
      spanCount = clip.spanCount;
      effectiveDrop = { ...drop, slotId: orderedSlots[clip.startIdx].id };
    }

    {
      const clampStartIdx = orderedSlots.findIndex((s) => s.id === effectiveDrop.slotId);
      if (clampStartIdx !== -1) {
        const maxFree = computeMaxFreeSpan({
          entries,
          orderedSlots,
          startIdx: clampStartIdx,
          dayOfWeek: effectiveDrop.dayOfWeek,
          groupTag,
          excludeEntryId: sourceEntry?.id ?? null,
          maxSpan: spanCount,
        });
        spanCount = Math.min(spanCount, maxFree);
      }
    }

    let cellEntries = findEntriesCoveringRange(entries, orderedSlots, effectiveDrop.slotId, spanCount, effectiveDrop.dayOfWeek);
    if (sourceEntry) {
      const droppingOntoOwnPosition =
        sourceEntry.start_slot_id === effectiveDrop.slotId &&
        sourceEntry.day_of_week === effectiveDrop.dayOfWeek &&
        (sourceCell.groupTag === "all" || sourceCell.groupTag === groupTag);
      if (!droppingOntoOwnPosition) {
        cellEntries = cellEntries.filter((e) => e.id !== sourceEntry.id);
      }
    }
    const result = resolveDragMove({ cellEntries, drop: effectiveDrop, groupTag, sourceCell, spanCount });

    if (result.kind === "noop") return;

    if (result.kind === "clear-source") {

      if (!undoRedo.acquire()) return;
      const changes = [
        {
          slotId: result.sourceCell.slotId,
          dayOfWeek: result.sourceCell.dayOfWeek,
          groupTag: result.sourceCell.groupTag,
          before: beforeStateFor(
            entriesByCell,
            result.sourceCell.slotId,
            result.sourceCell.dayOfWeek,
            result.sourceCell.groupTag
          ),
          after: null,
        },
      ];
      clearEntryAt(timetable.id, entriesByCell, result.sourceCell.slotId, result.sourceCell.dayOfWeek, result.sourceCell.groupTag)
        .then(refreshWorkspace)
        .then(() => undoRedo.push({ label: "Move subject", changes }))
        .catch((err) => {
          reportSaveError(err, "Something went wrong moving this subject.");
        })
        .finally(() => undoRedo.release());
      return;
    }

    commitSave(result.payload.target, result.payload);
  }

  async function undo() {
    try {
      await undoRedo.undo((command) =>
        applyChanges(command.changes, "undo", {
          timetableId: timetable.id,
          entries,
          orderedSlots,
          refreshWorkspace,
        })
      );
      setActionNotice(null);
    } catch (err) {
      console.error("Undo failed:", err);
      await recoverFromDesync();
    }
  }

  async function redo() {
    try {
      await undoRedo.redo((command) =>
        applyChanges(command.changes, "redo", {
          timetableId: timetable.id,
          entries,
          orderedSlots,
          refreshWorkspace,
        })
      );
    } catch (err) {
      console.error("Redo failed:", err);
      await recoverFromDesync();
    }
  }

  const activeEntry = activeCell
    ? (entriesByCell[entryKey(activeCell.slotId, activeCell.dayOfWeek)] || []).find(
        (e) => e.group_tag === activeCell.groupTag
      ) || null
    : null;

  return {
    subjects,
    activeCell,
    activeEntry,
    saveError,
    clearSaveError: () => setSaveError(null),
    actionNotice,
    clearActionNotice: () => setActionNotice(null),
    openCell,
    closePicker,
    handleSelect,
    handleClear,
    saveDraggedSubject,
    resizeEntry,
    undo,
    redo,
    canUndo: undoRedo.canUndo,
    canRedo: undoRedo.canRedo,
  };
}
