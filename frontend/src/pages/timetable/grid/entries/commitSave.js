import {
  findEntryAtPosition,
  beforeStateFor,
  saveEntryAtPosition,
  clearEntryAt,
  mergeAdjacentIfNeeded,
  resolveSpanOverlap,
  resolveLaneOverlap,
} from "./entryPersistence";
import { buildCommitChanges } from "./entryChangeBuilder";
import { getSpanCount, computeEndSlotId, computeMaxFreeSpan } from "../layout/slotSpanUtils";
import { actionNoticeConfig } from "../dragdrop/dragMovePlanner";
import { changeKey } from "./changeKey";

export function createCommitSave({
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
}) {
  return async function commitSave(target, payload) {
    if (!target) return;

    let spanCount = 1;
    if (payload.dragSpanCount != null) {
      spanCount = payload.dragSpanCount;
    } else if (payload.sourceCell) {
      const sourceEntry = findEntryAtPosition(
        entriesByCell, payload.sourceCell.slotId, payload.sourceCell.dayOfWeek, payload.sourceCell.groupTag
      );
      const originalSpan = sourceEntry ? getSpanCount(sourceEntry, orderedSlots) : 1;
      const targetStartIdx = orderedSlots.findIndex((s) => s.id === target.slotId);
      if (targetStartIdx !== -1) {
        spanCount = computeMaxFreeSpan({
          entries,
          orderedSlots,
          startIdx: targetStartIdx,
          dayOfWeek: target.dayOfWeek,
          groupTag: payload.groupTag,
          excludeEntryId: sourceEntry?.id ?? null,
          maxSpan: originalSpan,
        });
      } else {
        spanCount = originalSpan;
      }
    } else {
      const targetEntry = findEntryAtPosition(entriesByCell, target.slotId, target.dayOfWeek, payload.groupTag);
      if (targetEntry) {
        spanCount = getSpanCount(targetEntry, orderedSlots);
      }
    }
    const targetEndSlotId = computeEndSlotId(orderedSlots, target.slotId, spanCount);

    const changes = buildCommitChanges({ ...payload, targetEndSlotId }, entriesByCell);

    const sourceKey = payload.sourceCell
      ? changeKey(payload.sourceCell.slotId, payload.sourceCell.dayOfWeek, payload.sourceCell.groupTag)
      : null;

    const sameSpotDeletions = [];
    let sourceVacateDeletion = null;
    const handledDelEntryIds = new Set();
    for (const del of payload.deletions) {
      const delKey = changeKey(del.slotId, del.dayOfWeek, del.groupTag);
      if (sourceKey && delKey === sourceKey) {
        sourceVacateDeletion = del;
      } else {
        sameSpotDeletions.push(del);
      }
    }

    const expectedSiblingGroupTag =
      payload.actionType === "merge" && payload.originalGroupTag
        ? payload.originalGroupTag === "g1" ? "g2" : "g1"
        : null;
    let mergeSiblingSpan = null;

    const overlapResolutionChanges = [];
    const replacedKeys = new Set();

    setSaveError(null);
    try {
      for (const del of sameSpotDeletions) {
        const delEntry = findEntryAtPosition(entriesByCell, del.slotId, del.dayOfWeek, del.groupTag);
        if (!delEntry) continue;
        handledDelEntryIds.add(delEntry.id);
        if (expectedSiblingGroupTag && del.groupTag === expectedSiblingGroupTag) {
          mergeSiblingSpan = { start: delEntry.start_slot_id, end: delEntry.end_slot_id };
        }

        replacedKeys.add(changeKey(del.slotId, del.dayOfWeek, del.groupTag));

        if (delEntry.group_tag === "all" && (payload.groupTag === "g1" || payload.groupTag === "g2")) {
          const siblingTag = payload.groupTag === "g1" ? "g2" : "g1";
          const { changes: laneChanges } = await resolveLaneOverlap(
            timetable.id, orderedSlots, delEntry, target.slotId, targetEndSlotId, siblingTag
          );
          overlapResolutionChanges.push(...laneChanges);
        } else {
          const spanChanges = await resolveSpanOverlap(timetable.id, orderedSlots, delEntry, target.slotId, targetEndSlotId);
          overlapResolutionChanges.push(...spanChanges);
        }
      }
      if (sourceVacateDeletion) {
        await clearEntryAt(
          timetable.id, entriesByCell, sourceVacateDeletion.slotId, sourceVacateDeletion.dayOfWeek, sourceVacateDeletion.groupTag
        );
      }

      const idx = (slotId) => orderedSlots.findIndex((s) => s.id === slotId);
      let segments = null;
      if (mergeSiblingSpan && payload.originalGroupTag && payload.originalGroupTag !== payload.groupTag) {
        const dropStartIdx = idx(target.slotId);
        const dropEndIdx = idx(targetEndSlotId);
        const sibStartIdx = idx(mergeSiblingSpan.start);
        const sibEndIdx = idx(mergeSiblingSpan.end);
        if (dropStartIdx !== -1 && dropEndIdx !== -1 && sibStartIdx !== -1 && sibEndIdx !== -1) {
          const overlapStartIdx = Math.max(dropStartIdx, sibStartIdx);
          const overlapEndIdx = Math.min(dropEndIdx, sibEndIdx);
          if (overlapStartIdx <= overlapEndIdx && (overlapStartIdx > dropStartIdx || overlapEndIdx < dropEndIdx)) {
            segments = [];
            if (overlapStartIdx > dropStartIdx) {
              segments.push({
                slotId: orderedSlots[dropStartIdx].id,
                endSlotId: orderedSlots[overlapStartIdx - 1].id,
                groupTag: payload.originalGroupTag,
              });
            }
            segments.push({
              slotId: orderedSlots[overlapStartIdx].id,
              endSlotId: orderedSlots[overlapEndIdx].id,
              groupTag: "all",
            });
            if (overlapEndIdx < dropEndIdx) {
              segments.push({
                slotId: orderedSlots[overlapEndIdx + 1].id,
                endSlotId: orderedSlots[dropEndIdx].id,
                groupTag: payload.originalGroupTag,
              });
            }
          }
        }
      }

      let savedEntry = null;
      let mergeResult = { merged: false, mergeChanges: [] };
      const segmentMergeChanges = [];
      const entriesForMerge = sourceVacateDeletion
        ? entries.filter(
            (e) =>
              !(
                e.day_of_week === sourceVacateDeletion.dayOfWeek &&
                e.group_tag === sourceVacateDeletion.groupTag &&
                e.start_slot_id === sourceVacateDeletion.slotId
              )
          )
        : entries;

      if (segments) {
        for (const seg of segments) {
          const segEntry = await saveEntryAtPosition(
            timetable.id, entriesByCell, orderedSlots, seg.slotId, target.dayOfWeek, seg.groupTag,
            payload.subjectId, payload.room, { explicitEndSlotId: seg.endSlotId }
          );
          if (seg.groupTag === payload.groupTag) savedEntry = segEntry;
          if (segEntry) {
            const segMerge = await mergeAdjacentIfNeeded(timetable.id, orderedSlots, entriesForMerge, segEntry);
            if (segMerge.merged) segmentMergeChanges.push(...segMerge.mergeChanges);
          }
        }
      } else {
        savedEntry = await saveEntryAtPosition(
          timetable.id, entriesByCell, orderedSlots, target.slotId, target.dayOfWeek, payload.groupTag,
          payload.subjectId, payload.room, { spanCount, excludeExistingIds: handledDelEntryIds }
        );
        if (payload.swap) {
          await saveEntryAtPosition(
            timetable.id, entriesByCell, orderedSlots, target.slotId, target.dayOfWeek, payload.swap.groupTag,
            payload.swap.subjectId, payload.swap.room, { spanCount }
          );
        }
        if (!payload.swap && savedEntry) {
          mergeResult = await mergeAdjacentIfNeeded(timetable.id, orderedSlots, entriesForMerge, savedEntry);
        }
      }

      const targetKey = changeKey(target.slotId, target.dayOfWeek, payload.groupTag);
      let finalChanges = changes.filter((c) => {
        const key = changeKey(c.slotId, c.dayOfWeek, c.groupTag);
        return key === targetKey || !replacedKeys.has(key);
      });
      finalChanges = [
        ...finalChanges,
        ...overlapResolutionChanges.filter((c) => changeKey(c.slotId, c.dayOfWeek, c.groupTag) !== targetKey),
      ];

      if (segments) {
        const targetKeyToDrop = changeKey(target.slotId, target.dayOfWeek, payload.groupTag);
        const segmentChanges = segments.map((seg) => ({
          slotId: seg.slotId,
          dayOfWeek: target.dayOfWeek,
          groupTag: seg.groupTag,
          before: beforeStateFor(entriesByCell, seg.slotId, target.dayOfWeek, seg.groupTag),
          after: { subjectId: payload.subjectId, room: payload.room || null, endSlotId: seg.endSlotId },
        }));
        finalChanges = [
          ...finalChanges.filter((c) => changeKey(c.slotId, c.dayOfWeek, c.groupTag) !== targetKeyToDrop),
          ...segmentChanges,
        ];
      }

      await refreshWorkspace();
      undoRedo.push({
        label: "Assign subject",
        changes: [...finalChanges, ...mergeResult.mergeChanges, ...segmentMergeChanges],
      });

      if (payload.warnings && payload.warnings.length > 0) {
        const { title } = actionNoticeConfig(payload.actionType, payload.isMove);
        setActionNotice({ title, warnings: payload.warnings });
      } else {
        setActionNotice(null);
      }

      closePicker();
    } catch (err) {
      reportSaveError(err, "Something went wrong saving. Try again.");
    }
  };
}
