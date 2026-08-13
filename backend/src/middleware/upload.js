const multer = require("multer");
const path = require("path");
const fs = require("fs");

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

module.exports = uploadAvatarFields;
