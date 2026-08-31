import { entryKey } from "../cell/cellDisplayUtils";
import { getSlotIndex } from "../layout/slotSpanUtils";

export function rebuildEntriesByCell(entries, orderedSlots) {
  const map = {};

  for (const entry of entries || []) {
    const startIndex = getSlotIndex(orderedSlots, entry.start_slot_id);
    const endIndex = getSlotIndex(
      orderedSlots,
      entry.end_slot_id ?? entry.start_slot_id
    );

    if (startIndex === -1 || endIndex === -1) continue;

    for (let index = Math.min(startIndex, endIndex); index <= Math.max(startIndex, endIndex); index += 1) {
      const key = entryKey(orderedSlots[index].id, entry.day_of_week);
      if (!map[key]) map[key] = [];
      map[key].push(entry);
    }
  }

  return map;
}

export function reconcileBatchResult(
  entries,
  { created = [], updated = [], deletedIds = [] }
) {
  const deleted = new Set(deletedIds);
  const byId = new Map(
    (entries || [])
      .filter((entry) => !deleted.has(entry.id))
      .map((entry) => [entry.id, entry])
  );

  for (const entry of updated) {
    if (entry) byId.set(entry.id, entry);
  }

  for (const item of created) {
    if (item?.entry) byId.set(item.entry.id, item.entry);
  }

  return [...byId.values()];
}
