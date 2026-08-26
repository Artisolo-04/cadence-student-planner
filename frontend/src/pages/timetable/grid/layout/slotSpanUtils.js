export function getSlotIndex(orderedSlots, slotId) {
  return orderedSlots.findIndex((s) => s.id === slotId);
}

export function getSpanCount(entry, orderedSlots) {
  const startIdx = getSlotIndex(orderedSlots, entry.start_slot_id ?? entry.slot_id);
  const endIdx = getSlotIndex(orderedSlots, entry.end_slot_id);
  if (startIdx === -1 || endIdx === -1) return 1;
  return Math.max(1, endIdx - startIdx + 1);
}

export function computeEndSlotId(orderedSlots, startSlotId, spanCount) {
  const startIdx = getSlotIndex(orderedSlots, startSlotId);
  if (startIdx === -1) return startSlotId;
  const endIdx = Math.min(startIdx + Math.max(1, spanCount) - 1, orderedSlots.length - 1);
  return orderedSlots[endIdx].id;
}

export function resizeDeltaToSpan(deltaY, rowHeight, originalSpan) {
  if (!rowHeight || rowHeight <= 0) return originalSpan;
  const rowsCrossed = Math.round(deltaY / rowHeight);
  return Math.max(1, originalSpan + rowsCrossed);
}

export function buildSpanLayout(entries, orderedSlots) {
  const slotIndexById = new Map(orderedSlots.map((s, i) => [s.id, i]));
  const layout = {};

  function ensureDay(dayOfWeek) {
    if (!layout[dayOfWeek]) {
      layout[dayOfWeek] = {
        all: new Array(orderedSlots.length).fill(null),
        g1: new Array(orderedSlots.length).fill(null),
        g2: new Array(orderedSlots.length).fill(null),
      };
    }
    return layout[dayOfWeek];
  }

  for (const entry of entries || []) {
    const startIdx = slotIndexById.get(entry.start_slot_id);
    const endIdx = slotIndexById.get(entry.end_slot_id);
    if (startIdx === undefined || endIdx === undefined) continue;
    const lane = entry.group_tag === "g1" || entry.group_tag === "g2" ? entry.group_tag : "all";
    const span = Math.max(1, endIdx - startIdx + 1);
    const dayLayout = ensureDay(entry.day_of_week);

    dayLayout[lane][startIdx] = { type: "start", entry, span };
    for (let i = startIdx + 1; i <= endIdx; i++) {
      dayLayout[lane][i] = { type: "covered" };
    }
  }

  return layout;
}

export function findEntriesCoveringSlot(entries, orderedSlots, slotId, dayOfWeek) {
  const targetIdx = getSlotIndex(orderedSlots, slotId);
  if (targetIdx === -1) return [];
  return (entries || []).filter((e) => {
    if (e.day_of_week !== dayOfWeek) return false;
    const startIdx = getSlotIndex(orderedSlots, e.start_slot_id);
    const endIdx = getSlotIndex(orderedSlots, e.end_slot_id);
    if (startIdx === -1 || endIdx === -1) return false;
    return targetIdx >= startIdx && targetIdx <= endIdx;
  });
}

export function findEntriesCoveringRange(entries, orderedSlots, startSlotId, spanCount, dayOfWeek) {
  const startIdx = getSlotIndex(orderedSlots, startSlotId);
  if (startIdx === -1) return [];
  const endIdx = Math.min(startIdx + Math.max(1, spanCount) - 1, orderedSlots.length - 1);
  const seen = new Map();
  for (let idx = startIdx; idx <= endIdx; idx++) {
    const slot = orderedSlots[idx];
    for (const e of findEntriesCoveringSlot(entries, orderedSlots, slot.id, dayOfWeek)) {
      seen.set(e.id, e);
    }
  }
  return Array.from(seen.values());
}

export function findMergeCandidates(entries, orderedSlots, targetEntry) {
  if (!targetEntry) return { prev: null, next: null };
  const startIdx = getSlotIndex(orderedSlots, targetEntry.start_slot_id);
  const endIdx = getSlotIndex(orderedSlots, targetEntry.end_slot_id);
  if (startIdx === -1 || endIdx === -1) return { prev: null, next: null };

  const sameLane = (e) =>
    e.id !== targetEntry.id &&
    e.day_of_week === targetEntry.day_of_week &&
    e.group_tag === targetEntry.group_tag &&
    e.subject_id === targetEntry.subject_id &&
    (e.room || null) === (targetEntry.room || null);

  let prev = null;
  let next = null;

  if (startIdx > 0) {
    const prevSlotId = orderedSlots[startIdx - 1].id;
    prev = (entries || []).find((e) => sameLane(e) && e.end_slot_id === prevSlotId) || null;
  }
  if (endIdx < orderedSlots.length - 1) {
    const nextSlotId = orderedSlots[endIdx + 1].id;
    next = (entries || []).find((e) => sameLane(e) && e.start_slot_id === nextSlotId) || null;
  }

  return { prev, next };
}

export function computeMaxFreeSpan({ entries, orderedSlots, startIdx, dayOfWeek, groupTag, excludeEntryId, maxSpan }) {
  if (startIdx < 0 || startIdx >= orderedSlots.length) return 1;
  const cap = Math.max(1, maxSpan || 1);

  function isBlocking(coveringList) {
    if (groupTag === "all") return coveringList.length > 0;
    return coveringList.some((e) => e.group_tag === "all" || e.group_tag === groupTag);
  }

  const startSlot = orderedSlots[startIdx];
  const coveringAtStart = findEntriesCoveringSlot(entries, orderedSlots, startSlot.id, dayOfWeek).filter(
    (e) => e.id !== excludeEntryId
  );

  if (isBlocking(coveringAtStart)) {
    return Math.max(1, Math.min(cap, orderedSlots.length - startIdx));
  }

  let span = 0;
  const limit = Math.min(cap, orderedSlots.length - startIdx);
  for (let i = 0; i < limit; i++) {
    const idx = startIdx + i;
    const slot = orderedSlots[idx];
    const covering = findEntriesCoveringSlot(entries, orderedSlots, slot.id, dayOfWeek).filter(
      (e) => e.id !== excludeEntryId
    );
    if (isBlocking(covering)) break;
    span += 1;
  }
  return Math.max(1, span);
}

export function clipRangeAgainstSameSubjectAll({
  entries,
  orderedSlots,
  startIdx,
  spanCount,
  dayOfWeek,
  groupTag,
  subjectId,
  excludeEntryId,
}) {
  if (groupTag === "all") return { startIdx, spanCount };
  if (startIdx < 0 || startIdx >= orderedSlots.length) return null;

  let clippedStart = startIdx;
  let clippedEnd = Math.min(startIdx + Math.max(1, spanCount) - 1, orderedSlots.length - 1);

  for (let i = clippedStart; i <= clippedEnd; i++) {
    const slot = orderedSlots[i];
    if (!slot) continue;
    const blockedBySameSubjectAll = findEntriesCoveringSlot(entries, orderedSlots, slot.id, dayOfWeek).some(
      (e) => e.id !== excludeEntryId && e.group_tag === "all" && e.subject_id === subjectId
    );
    if (!blockedBySameSubjectAll) continue;

    if (i === clippedStart) {
      clippedStart += 1;
    } else {
      clippedEnd = i - 1;
      break;
    }
  }

  if (clippedStart > clippedEnd) return null;
  return { startIdx: clippedStart, spanCount: clippedEnd - clippedStart + 1 };
}
