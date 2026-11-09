const pool = require("../config/db");

async function saveProfile(userId, { fullName, faculty, classYear }) {
  const result = await pool.query(
    `INSERT INTO profiles (user_id, full_name, faculty, class_year)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id) DO UPDATE
       SET full_name = EXCLUDED.full_name,
           faculty = EXCLUDED.faculty,
           class_year = EXCLUDED.class_year,
           updated_at = NOW()
     RETURNING id, user_id, full_name, faculty, class_year, avatar_url,
               avatar_original_url, avatar_zoom, avatar_offset_x, avatar_offset_y, updated_at`,
    [userId, fullName, faculty, classYear]
  );
  return result.rows[0];
}

async function findProfileByUserId(userId) {
  const result = await pool.query("SELECT * FROM profiles WHERE user_id = $1", [userId]);
  return result.rows[0];
}

async function updateProfileAvatarWithOriginal(
  userId,
  { avatarUrl, avatarOriginalUrl, zoom, offsetX, offsetY }
) {
  const result = await pool.query(
    `UPDATE profiles
     SET avatar_url = $2, avatar_original_url = $3, avatar_zoom = $4,
         avatar_offset_x = $5, avatar_offset_y = $6, updated_at = NOW()
     WHERE user_id = $1
     RETURNING id, user_id, full_name, faculty, class_year, avatar_url,
               avatar_original_url, avatar_zoom, avatar_offset_x, avatar_offset_y, updated_at`,
    [userId, avatarUrl, avatarOriginalUrl, zoom, offsetX, offsetY]
  );
  return result.rows[0];
}

async function updateProfileAvatarCrop(userId, { avatarUrl, zoom, offsetX, offsetY }) {
  const result = await pool.query(
    `UPDATE profiles
     SET avatar_url = $2, avatar_zoom = $3, avatar_offset_x = $4,
         avatar_offset_y = $5, updated_at = NOW()
     WHERE user_id = $1
     RETURNING id, user_id, full_name, faculty, class_year, avatar_url,
               avatar_original_url, avatar_zoom, avatar_offset_x, avatar_offset_y, updated_at`,
    [userId, avatarUrl, zoom, offsetX, offsetY]
  );
  return result.rows[0];
}

module.exports = {
  saveProfile,
  findProfileByUserId,
  updateProfileAvatarWithOriginal,
  updateProfileAvatarCrop,
};
