import {
  findEntryAtPosition,
  beforeStateFor,
  saveEntryAtPosition,
  clearEntryAt,
  createEntry,
  mergeAdjacentIfNeeded,
  resolveSpanOverlap,
  resolveLaneOverlap,
} from "./entryPersistence";
import { buildCommitChanges } from "./entryChangeBuilder";
import { getSpanCount, computeEndSlotId, computeMaxFreeSpan } from "../layout/slotSpanUtils";
import { actionNoticeConfig } from "../dragdrop/dragMovePlanner";
import { changeKey } from "./changeKey";
import { dedupeChanges } from "./dedupeChanges";
import { createLiveGridState, foldSavedEntryIntoLive, foldChangeIntoLiveState } from "./liveGridState";

function lanesConflict(tagA, tagB) {
  return tagA === "all" || tagB === "all" || tagA === tagB;
}

function sourceOverlapsClaim(sourceEntry, targetDayOfWeek, targetStartSlotId, targetEndSlotId, claimGroupTags, orderedSlots) {
  if (!sourceEntry) return false;
  if (sourceEntry.day_of_week !== targetDayOfWeek) return false;
  const idx = (slotId) => orderedSlots.findIndex((s) => s.id === slotId);
  const sStart = idx(sourceEntry.start_slot_id);
  const sEnd = idx(sourceEntry.end_slot_id);
  const tStart = idx(targetStartSlotId);
  const tEnd = idx(targetEndSlotId);
  if (sStart === -1 || sEnd === -1 || tStart === -1 || tEnd === -1) return true; 
  const rangesOverlap = sStart <= tEnd && tStart <= sEnd;
  if (!rangesOverlap) return false;
  return claimGroupTags.some((tag) => lanesConflict(sourceEntry.group_tag, tag));
}

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

    if (!undoRedo.acquire()) return;

    setSaveError(null);

    let sourceClearedEarly = false;
    let sourceSnapshotForRestore = null;

    try {
      const live = createLiveGridState(entries, orderedSlots);

      let spanCount = 1;
      if (payload.dragSpanCount != null) {
        spanCount = payload.dragSpanCount;
      } else if (payload.sourceCell) {
        const sourceEntry = findEntryAtPosition(
          live.entriesByCell, payload.sourceCell.slotId, payload.sourceCell.dayOfWeek, payload.sourceCell.groupTag
        );
        const originalSpan = sourceEntry ? getSpanCount(sourceEntry, orderedSlots) : 1;
        const targetStartIdx = orderedSlots.findIndex((s) => s.id === target.slotId);
        if (targetStartIdx !== -1) {
          spanCount = computeMaxFreeSpan({
            entries: live.entries,
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
        const targetEntry = findEntryAtPosition(live.entriesByCell, target.slotId, target.dayOfWeek, payload.groupTag);
        if (targetEntry) {
          spanCount = getSpanCount(targetEntry, orderedSlots);
        }
      }
      const targetEndSlotId = computeEndSlotId(orderedSlots, target.slotId, spanCount);

      const changes = buildCommitChanges({ ...payload, targetEndSlotId }, live.entriesByCell);

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

      for (const del of sameSpotDeletions) {
        const delEntry = findEntryAtPosition(live.entriesByCell, del.slotId, del.dayOfWeek, del.groupTag);
        if (!delEntry) continue;
        if (handledDelEntryIds.has(delEntry.id)) continue;
        handledDelEntryIds.add(delEntry.id);
        if (expectedSiblingGroupTag && del.groupTag === expectedSiblingGroupTag) {
          mergeSiblingSpan = { start: delEntry.start_slot_id, end: delEntry.end_slot_id };
        }

        replacedKeys.add(changeKey(del.slotId, del.dayOfWeek, del.groupTag));

        const isCrossGroupOverlap =
          (payload.groupTag === "g1" || payload.groupTag === "g2") &&
          (delEntry.group_tag === "all" || delEntry.group_tag === "g1" || delEntry.group_tag === "g2") &&
          delEntry.group_tag !== payload.groupTag;

        if (isCrossGroupOverlap) {
          const siblingTag = delEntry.group_tag === "all" ? (payload.groupTag === "g1" ? "g2" : "g1") : delEntry.group_tag;
          const { changes: laneChanges } = await resolveLaneOverlap(
            timetable.id, orderedSlots, delEntry, target.slotId, targetEndSlotId, siblingTag
          );
          for (const c of laneChanges) foldChangeIntoLiveState(live, c);
          overlapResolutionChanges.push(...laneChanges);
        } else {
          const spanChanges = await resolveSpanOverlap(timetable.id, orderedSlots, delEntry, target.slotId, targetEndSlotId);
          for (const c of spanChanges) foldChangeIntoLiveState(live, c);
          overlapResolutionChanges.push(...spanChanges);
        }
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

      const toClear = sourceVacateDeletion
        ? findEntryAtPosition(live.entriesByCell, sourceVacateDeletion.slotId, sourceVacateDeletion.dayOfWeek, sourceVacateDeletion.groupTag)
        : null;

      const claimGroupTags = segments
        ? segments.map((s) => s.groupTag)
        : [payload.groupTag, ...(payload.swap ? [payload.swap.groupTag] : [])];

      const mustClearSourceFirst =
        Boolean(toClear) && sourceOverlapsClaim(toClear, target.dayOfWeek, target.slotId, targetEndSlotId, claimGroupTags, orderedSlots);

      if (sourceVacateDeletion && mustClearSourceFirst) {
        sourceSnapshotForRestore = {
          start_slot_id: toClear.start_slot_id,
          end_slot_id: toClear.end_slot_id,
          day_of_week: toClear.day_of_week,
          group_tag: toClear.group_tag,
          subject_id: toClear.subject_id,
          room: toClear.room,
        };
        await clearEntryAt(
          timetable.id, live.entriesByCell, sourceVacateDeletion.slotId, sourceVacateDeletion.dayOfWeek, sourceVacateDeletion.groupTag
        );
        live.recordDelete(toClear.id);
        sourceClearedEarly = true;
      }

      const entriesForMerge = toClear ? live.entries.filter((e) => e.id !== toClear.id) : live.entries;

      let savedEntry = null;
      let swapSaved = null;
      let mergeResult = { merged: false, mergeChanges: [], extensionChange: null };
      const segmentMergeChanges = [];
      const segmentResults = [];

      if (segments) {
        for (const seg of segments) {
          const segEntry = await saveEntryAtPosition(
            timetable.id, live.entriesByCell, orderedSlots, seg.slotId, target.dayOfWeek, seg.groupTag,
            payload.subjectId, payload.room, { explicitEndSlotId: seg.endSlotId }
          );
          foldSavedEntryIntoLive(live, segEntry);
          segmentResults.push({ seg, segEntry });
          if (seg.groupTag === payload.groupTag) savedEntry = segEntry;
          if (segEntry) {
            const segMerge = await mergeAdjacentIfNeeded(timetable.id, orderedSlots, entriesForMerge, segEntry);
            if (segMerge.merged) {
              for (const c of [...segMerge.mergeChanges, segMerge.extensionChange]) foldChangeIntoLiveState(live, c);
              segmentMergeChanges.push(...segMerge.mergeChanges, segMerge.extensionChange);
            }
          }
        }
      } else {
        savedEntry = await saveEntryAtPosition(
          timetable.id, live.entriesByCell, orderedSlots, target.slotId, target.dayOfWeek, payload.groupTag,
          payload.subjectId, payload.room, { spanCount, excludeExistingIds: handledDelEntryIds }
        );
        foldSavedEntryIntoLive(live, savedEntry);
        if (payload.swap) {
          swapSaved = await saveEntryAtPosition(
            timetable.id, live.entriesByCell, orderedSlots, target.slotId, target.dayOfWeek, payload.swap.groupTag,
            payload.swap.subjectId, payload.swap.room, { spanCount }
          );
          foldSavedEntryIntoLive(live, swapSaved);
        }
        if (!payload.swap && savedEntry) {
          mergeResult = await mergeAdjacentIfNeeded(timetable.id, orderedSlots, entriesForMerge, savedEntry);
          if (mergeResult.merged) {
            for (const c of [...mergeResult.mergeChanges, mergeResult.extensionChange]) foldChangeIntoLiveState(live, c);
          }
        }
      }

      if (sourceVacateDeletion && !mustClearSourceFirst) {
        await clearEntryAt(
          timetable.id, live.entriesByCell, sourceVacateDeletion.slotId, sourceVacateDeletion.dayOfWeek, sourceVacateDeletion.groupTag
        );
        if (toClear) live.recordDelete(toClear.id);
      }

      const targetKey = changeKey(target.slotId, target.dayOfWeek, payload.groupTag);
      const swapKey = payload.swap ? changeKey(target.slotId, target.dayOfWeek, payload.swap.groupTag) : null;

      let finalChanges = changes.filter((c) => {
        const key = changeKey(c.slotId, c.dayOfWeek, c.groupTag);
        return key === targetKey || !replacedKeys.has(key);
      });

      finalChanges = finalChanges.map((c) => {
        const key = changeKey(c.slotId, c.dayOfWeek, c.groupTag);
        if (key === targetKey && savedEntry) return { ...c, entryId: savedEntry.id };
        if (swapKey && key === swapKey && swapSaved) return { ...c, entryId: swapSaved.id };
        return c;
      });

      finalChanges = [
        ...finalChanges,
        ...overlapResolutionChanges.filter((c) => changeKey(c.slotId, c.dayOfWeek, c.groupTag) !== targetKey),
      ];

      if (segments) {
        const targetKeyToDrop = changeKey(target.slotId, target.dayOfWeek, payload.groupTag);
        const segmentChanges = segmentResults.map(({ seg, segEntry }) => ({
          slotId: seg.slotId,
          dayOfWeek: target.dayOfWeek,
          groupTag: seg.groupTag,
          entryId: segEntry ? segEntry.id : null,
          before: beforeStateFor(entriesByCell, seg.slotId, target.dayOfWeek, seg.groupTag),
          after: segEntry
            ? { subjectId: payload.subjectId, room: payload.room || null, slotId: seg.slotId, endSlotId: seg.endSlotId }
            : null,
        }));
        finalChanges = [
          ...finalChanges.filter((c) => changeKey(c.slotId, c.dayOfWeek, c.groupTag) !== targetKeyToDrop),
          ...segmentChanges,
        ];
      }

      if (mergeResult.merged) {
        if (mergeResult.finalStartSlotId !== target.slotId) {
          finalChanges = finalChanges.map((c) =>
            changeKey(c.slotId, c.dayOfWeek, c.groupTag) === targetKey ? { ...c, entryId: null, after: null } : c
          );
        }
        finalChanges = [...finalChanges, mergeResult.extensionChange];
      }

      await refreshWorkspace();
      undoRedo.push({
        label: "Assign subject",
        changes: dedupeChanges([...finalChanges, ...mergeResult.mergeChanges, ...segmentMergeChanges]),
      });

      if (payload.warnings && payload.warnings.length > 0) {
        const { title } = actionNoticeConfig(payload.actionType, payload.isMove);
        setActionNotice({ title, warnings: payload.warnings });
      } else {
        setActionNotice(null);
      }

      closePicker();
    } catch (err) {
      if (sourceClearedEarly && sourceSnapshotForRestore) {
        try {
          await createEntry(timetable.id, {
            slotId: sourceSnapshotForRestore.start_slot_id,
            endSlotId: sourceSnapshotForRestore.end_slot_id,
            dayOfWeek: sourceSnapshotForRestore.day_of_week,
            groupTag: sourceSnapshotForRestore.group_tag,
            subjectId: sourceSnapshotForRestore.subject_id,
            room: sourceSnapshotForRestore.room,
          });
        } catch (restoreErr) {
          console.error("Compensating restore of source entry after a failed move also failed:", restoreErr);
        }
      }
      reportSaveError(err, "Something went wrong saving. Try again.");
      try {
        await refreshWorkspace();
      } catch (refreshErr) {
        console.error("Resync after failed save also failed:", refreshErr);
      }
      undoRedo.reset();
    } finally {
      undoRedo.release();
    }
  };
}
