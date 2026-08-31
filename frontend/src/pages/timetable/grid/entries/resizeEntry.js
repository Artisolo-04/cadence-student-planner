export function createResizeEntry({
  submitBatch,
  setSaveError,
  reportSaveError,
}) {
  return async function resizeEntry(entry, endSlotId) {
    setSaveError(null);

    try {
      await submitBatch([
        {
          op: "update",
          entryId: entry.id,
          slotId: entry.start_slot_id,
          endSlotId,
          dayOfWeek: entry.day_of_week,
          subjectId: entry.subject_id,
          groupTag: entry.group_tag,
          room: entry.room,
        },
      ]);

      return { ok: true };
    } catch (error) {
      reportSaveError(error, "Something went wrong resizing this entry.");
      return { ok: false };
    }
  };
}
