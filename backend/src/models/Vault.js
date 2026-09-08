const pool = require("../config/db");

async function createResource(
  userId,
  { subjectId, folderName, resourceType, title, urlPath, fileSizeBytes, mimeType, pageCount }
) {
  const result = await pool.query(
    `INSERT INTO subject_resources
       (user_id, subject_id, folder_name, resource_type, title, url_path,
        file_size_bytes, mime_type, page_count)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING id, user_id, subject_id, folder_name, resource_type, title, url_path,
               file_size_bytes, mime_type, page_count, created_at, updated_at`,
    [
      userId,
      subjectId || null,
      folderName || null,
      resourceType,
      title,
      urlPath,
      fileSizeBytes ?? null,
      mimeType ?? null,
      pageCount ?? null,
    ]
  );
  return result.rows[0];
}

async function findResourcesByUserId(userId) {
  const result = await pool.query(
    `SELECT r.id, r.subject_id, s.name AS subject_name, r.folder_name,
            r.resource_type, r.title, r.url_path,
            r.file_size_bytes, r.mime_type, r.page_count,
            r.created_at, r.updated_at
     FROM subject_resources r
     LEFT JOIN subjects s ON s.id = r.subject_id
     WHERE r.user_id = $1
     ORDER BY r.created_at DESC`,
    [userId]
  );
  return result.rows;
}

async function findResourceById(id, userId) {
  const result = await pool.query(
    `SELECT id, user_id, subject_id, folder_name, resource_type, title, url_path,
            file_size_bytes, mime_type, page_count
     FROM subject_resources WHERE id = $1 AND user_id = $2`,
    [id, userId]
  );
  return result.rows[0];
}

async function updateResource(id, userId, updates) {
  const setClauses = [];
  const values = [];
  let paramIndex = 1;

  if (Object.prototype.hasOwnProperty.call(updates, "title")) {
    setClauses.push(`title = $${paramIndex++}`);
    values.push(updates.title);
  }
  if (Object.prototype.hasOwnProperty.call(updates, "subjectId")) {
    setClauses.push(`subject_id = $${paramIndex++}`);
    values.push(updates.subjectId);
  }
  if (Object.prototype.hasOwnProperty.call(updates, "folderName")) {
    setClauses.push(`folder_name = $${paramIndex++}`);
    values.push(updates.folderName);
  }

  if (setClauses.length === 0) {
    return null;
  }

  setClauses.push("updated_at = NOW()");
  values.push(id, userId);
  const idParam = paramIndex++;
  const userIdParam = paramIndex++;

  const result = await pool.query(
    `UPDATE subject_resources
     SET ${setClauses.join(", ")}
     WHERE id = $${idParam} AND user_id = $${userIdParam}
     RETURNING id, user_id, subject_id, folder_name, resource_type, title, url_path,
               file_size_bytes, mime_type, page_count, created_at, updated_at`,
    values
  );
  return result.rows[0];
}

async function deleteResource(id, userId) {
  const result = await pool.query(
    "DELETE FROM subject_resources WHERE id = $1 AND user_id = $2 RETURNING id",
    [id, userId]
  );
  return result.rows[0];
}

module.exports = {
  createResource,
  findResourcesByUserId,
  findResourceById,
  updateResource,
  deleteResource,
};
