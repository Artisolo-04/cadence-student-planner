const pool = require("../config/db");

async function createTimetable(userId, name) {
  const result = await pool.query(
    "INSERT INTO timetables (user_id, name) VALUES ($1, $2) RETURNING id, user_id, name, my_group, current_version, created_at, updated_at",
    [userId, name]
  );
  return result.rows[0];
}

async function findTimetableById(id) {
  const result = await pool.query(
    "SELECT id, user_id, name, my_group, current_version, created_at, updated_at FROM timetables WHERE id = $1",
    [id]
  );
  return result.rows[0];
}

async function findTimetablesByUserId(userId) {
  const result = await pool.query(
    "SELECT id, user_id, name, my_group, current_version, created_at, updated_at FROM timetables WHERE user_id = $1 ORDER BY created_at DESC",
    [userId]
  );
  return result.rows;
}

async function updateTimetableName(id, name) {
  const result = await pool.query(
    "UPDATE timetables SET name = $1, updated_at = NOW() WHERE id = $2 RETURNING id, user_id, name, my_group, current_version, created_at, updated_at",
    [name, id]
  );
  return result.rows[0];
}

async function updateTimetableMyGroup(id, userId, myGroup) {
  const result = await pool.query(
    `UPDATE timetables
     SET my_group = $1, updated_at = NOW()
     WHERE id = $2 AND user_id = $3
     RETURNING id, user_id, name, my_group, current_version, created_at, updated_at`,
    [myGroup, id, userId]
  );
  return result.rows[0];
}

async function setDays(timetableId, daysOfWeek) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM timetable_days WHERE timetable_id = $1", [timetableId]);

    if (daysOfWeek.length === 0) {
      await client.query("COMMIT");
      return [];
    }

    const values = daysOfWeek.map((_, index) => `($1, $${index + 2})`).join(", ");
    const result = await client.query(
      `INSERT INTO timetable_days (timetable_id, day_of_week) VALUES ${values} RETURNING id, day_of_week`,
      [timetableId, ...daysOfWeek]
    );

    await client.query("COMMIT");
    return result.rows;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

async function findDaysByTimetableId(timetableId) {
  const result = await pool.query(
    "SELECT id, day_of_week FROM timetable_days WHERE timetable_id = $1 ORDER BY day_of_week",
    [timetableId]
  );
  return result.rows;
}

async function addSlot(timetableId, { label, startTime, endTime }) {
  const result = await pool.query(
    "INSERT INTO timetable_slots (timetable_id, label, start_time, end_time) VALUES ($1, $2, $3, $4) RETURNING id, label, start_time, end_time, sort_order",
    [timetableId, label || null, startTime, endTime]
  );
  return result.rows[0];
}

async function updateSlot(slotId, timetableId, { label, startTime, endTime }) {
  const result = await pool.query(
    `UPDATE timetable_slots
     SET label = $1, start_time = $2, end_time = $3
     WHERE id = $4 AND timetable_id = $5
     RETURNING id, label, start_time, end_time, sort_order`,
    [label || null, startTime, endTime, slotId, timetableId]
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
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const entryCountResult = await client.query(
      `SELECT COUNT(*)::int AS count FROM timetable_entries
       WHERE timetable_id = $1 AND (slot_id = $2 OR end_slot_id = $2)`,
      [timetableId, slotId]
    );

    const result = await client.query(
      "DELETE FROM timetable_slots WHERE id = $1 AND timetable_id = $2 RETURNING id",
      [slotId, timetableId]
    );

    await client.query("COMMIT");
    if (!result.rows[0]) return null;
    return { id: result.rows[0].id, cascadedEntries: entryCountResult.rows[0].count };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
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
  updateTimetableMyGroup,
  setDays,
  findDaysByTimetableId,
  addSlot,
  updateSlot,
  findSlotsByTimetableId,
  deleteSlot,
  deleteTimetable,
};
