const { findTimetableById } = require("../../models/Timetable");
const { findSubjectById } = require("../../models/Subject");
const {
  createEntry,
  updateEntry,
  deleteEntry,
  applyBatch,
  OverlapConflictError,
} = require("../../models/TimetableEntry");
const {
  ensureBaselineSnapshot,
  recordSnapshot,
} = require("../../models/TimetableSnapshot");
const { VALID_GROUP_TAGS, validateOp } = require("./validators");

async function createEntryHandler(req, res) {
  try {
    const { slotId, endSlotId, dayOfWeek, subjectId, groupTag = "all", room } = req.body;
    if (slotId == null || dayOfWeek == null || subjectId == null) {
      return res.status(400).json({ error: "slotId, dayOfWeek, and subjectId are required" });
    }
    if (dayOfWeek < 0 || dayOfWeek > 6) {
      return res.status(400).json({ error: "dayOfWeek must be between 0 and 6" });
    }
    if (!["all", "g1", "g2"].includes(groupTag)) {
      return res.status(400).json({ error: "groupTag must be 'all', 'g1', or 'g2'" });
    }

    const timetable = await findTimetableById(req.params.id);
    if (!timetable || timetable.user_id !== req.userId) {
      return res.status(404).json({ error: "Workspace not found" });
    }

    const subject = await findSubjectById(subjectId);
    if (!subject || subject.user_id !== req.userId) {
      return res.status(404).json({ error: "Subject not found" });
    }

    await ensureBaselineSnapshot(req.params.id);

    const { mainEntry, deletedIds, createdFragments } = await createEntry(req.params.id, {
      slotId,
      endSlotId: endSlotId ?? slotId,
      dayOfWeek,
      subjectId,
      groupTag,
      room: room?.trim() ? room.trim() : null,
    });

    const currentVersion = await recordSnapshot(req.params.id);

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
    const { slotId, endSlotId, dayOfWeek, subjectId, groupTag = "all", room } = req.body;
    if (slotId == null || dayOfWeek == null || subjectId == null) {
      return res.status(400).json({ error: "slotId, dayOfWeek, and subjectId are required" });
    }
    if (dayOfWeek < 0 || dayOfWeek > 6) {
      return res.status(400).json({ error: "dayOfWeek must be between 0 and 6" });
    }
    if (!["all", "g1", "g2"].includes(groupTag)) {
      return res.status(400).json({ error: "groupTag must be 'all', 'g1', or 'g2'" });
    }

    const timetable = await findTimetableById(req.params.id);
    if (!timetable || timetable.user_id !== req.userId) {
      return res.status(404).json({ error: "Workspace not found" });
    }

    const subject = await findSubjectById(subjectId);
    if (!subject || subject.user_id !== req.userId) {
      return res.status(404).json({ error: "Subject not found" });
    }

    await ensureBaselineSnapshot(req.params.id);

    const { mainEntry, deletedIds, createdFragments } = await updateEntry(
      req.params.id,
      req.params.entryId,
      {
        slotId,
        endSlotId: endSlotId ?? slotId,
        dayOfWeek,
        subjectId,
        groupTag,
        room: room?.trim() ? room.trim() : null,
      }
    );

    const currentVersion = await recordSnapshot(req.params.id);

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
    const timetable = await findTimetableById(req.params.id);
    if (!timetable || timetable.user_id !== req.userId) {
      return res.status(404).json({ error: "Workspace not found" });
    }

    await ensureBaselineSnapshot(req.params.id);

    const deleted = await deleteEntry(req.params.id, req.params.entryId);
    if (!deleted) {
      return res.status(404).json({ error: "Entry not found" });
    }

    const currentVersion = await recordSnapshot(req.params.id);

    res.json({ id: deleted.id, currentVersion });
  } catch (err) {
    console.error("Clear entry error:", err);
    res.status(500).json({ error: "Something went wrong clearing the cell" });
  }
}

async function batchUpdateEntries(req, res) {
  try {
    const { operations } = req.body;
    if (!Array.isArray(operations) || operations.length === 0) {
      return res.status(400).json({ error: "operations must be a non-empty array" });
    }
    if (operations.length > 200) {
      return res.status(400).json({ error: "Batch too large (max 200 operations)" });
    }

    operations.forEach(validateOp);

    const timetable = await findTimetableById(req.params.id);
    if (!timetable || timetable.user_id !== req.userId) {
      return res.status(404).json({ error: "Workspace not found" });
    }

    const subjectIds = [
      ...new Set(operations.filter((o) => o.op !== "delete").map((o) => o.subjectId)),
    ];
    for (const subjectId of subjectIds) {
      const subject = await findSubjectById(subjectId);
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

    await ensureBaselineSnapshot(req.params.id);
    const result = await applyBatch(req.params.id, normalizedOps);
    const newVersion = await recordSnapshot(req.params.id);

    res.json({ ...result, currentVersion: newVersion });
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
