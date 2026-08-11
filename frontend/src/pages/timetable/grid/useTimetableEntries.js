import { useEffect, useState } from "react";
import api from "../../../lib/api";
import { entryKey, findEntryForGroup, planEntrySave } from "./timetableGridUtils";

function dialogConfigForAction(actionType) {
  switch (actionType) {
    case "merge":
      return { title: "Merge duplicate subjects?", confirmLabel: "Merge into All" };
    case "swap":
      return { title: "Swap subjects between groups?", confirmLabel: "Swap subjects" };
    case "overwrite":
      return { title: "Replace subject?", confirmLabel: "Replace" };
    case "convert":
      return { title: "Convert to shared slot?", confirmLabel: "Convert to All" };
    case "split":
      return { title: "Split shared slot?", confirmLabel: "Split" };
    case "noop":
      return { title: "No changes", confirmLabel: "OK" };
    default:
      return { title: "This will change more than one thing", confirmLabel: "Continue" };
  }
}

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

  async function commitSave(target, { subjectId, groupTag, room, deletions, swap }) {
    if (!target) return;
    try {
      for (const deleteGroupTag of deletions) {
        await api.delete(`/timetables/${timetable.id}/entries`, {
          data: {
            slotId: target.slotId,
            dayOfWeek: target.dayOfWeek,
            groupTag: deleteGroupTag,
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
      deletions: plan.deletions,
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
      await api.delete(`/timetables/${timetable.id}/entries`, {
        data: { slotId: activeCell.slotId, dayOfWeek: activeCell.dayOfWeek, groupTag },
      });
      await refreshWorkspace();
      closePicker();
    } catch (err) {
      console.error("Clear entry error:", err);
    }
  }

  function saveDraggedSubject(drop, groupTag) {
    const cellEntries = entriesByCell[entryKey(drop.slotId, drop.dayOfWeek)];
    const allEntry = findEntryForGroup(cellEntries, "all");
    const sourceGroupTag = allEntry ? "all" : groupTag;
    const currentEntry = allEntry || findEntryForGroup(cellEntries, groupTag);
    const room = currentEntry?.room || null;

    const plan = planEntrySave({
      cellEntries,
      sourceGroupTag,
      targetGroupTag: groupTag,
      subjectId: drop.subjectId,
      room,
    });

    if (plan.noop) return;

    const payload = {
      subjectId: drop.subjectId,
      groupTag: plan.finalGroupTag || groupTag,
      room,
      deletions: plan.deletions,
      swap: plan.swap,
      actionType: plan.actionType,
      warnings: plan.warnings,
      target: { slotId: drop.slotId, dayOfWeek: drop.dayOfWeek },
    };

    if (plan.needsConfirm) {
      setPendingSave(payload);
    } else {
      commitSave(payload.target, payload);
    }
  }

  const activeEntry = activeCell
    ? findEntryForGroup(
        entriesByCell[entryKey(activeCell.slotId, activeCell.dayOfWeek)],
        activeCell.groupTag
      )
    : null;

  const dialogConfig = pendingSave ? dialogConfigForAction(pendingSave.actionType) : null;

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
