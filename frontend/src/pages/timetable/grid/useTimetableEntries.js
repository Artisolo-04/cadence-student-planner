import { useEffect, useState } from "react";
import api from "../../../lib/api";
import { entryKey, planEntrySave } from "./timetableGridUtils";
import { dialogConfigForAction, resolveDragMove } from "./dragMovePlanner";

export function useTimetableEntries({ timetable, entriesByCell, onWorkspaceChange }) {
  const [subjects, setSubjects] = useState([]);
  useEffect(() => {
    api
      .get("/subjects")
      .then(({ data }) => setSubjects(data.subjects))
      .catch((err) => console.error("Load subjects error:", err));
  }, []);

  const [activeCell, setActiveCell] = useState(null);
  const [pendingSave, setPendingSave] = useState(null);

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
    await api.delete(`/timetables/${timetable.id}/entries`, {
      data: { slotId, dayOfWeek, groupTag },
    });
  }

  async function commitSave(target, { subjectId, groupTag, room, deletions, swap }) {
    if (!target) return;
    try {
      for (const del of deletions) {
        await api.delete(`/timetables/${timetable.id}/entries`, {
          data: {
            slotId: del.slotId,
            dayOfWeek: del.dayOfWeek,
            groupTag: del.groupTag,
          },
        });
      }
      await api.put(`/timetables/${timetable.id}/entries`, {
        slotId: target.slotId,
        dayOfWeek: target.dayOfWeek,
        subjectId,
        groupTag,
        room,
      });
      if (swap) {
        await api.put(`/timetables/${timetable.id}/entries`, {
          slotId: target.slotId,
          dayOfWeek: target.dayOfWeek,
          subjectId: swap.subjectId,
          groupTag: swap.groupTag,
          room: swap.room,
        });
      }
      await refreshWorkspace();
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
      await clearEntryAt(activeCell.slotId, activeCell.dayOfWeek, groupTag);
      await refreshWorkspace();
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
      clearEntryAt(result.sourceCell.slotId, result.sourceCell.dayOfWeek, result.sourceCell.groupTag)
        .then(refreshWorkspace)
        .catch((err) => console.error("Move subject error:", err));
      return;
    }

    if (result.needsConfirm) {
      setPendingSave(result.payload);
    } else {
      commitSave(result.payload.target, result.payload);
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
    commitSave,
    setPendingSave,
  };
}
