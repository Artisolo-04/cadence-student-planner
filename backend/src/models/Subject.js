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

async function findSubjectsByUserId(userId) {
  const result = await pool.query(
    "SELECT id, user_id, name, color, teacher, created_at, updated_at FROM subjects WHERE user_id = $1 ORDER BY created_at DESC",
    [userId]
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

module.exports = {
  createSubject,
  findSubjectById,
  findSubjectsByUserId,
  updateSubject,
  deleteSubject,
};
