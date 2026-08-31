const { findTimetableById } = require("../../models/Timetable");
const { findEntriesByTimetableId } = require("../../models/TimetableEntry");
const {
  ensureBaselineSnapshot,
  recordSnapshot,
  restoreVersion,
  getMaxVersion,
} = require("../../models/TimetableSnapshot");

async function checkpointEntries(req, res) {
  try {
    const timetable = await findTimetableById(req.params.id);
    if (!timetable || timetable.user_id !== req.userId) {
      return res.status(404).json({ error: "Workspace not found" });
    }

    await ensureBaselineSnapshot(req.params.id);
    const newVersion = await recordSnapshot(req.params.id);

    res.json({ currentVersion: newVersion });
  } catch (err) {
    console.error("Checkpoint entries error:", err);
    res.status(500).json({ error: "Something went wrong saving a history checkpoint" });
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

module.exports = { checkpointEntries, undoEntries, redoEntries };
