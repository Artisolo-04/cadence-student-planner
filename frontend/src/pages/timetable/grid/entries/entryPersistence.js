import api from "../../../../lib/api";
import { entryKey } from "../cell/cellDisplayUtils";
import { computeEndSlotId, findMergeCandidates } from "../layout/slotSpanUtils";

export function findEntryAtPosition(entriesByCell, slotId, dayOfWeek, groupTag) {
  const cellEntries = entriesByCell[entryKey(slotId, dayOfWeek)] || [];
  return cellEntries.find((e) => e.group_tag === groupTag) || null;
}

export function beforeStateFor(entriesByCell, slotId, dayOfWeek, groupTag) {
  const entry = findEntryAtPosition(entriesByCell, slotId, dayOfWeek, groupTag);
  return entry
    ? { subjectId: entry.subject_id, room: entry.room || null, endSlotId: entry.end_slot_id }
    : null;
}

export async function createEntry(timetableId, { slotId, endSlotId, dayOfWeek, groupTag, subjectId, room }) {
  const { data } = await api.post(`/timetables/${timetableId}/entries`, {
    slotId, endSlotId, dayOfWeek, groupTag, subjectId, room,
  });
  return data.entry;
}

export async function updateEntryById(timetableId, entryId, { slotId, endSlotId, dayOfWeek, groupTag, subjectId, room }) {
  const { data } = await api.patch(`/timetables/${timetableId}/entries/${entryId}`, {
    slotId, endSlotId, dayOfWeek, groupTag, subjectId, room,
  });
  return data.entry;
}

export async function deleteEntryById(timetableId, entryId) {
  try {
    await api.delete(`/timetables/${timetableId}/entries/${entryId}`);
  } catch (err) {
    if (err?.response?.status !== 404) throw err;
  }
}

export async function saveEntryAtPosition(
  timetableId, entriesByCell, orderedSlots, slotId, dayOfWeek, groupTag, subjectId, room, spanOptions = {}
) {
  let existing = findEntryAtPosition(entriesByCell, slotId, dayOfWeek, groupTag);
  if (existing && spanOptions.excludeExistingIds && spanOptions.excludeExistingIds.has(existing.id)) {
    existing = null;
  }

  const endSlotId =
    spanOptions.explicitEndSlotId != null
      ? spanOptions.explicitEndSlotId
      : spanOptions.spanCount != null
        ? computeEndSlotId(orderedSlots, slotId, spanOptions.spanCount)
        : existing
          ? existing.end_slot_id
          : slotId;

  if (existing) {
    return updateEntryById(timetableId, existing.id, {
      slotId, endSlotId, dayOfWeek, groupTag, subjectId, room,
    });
  }
  return createEntry(timetableId, { slotId, endSlotId, dayOfWeek, groupTag, subjectId, room });
}

