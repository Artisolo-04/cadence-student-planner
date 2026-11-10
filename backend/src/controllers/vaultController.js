const path = require("path");
const fs = require("fs/promises");

const {
  createResource,
  findResourcesByUserId,
  findResourceById,
  updateResource,
  deleteResource,
  findResourcesByFolder,
  deleteResourcesByFolder,
} = require("../models/Vault");

const pool = require("../config/db");
const { VAULT_EXT_TYPE_MAP, VAULT_FILE_TYPES } = require("../middleware/upload");
const {
  unlinkOwnedVaultFile,
  validateVaultFileContent,
} = require("../utils/vaultFiles");

const VALID_TYPES = ["pdf", "link"];
const VAULT_UPLOADS_DIR = path.join(__dirname, "..", "..", "uploads", "vault-docs");

const MAX_POSTGRES_INT = 2147483647;

function parsePositiveId(raw) {
  if (typeof raw !== "string" && typeof raw !== "number") return null;
  const value = String(raw);
  if (!/^[1-9]\d*$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) && id <= MAX_POSTGRES_INT ? id : null;
}

function isHttpUrl(value) {
  if (typeof value !== "string" || !value.trim()) return false;
  try {
    const parsed = new URL(value.trim());
    return ["http:", "https:"].includes(parsed.protocol) && Boolean(parsed.hostname);
  } catch {
    return false;
  }
}


async function listVault(req, res) {
  try {
    const rows = await findResourcesByUserId(req.userId);

    const bySubject = {};
    const byFolder = {};
    for (const r of rows) {
      if (r.subject_id !== null) {
        (bySubject[r.subject_id] ||= { subjectId: r.subject_id, subjectName: r.subject_name, items: [] }).items.push(r);
      } else {
        (byFolder[r.folder_name] ||= { folderName: r.folder_name, items: [] }).items.push(r);
      }
    }

    res.json({ items: rows, bySubject: Object.values(bySubject), byFolder: Object.values(byFolder) });
  } catch (err) {
    console.error("LIST VAULT ERROR:", err);
    res.status(500).json({ error: "Failed to load vault" });
  }
}

async function addVaultItem(req, res) {
  try {
    const body = req.body;
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return res.status(400).json({ error: "Invalid request body" });
    }

    const { subjectId, folderName, resourceType, title, urlPath } = body;
    const hasSubject = subjectId !== undefined && subjectId !== null && subjectId !== "";
    const hasFolder = folderName !== undefined && folderName !== null && folderName !== "";

    if (hasSubject === hasFolder) {
      return res.status(400).json({ error: "Choose exactly one subject or folder" });
    }
    if (!VALID_TYPES.includes(resourceType)) {
      return res.status(400).json({ error: "resourceType must be 'pdf' or 'link'" });
    }
    if (typeof title !== "string" || !title.trim()) {
      return res.status(400).json({ error: "title is required" });
    }
    if (title.trim().length > 255) {
      return res.status(400).json({ error: "title must be 255 characters or fewer" });
    }
    const isPlaceholder = urlPath === "#" && resourceType === "link";
    if (!isPlaceholder && !isHttpUrl(urlPath)) {
      return res.status(400).json({ error: "urlPath must be an HTTP or HTTPS URL" });
    }

    const parsedSubjectId = hasSubject ? parsePositiveId(subjectId) : null;
    if (hasSubject && parsedSubjectId === null) {
      return res.status(400).json({ error: "subjectId must be a positive integer" });
    }

    let normalizedFolder = null;
    if (hasFolder) {
      if (typeof folderName !== "string" || !folderName.trim()) {
        return res.status(400).json({ error: "folderName must be a non-empty string" });
      }
      normalizedFolder = folderName.trim();
      if (normalizedFolder.length > 120) {
        return res.status(400).json({ error: "folderName must be 120 characters or fewer" });
      }
    }

    const resource = await createResource(req.userId, {
      subjectId: parsedSubjectId,
      folderName: normalizedFolder,
      resourceType,
      title: title.trim(),
      urlPath: urlPath.trim(),
    });
    if (!resource) return res.status(400).json({ error: "Invalid subjectId" });

    res.status(201).json(resource);
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ error: "A resource with this title already exists in this location" });
    }
    console.error("ADD VAULT ITEM ERROR:", err);
    res.status(500).json({ error: "Failed to create resource" });
  }
}

