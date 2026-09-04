const pool = require("../config/db");

async function createSubject(userId, { name, color, teacher }) {
  const result = await pool.query(
    "INSERT INTO subjects (user_id, name, color, teacher) VALUES ($1, $2, $3, $4) RETURNING id, user_id, name, color, teacher, created_at, updated_at",
    [userId, name, color, teacher || null]
  );
  return result.rows[0];
}

async function findSubjectById(id) {
  const result = await pool.query(
    "SELECT id, user_id, name, color, teacher, created_at, updated_at FROM subjects WHERE id = $1",
    [id]
  );
  return result.rows[0];
}

async function findSubjectsByUserId(userId, timetableId = null) {
  const result = await pool.query(
    `SELECT s.id, s.user_id, s.name, s.color, s.teacher, s.created_at, s.updated_at,
            COALESCE(
              SUM(EXTRACT(EPOCH FROM (slot_end.end_time - slot_start.start_time))) / 3600,
              0
            )::float AS weekly_hours
     FROM subjects s
     LEFT JOIN timetable_entries e
       ON e.subject_id = s.id AND e.timetable_id = $2
     LEFT JOIN timetable_slots slot_start ON slot_start.id = e.slot_id
     LEFT JOIN timetable_slots slot_end ON slot_end.id = e.end_slot_id
     WHERE s.user_id = $1
     GROUP BY s.id
     ORDER BY s.created_at DESC`,
    [userId, timetableId]
  );
  return result.rows;
}

async function updateSubject(id, userId, { name, color, teacher }) {
  const result = await pool.query(
    `UPDATE subjects
     SET name = $1, color = $2, teacher = $3, updated_at = NOW()
     WHERE id = $4 AND user_id = $5
     RETURNING id, user_id, name, color, teacher, created_at, updated_at`,
    [name, color, teacher || null, id, userId]
  );
  return result.rows[0];
}

async function deleteSubject(id, userId) {
  const result = await pool.query(
    "DELETE FROM subjects WHERE id = $1 AND user_id = $2 RETURNING id",
    [id, userId]
  );
  return result.rows[0];
}

async function findSubjectDetail(id, userId, timetableId = null) {
  const entriesResult = await pool.query(
    `SELECT e.id, e.day_of_week, e.room, e.group_tag,
            slot_start.start_time, slot_end.end_time
     FROM timetable_entries e
     JOIN timetable_slots slot_start ON slot_start.id = e.slot_id
     JOIN timetable_slots slot_end ON slot_end.id = e.end_slot_id
     JOIN timetables t ON t.id = e.timetable_id
     WHERE e.subject_id = $1 AND t.user_id = $2 AND e.timetable_id = $3
     ORDER BY e.day_of_week ASC, slot_start.start_time ASC`,
    [id, userId, timetableId]
  );

  const homeworkResult = await pool.query(
    `SELECT id, title, due_date, status, priority
     FROM homework
     WHERE subject_id = $1 AND user_id = $2
     ORDER BY due_date ASC`,
    [id, userId]
  );

  return { entries: entriesResult.rows, homework: homeworkResult.rows };
}

module.exports = {
  createSubject,
  findSubjectById,
  findSubjectsByUserId,
  updateSubject,
  deleteSubject,
  findSubjectDetail,
};
