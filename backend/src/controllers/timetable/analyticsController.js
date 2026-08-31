const { findTimetableById } = require("../../models/Timetable");
const { computeAnalytics } = require("../../models/timetableEntry/analytics");

async function getAnalytics(req, res) {
  try {
    const timetable = await findTimetableById(req.params.id);
    if (!timetable || timetable.user_id !== req.userId) {
      return res.status(404).json({ error: "Workspace not found" });
    }

    const analytics = await computeAnalytics(req.params.id, timetable.my_group);
    res.json(analytics);
  } catch (err) {
    console.error("Get analytics error:", err);
    res.status(500).json({ error: "Something went wrong computing analytics" });
  }
}

module.exports = { getAnalytics };
