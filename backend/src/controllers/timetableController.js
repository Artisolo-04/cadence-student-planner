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
  OverlapConflictError,
} = require("../models/TimetableEntry");

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

    const [days, slots, entries] = await Promise.all([
      findDaysByTimetableId(timetable.id),
      findSlotsByTimetableId(timetable.id),
      findEntriesByTimetableId(timetable.id),
    ]);

    res.json({ timetable, days, slots, entries });
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
};
