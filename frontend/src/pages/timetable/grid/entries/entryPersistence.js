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
    ? {
        subjectId: entry.subject_id,
        room: entry.room || null,
        slotId: entry.start_slot_id,
        endSlotId: entry.end_slot_id,
      }
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

async function splitEntryAroundOverlap(timetableId, orderedSlots, entry, overlapStartIdx, overlapEndIdx) {
  const idx = (slotId) => orderedSlots.findIndex((s) => s.id === slotId);
  const eStartIdx = idx(entry.start_slot_id);
  const eEndIdx = idx(entry.end_slot_id);

  const originalState = {
    subjectId: entry.subject_id,
    room: entry.room || null,
    slotId: entry.start_slot_id,
    endSlotId: entry.end_slot_id,
  };
  const baseKey = { slotId: entry.start_slot_id, dayOfWeek: entry.day_of_week, groupTag: entry.group_tag };

  const hasBefore = eStartIdx < overlapStartIdx;
  const hasAfter = eEndIdx > overlapEndIdx;

  if (hasBefore && hasAfter) {
    const newLeftEnd = orderedSlots[overlapStartIdx - 1].id;
    const newRightStart = orderedSlots[overlapEndIdx + 1].id;
    await updateEntryById(timetableId, entry.id, {
      slotId: entry.start_slot_id, endSlotId: newLeftEnd, dayOfWeek: entry.day_of_week,
      groupTag: entry.group_tag, subjectId: entry.subject_id, room: entry.room,
    });
    const rightEntry = await createEntry(timetableId, {
      slotId: newRightStart, endSlotId: entry.end_slot_id, dayOfWeek: entry.day_of_week,
      groupTag: entry.group_tag, subjectId: entry.subject_id, room: entry.room,
    });
    return [
      {
        ...baseKey,
        entryId: entry.id,
        before: originalState,
        after: { subjectId: entry.subject_id, room: entry.room || null, slotId: entry.start_slot_id, endSlotId: newLeftEnd },
      },
      {
        slotId: newRightStart,
        dayOfWeek: entry.day_of_week,
        groupTag: entry.group_tag,
        entryId: rightEntry.id,
        before: null,
        after: { subjectId: entry.subject_id, room: entry.room || null, slotId: newRightStart, endSlotId: entry.end_slot_id },
      },
    ];
  } else if (hasBefore) {
    const newEnd = orderedSlots[overlapStartIdx - 1].id;
    await updateEntryById(timetableId, entry.id, {
      slotId: entry.start_slot_id, endSlotId: newEnd, dayOfWeek: entry.day_of_week,
      groupTag: entry.group_tag, subjectId: entry.subject_id, room: entry.room,
    });
    return [{
      ...baseKey,
      entryId: entry.id,
      before: originalState,
      after: { subjectId: entry.subject_id, room: entry.room || null, slotId: entry.start_slot_id, endSlotId: newEnd },
    }];
  } else if (hasAfter) {

    const newStart = orderedSlots[overlapEndIdx + 1].id;
    await updateEntryById(timetableId, entry.id, {
      slotId: newStart, endSlotId: entry.end_slot_id, dayOfWeek: entry.day_of_week,
      groupTag: entry.group_tag, subjectId: entry.subject_id, room: entry.room,
    });
    return [{
      ...baseKey,
      entryId: entry.id,
      before: originalState,
      after: { subjectId: entry.subject_id, room: entry.room || null, slotId: newStart, endSlotId: entry.end_slot_id },
    }];
  } else {
    await deleteEntryById(timetableId, entry.id);
    return [{ ...baseKey, entryId: null, before: originalState, after: null }];
  }
}

