const {
  findTimetableById,
  addSlot,
  updateSlot,
  deleteSlot,
} = require("../../models/Timetable");
const TIME_RE = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

function validateSlotInput(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: "Request body must be a JSON object" };
  }

  const { label, startTime, endTime } = body;
  if (typeof startTime !== "string" || typeof endTime !== "string" ||
      !TIME_RE.test(startTime) || !TIME_RE.test(endTime)) {
    return { error: "Start time and end time must be valid HH:MM values" };
  }
  if (startTime >= endTime) {
    return { error: "End time must be after start time" };
  }
  if (label != null && typeof label !== "string") {
    return { error: "Label must be a string or null" };
  }
  if (typeof label === "string" && label.trim().length > 50) {
    return { error: "Label must be 50 characters or fewer" };
  }

  return {
    value: {
      label: typeof label === "string" && label.trim() ? label.trim() : null,
      startTime,
      endTime,
    },
  };
}


async function createSlot(req, res) {
  try {
    const input = validateSlotInput(req.body);
    if (input.error) return res.status(400).json({ error: input.error });
    const { label, startTime, endTime } = input.value;

    const timetable = await findTimetableById(req.params.id, req.userId);
    if (!timetable || timetable.user_id !== req.userId) {
      return res.status(404).json({ error: "Workspace not found" });
    }

    const slot = await addSlot(req.params.id, { label, startTime, endTime });
    res.status(201).json({ slot });
  } catch (err) {
    if (err.code === "SLOT_CONFLICT") {
      return res.status(409).json({ error: err.message });
    }
    console.error("Create slot error:", err);
    res.status(500).json({ error: "Something went wrong adding the slot" });
  }
}

async function editSlot(req, res) {
  try {
    const input = validateSlotInput(req.body);
    if (input.error) return res.status(400).json({ error: input.error });
    const { label, startTime, endTime } = input.value;

    const timetable = await findTimetableById(req.params.id, req.userId);
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
    if (err.code === "SLOT_CONFLICT") {
      return res.status(409).json({ error: err.message });
    }
    console.error("Edit slot error:", err);
    res.status(500).json({ error: "Something went wrong updating the slot" });
  }
}

async function removeSlot(req, res) {
  try {
    const timetable = await findTimetableById(req.params.id, req.userId);
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