export async function resolveSpanOverlap(timetableId, orderedSlots, entry, dropStartSlotId, dropEndSlotId) {
  const idx = (slotId) => orderedSlots.findIndex((s) => s.id === slotId);
  const dropStartIdx = idx(dropStartSlotId);
  const dropEndIdx = idx(dropEndSlotId);
  const eStartIdx = idx(entry.start_slot_id);
  const eEndIdx = idx(entry.end_slot_id);

  const originalState = { subjectId: entry.subject_id, room: entry.room || null, endSlotId: entry.end_slot_id };
  const baseKey = { slotId: entry.start_slot_id, dayOfWeek: entry.day_of_week, groupTag: entry.group_tag };

  if (dropStartIdx === -1 || dropEndIdx === -1 || eStartIdx === -1 || eEndIdx === -1) {
    await deleteEntryById(timetableId, entry.id);
    return [{ ...baseKey, before: originalState, after: null }];
  }

  const overlapsBefore = eStartIdx < dropStartIdx;
  const overlapsAfter = eEndIdx > dropEndIdx;

  if (overlapsBefore && overlapsAfter) {
    const newLeftEnd = orderedSlots[dropStartIdx - 1].id;
    const newRightStart = orderedSlots[dropEndIdx + 1].id;
    await updateEntryById(timetableId, entry.id, {
      slotId: entry.start_slot_id, endSlotId: newLeftEnd, dayOfWeek: entry.day_of_week,
      groupTag: entry.group_tag, subjectId: entry.subject_id, room: entry.room,
    });
    await createEntry(timetableId, {
      slotId: newRightStart, endSlotId: entry.end_slot_id, dayOfWeek: entry.day_of_week,
      groupTag: entry.group_tag, subjectId: entry.subject_id, room: entry.room,
    });
    return [
      { ...baseKey, before: originalState, after: { subjectId: entry.subject_id, room: entry.room || null, endSlotId: newLeftEnd } },
      { slotId: newRightStart, dayOfWeek: entry.day_of_week, groupTag: entry.group_tag, before: null, after: { subjectId: entry.subject_id, room: entry.room || null, endSlotId: entry.end_slot_id } },
    ];
  } else if (overlapsBefore) {
    const newEnd = orderedSlots[dropStartIdx - 1].id;
    await updateEntryById(timetableId, entry.id, {
      slotId: entry.start_slot_id, endSlotId: newEnd, dayOfWeek: entry.day_of_week,
      groupTag: entry.group_tag, subjectId: entry.subject_id, room: entry.room,
    });
    return [{ ...baseKey, before: originalState, after: { subjectId: entry.subject_id, room: entry.room || null, endSlotId: newEnd } }];
  } else if (overlapsAfter) {
    const newStart = orderedSlots[dropEndIdx + 1].id;
    await updateEntryById(timetableId, entry.id, {
      slotId: newStart, endSlotId: entry.end_slot_id, dayOfWeek: entry.day_of_week,
      groupTag: entry.group_tag, subjectId: entry.subject_id, room: entry.room,
    });
    return [
      { ...baseKey, before: originalState, after: null },
      { slotId: newStart, dayOfWeek: entry.day_of_week, groupTag: entry.group_tag, before: null, after: { subjectId: entry.subject_id, room: entry.room || null, endSlotId: entry.end_slot_id } },
    ];
  } else {
    await deleteEntryById(timetableId, entry.id);
    return [{ ...baseKey, before: originalState, after: null }];
  }
}

