const pool = require("../config/db");

async function createTimetable(userId, name) {
  const result = await pool.query(
    "INSERT INTO timetables (user_id, name) VALUES ($1, $2) RETURNING id, user_id, name, created_at, updated_at",
    [userId, name]
  );
  return result.rows[0];
}

async function findTimetableById(id) {
  const result = await pool.query(
    "SELECT id, user_id, name, created_at, updated_at FROM timetables WHERE id = $1",
    [id]
  );
  return result.rows[0];
}

async function findTimetablesByUserId(userId) {
  const result = await pool.query(
    "SELECT id, user_id, name, created_at, updated_at FROM timetables WHERE user_id = $1 ORDER BY created_at DESC",
    [userId]
  );
  return result.rows;
}

async function updateTimetableName(id, name) {
  const result = await pool.query(
    "UPDATE timetables SET name = $1, updated_at = NOW() WHERE id = $2 RETURNING id, user_id, name, created_at, updated_at",
    [name, id]
  );
  return result.rows[0];
}

async function setDays(timetableId, daysOfWeek) {
  await pool.query("DELETE FROM timetable_days WHERE timetable_id = $1", [timetableId]);
  if (daysOfWeek.length === 0) return [];
  const values = daysOfWeek.map((_, i) => `($1, $${i + 2})`).join(", ");
  const result = await pool.query(
    `INSERT INTO timetable_days (timetable_id, day_of_week) VALUES ${values} RETURNING id, day_of_week`,
    [timetableId, ...daysOfWeek]
  );
  return result.rows;
}

async function findDaysByTimetableId(timetableId) {
  const result = await pool.query(
    "SELECT id, day_of_week FROM timetable_days WHERE timetable_id = $1 ORDER BY day_of_week",
    [timetableId]
  );
  return result.rows;
}

async function addSlot(timetableId, { label, startTime, endTime, sortOrder }) {
  const result = await pool.query(
    "INSERT INTO timetable_slots (timetable_id, label, start_time, end_time, sort_order) VALUES ($1, $2, $3, $4, $5) RETURNING id, label, start_time, end_time, sort_order",
    [timetableId, label || null, startTime, endTime, sortOrder || 0]
  );
  return result.rows[0];
}

async function findSlotsByTimetableId(timetableId) {
  const result = await pool.query(
    "SELECT id, label, start_time, end_time, sort_order FROM timetable_slots WHERE timetable_id = $1 ORDER BY sort_order, start_time",
    [timetableId]
  );
  return result.rows;
}

async function deleteSlot(slotId, timetableId) {
  const result = await pool.query(
    "DELETE FROM timetable_slots WHERE id = $1 AND timetable_id = $2 RETURNING id",
    [slotId, timetableId]
  );
  return result.rows[0];
}

async function deleteTimetable(id, userId) {
  const result = await pool.query(
    "DELETE FROM timetables WHERE id = $1 AND user_id = $2 RETURNING id",
    [id, userId]
  );
  return result.rows[0];
}

module.exports = {
  createTimetable,
  findTimetableById,
  findTimetablesByUserId,
  updateTimetableName,
  setDays,
  findDaysByTimetableId,
  addSlot,
  findSlotsByTimetableId,
  deleteSlot,
  deleteTimetable,
};
