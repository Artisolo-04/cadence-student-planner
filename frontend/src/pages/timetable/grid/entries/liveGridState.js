import { entryKey } from "../cell/cellDisplayUtils";
import { getSlotIndex } from "../layout/slotSpanUtils";

export function rebuildEntriesByCell(entries, orderedSlots) {
  const map = {};
  for (const entry of entries) {
    const startIdx = getSlotIndex(orderedSlots, entry.start_slot_id);
    const endIdx = getSlotIndex(orderedSlots, entry.end_slot_id);
    if (startIdx === -1 || endIdx === -1) continue;
    for (let i = startIdx; i <= endIdx; i++) {
      const key = entryKey(orderedSlots[i].id, entry.day_of_week);
      if (!map[key]) map[key] = [];
      map[key].push(entry);
    }
  }
  return map;
}

export function createLiveGridState(initialEntries, orderedSlots) {
  let entries = [...(initialEntries || [])];
  let entriesByCell = rebuildEntriesByCell(entries, orderedSlots);

  function sync() {
    entriesByCell = rebuildEntriesByCell(entries, orderedSlots);
  }

  return {
    get entries() {
      return entries;
    },
    get entriesByCell() {
      return entriesByCell;
    },
    recordCreate(entry) {
      if (!entry) return;
      entries = [...entries, entry];
      sync();
    },
    recordUpdate(entry) {
      if (!entry) return;
      entries = entries.map((e) => (e.id === entry.id ? entry : e));
      sync();
    },
    recordDelete(entryId) {
      if (entryId == null) return;
      entries = entries.filter((e) => e.id !== entryId);
      sync();
    },
  };
}

export function foldSavedEntryIntoLive(live, savedEntry) {
  if (!savedEntry) return;
  const existed = live.entries.some((e) => e.id === savedEntry.id);
  if (existed) live.recordUpdate(savedEntry);
  else live.recordCreate(savedEntry);
}

export function foldChangeIntoLiveState(live, change) {
  if (!change) return;

  if (change.entryId != null) {
    if (change.after == null) {
      live.recordDelete(change.entryId);
    } else {
      live.recordUpdate({
        id: change.entryId,
        day_of_week: change.dayOfWeek,
        group_tag: change.groupTag,
        start_slot_id: change.after.slotId,
        end_slot_id: change.after.endSlotId,
        subject_id: change.after.subjectId,
        room: change.after.room,
      });
    }
    return;
  }

  const priorLive = live.entries.find(
    (e) =>
      e.start_slot_id === change.slotId &&
      e.day_of_week === change.dayOfWeek &&
      e.group_tag === change.groupTag
  );
  if (!priorLive) return;

  if (change.after == null) {
    live.recordDelete(priorLive.id);
  } else {
    live.recordUpdate({
      ...priorLive,
      start_slot_id: change.after.slotId,
      end_slot_id: change.after.endSlotId,
      subject_id: change.after.subjectId,
      room: change.after.room,
    });
  }
}
