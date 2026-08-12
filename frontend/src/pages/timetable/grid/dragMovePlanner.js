import { findEntryForGroup, planEntrySave } from "./timetableGridUtils";

export const DRAG_AUTO_CONFIRM_ACTIONS = new Set([
  "overwrite",
  "move",
  "expand",
  "noop",
  "merge",
]);

export function dialogConfigForAction(actionType, isMove = false) {
  switch (actionType) {
    case "merge":
      return { title: "Merge duplicate subjects?", confirmLabel: "Merge into All" };
    case "swap":
      return { title: "Swap subjects between groups?", confirmLabel: "Swap subjects" };
    case "overwrite":
      return isMove
        ? { title: "Move subject here?", confirmLabel: "Move anyway" }
        : { title: "Replace subject?", confirmLabel: "Replace" };
    case "convert":
      return isMove
        ? { title: "Move subject to a shared slot?", confirmLabel: "Move anyway" }
        : { title: "Convert to shared slot?", confirmLabel: "Convert to All" };
    case "split":
      return { title: "Split shared slot?", confirmLabel: "Split" };
    case "noop":
      return { title: "No changes", confirmLabel: "OK" };
    default:
      return { title: "This will change more than one thing", confirmLabel: "Continue" };
  }
}

export function resolveDragMove({ cellEntries, drop, groupTag, sourceCell }) {
  const isSameCell =
    sourceCell &&
    sourceCell.slotId === drop.slotId &&
    sourceCell.dayOfWeek === drop.dayOfWeek;

  if (isSameCell && sourceCell.groupTag === groupTag) {
    return { kind: "noop" };
  }

  let sourceGroupTag;
  let room;

  if (isSameCell) {
    sourceGroupTag = sourceCell.groupTag;
    room = sourceCell.room || null;
  } else {
    const allEntry = findEntryForGroup(cellEntries, "all");
    sourceGroupTag = allEntry ? "all" : groupTag;
    const currentEntry = allEntry || findEntryForGroup(cellEntries, groupTag);
    room = sourceCell?.room || currentEntry?.room || null;
  }

  const plan = planEntrySave({
    cellEntries,
    sourceGroupTag,
    targetGroupTag: groupTag,
    subjectId: drop.subjectId,
    room,
    isMove: Boolean(sourceCell),
  });

  if (plan.noop) {
    if (sourceCell && !isSameCell) {
      return { kind: "clear-source", sourceCell };
    }
    return { kind: "noop" };
  }

  const deletions = plan.deletions.map((tag) => ({
    slotId: drop.slotId,
    dayOfWeek: drop.dayOfWeek,
    groupTag: tag,
  }));

  if (sourceCell && !isSameCell) {
    deletions.push({
      slotId: sourceCell.slotId,
      dayOfWeek: sourceCell.dayOfWeek,
      groupTag: sourceCell.groupTag,
    });
  }

  const payload = {
    subjectId: drop.subjectId,
    groupTag: plan.finalGroupTag || groupTag,
    room,
    deletions,
    swap: plan.swap,
    actionType: plan.actionType,
    warnings: plan.warnings,
    target: { slotId: drop.slotId, dayOfWeek: drop.dayOfWeek },
    isMove: Boolean(sourceCell),
  };

  const skipConfirmForDrag = Boolean(sourceCell);

  return {
    kind: "save",
    needsConfirm: plan.needsConfirm && !skipConfirmForDrag,
    payload,
  };
}
