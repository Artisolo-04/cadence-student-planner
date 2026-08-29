import { beforeStateFor } from "./entryPersistence";

export function buildCommitChanges(payload, entriesByCell) {
  const changesMap = new Map();

  function recordChange(slotId, dayOfWeek, groupTag, after) {
    const key = `${slotId}-${dayOfWeek}-${groupTag}`;
    changesMap.set(key, {
      slotId,
      dayOfWeek,
      groupTag,
      entryId: null,
      before: beforeStateFor(entriesByCell, slotId, dayOfWeek, groupTag),
      after,
    });
  }

  recordChange(payload.target.slotId, payload.target.dayOfWeek, payload.groupTag, {
    subjectId: payload.subjectId,
    room: payload.room || null,
    slotId: payload.target.slotId,
    endSlotId: payload.targetEndSlotId ?? null,
  });

  if (payload.swap) {
    recordChange(payload.target.slotId, payload.target.dayOfWeek, payload.swap.groupTag, {
      subjectId: payload.swap.subjectId,
      room: payload.swap.room || null,
      slotId: payload.target.slotId,
      endSlotId: payload.targetEndSlotId ?? null,
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
      const existingAll = beforeStateFor(entriesByCell, payload.target.slotId, payload.target.dayOfWeek, "all");
      if (existingAll) {
        recordChange(payload.target.slotId, payload.target.dayOfWeek, "all", null);
      }
    }
  }

  return Array.from(changesMap.values());
}
