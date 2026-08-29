import {
  updateEntryById,
  deleteEntryById,
  mergeAdjacentIfNeeded,
  resolveSpanOverlap,
  resolveLaneOverlap,
} from "./entryPersistence";
import { findEntriesCoveringRange } from "../layout/slotSpanUtils";
import { dedupeChanges } from "./dedupeChanges";
import { changeKey } from "./changeKey";

export function createResizeEntry({
  timetable,
  entries,
  orderedSlots,
  undoRedo,
  setSaveError,
  reportSaveError,
  refreshWorkspace,
}) {
  return async function resizeEntry(entry, newEndSlotId) {

    if (!undoRedo.acquire()) return { ok: false, conflict: false };

    const before = {
      subjectId: entry.subject_id,
      room: entry.room || null,
      slotId: entry.start_slot_id,
      endSlotId: entry.end_slot_id,
    };
    setSaveError(null);
    try {
      const startIdx = orderedSlots.findIndex((s) => s.id === entry.start_slot_id);
      const oldEndIdx = orderedSlots.findIndex((s) => s.id === entry.end_slot_id);
      const newEndIdx = orderedSlots.findIndex((s) => s.id === newEndSlotId);
      const overlapChanges = [];

      let effectiveEndSlotId = newEndSlotId;

      if (startIdx !== -1 && newEndIdx !== -1 && newEndIdx > oldEndIdx) {
        const spanCount = newEndIdx - startIdx + 1;
        const isBlockingTag = (t) =>
          entry.group_tag === "all" ? true : t === "all" || t === entry.group_tag;
        const covering = findEntriesCoveringRange(
          entries, orderedSlots, entry.start_slot_id, spanCount, entry.day_of_week
        );

        const sameIdentity = covering.filter(
          (e) =>
            e.id !== entry.id &&
            e.subject_id === entry.subject_id &&
            e.day_of_week === entry.day_of_week &&
            e.group_tag === entry.group_tag
        );

        let effectiveEndIdx = newEndIdx;
        for (const s of sameIdentity) {
          const sEndIdx = orderedSlots.findIndex((sl) => sl.id === s.end_slot_id);
          if (sEndIdx > effectiveEndIdx) {
            effectiveEndIdx = sEndIdx;
            effectiveEndSlotId = s.end_slot_id;
          }
        }

        for (const s of sameIdentity) {
          overlapChanges.push({
            slotId: s.start_slot_id,
            dayOfWeek: s.day_of_week,
            groupTag: s.group_tag,
            entryId: null,
            before: {
              subjectId: s.subject_id,
              room: s.room || null,
              slotId: s.start_slot_id,
              endSlotId: s.end_slot_id,
            },
            after: null,
          });
          await deleteEntryById(timetable.id, s.id);
        }

        const sameIdentityIds = new Set(sameIdentity.map((s) => s.id));
        const blocking = covering.filter(
          (e) => e.id !== entry.id && isBlockingTag(e.group_tag) && !sameIdentityIds.has(e.id)
        );
        for (const b of blocking) {
          if (entry.group_tag !== "all" && b.group_tag === "all") {
            const siblingTag = entry.group_tag === "g1" ? "g2" : "g1";
            const { siblingEntry, changes: laneChanges } = await resolveLaneOverlap(
              timetable.id, orderedSlots, b, entry.start_slot_id, effectiveEndSlotId, siblingTag
            );
            overlapChanges.push(...laneChanges);
            if (siblingEntry) {
              const siblingOwnStart = siblingEntry.start_slot_id;
              const siblingMerge = await mergeAdjacentIfNeeded(timetable.id, orderedSlots, entries, siblingEntry);
              if (siblingMerge.merged) {
                if (siblingMerge.finalStartSlotId !== siblingOwnStart) {
                  const staleKey = changeKey(siblingOwnStart, entry.day_of_week, siblingTag);
                  for (let i = 0; i < overlapChanges.length; i++) {
                    const c = overlapChanges[i];
                    if (changeKey(c.slotId, c.dayOfWeek, c.groupTag) === staleKey) {
                      overlapChanges[i] = { ...c, entryId: null, after: null };
                    }
                  }
                }
                overlapChanges.push(...siblingMerge.mergeChanges, siblingMerge.extensionChange);
              }
            }
          } else {
            const spanChanges = await resolveSpanOverlap(timetable.id, orderedSlots, b, entry.start_slot_id, effectiveEndSlotId);
            overlapChanges.push(...spanChanges);
          }
        }
      }

      await updateEntryById(timetable.id, entry.id, {
        slotId: entry.start_slot_id,
        endSlotId: effectiveEndSlotId,
        dayOfWeek: entry.day_of_week,
        groupTag: entry.group_tag,
        subjectId: entry.subject_id,
        room: entry.room,
      });

      const mergeResult = await mergeAdjacentIfNeeded(timetable.id, orderedSlots, entries, {
        id: entry.id,
        start_slot_id: entry.start_slot_id,
        end_slot_id: effectiveEndSlotId,
        day_of_week: entry.day_of_week,
        group_tag: entry.group_tag,
        subject_id: entry.subject_id,
        room: entry.room,
      });

      await refreshWorkspace();

      let ownRecord = {
        slotId: entry.start_slot_id,
        dayOfWeek: entry.day_of_week,
        groupTag: entry.group_tag,
        entryId: entry.id,
        before,
        after: { ...before, endSlotId: effectiveEndSlotId },
      };
      let extensionRecords = [];

      if (mergeResult.merged) {
        if (mergeResult.finalStartSlotId !== entry.start_slot_id) {
          ownRecord = { ...ownRecord, entryId: null, after: null };
        }
        extensionRecords = [mergeResult.extensionChange];
      }

      undoRedo.push({
        label: "Resize subject",
        changes: dedupeChanges([
          ...overlapChanges,
          ownRecord,
          ...mergeResult.mergeChanges,
          ...extensionRecords,
        ]),
      });
      return { ok: true };
    } catch (err) {
      reportSaveError(err, "Something went wrong resizing this entry.");
      if (err?.response?.status === 409) {
        return { ok: false, conflict: true, conflicts: err.response.data?.conflicts || [] };
      }
      return { ok: false, conflict: false };
    } finally {
      undoRedo.release();
    }
  };
}
