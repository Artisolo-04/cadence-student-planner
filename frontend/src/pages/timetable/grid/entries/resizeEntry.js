import {
  updateEntryById,
  mergeAdjacentIfNeeded,
  resolveSpanOverlap,
  resolveLaneOverlap,
} from "./entryPersistence";
import { findEntriesCoveringRange } from "../layout/timetableGridUtils";

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
    const before = {
      subjectId: entry.subject_id,
      room: entry.room || null,
      endSlotId: entry.end_slot_id,
    };
    setSaveError(null);
    try {
      const startIdx = orderedSlots.findIndex((s) => s.id === entry.start_slot_id);
      const oldEndIdx = orderedSlots.findIndex((s) => s.id === entry.end_slot_id);
      const newEndIdx = orderedSlots.findIndex((s) => s.id === newEndSlotId);
      const overlapChanges = [];

      if (startIdx !== -1 && newEndIdx !== -1 && newEndIdx > oldEndIdx) {
        const spanCount = newEndIdx - startIdx + 1;
        const isBlockingTag = (t) =>
          entry.group_tag === "all" ? true : t === "all" || t === entry.group_tag;
        const covering = findEntriesCoveringRange(
          entries, orderedSlots, entry.start_slot_id, spanCount, entry.day_of_week
        );
        const blocking = covering.filter((e) => e.id !== entry.id && isBlockingTag(e.group_tag));
        for (const b of blocking) {
          if (entry.group_tag !== "all" && b.group_tag === "all") {
            const siblingTag = entry.group_tag === "g1" ? "g2" : "g1";
            const { siblingEntry, changes: laneChanges } = await resolveLaneOverlap(
              timetable.id, orderedSlots, b, entry.start_slot_id, newEndSlotId, siblingTag
            );
            overlapChanges.push(...laneChanges);
            if (siblingEntry) {
              const siblingMerge = await mergeAdjacentIfNeeded(timetable.id, orderedSlots, entries, siblingEntry);
              if (siblingMerge.merged) {
                overlapChanges.push(...siblingMerge.mergeChanges);
              }
            }
          } else {
            const spanChanges = await resolveSpanOverlap(timetable.id, orderedSlots, b, entry.start_slot_id, newEndSlotId);
            overlapChanges.push(...spanChanges);
          }
        }
      }

      await updateEntryById(timetable.id, entry.id, {
        slotId: entry.start_slot_id,
        endSlotId: newEndSlotId,
        dayOfWeek: entry.day_of_week,
        groupTag: entry.group_tag,
        subjectId: entry.subject_id,
        room: entry.room,
      });

      const mergeResult = await mergeAdjacentIfNeeded(timetable.id, orderedSlots, entries, {
        id: entry.id,
        start_slot_id: entry.start_slot_id,
        end_slot_id: newEndSlotId,
        day_of_week: entry.day_of_week,
        group_tag: entry.group_tag,
        subject_id: entry.subject_id,
        room: entry.room,
      });

      await refreshWorkspace();
      undoRedo.push({
        label: "Resize subject",
        changes: [
          ...overlapChanges,
          {
            slotId: entry.start_slot_id,
            dayOfWeek: entry.day_of_week,
            groupTag: entry.group_tag,
            before,
            after: {
              ...before,
              endSlotId: mergeResult.merged ? mergeResult.finalEndSlotId : newEndSlotId,
            },
          },
          ...mergeResult.mergeChanges,
        ],
      });
      return { ok: true };
    } catch (err) {
      reportSaveError(err, "Something went wrong resizing this entry.");
      if (err?.response?.status === 409) {
        return { ok: false, conflict: true, conflicts: err.response.data?.conflicts || [] };
      }
      return { ok: false, conflict: false };
    }
  };
}
