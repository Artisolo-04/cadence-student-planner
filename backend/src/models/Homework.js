const pool = require("../config/db");

async function createHomework(userId, { subjectId, title, notes, dueDate, status, priority }) {
  const result = await pool.query(
    `INSERT INTO homework (user_id, subject_id, title, notes, due_date, status, priority)
     VALUES ($1, $2, $3, $4, $5, COALESCE($6, 'todo'), COALESCE($7, 'normal'))
     RETURNING id, user_id, subject_id, title, notes, due_date, status, priority, created_at, updated_at`,
    [userId, subjectId || null, title, notes || null, dueDate, status || null, priority || null]
  );
  return result.rows[0];
}

async function findHomeworkByUserId(userId) {
  const result = await pool.query(
    `SELECT h.id, h.user_id, h.subject_id, h.title, h.notes, h.due_date, h.status, h.priority,
            h.created_at, h.updated_at,
            s.name AS subject_name, s.color AS subject_color
     FROM homework h
     LEFT JOIN subjects s ON s.id = h.subject_id
     WHERE h.user_id = $1
     ORDER BY h.due_date ASC, h.created_at DESC`,
    [userId]
  );
  return result.rows;
}

async function findHomeworkById(id, userId) {
  const result = await pool.query(
    `SELECT id, user_id, subject_id, title, notes, due_date, status, priority, created_at, updated_at
     FROM homework WHERE id = $1 AND user_id = $2`,
    [id, userId]
  );
  return result.rows[0];
}

async function updateHomework(id, userId, { subjectId, title, notes, dueDate, status, priority }) {
  const result = await pool.query(
    `UPDATE homework
     SET subject_id = $1, title = $2, notes = $3, due_date = $4, status = $5, priority = $6, updated_at = NOW()
     WHERE id = $7 AND user_id = $8
     RETURNING id, user_id, subject_id, title, notes, due_date, status, priority, created_at, updated_at`,
    [subjectId || null, title, notes || null, dueDate, status, priority, id, userId]
  );
  return result.rows[0];
}

async function updateHomeworkStatus(id, userId, status) {
  const result = await pool.query(
    `UPDATE homework SET status = $1, updated_at = NOW()
     WHERE id = $2 AND user_id = $3
     RETURNING id, user_id, subject_id, title, notes, due_date, status, priority, created_at, updated_at`,
    [status, id, userId]
  );
  return result.rows[0];
}

async function deleteHomework(id, userId) {
  const result = await pool.query(
    "DELETE FROM homework WHERE id = $1 AND user_id = $2 RETURNING id",
    [id, userId]
  );
  return result.rows[0];
}

module.exports = {
  createHomework,
  findHomeworkByUserId,
  findHomeworkById,
  updateHomework,
  updateHomeworkStatus,
  deleteHomework,
};
