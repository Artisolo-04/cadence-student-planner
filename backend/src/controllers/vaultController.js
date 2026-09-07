const path = require("path");
const fs = require("fs/promises");

const {
  createResource,
  findResourcesByUserId,
  findResourceById,
  updateResource,
  deleteResource,
} = require("../models/Vault");

const pool = require("../config/db");
const { VAULT_EXT_TYPE_MAP, VAULT_FILE_TYPES } = require("../middleware/upload");

const VALID_TYPES = ["pdf", "link"];
const VAULT_UPLOADS_DIR = path.join(__dirname, "..", "..", "uploads", "vault-docs");

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
    const { subjectId, folderName, resourceType, title, urlPath } = req.body || {};

    if (!resourceType || !VALID_TYPES.includes(resourceType)) {
      return res.status(400).json({ error: "resourceType must be 'pdf' or 'link'" });
    }
    if (!title || typeof title !== "string" || !title.trim()) {
      return res.status(400).json({ error: "title is required" });
    }
    if (!urlPath || typeof urlPath !== "string" || !urlPath.trim()) {
      return res.status(400).json({ error: "urlPath is required" });
    }
    if (!subjectId && !folderName) {
      return res.status(400).json({ error: "subjectId or folderName is required" });
    }

    const parsedSubjectId = subjectId ? parseInt(subjectId, 10) : null;
    if (subjectId && Number.isNaN(parsedSubjectId)) {
      return res.status(400).json({ error: "subjectId must be an integer" });
    }

    const resource = await createResource(req.userId, {
      subjectId: parsedSubjectId,
      folderName: folderName ? String(folderName).trim() : null,
      resourceType,
      title: title.trim(),
      urlPath: urlPath.trim(),
    });

    res.status(201).json(resource);
  } catch (err) {
    console.error("ADD VAULT ITEM ERROR:", err);
    res.status(500).json({ error: "Failed to create resource" });
  }
}

async function updateVaultItem(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: "Invalid id" });
    }

    const existing = await findResourceById(id, req.userId);
    if (!existing) {
      return res.status(404).json({ error: "Resource not found" });
    }

    const { title, subjectId, folderName, resourceType } = req.body || {};

    if (resourceType !== undefined && resourceType !== existing.resource_type) {
      return res.status(400).json({ error: "resourceType cannot be changed after creation" });
    }

    const updates = {};

    if (title !== undefined) {
      if (typeof title !== "string" || !title.trim()) {
        return res.status(400).json({ error: "title cannot be empty" });
      }
      updates.title = title.trim();
    }

    const movingToSubject = subjectId !== undefined;
    const movingToFolder = folderName !== undefined;

    if (movingToSubject && movingToFolder) {
      return res.status(400).json({ error: "Provide only one of subjectId or folderName when moving a resource" });
    }

    if (movingToSubject) {
      const parsedSubjectId = subjectId === null ? null : parseInt(subjectId, 10);
      if (subjectId !== null && Number.isNaN(parsedSubjectId)) {
        return res.status(400).json({ error: "subjectId must be an integer or null" });
      }
      updates.subjectId = parsedSubjectId;
      updates.folderName = null;
    }

    if (movingToFolder) {
      const trimmedFolder = folderName === null ? null : String(folderName).trim();
      if (folderName !== null && !trimmedFolder) {
        return res.status(400).json({ error: "folderName cannot be empty" });
      }
      updates.folderName = trimmedFolder;
      updates.subjectId = null;
    }

    const finalSubjectId = Object.prototype.hasOwnProperty.call(updates, "subjectId") ? updates.subjectId : existing.subject_id;
    const finalFolderName = Object.prototype.hasOwnProperty.call(updates, "folderName") ? updates.folderName : existing.folder_name;
    if (finalSubjectId === null && finalFolderName === null) {
      return res.status(400).json({ error: "Resource must belong to a subject or a folder" });
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No valid fields provided to update" });
    }

    const updated = await updateResource(id, req.userId, updates);
    res.json(updated);
  } catch (err) {
    console.error("UPDATE VAULT ITEM ERROR:", err);
    res.status(500).json({ error: "Failed to update resource" });
  }
}

async function removeVaultItem(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: "Invalid id" });
    }

    const existing = await findResourceById(id, req.userId);
    if (!existing) {
      return res.status(404).json({ error: "Resource not found" });
    }

    if (VAULT_FILE_TYPES.includes(existing.resource_type) && existing.url_path && !/^https?:\/\//i.test(existing.url_path)) {
      const safeFileName = path.basename(existing.url_path);
      const filePath = path.join(VAULT_UPLOADS_DIR, safeFileName);
      try {
        await fs.unlink(filePath);
      } catch (fileErr) {
        if (fileErr.code !== "ENOENT") {
          console.error("VAULT FILE CLEANUP WARNING:", fileErr);
        }
      }
    }

    await deleteResource(id, req.userId);
    res.json({ deleted: true, id });
  } catch (err) {
    console.error("REMOVE VAULT ITEM ERROR:", err);
    res.status(500).json({ error: "Failed to delete resource" });
  }
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

async function uploadDocument(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: "No file provided" });
  }

  const writtenPath = req.file.path;
  const ext = path.extname(req.file.originalname).toLowerCase();
  const resourceType = VAULT_EXT_TYPE_MAP[ext];

  if (!resourceType) {
    await safeUnlink(writtenPath);
    return res.status(400).json({ error: "Unsupported file type" });
  }

  const rawTitle = req.body?.title;
  const title = (typeof rawTitle === "string" && rawTitle.trim()) || req.file.originalname;

  const rawFolderName = req.body?.folderName;
  const folderName =
    typeof rawFolderName === "string" && rawFolderName.trim()
      ? rawFolderName.trim()
      : "Custom Workspaces";

  const urlPath = `/uploads/vault-docs/${req.file.filename}`;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const result = await client.query(
      `INSERT INTO subject_resources (user_id, subject_id, folder_name, resource_type, title, url_path)
       VALUES ($1, NULL, $2, $3, $4, $5)
       RETURNING id, user_id, subject_id, folder_name, resource_type, title, url_path, created_at, updated_at`,
      [req.userId, folderName, resourceType, title, urlPath]
    );

    await client.query("COMMIT");
    res.status(201).json(result.rows[0]);
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackErr) {
      console.error("VAULT UPLOAD ROLLBACK FAILED:", rollbackErr);
    }
    console.error("UPLOAD VAULT DOC ERROR:", err);
    await safeUnlink(writtenPath);
    res.status(500).json({ error: "Failed to save document" });
  } finally {
    client.release();
  }
}

module.exports = { listVault, addVaultItem, updateVaultItem, removeVaultItem, uploadDocument };