async function updateVaultItem(req, res) {
  try {
    const id = parsePositiveId(req.params.id);
    if (id === null) return res.status(400).json({ error: "Invalid id" });

    const existing = await findResourceById(id, req.userId);
    if (!existing) return res.status(404).json({ error: "Resource not found" });

    const body = req.body;
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return res.status(400).json({ error: "Invalid request body" });
    }
    const { title, subjectId, folderName, resourceType } = body;

    if (resourceType !== undefined && resourceType !== existing.resource_type) {
      return res.status(400).json({ error: "resourceType cannot be changed after creation" });
    }

    const updates = {};
    if (title !== undefined) {
      if (typeof title !== "string" || !title.trim()) {
        return res.status(400).json({ error: "title cannot be empty" });
      }
      if (title.trim().length > 255) {
        return res.status(400).json({ error: "title must be 255 characters or fewer" });
      }
      updates.title = title.trim();
    }

    const movingToSubject = subjectId !== undefined;
    const movingToFolder = folderName !== undefined;
    if (movingToSubject && movingToFolder) {
      return res.status(400).json({ error: "Provide only one of subjectId or folderName when moving a resource" });
    }

    if (movingToSubject) {
      const parsedSubjectId = subjectId === null ? null : parsePositiveId(subjectId);
      if (subjectId !== null && parsedSubjectId === null) {
        return res.status(400).json({ error: "subjectId must be a positive integer or null" });
      }
      updates.subjectId = parsedSubjectId;
      updates.folderName = null;
    }

    if (movingToFolder) {
      if (folderName !== null && (typeof folderName !== "string" || !folderName.trim())) {
        return res.status(400).json({ error: "folderName cannot be empty" });
      }
      const normalizedFolder = folderName === null ? null : folderName.trim();
      if (normalizedFolder && normalizedFolder.length > 120) {
        return res.status(400).json({ error: "folderName must be 120 characters or fewer" });
      }
      updates.folderName = normalizedFolder;
      updates.subjectId = null;
    }

    const finalSubjectId = Object.prototype.hasOwnProperty.call(updates, "subjectId")
      ? updates.subjectId
      : existing.subject_id;
    const finalFolderName = Object.prototype.hasOwnProperty.call(updates, "folderName")
      ? updates.folderName
      : existing.folder_name;
    if ((finalSubjectId === null) === (finalFolderName === null)) {
      return res.status(400).json({ error: "Resource must belong to exactly one subject or folder" });
    }
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No valid fields provided to update" });
    }

    const updated = await updateResource(id, req.userId, updates);
    if (!updated) {
      if (movingToSubject && subjectId !== null) {
        return res.status(400).json({ error: "Invalid subjectId" });
      }
      return res.status(404).json({ error: "Resource not found" });
    }
    res.json(updated);
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ error: "A resource with this title already exists in this location" });
    }
    console.error("UPDATE VAULT ITEM ERROR:", err);
    res.status(500).json({ error: "Failed to update resource" });
  }
}

async function removeVaultItem(req, res) {
  try {
    const id = parsePositiveId(req.params.id);
    if (id === null) return res.status(400).json({ error: "Invalid id" });

    const existing = await findResourceById(id, req.userId);
    if (!existing) return res.status(404).json({ error: "Resource not found" });

    const deleted = await deleteResource(id, req.userId);
    if (!deleted) return res.status(404).json({ error: "Resource not found" });

    if (VAULT_FILE_TYPES.includes(existing.resource_type)) {
      await unlinkOwnedVaultFile(existing.url_path, req.userId);
    }
    res.json({ deleted: true, id });
  } catch (err) {
    console.error("REMOVE VAULT ITEM ERROR:", err);
    res.status(500).json({ error: "Failed to delete resource" });
  }
}

