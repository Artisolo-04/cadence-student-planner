const { findTimetableById } = require("../../models/Timetable");
const { findSubjectById } = require("../../models/Subject");
const {
  createEntry,
  updateEntry,
  deleteEntry,
  applyBatch,
  OverlapConflictError,
} = require("../../models/TimetableEntry");
const { parsePositiveRouteId, validateEntryInput, validateOp } = require("./validators");

async function createEntryHandler(req, res) {
  try {
    const input = validateEntryInput(req.body);
    if (input.error) return res.status(400).json({ error: input.error });
    const { slotId, endSlotId, dayOfWeek, subjectId, groupTag, room } = input.value;

    const timetableId = parsePositiveRouteId(req.params.id);
    if (timetableId === null) {
      return res.status(404).json({ error: "Workspace not found" });
    }
    const timetable = await findTimetableById(timetableId, req.userId);
    if (!timetable || timetable.user_id !== req.userId) {
      return res.status(404).json({ error: "Workspace not found" });
    }

    const subject = await findSubjectById(subjectId, req.userId);
    if (!subject || subject.user_id !== req.userId) {
      return res.status(404).json({ error: "Subject not found" });
    }


    const { mainEntry, deletedIds, createdFragments, skipped, reason, coveredBy, currentVersion } = await createEntry(req.params.id, {
      slotId,
      endSlotId,
      dayOfWeek,
      subjectId,
      groupTag,
      room,
    });

    if (skipped) {
      return res.status(200).json({
        skipped: true,
        reason,
        entry: coveredBy,
        deletedIds: [],
        createdFragments: [],
        currentVersion,
      });
    }

    res.status(201).json({
      entry: mainEntry,
      deletedIds,
      createdFragments,
      currentVersion,
    });
  } catch (err) {
    if (err instanceof OverlapConflictError) {
      return res.status(409).json({ error: err.message, conflicts: err.conflicts });
    }
    if (err.message === "Invalid slot range: slot not found in this timetable") {
      return res.status(400).json({ error: err.message });
    }
    if (err.message === "end_slot_id must not end before start_slot_id begins") {
      return res.status(400).json({ error: err.message });
    }
    console.error("Create entry error:", err);
    res.status(500).json({ error: "Something went wrong assigning the subject" });
  }
}

async function updateEntryHandler(req, res) {
  try {
    const input = validateEntryInput(req.body);
    if (input.error) return res.status(400).json({ error: input.error });
    const { slotId, endSlotId, dayOfWeek, subjectId, groupTag, room } = input.value;

    const timetableId = parsePositiveRouteId(req.params.id);
    if (timetableId === null) {
      return res.status(404).json({ error: "Workspace not found" });
    }
    const timetable = await findTimetableById(timetableId, req.userId);
    if (!timetable || timetable.user_id !== req.userId) {
      return res.status(404).json({ error: "Workspace not found" });
    }

    const subject = await findSubjectById(subjectId, req.userId);
    if (!subject || subject.user_id !== req.userId) {
      return res.status(404).json({ error: "Subject not found" });
    }


    const entryId = parsePositiveRouteId(req.params.entryId);
    if (entryId === null) return res.status(404).json({ error: "Entry not found" });

    const { mainEntry, deletedIds, createdFragments, skipped, reason, coveredBy, currentVersion } = await updateEntry(
      timetableId,
      entryId,
      {
        slotId,
        endSlotId,
        dayOfWeek,
        subjectId,
        groupTag,
        room,
      }
    );

    if (skipped) {
      return res.status(200).json({
        skipped: true,
        reason,
        entry: coveredBy,
        deletedIds: [],
        createdFragments: [],
        currentVersion,
      });
    }

    res.json({
      entry: mainEntry,
      deletedIds,
      createdFragments,
      currentVersion,
    });
  } catch (err) {
    if (err instanceof OverlapConflictError) {
      return res.status(409).json({ error: err.message, conflicts: err.conflicts });
    }
    if (err.message === "Entry not found") {
      return res.status(404).json({ error: "Entry not found" });
    }
    if (err.message === "Invalid slot range: slot not found in this timetable") {
      return res.status(400).json({ error: err.message });
    }
    if (err.message === "end_slot_id must not end before start_slot_id begins") {
      return res.status(400).json({ error: err.message });
    }
    console.error("Update entry error:", err);
    res.status(500).json({ error: "Something went wrong updating the entry" });
  }
}

async function clearEntry(req, res) {
  try {
    const timetableId = parsePositiveRouteId(req.params.id);
    if (timetableId === null) {
      return res.status(404).json({ error: "Workspace not found" });
    }
    const timetable = await findTimetableById(timetableId, req.userId);
    if (!timetable || timetable.user_id !== req.userId) {
      return res.status(404).json({ error: "Workspace not found" });
    }


    const entryId = parsePositiveRouteId(req.params.entryId);
    if (entryId === null) return res.status(404).json({ error: "Entry not found" });

    const deleted = await deleteEntry(timetableId, entryId);
    if (!deleted) {
      return res.status(404).json({ error: "Entry not found" });
    }

    res.json({ id: deleted.id, currentVersion: deleted.currentVersion });
  } catch (err) {
    console.error("Clear entry error:", err);
    res.status(500).json({ error: "Something went wrong clearing the cell" });
  }
}

async function batchUpdateEntries(req, res) {
  try {
    if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
      return res.status(400).json({ error: "operations must be a non-empty array" });
    }
    const { operations } = req.body;
    if (!Array.isArray(operations) || operations.length === 0) {
      return res.status(400).json({ error: "operations must be a non-empty array" });
    }
    if (operations.length > 200) {
      return res.status(400).json({ error: "Batch too large (max 200 operations)" });
    }

    operations.forEach(validateOp);

    const timetableId = parsePositiveRouteId(req.params.id);
    if (timetableId === null) {
      return res.status(404).json({ error: "Workspace not found" });
    }
    const timetable = await findTimetableById(timetableId, req.userId);
    if (!timetable || timetable.user_id !== req.userId) {
      return res.status(404).json({ error: "Workspace not found" });
    }

    const subjectIds = [
      ...new Set(operations.filter((o) => o.op !== "delete").map((o) => o.subjectId)),
    ];
    for (const subjectId of subjectIds) {
      const subject = await findSubjectById(subjectId, req.userId);
      if (!subject || subject.user_id !== req.userId) {
        return res.status(404).json({ error: `Subject not found: ${subjectId}` });
      }
    }

    const normalizedOps = operations.map((o) => ({
      ...o,
      endSlotId: o.endSlotId ?? o.slotId,
      groupTag: o.groupTag ?? "all",
      room: o.room?.trim ? (o.room.trim() ? o.room.trim() : null) : (o.room ?? null),
    }));

    const result = await applyBatch(timetableId, normalizedOps);
    res.json(result);
  } catch (err) {
    if (err instanceof OverlapConflictError) {
      return res.status(409).json({ error: err.message, conflicts: err.conflicts });
    }
    if (err.status === 400) {
      return res.status(400).json({ error: err.message });
    }
    if (typeof err.message === "string" && err.message.startsWith("Entry not found")) {
      return res.status(404).json({ error: err.message });
    }
    if (typeof err.message === "string" && err.message.startsWith("Invalid slot range")) {
      return res.status(400).json({ error: err.message });
    }
    console.error("Batch update entries error:", err);
    res.status(500).json({ error: "Something went wrong applying the batch update" });
  }
}

module.exports = {
  createEntryHandler,
  updateEntryHandler,
  clearEntry,
  batchUpdateEntries,
};
