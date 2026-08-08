const pool = require("../config/db");

async function upsertEntry(timetableId, { slotId, dayOfWeek, subjectId }) {
  const result = await pool.query(
    `INSERT INTO timetable_entries (timetable_id, slot_id, day_of_week, subject_id)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (timetable_id, slot_id, day_of_week)
     DO UPDATE SET subject_id = $4, updated_at = NOW()
     RETURNING id, timetable_id, slot_id, day_of_week, subject_id, created_at, updated_at`,
    [timetableId, slotId, dayOfWeek, subjectId]
  );
  return result.rows[0];
}

async function findEntriesByTimetableId(timetableId) {
  const result = await pool.query(
    `SELECT e.id, e.slot_id, e.day_of_week, e.subject_id,
            s.name AS subject_name, s.color AS subject_color, s.teacher AS subject_teacher
     FROM timetable_entries e
     JOIN subjects s ON s.id = e.subject_id
     WHERE e.timetable_id = $1`,
    [timetableId]
  );
  return result.rows;
}

async function deleteEntry(timetableId, { slotId, dayOfWeek }) {
  const result = await pool.query(
    `DELETE FROM timetable_entries
     WHERE timetable_id = $1 AND slot_id = $2 AND day_of_week = $3
     RETURNING id`,
    [timetableId, slotId, dayOfWeek]
  );
  return result.rows[0];
}

module.exports = {
  upsertEntry,
  findEntriesByTimetableId,
  deleteEntry,
};