async function removeVaultFolder(req, res) {
  try {
    const folderName = (req.params.name || "").trim();
    if (!folderName || folderName.length > 120) {
      return res.status(400).json({ error: "Invalid folder name" });
    }

    const resources = await findResourcesByFolder(req.userId, folderName);
    if (resources.length === 0) {
      return res.status(404).json({ error: "Folder not found or already empty" });
    }

    await deleteResourcesByFolder(req.userId, folderName);

    const unlinkTargets = resources.filter(
      (r) =>
        VAULT_FILE_TYPES.includes(r.resource_type) &&
        r.url_path &&
        !/^https?:\/\//i.test(r.url_path)
    );

    await Promise.all(
      unlinkTargets.map((r) =>
        unlinkOwnedVaultFile(r.url_path, req.userId)
      )
    );

    res.json({
      deleted: true,
      folderName,
      rowsDeleted: resources.length,
      filesUnlinked: unlinkTargets.length,
    });
  } catch (err) {
    console.error("REMOVE VAULT FOLDER ERROR:", err);
    res.status(500).json({ error: "Failed to delete folder" });
  }
}

async function removeVaultSubject(req, res) {
  const id = parsePositiveId(req.params.id);
  if (id === null) return res.status(400).json({ error: "Invalid subject id" });

  let client;
  let resources;
  try {
    client = await pool.connect();
    await client.query("BEGIN");

    const selectResult = await client.query(
      `SELECT id, url_path, resource_type
       FROM subject_resources
       WHERE user_id = $1 AND subject_id = $2`,
      [req.userId, id]
    );
    resources = selectResult.rows;

    if (resources.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Subject vault is empty or not found" });
    }

    await client.query(
      "DELETE FROM subject_resources WHERE user_id = $1 AND subject_id = $2",
      [req.userId, id]
    );
    await client.query("COMMIT");
  } catch (err) {
    if (client) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackErr) {
        console.error("VAULT SUBJECT UNLINK ROLLBACK FAILED:", rollbackErr);
      }
    }
    console.error("REMOVE VAULT SUBJECT ERROR:", err);
    return res.status(500).json({ error: "Failed to unlink subject vault" });
  } finally {
    client?.release();
  }

  const unlinkTargets = resources.filter((r) => VAULT_FILE_TYPES.includes(r.resource_type));
  await Promise.all(
    unlinkTargets.map((r) => unlinkOwnedVaultFile(r.url_path, req.userId))
  );

  return res.json({
    deleted: true,
    subjectId: id,
    rowsDeleted: resources.length,
    filesUnlinked: unlinkTargets.length,
  });
}

async function safeUnlink(filePath) {
  try {
    await fs.unlink(filePath);
  } catch (err) {
    if (err.code !== "ENOENT") {
      console.error("VAULT UPLOAD CLEANUP WARNING:", err);
    }
  }
}

/**
 * @param {string} filePath
 * @returns {Promise<number|null>}
*/

async function extractPdfPageCount(filePath) {
  try {
    const buffer = await fs.readFile(filePath);
    const MAX_SCAN_BYTES = 10 * 1024 * 1024;
    const scanBuffer = buffer.length > MAX_SCAN_BYTES ? buffer.subarray(0, MAX_SCAN_BYTES) : buffer;
    const text = scanBuffer.toString("latin1");
    const pageTreePattern = /\/Type\s*\/Pages[^>]{0,500}?\/Count\s+(\d+)/g;
    const countOnlyPattern = /\/Count\s+(\d+)/g;

    let maxCount = null;

    let match;
    while ((match = pageTreePattern.exec(text)) !== null) {
      const n = parseInt(match[1], 10);
      if (!Number.isNaN(n) && (maxCount === null || n > maxCount)) {
        maxCount = n;
      }
    }

    if (maxCount === null) {
      while ((match = countOnlyPattern.exec(text)) !== null) {
        const n = parseInt(match[1], 10);
        if (!Number.isNaN(n) && (maxCount === null || n > maxCount)) {
          maxCount = n;
        }
      }
    }

    return maxCount;
  } catch (err) {
    console.error("PDF PAGE COUNT PARSE WARNING:", err);
    return null;
  }
}

