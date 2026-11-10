const Analytics = require("../models/Analytics");

const MAX_POSTGRES_INT = 2147483647;
const VALID_DAYS = new Set([7, 30, 90]);
const VALID_GROUPS = new Set(["all", "g1", "g2"]);

function parseOptionalId(raw) {
  if (raw === undefined) return { value: null };
  if (typeof raw !== "string" || !/^[1-9]\d*$/.test(raw)) {
    return { error: "timetableId must be a positive integer" };
  }
  const id = Number(raw);
  if (!Number.isSafeInteger(id) || id > MAX_POSTGRES_INT) {
    return { error: "timetableId must be a positive integer" };
  }
  return { value: id };
}

function getAnalyticsOptions(query) {
  const timetableId = parseOptionalId(query.timetableId);
  if (timetableId.error) return timetableId;

  const days = query.days === undefined ? 30 : Number(query.days);
  if (!VALID_DAYS.has(days)) {
    return { error: "days must be 7, 30, or 90" };
  }

  const groupTag = query.groupTag;
  if (groupTag !== undefined && (typeof groupTag !== "string" || !VALID_GROUPS.has(groupTag))) {
    return { error: "groupTag must be all, g1, or g2" };
  }

  return { value: { timetableId: timetableId.value, days, groupTag: groupTag ?? null } };
}

async function getOverview(req, res) {
  const options = getAnalyticsOptions(req.query);
  if (options.error) return res.status(400).json({ error: options.error });

  try {
    const overview = await Analytics.getAnalyticsOverview(req.userId, options.value);
    if (!overview) return res.status(404).json({ error: "Timetable not found" });
    return res.json(overview);
  } catch (err) {
    console.error("Analytics overview error:", err);
    return res.status(500).json({ error: "Failed to load analytics" });
  }
}

module.exports = { getOverview };
