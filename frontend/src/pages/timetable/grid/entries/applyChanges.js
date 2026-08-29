import { createEntry, updateEntryById, deleteEntryById } from "./entryPersistence";
import { getSlotIndex, findEntriesCoveringSlot } from "../layout/slotSpanUtils";

function expandSpan(orderedSlots, startSlotId, endSlotId) {
  const startIdx = getSlotIndex(orderedSlots, startSlotId);
  if (startIdx === -1) return [];
  const rawEndIdx = getSlotIndex(orderedSlots, endSlotId ?? startSlotId);
  const endIdx = rawEndIdx === -1 ? startIdx : rawEndIdx;
  const lo = Math.min(startIdx, endIdx);
  const hi = Math.max(startIdx, endIdx);
  const cells = [];
  for (let i = lo; i <= hi; i++) cells.push(i);
  return cells;
}

function cellKey(dayOfWeek, groupTag, slotIdx) {
  return `${dayOfWeek}::${groupTag}::${slotIdx}`;
}

function isCellFree(liveEntries, orderedSlots, dayOfWeek, groupTag, slotIdx) {
  const slot = orderedSlots[slotIdx];
  const covering = findEntriesCoveringSlot(liveEntries, orderedSlots, slot.id, dayOfWeek);
  return !covering.some((e) => e.group_tag === "all" || groupTag === "all" || e.group_tag === groupTag);
}

function findFreeParkCell(liveEntries, orderedSlots, groupTag, reservedClaimKeys) {
  for (let day = 0; day <= 6; day++) {
    for (let idx = 0; idx < orderedSlots.length; idx++) {
      const key = cellKey(day, groupTag, idx);
      if (reservedClaimKeys.has(key)) continue;
      if (isCellFree(liveEntries, orderedSlots, day, groupTag, idx)) {
        return { dayOfWeek: day, slotId: orderedSlots[idx].id };
      }
    }
  }
  return null;
}

export async function applyChanges(
  changes,
  direction,
  { timetableId, entries, orderedSlots, refreshWorkspace }
) {

  let liveEntries = [...(entries || [])];
  const entryById = new Map(liveEntries.map((e) => [e.id, e]));

  function applyLocalCreate(entry) {
    liveEntries = [...liveEntries, entry];
    entryById.set(entry.id, entry);
  }
  function applyLocalUpdate(entry) {
    liveEntries = liveEntries.map((e) => (e.id === entry.id ? entry : e));
    entryById.set(entry.id, entry);
  }
  function applyLocalDelete(entryId) {
    liveEntries = liveEntries.filter((e) => e.id !== entryId);
    entryById.delete(entryId);
  }

  const resolved = changes.map((change) => ({
    change,
    source: direction === "undo" ? change.after : change.before,
    target: direction === "undo" ? change.before : change.after,
  }));

  const plans = resolved.map(({ change, source, target }, idx) => {
    const sourceCellsArr = source
      ? expandSpan(orderedSlots, source.slotId, source.endSlotId).map((i) => cellKey(change.dayOfWeek, change.groupTag, i))
      : [];
    const targetCellsArr = target
      ? expandSpan(orderedSlots, target.slotId, target.endSlotId).map((i) => cellKey(change.dayOfWeek, change.groupTag, i))
      : [];

    const sourceCells = new Set(sourceCellsArr);
    const targetCells = new Set(targetCellsArr);

    const vacateArr = sourceCellsArr.filter((c) => !targetCells.has(c));
    const claimArr = targetCellsArr.filter((c) => !sourceCells.has(c));

    return {
      idx,
      change,
      source,
      target,
      vacate: new Set(vacateArr),
      claim: new Set(claimArr),

      currentDayOfWeek: change.dayOfWeek,
      currentGroupTag: change.groupTag,
      currentSlotId: source ? source.slotId : null,
    };
  });

  function resolveLiveEntryFor(plan) {
    if (plan.change.entryId != null && entryById.has(plan.change.entryId)) {
      return entryById.get(plan.change.entryId);
    }
    if (plan.currentSlotId != null) {
      return (
        findEntriesCoveringSlot(liveEntries, orderedSlots, plan.currentSlotId, plan.currentDayOfWeek).find(
          (e) => e.group_tag === plan.currentGroupTag
        ) || null
      );
    }
    return null;
  }

  async function runPlan(plan) {
    const liveEntry = resolveLiveEntryFor(plan);

    if (plan.target === null) {
      if (!liveEntry) return; 
      await deleteEntryById(timetableId, liveEntry.id);
      applyLocalDelete(liveEntry.id);
      return;
    }

    const fields = {
      slotId: plan.target.slotId,
      endSlotId: plan.target.endSlotId,
      dayOfWeek: plan.change.dayOfWeek,
      groupTag: plan.change.groupTag,
      subjectId: plan.target.subjectId,
      room: plan.target.room,
    };

    if (liveEntry) {
      const saved = await updateEntryById(timetableId, liveEntry.id, fields);
      applyLocalUpdate(saved);
    } else {
      const saved = await createEntry(timetableId, fields);
      applyLocalCreate(saved);
    }
  }

  const deletePlans = plans.filter((p) => p.target === null);
  const claimPlans = plans.filter((p) => p.target !== null);

  for (const plan of deletePlans) {
    await runPlan(plan);
  }

  const remaining = [...claimPlans];
  const maxParkAttempts = remaining.length + 4;
  let parkAttempts = 0;

  while (remaining.length > 0) {
    const pendingVacates = new Set();
    for (const plan of remaining) {
      for (const c of plan.vacate) pendingVacates.add(c);
    }

    const readyIdx = remaining.findIndex((plan) => {
      for (const c of plan.claim) {
        if (pendingVacates.has(c)) return false;
      }
      return true;
    });

    if (readyIdx !== -1) {
      const [plan] = remaining.splice(readyIdx, 1);
      await runPlan(plan);
      continue;
    }

    parkAttempts += 1;
    if (parkAttempts > maxParkAttempts) {
      throw new Error("applyChanges: could not resolve circular slot dependency even after parking");
    }

    const victim = remaining[0];
    const liveEntry = resolveLiveEntryFor(victim);
    if (!liveEntry) {

      remaining.shift();
      continue;
    }

    const reservedClaimKeys = new Set();
    for (const plan of remaining) {
      for (const c of plan.claim) reservedClaimKeys.add(c);
    }

    const park = findFreeParkCell(liveEntries, orderedSlots, victim.currentGroupTag, reservedClaimKeys);
    if (!park) {
      throw new Error("applyChanges: no free cell available to park a blocked entry");
    }

    const parkFields = {
      slotId: park.slotId,
      endSlotId: park.slotId,
      dayOfWeek: park.dayOfWeek,
      groupTag: victim.currentGroupTag,
      subjectId: liveEntry.subject_id,
      room: liveEntry.room,
    };
    const saved = await updateEntryById(timetableId, liveEntry.id, parkFields);
    applyLocalUpdate(saved);

    victim.currentDayOfWeek = park.dayOfWeek;
    victim.currentSlotId = park.slotId;
    victim.vacate = new Set([cellKey(park.dayOfWeek, victim.currentGroupTag, getSlotIndex(orderedSlots, park.slotId))]);
  }

  await refreshWorkspace();
}