export async function resolveLaneOverlap(timetableId, orderedSlots, entry, dropStartSlotId, dropEndSlotId, siblingGroupTag) {
  const idx = (slotId) => orderedSlots.findIndex((s) => s.id === slotId);
  const dropStartIdx = idx(dropStartSlotId);
  const dropEndIdx = idx(dropEndSlotId);
  const eStartIdx = idx(entry.start_slot_id);
  const eEndIdx = idx(entry.end_slot_id);

  const originalState = { subjectId: entry.subject_id, room: entry.room || null, endSlotId: entry.end_slot_id };
  const baseKey = { slotId: entry.start_slot_id, dayOfWeek: entry.day_of_week, groupTag: entry.group_tag };

  if (dropStartIdx === -1 || dropEndIdx === -1 || eStartIdx === -1 || eEndIdx === -1) {
    await deleteEntryById(timetableId, entry.id);
    return { siblingEntry: null, changes: [{ ...baseKey, before: originalState, after: null }] };
  }

  const overlapStartIdx = Math.max(eStartIdx, dropStartIdx);
  const overlapEndIdx = Math.min(eEndIdx, dropEndIdx);
  if (overlapStartIdx > overlapEndIdx) {
    return { siblingEntry: null, changes: [] };
  }

  const hasBefore = eStartIdx < overlapStartIdx;
  const hasAfter = eEndIdx > overlapEndIdx;
  const changes = [];

  if (hasBefore && hasAfter) {
    const newLeftEnd = orderedSlots[overlapStartIdx - 1].id;
    const newRightStart = orderedSlots[overlapEndIdx + 1].id;
    await updateEntryById(timetableId, entry.id, {
      slotId: entry.start_slot_id, endSlotId: newLeftEnd, dayOfWeek: entry.day_of_week,
      groupTag: entry.group_tag, subjectId: entry.subject_id, room: entry.room,
    });
    await createEntry(timetableId, {
      slotId: newRightStart, endSlotId: entry.end_slot_id, dayOfWeek: entry.day_of_week,
      groupTag: entry.group_tag, subjectId: entry.subject_id, room: entry.room,
    });
    changes.push(
      { ...baseKey, before: originalState, after: { subjectId: entry.subject_id, room: entry.room || null, endSlotId: newLeftEnd } },
      { slotId: newRightStart, dayOfWeek: entry.day_of_week, groupTag: entry.group_tag, before: null, after: { subjectId: entry.subject_id, room: entry.room || null, endSlotId: entry.end_slot_id } },
    );
  } else if (hasBefore) {
    const newEnd = orderedSlots[overlapStartIdx - 1].id;
    await updateEntryById(timetableId, entry.id, {
      slotId: entry.start_slot_id, endSlotId: newEnd, dayOfWeek: entry.day_of_week,
      groupTag: entry.group_tag, subjectId: entry.subject_id, room: entry.room,
    });
    changes.push({ ...baseKey, before: originalState, after: { subjectId: entry.subject_id, room: entry.room || null, endSlotId: newEnd } });
  } else if (hasAfter) {
    const newStart = orderedSlots[overlapEndIdx + 1].id;
    await updateEntryById(timetableId, entry.id, {
      slotId: newStart, endSlotId: entry.end_slot_id, dayOfWeek: entry.day_of_week,
      groupTag: entry.group_tag, subjectId: entry.subject_id, room: entry.room,
    });
    changes.push(
      { ...baseKey, before: originalState, after: null },
      { slotId: newStart, dayOfWeek: entry.day_of_week, groupTag: entry.group_tag, before: null, after: { subjectId: entry.subject_id, room: entry.room || null, endSlotId: entry.end_slot_id } },
    );
  } else {
    await deleteEntryById(timetableId, entry.id);
    changes.push({ ...baseKey, before: originalState, after: null });
  }

  const siblingStartSlotId = orderedSlots[overlapStartIdx].id;
  const siblingEndSlotId = orderedSlots[overlapEndIdx].id;
  const siblingEntry = await createEntry(timetableId, {
    slotId: siblingStartSlotId,
    endSlotId: siblingEndSlotId,
    dayOfWeek: entry.day_of_week,
    groupTag: siblingGroupTag,
    subjectId: entry.subject_id,
    room: entry.room,
  });

  changes.push({
    slotId: siblingStartSlotId,
    dayOfWeek: entry.day_of_week,
    groupTag: siblingGroupTag,
    before: null,
    after: { subjectId: entry.subject_id, room: entry.room || null, endSlotId: siblingEndSlotId },
  });

  return { siblingEntry, changes };
}

export async function clearEntryAt(timetableId, entriesByCell, slotId, dayOfWeek, groupTag) {
  const existing = findEntryAtPosition(entriesByCell, slotId, dayOfWeek, groupTag);
  if (!existing) return;
  await deleteEntryById(timetableId, existing.id);
}

export async function mergeAdjacentIfNeeded(timetableId, orderedSlots, entries, targetSnapshot) {
  const { prev, next } = findMergeCandidates(entries, orderedSlots, targetSnapshot);
  if (!prev && !next) return { merged: false, mergeChanges: [] };

  const finalStartSlotId = prev ? prev.start_slot_id : targetSnapshot.start_slot_id;
  const finalEndSlotId = next ? next.end_slot_id : targetSnapshot.end_slot_id;
  const mergeChanges = [];

  if (prev) {
    mergeChanges.push({
      slotId: prev.start_slot_id,
      dayOfWeek: prev.day_of_week,
      groupTag: prev.group_tag,
      before: { subjectId: prev.subject_id, room: prev.room || null, endSlotId: prev.end_slot_id },
      after: null,
    });
    await deleteEntryById(timetableId, prev.id);
  }
  if (next) {
    mergeChanges.push({
      slotId: next.start_slot_id,
      dayOfWeek: next.day_of_week,
      groupTag: next.group_tag,
      before: { subjectId: next.subject_id, room: next.room || null, endSlotId: next.end_slot_id },
      after: null,
    });
    await deleteEntryById(timetableId, next.id);
  }

  await updateEntryById(timetableId, targetSnapshot.id, {
    slotId: finalStartSlotId,
    endSlotId: finalEndSlotId,
    dayOfWeek: targetSnapshot.day_of_week,
    groupTag: targetSnapshot.group_tag,
    subjectId: targetSnapshot.subject_id,
    room: targetSnapshot.room,
  });

  return { merged: true, mergeChanges, finalStartSlotId, finalEndSlotId };
}
