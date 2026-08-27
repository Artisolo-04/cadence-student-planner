import { entryKey } from "../cell/cellDisplayUtils";
import { clearEntryAt, saveEntryAtPosition } from "./entryPersistence";

export async function applyChanges(changes, direction, { timetableId, entriesByCell, orderedSlots, refreshWorkspace }) {
  const withState = changes.map((change) => ({
    change,
    state: direction === "undo" ? change.before : change.after,
  }));

  const localEntriesByCell = {};
  for (const key of Object.keys(entriesByCell)) {
    localEntriesByCell[key] = [...entriesByCell[key]];
  }
  function upsertLocal(slotId, dayOfWeek, groupTag, entry) {
    const key = entryKey(slotId, dayOfWeek);
    const existing = localEntriesByCell[key] || [];
    const filtered = existing.filter((e) => e.group_tag !== groupTag);
    localEntriesByCell[key] = entry ? [...filtered, entry] : filtered;
  }

  for (const { change } of withState) {
    await clearEntryAt(timetableId, localEntriesByCell, change.slotId, change.dayOfWeek, change.groupTag);
    upsertLocal(change.slotId, change.dayOfWeek, change.groupTag, null);
  }
  for (const { change, state } of withState.filter((x) => x.state)) {
    const saved = await saveEntryAtPosition(
      timetableId, localEntriesByCell, orderedSlots, change.slotId, change.dayOfWeek, change.groupTag,
      state.subjectId, state.room,
      state.endSlotId != null ? { explicitEndSlotId: state.endSlotId } : { spanCount: 1 }
    );
    upsertLocal(change.slotId, change.dayOfWeek, change.groupTag, saved);
  }
  await refreshWorkspace();
}
