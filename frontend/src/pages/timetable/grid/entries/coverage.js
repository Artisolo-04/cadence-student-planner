export function findCoveringAllEntry(
  entries,
  orderedSlots,
  { subjectId, dayOfWeek, slotId, endSlotId, room = null, excludeEntryId = null }
) {
  const iStart = orderedSlots.findIndex((s) => s.id === slotId);
  const iEnd = orderedSlots.findIndex((s) => s.id === (endSlotId ?? slotId));
  if (iStart === -1 || iEnd === -1) return null;

  const lo = Math.min(iStart, iEnd);
  const hi = Math.max(iStart, iEnd);

  for (const entry of entries || []) {
    if (entry.group_tag !== "all") continue;
    if (entry.subject_id !== subjectId) continue;
    if (entry.day_of_week !== dayOfWeek) continue;
    if (excludeEntryId != null && entry.id === excludeEntryId) continue;
    if (room != null && (entry.room ?? null) !== room) continue;

    const eStart = orderedSlots.findIndex((s) => s.id === entry.start_slot_id);
    const eEnd = orderedSlots.findIndex(
      (s) => s.id === (entry.end_slot_id ?? entry.start_slot_id)
    );
    if (eStart === -1 || eEnd === -1) continue;

    if (Math.min(eStart, eEnd) <= lo && Math.max(eStart, eEnd) >= hi) return entry;
  }
  return null;
}
