const {
  createTimetable,
  findTimetableById,
  findTimetablesByUserId,
  updateTimetableName,
  updateTimetableMyGroup,
  setDays,
  findDaysByTimetableId,
  addSlot,
  updateSlot,
  findSlotsByTimetableId,
  deleteSlot,
  deleteTimetable,
} = require("../models/Timetable");
const { findSubjectById } = require("../models/Subject");
const {
  createEntry,
  updateEntry,
  findEntriesByTimetableId,
  deleteEntry,
  applyBatch,
  OverlapConflictError,
} = require("../models/TimetableEntry");
const {
  ensureBaselineSnapshot,
  recordSnapshot,
  restoreVersion,
  getMaxVersion,
} = require("../models/TimetableSnapshot");

const VALID_GROUP_TAGS = ["all", "g1", "g2"];

async function createWorkspace(req, res) {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Workspace name is required" });
    }
    const timetable = await createTimetable(req.userId, name.trim());
    res.status(201).json({ timetable });
  } catch (err) {
    console.error("Create workspace error:", err);
    res.status(500).json({ error: "Something went wrong creating the workspace" });
  }
}

async function listWorkspaces(req, res) {
  try {
    const timetables = await findTimetablesByUserId(req.userId);
    res.json({ timetables });
  } catch (err) {
    console.error("List workspaces error:", err);
    res.status(500).json({ error: "Something went wrong fetching your workspaces" });
  }
}

async function getWorkspace(req, res) {
  try {
    const timetable = await findTimetableById(req.params.id);
    if (!timetable || timetable.user_id !== req.userId) {
      return res.status(404).json({ error: "Workspace not found" });
    }

    const [days, slots, entries, maxVersion] = await Promise.all([
      findDaysByTimetableId(timetable.id),
      findSlotsByTimetableId(timetable.id),
      findEntriesByTimetableId(timetable.id),
      getMaxVersion(timetable.id),
    ]);

    res.json({
      timetable,
      days,
      slots,
      entries,
      currentVersion: timetable.current_version,
      maxVersion,
    });
  } catch (err) {
    console.error("Get workspace error:", err);
    res.status(500).json({ error: "Something went wrong fetching the workspace" });
  }
}

async function renameWorkspace(req, res) {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Workspace name is required" });
    }

    const timetable = await findTimetableById(req.params.id);
    if (!timetable || timetable.user_id !== req.userId) {
      return res.status(404).json({ error: "Workspace not found" });
    }

    const updated = await updateTimetableName(req.params.id, name.trim());
    res.json({ timetable: updated });
  } catch (err) {
    console.error("Rename workspace error:", err);
    res.status(500).json({ error: "Something went wrong renaming the workspace" });
  }
}

async function updateMyGroup(req, res) {
  try {
    const { myGroup } = req.body;

    if (myGroup !== null && !["g1", "g2"].includes(myGroup)) {
      return res.status(400).json({ error: "myGroup must be 'g1', 'g2', or null" });
    }

    const timetable = await updateTimetableMyGroup(
      req.params.id,
      req.userId,
      myGroup
    );

    if (!timetable) {
      return res.status(404).json({ error: "Workspace not found" });
    }

    res.json({ timetable });
  } catch (err) {
    console.error("Update timetable group error:", err);
    res.status(500).json({ error: "Something went wrong updating your group" });
  }
}

async function updateDays(req, res) {
  try {
    const { days } = req.body;
    if (!Array.isArray(days) || days.some((day) => day < 0 || day > 6)) {
      return res.status(400).json({ error: "Days must be an array of numbers between 0 and 6" });
    }

    const timetable = await findTimetableById(req.params.id);
    if (!timetable || timetable.user_id !== req.userId) {
      return res.status(404).json({ error: "Workspace not found" });
    }

    const updatedDays = await setDays(req.params.id, days);
    res.json({ days: updatedDays });
  } catch (err) {
    console.error("Update days error:", err);
    res.status(500).json({ error: "Something went wrong updating days" });
  }
}

async function createSlot(req, res) {
  try {
    const { label, startTime, endTime } = req.body;
    if (!startTime || !endTime) {
      return res.status(400).json({ error: "Start time and end time are required" });
    }
    if (startTime >= endTime) {
      return res.status(400).json({ error: "End time must be after start time" });
    }

    const timetable = await findTimetableById(req.params.id);
    if (!timetable || timetable.user_id !== req.userId) {
      return res.status(404).json({ error: "Workspace not found" });
    }

    const slot = await addSlot(req.params.id, { label, startTime, endTime });
    res.status(201).json({ slot });
  } catch (err) {
    console.error("Create slot error:", err);
    res.status(500).json({ error: "Something went wrong adding the slot" });
  }
}

async function editSlot(req, res) {
  try {
    const { label, startTime, endTime } = req.body;
    if (!startTime || !endTime) {
      return res.status(400).json({ error: "Start time and end time are required" });
    }
    if (startTime >= endTime) {
      return res.status(400).json({ error: "End time must be after start time" });
    }

    const timetable = await findTimetableById(req.params.id);
    if (!timetable || timetable.user_id !== req.userId) {
      return res.status(404).json({ error: "Workspace not found" });
    }

    const slot = await updateSlot(req.params.slotId, req.params.id, {
      label,
      startTime,
      endTime,
    });

    if (!slot) {
      return res.status(404).json({ error: "Slot not found" });
    }

    res.json({ slot });
  } catch (err) {
    console.error("Edit slot error:", err);
    res.status(500).json({ error: "Something went wrong updating the slot" });
  }
}

