import { findEntryForGroup, findAllEntriesForGroup } from "../cell/cellDisplayUtils";
import { planEntrySave } from "../entries/entryPlanning";

export function actionNoticeConfig(actionType, isMove = false) {
  switch (actionType) {
    case "merge":
      return { title: "Merged duplicate subjects into All" };
    case "swap":
      return { title: "Swapped subjects between groups" };
    case "overwrite":
      return { title: isMove ? "Moved subject, replacing what was there" : "Replaced subject" };
    case "convert":
      return { title: isMove ? "Moved subject into a shared slot" : "Converted to a shared slot" };
    case "split":
      return { title: "Split the shared slot" };
    default:
      return { title: "Updated more than one slot" };
  }
}

export function resolveDragMove({ cellEntries, drop, groupTag, sourceCell, spanCount = null }) {
  const isSameCell =
    sourceCell &&
    sourceCell.slotId === drop.slotId &&
    sourceCell.dayOfWeek === drop.dayOfWeek &&
    (sourceCell.groupTag === "all" || sourceCell.groupTag === groupTag);

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
    isSameCell,
  });

  if (plan.noop) {
    if (sourceCell && !isSameCell) {
      return { kind: "clear-source", sourceCell };
    }
    return { kind: "noop" };
  }

  const deletions = plan.deletions.flatMap((tag) => {
    const matches = findAllEntriesForGroup(cellEntries, tag);
    if (matches.length === 0) {
      return [{ slotId: drop.slotId, dayOfWeek: drop.dayOfWeek, groupTag: tag }];
    }
    return matches.map((entry) => ({
      slotId: entry.start_slot_id,
      dayOfWeek: entry.day_of_week,
      groupTag: tag,
    }));
  });

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
    originalGroupTag: groupTag,
    room,
    deletions,
    swap: plan.swap,
    actionType: plan.actionType,
    warnings: plan.warnings,
    target: { slotId: drop.slotId, dayOfWeek: drop.dayOfWeek },
    sourceCell: sourceCell || null,
    isMove: Boolean(sourceCell),
    dragSpanCount: spanCount,
  };

  return { kind: "save", payload };
}
