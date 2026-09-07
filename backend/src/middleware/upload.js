const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const avatarsDir = path.join(__dirname, "..", "..", "uploads", "avatars");
fs.mkdirSync(avatarsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, avatarsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `user-${req.userId}-${file.fieldname}-${Date.now()}${ext}`);
  },
});

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
function fileFilter(req, file, cb) {
  if (!ALLOWED_TYPES.includes(file.mimetype)) {
    return cb(new Error("Only JPG, PNG, or WEBP images are allowed"));
  }
  cb(null, true);
}

const uploadAvatar = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 },
});

const uploadAvatarFields = uploadAvatar.fields([
  { name: "avatar", maxCount: 1 },
  { name: "avatarOriginal", maxCount: 1 },
]);

const vaultDocsDir = path.join(__dirname, "..", "..", "uploads", "vault-docs");
fs.mkdirSync(vaultDocsDir, { recursive: true });

const VAULT_EXT_TYPE_MAP = {
  ".pdf": "pdf",
  ".docx": "docx",
  ".xlsx": "xlsx",
  ".txt": "txt",
};

const VAULT_MIME_MAP = {
  ".pdf": ["application/pdf"],
  ".docx": [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/octet-stream",
  ],
  ".xlsx": [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/octet-stream",
  ],
  ".txt": ["text/plain"],
};

function sanitizeBaseName(originalName) {
  const base = path.basename(originalName, path.extname(originalName));
  return base
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60) || "file";
}

const vaultStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, vaultDocsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeBase = sanitizeBaseName(file.originalname);
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}`;
    cb(null, `user-${req.userId}-${safeBase}-${uniqueSuffix}${ext}`);
  },
});

function vaultFileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedType = VAULT_EXT_TYPE_MAP[ext];

  if (!allowedType) {
    return cb(new Error("Only .pdf, .docx, .xlsx, or .txt files are allowed"));
  }

  const allowedMimes = VAULT_MIME_MAP[ext] || [];
  if (!allowedMimes.includes(file.mimetype)) {
    return cb(new Error("File content does not match its extension"));
  }

  cb(null, true);
}

const vaultDocUpload = multer({
  storage: vaultStorage,
  fileFilter: vaultFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
}).single("file");

module.exports = uploadAvatarFields;
module.exports.vaultDocUpload = vaultDocUpload;
module.exports.VAULT_EXT_TYPE_MAP = VAULT_EXT_TYPE_MAP;
module.exports.VAULT_FILE_TYPES = Object.values(VAULT_EXT_TYPE_MAP);
