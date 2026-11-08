const path = require("path");
const fs = require("fs/promises");

const VAULT_UPLOADS_DIR = path.join(__dirname, "..", "..", "uploads", "vault-docs");

function resolveOwnedVaultFile(urlPath, userId) {
  if (typeof urlPath !== "string") return null;

  const prefix = "/uploads/vault-docs/";
  if (!urlPath.startsWith(prefix)) return null;

  const fileName = urlPath.slice(prefix.length);
  if (!fileName || fileName !== path.posix.basename(fileName)) return null;

  const escapedUserId = String(userId).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const generatedName = new RegExp(
    `^user-${escapedUserId}-[A-Za-z0-9_-]+-\\d+-[a-f0-9]{12}\\.(pdf|docx|xlsx|txt)$`
  );
  if (!generatedName.test(fileName)) return null;

  return path.join(VAULT_UPLOADS_DIR, fileName);
}

async function unlinkOwnedVaultFile(urlPath, userId) {
  const filePath = resolveOwnedVaultFile(urlPath, userId);
  if (!filePath) return false;

  try {
    await fs.unlink(filePath);
    return true;
  } catch (err) {
    if (err.code !== "ENOENT") {
      console.error("VAULT UPLOAD CLEANUP WARNING:", err);
    }
    return false;
  }
}

function readZipEntries(buffer) {
  const minOffset = Math.max(0, buffer.length - 65557);
  let eocd = -1;
  for (let i = buffer.length - 22; i >= minOffset; i -= 1) {
    if (buffer.readUInt32LE(i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) return null;

  const entryCount = buffer.readUInt16LE(eocd + 10);
  let offset = buffer.readUInt32LE(eocd + 16);
  const entries = new Set();

  for (let i = 0; i < entryCount; i += 1) {
    if (offset + 46 > buffer.length || buffer.readUInt32LE(offset) !== 0x02014b50) {
      return null;
    }
    const nameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const end = offset + 46 + nameLength;
    if (end > buffer.length) return null;
    entries.add(buffer.toString("utf8", offset + 46, end));
    offset = end + extraLength + commentLength;
  }
  return entries;
}

async function validateVaultFileContent(filePath, extension) {
  const buffer = await fs.readFile(filePath);

  if (extension === ".pdf") {
    return buffer.subarray(0, 1024).includes(Buffer.from("%PDF-"));
  }

  if (extension === ".docx" || extension === ".xlsx") {
    if (
      buffer.length < 4 ||
      buffer.readUInt32LE(0) !== 0x04034b50
    ) {
      return false;
    }
    const entries = readZipEntries(buffer);
    if (!entries || !entries.has("[Content_Types].xml")) return false;
    return extension === ".docx"
      ? entries.has("word/document.xml")
      : entries.has("xl/workbook.xml");
  }

  if (extension === ".txt") {
    if (buffer.includes(0)) return false;
    try {
      new TextDecoder("utf-8", { fatal: true }).decode(buffer);
      return true;
    } catch {
      return false;
    }
  }

  return false;
}

module.exports = {
  resolveOwnedVaultFile,
  unlinkOwnedVaultFile,
  validateVaultFileContent,
};