async function removeSlot(req, res) {
  try {
    const timetable = await findTimetableById(req.params.id);
    if (!timetable || timetable.user_id !== req.userId) {
      return res.status(404).json({ error: "Workspace not found" });
    }

    const deleted = await deleteSlot(req.params.slotId, req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Slot not found" });
    }

    res.json({ id: deleted.id, cascadedEntries: deleted.cascadedEntries });
  } catch (err) {
    console.error("Remove slot error:", err);
    res.status(500).json({ error: "Something went wrong removing the slot" });
  }
}

async function removeWorkspace(req, res) {
  try {
    const deleted = await deleteTimetable(req.params.id, req.userId);
    if (!deleted) {
      return res.status(404).json({ error: "Workspace not found" });
    }
    res.json({ id: deleted.id });
  } catch (err) {
    console.error("Remove workspace error:", err);
    res.status(500).json({ error: "Something went wrong deleting the workspace" });
  }
}

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

    const entry = await createEntry(req.params.id, {
      slotId,
      endSlotId: endSlotId ?? slotId,
      dayOfWeek,
      subjectId,
      groupTag,
      room: room?.trim() ? room.trim() : null,
    });
    res.status(201).json({ entry });
  } catch (err) {
    if (err instanceof OverlapConflictError) {
      return res.status(409).json({ error: err.message, conflicts: err.conflicts });
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

    const entry = await updateEntry(req.params.id, req.params.entryId, {
      slotId,
      endSlotId: endSlotId ?? slotId,
      dayOfWeek,
      subjectId,
      groupTag,
      room: room?.trim() ? room.trim() : null,
    });
    res.json({ entry });
  } catch (err) {
    if (err instanceof OverlapConflictError) {
      return res.status(409).json({ error: err.message, conflicts: err.conflicts });
    }
    if (err.message === "Entry not found") {
      return res.status(404).json({ error: "Entry not found" });
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

    const deleted = await deleteEntry(req.params.id, req.params.entryId);
    if (!deleted) {
      return res.status(404).json({ error: "Entry not found" });
    }
    res.json({ id: deleted.id });
  } catch (err) {
    console.error("Clear entry error:", err);
    res.status(500).json({ error: "Something went wrong clearing the cell" });
  }
}

function validateOp(op, index) {
  if (!op || typeof op !== "object") {
    throw { status: 400, message: `Operation at index ${index} is invalid` };
  }
  if (!["create", "update", "delete"].includes(op.op)) {
    throw { status: 400, message: `Operation at index ${index} has invalid 'op'` };
  }
  if (op.op === "delete") {
    if (op.entryId == null) {
      throw { status: 400, message: `Operation at index ${index}: entryId is required for delete` };
    }
    return;
  }
  if (op.op === "update" && op.entryId == null) {
    throw { status: 400, message: `Operation at index ${index}: entryId is required for update` };
  }
  if (op.op === "create" && !op.tempId) {
    throw { status: 400, message: `Operation at index ${index}: tempId is required for create` };
  }
  if (op.slotId == null || op.dayOfWeek == null || op.subjectId == null) {
    throw { status: 400, message: `Operation at index ${index}: slotId, dayOfWeek, subjectId are required` };
  }
  if (op.dayOfWeek < 0 || op.dayOfWeek > 6) {
    throw { status: 400, message: `Operation at index ${index}: dayOfWeek must be between 0 and 6` };
  }
  const groupTag = op.groupTag ?? "all";
  if (!VALID_GROUP_TAGS.includes(groupTag)) {
    throw { status: 400, message: `Operation at index ${index}: invalid groupTag` };
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

async function undoEntries(req, res) {
  try {
    const timetable = await findTimetableById(req.params.id);
    if (!timetable || timetable.user_id !== req.userId) {
      return res.status(404).json({ error: "Workspace not found" });
    }

    if (timetable.current_version <= 0) {
      return res.status(409).json({ error: "Nothing to undo" });
    }

    const targetVersion = timetable.current_version - 1;
    const restoredVersion = await restoreVersion(req.params.id, targetVersion);
    if (restoredVersion === null) {
      return res.status(409).json({ error: "No earlier state found" });
    }

    const entries = await findEntriesByTimetableId(req.params.id);
    res.json({ entries, currentVersion: restoredVersion });
  } catch (err) {
    if (err.code === "23503") {
      return res.status(409).json({
        error: "Can't undo: a slot or subject from that earlier state no longer exists",
      });
    }
    console.error("Undo entries error:", err);
    res.status(500).json({ error: "Something went wrong undoing the last change" });
  }
}

async function redoEntries(req, res) {
  try {
    const timetable = await findTimetableById(req.params.id);
    if (!timetable || timetable.user_id !== req.userId) {
      return res.status(404).json({ error: "Workspace not found" });
    }

    const maxVersion = await getMaxVersion(req.params.id);
    if (timetable.current_version >= maxVersion) {
      return res.status(409).json({ error: "Nothing to redo" });
    }

    const targetVersion = timetable.current_version + 1;
    const restoredVersion = await restoreVersion(req.params.id, targetVersion);
    if (restoredVersion === null) {
      return res.status(409).json({ error: "No later state found" });
    }

    const entries = await findEntriesByTimetableId(req.params.id);
    res.json({ entries, currentVersion: restoredVersion });
  } catch (err) {
    if (err.code === "23503") {
      return res.status(409).json({
        error: "Can't redo: a slot or subject from that later state no longer exists",
      });
    }
    console.error("Redo entries error:", err);
    res.status(500).json({ error: "Something went wrong redoing the last change" });
  }
}

module.exports = {
  createWorkspace,
  listWorkspaces,
  getWorkspace,
  renameWorkspace,
  updateMyGroup,
  updateDays,
  createSlot,
  editSlot,
  removeSlot,
  removeWorkspace,
  createEntryHandler,
  updateEntryHandler,
  clearEntry,
  batchUpdateEntries,
  undoEntries,
  redoEntries,
};
