const {
  createTimetable,
  findTimetableById,
  findTimetablesByUserId,
  updateTimetableName,
  updateTimetableMyGroup,
  setDays,
  findDaysByTimetableId,
  findSlotsByTimetableId,
  deleteTimetable,
} = require("../../models/Timetable");
const { findEntriesByTimetableId } = require("../../models/TimetableEntry");
const { getMaxVersion } = require("../../models/TimetableSnapshot");
function validateWorkspaceName(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: "Request body must be a JSON object" };
  }
  if (typeof body.name !== "string" || !body.name.trim()) {
    return { error: "Workspace name is required" };
  }
  if (body.name.trim().length > 255) {
    return { error: "Workspace name must be 255 characters or fewer" };
  }
  return { value: body.name.trim() };
}


async function createWorkspace(req, res) {
  try {
    const input = validateWorkspaceName(req.body);
    if (input.error) return res.status(400).json({ error: input.error });
    const name = input.value;
    const timetable = await createTimetable(req.userId, name);
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
    const timetable = await findTimetableById(req.params.id, req.userId);
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
    const input = validateWorkspaceName(req.body);
    if (input.error) return res.status(400).json({ error: input.error });
    const name = input.value;

    const timetable = await findTimetableById(req.params.id, req.userId);
    if (!timetable || timetable.user_id !== req.userId) {
      return res.status(404).json({ error: "Workspace not found" });
    }

    const updated = await updateTimetableName(req.params.id, req.userId, name);
    if (!updated) return res.status(404).json({ error: "Workspace not found" });
    res.json({ timetable: updated });
  } catch (err) {
    console.error("Rename workspace error:", err);
    res.status(500).json({ error: "Something went wrong renaming the workspace" });
  }
}

async function updateMyGroup(req, res) {
  try {
    if (!req.body || typeof req.body !== "object" || Array.isArray(req.body) ||
        !Object.prototype.hasOwnProperty.call(req.body, "myGroup")) {
      return res.status(400).json({ error: "myGroup must be 'g1', 'g2', or null" });
    }
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
    const days = req.body?.days;
    if (
      !Array.isArray(days) ||
      days.length > 7 ||
      days.some((day) => !Number.isInteger(day) || day < 0 || day > 6) ||
      new Set(days).size !== days.length
    ) {
      return res.status(400).json({
        error: "Days must be unique integers between 0 and 6",
      });
    }

    const timetable = await findTimetableById(req.params.id, req.userId);
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

module.exports = {
  createWorkspace,
  listWorkspaces,
  getWorkspace,
  renameWorkspace,
  updateMyGroup,
  updateDays,
  removeWorkspace,
};
