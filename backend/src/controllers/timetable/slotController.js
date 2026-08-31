const {
  findTimetableById,
  addSlot,
  updateSlot,
  deleteSlot,
} = require("../../models/Timetable");

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

module.exports = { createSlot, editSlot, removeSlot };