async function uploadDocument(req, res) {
  if (!req.file) return res.status(400).json({ error: "No file provided" });

  const writtenPath = req.file.path;
  const ext = path.extname(req.file.originalname).toLowerCase();
  const resourceType = VAULT_EXT_TYPE_MAP[ext];

  if (!resourceType) {
    await safeUnlink(writtenPath);
    return res.status(400).json({ error: "Unsupported file type" });
  }
  if (req.file.size === 0) {
    await safeUnlink(writtenPath);
    return res.status(400).json({ error: "Empty files (0 bytes) are not allowed" });
  }

  try {
    const validContent = await validateVaultFileContent(writtenPath, ext);
    if (!validContent) {
      await safeUnlink(writtenPath);
      return res.status(400).json({ error: "File content does not match its type" });
    }
  } catch (err) {
    await safeUnlink(writtenPath);
    console.error("VAULT FILE VALIDATION ERROR:", err);
    return res.status(400).json({ error: "Unable to validate uploaded file" });
  }

  const rawSubjectId = req.body?.subjectId;
  const rawFolderName = req.body?.folderName;
  const hasSubject = rawSubjectId !== undefined && rawSubjectId !== null && String(rawSubjectId).trim() !== "";
  const hasFolder = rawFolderName !== undefined && rawFolderName !== null && String(rawFolderName).trim() !== "";

  if (hasSubject && hasFolder) {
    await safeUnlink(writtenPath);
    return res.status(400).json({ error: "Choose either subjectId or folderName" });
  }

  let subjectId = null;
  let folderName = null;
  if (hasSubject) {
    subjectId = parsePositiveId(rawSubjectId);
    if (subjectId === null) {
      await safeUnlink(writtenPath);
      return res.status(400).json({ error: "subjectId must be a positive integer" });
    }
  } else if (hasFolder) {
    if (typeof rawFolderName !== "string" || !rawFolderName.trim()) {
      await safeUnlink(writtenPath);
      return res.status(400).json({ error: "folderName must be a non-empty string" });
    }
    folderName = rawFolderName.trim();
    if (folderName.length > 120) {
      await safeUnlink(writtenPath);
      return res.status(400).json({ error: "folderName must be 120 characters or fewer" });
    }
  } else {
    folderName = "Custom Workspaces";
  }

  const rawTitle = req.body?.title;
  if (rawTitle !== undefined && (typeof rawTitle !== "string" || !rawTitle.trim())) {
    await safeUnlink(writtenPath);
    return res.status(400).json({ error: "title must be a non-empty string" });
  }
  const title = (typeof rawTitle === "string" && rawTitle.trim()) || req.file.originalname;
  if (title.length > 255) {
    await safeUnlink(writtenPath);
    return res.status(400).json({ error: "title must be 255 characters or fewer" });
  }

  let pageCount = null;
  if (ext === ".pdf") pageCount = await extractPdfPageCount(writtenPath);

  let fileSizeBytes = req.file.size;
  let client;
  try {
    client = await pool.connect();
    await client.query("BEGIN");

    const result = await client.query(
      `INSERT INTO subject_resources
         (user_id, subject_id, folder_name, resource_type, title, url_path,
          file_size_bytes, mime_type, page_count)
       SELECT $1, $2, $3, $4, $5, $6, $7, $8, $9
       WHERE $2::INTEGER IS NULL
          OR EXISTS (
            SELECT 1 FROM subjects s WHERE s.id = $2::INTEGER AND s.user_id = $1
          )
       RETURNING id, user_id, subject_id, folder_name, resource_type, title, url_path,
                 file_size_bytes, mime_type, page_count, created_at, updated_at`,
      [
        req.userId,
        subjectId,
        folderName,
        resourceType,
        title.trim(),
        `/uploads/vault-docs/${req.file.filename}`,
        fileSizeBytes,
        req.file.mimetype || null,
        pageCount,
      ]
    );

    if (!result.rows[0]) {
      await client.query("ROLLBACK");
      await safeUnlink(writtenPath);
      return res.status(400).json({ error: "Invalid subjectId" });
    }

    await client.query("COMMIT");
    return res.status(201).json(result.rows[0]);
  } catch (err) {
    if (client) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackErr) {
        console.error("VAULT UPLOAD ROLLBACK FAILED:", rollbackErr);
      }
    }
    await safeUnlink(writtenPath);

    if (err.code === "23505") {
      return res.status(409).json({ error: "A file with this title already exists in this location" });
    }
    if (err.code === "23503") {
      return res.status(400).json({ error: "Invalid subjectId" });
    }
    console.error("UPLOAD VAULT DOC ERROR:", err);
    return res.status(500).json({ error: "Failed to save document" });
  } finally {
    client?.release();
  }
}

module.exports = {
  listVault,
  addVaultItem,
  updateVaultItem,
  removeVaultItem,
  removeVaultFolder,
  removeVaultSubject,
  uploadDocument,
};