export async function resolveSpanOverlap(timetableId, orderedSlots, entry, dropStartSlotId, dropEndSlotId) {
  const idx = (slotId) => orderedSlots.findIndex((s) => s.id === slotId);
  const dropStartIdx = idx(dropStartSlotId);
  const dropEndIdx = idx(dropEndSlotId);
  const eStartIdx = idx(entry.start_slot_id);
  const eEndIdx = idx(entry.end_slot_id);

  if (dropStartIdx === -1 || dropEndIdx === -1 || eStartIdx === -1 || eEndIdx === -1) {
    const originalState = {
      subjectId: entry.subject_id,
      room: entry.room || null,
      slotId: entry.start_slot_id,
      endSlotId: entry.end_slot_id,
    };
    const baseKey = { slotId: entry.start_slot_id, dayOfWeek: entry.day_of_week, groupTag: entry.group_tag };
    await deleteEntryById(timetableId, entry.id);
    return [{ ...baseKey, entryId: null, before: originalState, after: null }];
  }

  return splitEntryAroundOverlap(timetableId, orderedSlots, entry, dropStartIdx, dropEndIdx);
}

export async function resolveLaneOverlap(timetableId, orderedSlots, entry, dropStartSlotId, dropEndSlotId, siblingGroupTag) {
  const idx = (slotId) => orderedSlots.findIndex((s) => s.id === slotId);
  const dropStartIdx = idx(dropStartSlotId);
  const dropEndIdx = idx(dropEndSlotId);
  const eStartIdx = idx(entry.start_slot_id);
  const eEndIdx = idx(entry.end_slot_id);

  const originalState = {
    subjectId: entry.subject_id,
    room: entry.room || null,
    slotId: entry.start_slot_id,
    endSlotId: entry.end_slot_id,
  };
  const baseKey = { slotId: entry.start_slot_id, dayOfWeek: entry.day_of_week, groupTag: entry.group_tag };

  if (dropStartIdx === -1 || dropEndIdx === -1 || eStartIdx === -1 || eEndIdx === -1) {
    await deleteEntryById(timetableId, entry.id);
    return { siblingEntry: null, changes: [{ ...baseKey, entryId: null, before: originalState, after: null }] };
  }

  const overlapStartIdx = Math.max(eStartIdx, dropStartIdx);
  const overlapEndIdx = Math.min(eEndIdx, dropEndIdx);
  if (overlapStartIdx > overlapEndIdx) {
    return { siblingEntry: null, changes: [] };
  }

  const changes = await splitEntryAroundOverlap(timetableId, orderedSlots, entry, overlapStartIdx, overlapEndIdx);

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
    entryId: siblingEntry.id,
    before: null,
    after: {
      subjectId: entry.subject_id,
      room: entry.room || null,
      slotId: siblingStartSlotId,
      endSlotId: siblingEndSlotId,
    },
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
  if (!prev && !next) return { merged: false, mergeChanges: [], extensionChange: null };

  const finalStartSlotId = prev ? prev.start_slot_id : targetSnapshot.start_slot_id;
  const finalEndSlotId = next ? next.end_slot_id : targetSnapshot.end_slot_id;
  const mergeChanges = [];

  if (prev) {
    mergeChanges.push({
      slotId: prev.start_slot_id,
      dayOfWeek: prev.day_of_week,
      groupTag: prev.group_tag,
      entryId: null,
      before: {
        subjectId: prev.subject_id,
        room: prev.room || null,
        slotId: prev.start_slot_id,
        endSlotId: prev.end_slot_id,
      },
      after: null,
    });
    await deleteEntryById(timetableId, prev.id);
  }
  if (next) {
    mergeChanges.push({
      slotId: next.start_slot_id,
      dayOfWeek: next.day_of_week,
      groupTag: next.group_tag,
      entryId: null,
      before: {
        subjectId: next.subject_id,
        room: next.room || null,
        slotId: next.start_slot_id,
        endSlotId: next.end_slot_id,
      },
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

  const extensionChange = {
    slotId: finalStartSlotId,
    dayOfWeek: targetSnapshot.day_of_week,
    groupTag: targetSnapshot.group_tag,
    entryId: targetSnapshot.id,
    before: {
      subjectId: targetSnapshot.subject_id,
      room: targetSnapshot.room || null,
      slotId: targetSnapshot.start_slot_id,
      endSlotId: targetSnapshot.end_slot_id,
    },
    after: {
      subjectId: targetSnapshot.subject_id,
      room: targetSnapshot.room || null,
      slotId: finalStartSlotId,
      endSlotId: finalEndSlotId,
    },
  };

  return { merged: true, mergeChanges, extensionChange, finalStartSlotId, finalEndSlotId };
}
