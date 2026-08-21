import { useEffect, useState } from "react";
import api from "../../../lib/api";
import { entryKey, planEntrySave } from "./timetableGridUtils";
import { dialogConfigForAction, resolveDragMove } from "./dragMovePlanner";
import { useUndoRedo } from "./useUndoRedo";

function beforeStateFor(entriesByCell, slotId, dayOfWeek, groupTag) {
  const cellEntries = entriesByCell[entryKey(slotId, dayOfWeek)] || [];
  const entry = cellEntries.find((e) => e.group_tag === groupTag);
  return entry ? { subjectId: entry.subject_id, room: entry.room || null } : null;
}

function buildCommitChanges(payload, entriesByCell) {
  const changesMap = new Map();

  function recordChange(slotId, dayOfWeek, groupTag, after) {
    const key = `${slotId}-${dayOfWeek}-${groupTag}`;
    changesMap.set(key, {
      slotId,
      dayOfWeek,
      groupTag,
      before: beforeStateFor(entriesByCell, slotId, dayOfWeek, groupTag),
      after,
    });
  }

  recordChange(payload.target.slotId, payload.target.dayOfWeek, payload.groupTag, {
    subjectId: payload.subjectId,
    room: payload.room || null,
  });

  if (payload.swap) {
    recordChange(payload.target.slotId, payload.target.dayOfWeek, payload.swap.groupTag, {
      subjectId: payload.swap.subjectId,
      room: payload.swap.room || null,
    });
  }

  for (const del of payload.deletions) {
    const key = `${del.slotId}-${del.dayOfWeek}-${del.groupTag}`;
    if (changesMap.has(key)) continue;
    recordChange(del.slotId, del.dayOfWeek, del.groupTag, null);
  }

  if (payload.groupTag !== "all") {
    const allKey = `${payload.target.slotId}-${payload.target.dayOfWeek}-all`;
    if (!changesMap.has(allKey)) {
      const existingAll = beforeStateFor(
        entriesByCell,
        payload.target.slotId,
        payload.target.dayOfWeek,
        "all"
      );
      if (existingAll) {
        recordChange(payload.target.slotId, payload.target.dayOfWeek, "all", null);
      }
    }
  }

  return Array.from(changesMap.values());
}

export function useTimetableEntries({ timetable, entriesByCell, onWorkspaceChange, isEditMode }) {
  const [subjects, setSubjects] = useState([]);
  useEffect(() => {
    api
      .get("/subjects")
      .then(({ data }) => setSubjects(data.subjects))
      .catch((err) => console.error("Load subjects error:", err));
  }, []);

  const [activeCell, setActiveCell] = useState(null);
  const [pendingSave, setPendingSave] = useState(null);
  const undoRedo = useUndoRedo();

  useEffect(() => {
    if (!isEditMode) {
      undoRedo.reset();
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

  async function clearEntryAt(slotId, dayOfWeek, groupTag) {
    try {
      await api.delete(`/timetables/${timetable.id}/entries`, {
        data: { slotId, dayOfWeek, groupTag },
      });
    } catch (err) {
      if (err?.response?.status !== 404) throw err;
    }
  }

  async function putEntry(slotId, dayOfWeek, groupTag, subjectId, room) {
    await api.put(`/timetables/${timetable.id}/entries`, {
      slotId,
      dayOfWeek,
      subjectId,
      groupTag,
      room,
    });
  }

  async function applyChanges(changes, direction) {
    const ordered = direction === "undo" ? [...changes].reverse() : changes;
    for (const change of ordered) {
      const state = direction === "undo" ? change.before : change.after;
      if (!state) {
        await clearEntryAt(change.slotId, change.dayOfWeek, change.groupTag);
      } else {
        await putEntry(change.slotId, change.dayOfWeek, change.groupTag, state.subjectId, state.room);
      }
    }
    await refreshWorkspace();
  }

  async function commitResize({ sourceSlotId, dayOfWeek, groupTag, targetSlotIds }) {
    if (!targetSlotIds.length) return;
    const sourceEntries = entriesByCell[entryKey(sourceSlotId, dayOfWeek)] || [];
    const sourceEntry = sourceEntries.find((e) => e.group_tag === groupTag);
    if (!sourceEntry) return;

    const changes = targetSlotIds.map((slotId) => ({
      slotId,
      dayOfWeek,
      groupTag,
      before: beforeStateFor(entriesByCell, slotId, dayOfWeek, groupTag),
      after: { subjectId: sourceEntry.subject_id, room: sourceEntry.room || null },
    }));

    try {
      await applyChanges(changes, "redo");
      undoRedo.push({ label: "Resize subject", changes });
    } catch (err) {
      console.error("Resize subject error:", err);
    }
  }

  async function commitSave(target, payload) {
    if (!target) return;
    const changes = buildCommitChanges(payload, entriesByCell);
    try {
      for (const del of payload.deletions) {
        await clearEntryAt(del.slotId, del.dayOfWeek, del.groupTag);
      }
      await putEntry(target.slotId, target.dayOfWeek, payload.groupTag, payload.subjectId, payload.room);
      if (payload.swap) {
        await putEntry(
          target.slotId,
          target.dayOfWeek,
          payload.swap.groupTag,
          payload.swap.subjectId,
          payload.swap.room
        );
      }
      await refreshWorkspace();
      undoRedo.push({ label: "Assign subject", changes });
      closePicker();
    } catch (err) {
      console.error("Assign subject error:", err);
    }
  }

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
    };

    if (plan.needsConfirm) {
      setPendingSave(payload);
      return;
    }

    commitSave(target, payload);
  }

  async function handleClear() {
    if (!activeCell) return;
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
      await clearEntryAt(activeCell.slotId, activeCell.dayOfWeek, groupTag);
      await refreshWorkspace();
      undoRedo.push({ label: "Clear subject", changes });
      closePicker();
    } catch (err) {
      console.error("Clear entry error:", err);
    }
  }

  function saveDraggedSubject(drop, groupTag, sourceCell = null) {
    const cellEntries = entriesByCell[entryKey(drop.slotId, drop.dayOfWeek)];
    const result = resolveDragMove({ cellEntries, drop, groupTag, sourceCell });

    if (result.kind === "noop") return;

    if (result.kind === "clear-source") {
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
      clearEntryAt(result.sourceCell.slotId, result.sourceCell.dayOfWeek, result.sourceCell.groupTag)
        .then(refreshWorkspace)
        .then(() => undoRedo.push({ label: "Move subject", changes }))
        .catch((err) => console.error("Move subject error:", err));
      return;
    }

    if (result.needsConfirm) {
      setPendingSave(result.payload);
    } else {
      commitSave(result.payload.target, result.payload);
    }
  }

  async function undo() {
    try {
      await undoRedo.undo((command) => applyChanges(command.changes, "undo"));
    } catch (err) {
      console.error("Undo failed:", err);
    }
  }

  async function redo() {
    try {
      await undoRedo.redo((command) => applyChanges(command.changes, "redo"));
    } catch (err) {
      console.error("Redo failed:", err);
    }
  }

  const activeEntry = activeCell
    ? (entriesByCell[entryKey(activeCell.slotId, activeCell.dayOfWeek)] || []).find(
        (e) => e.group_tag === activeCell.groupTag
      ) || null
    : null;

  const dialogConfig = pendingSave ? dialogConfigForAction(pendingSave.actionType, pendingSave.isMove) : null;

  return {
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
    canUndo: undoRedo.canUndo,
    canRedo: undoRedo.canRedo,
  };
}
