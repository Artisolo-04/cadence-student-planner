const pool = require("../config/db");

async function createProfile(userId, fullName, faculty, classYear) {
  const result = await pool.query(
    `INSERT INTO profiles (user_id, full_name, faculty, class_year)
     VALUES ($1, $2, $3, $4)
     RETURNING id, user_id, full_name, faculty, class_year, updated_at`,
    [userId, fullName, faculty, classYear]
  );
  return result.rows[0];
}

async function findProfileByUserId(userId) {
  const result = await pool.query("SELECT * FROM profiles WHERE user_id = $1", [userId]);
  return result.rows[0];
}

async function updateProfile(userId, fullName, faculty, classYear) {
  const result = await pool.query(
    `UPDATE profiles SET full_name = $2, faculty = $3, class_year = $4, updated_at = NOW()
     WHERE user_id = $1
     RETURNING id, user_id, full_name, faculty, class_year, updated_at`,
    [userId, fullName, faculty, classYear]
  );
  return result.rows[0];
}

module.exports = { createProfile, findProfileByUserId, updateProfile };
