const path = require("path");
const fs = require("fs/promises");
const {
  saveProfile,
  findProfileByUserId,
  updateProfileAvatarWithOriginal,
  updateProfileAvatarCrop,
} = require("../models/Profile");

const AVATARS_DIR = path.join(__dirname, "..", "..", "uploads", "avatars");
const MAX_OFFSET = 999999.99;

function validateProfileInput(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: "Request body must be a JSON object" };
  }

  const fields = [
    ["fullName", "Full name", 255],
    ["faculty", "Faculty", 255],
    ["classYear", "Class/year", 100],
  ];
  const value = {};

  for (const [key, label, maxLength] of fields) {
    if (typeof body[key] !== "string") {
      return { error: `${label} must be a string` };
    }
    const trimmed = body[key].trim();
    if (!trimmed) return { error: `${label} is required` };
    if (Array.from(trimmed).length > maxLength) {
      return { error: `${label} must be ${maxLength} characters or fewer` };
    }
    value[key] = trimmed;
  }

  return { value };
}

function parseCropValue(raw, { min, max, integer = false }) {
  if (raw == null || raw === "") return { value: null };
  if (typeof raw !== "string" || !/^-?\d+(?:\.\d+)?$/.test(raw)) {
    return { error: true };
  }

  const value = Number(raw);
  if (!Number.isFinite(value) || value < min || value > max) {
    return { error: true };
  }
  if (integer && !Number.isInteger(value)) return { error: true };
  return { value };
}

function isImageSignature(buffer, mimeType) {
  if (mimeType === "image/jpeg") {
    return buffer.length >= 3 && buffer[0] === 0xff &&
      buffer[1] === 0xd8 && buffer[2] === 0xff;
  }
  if (mimeType === "image/png") {
    return buffer.length >= 8 &&
      buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  }
  if (mimeType === "image/webp") {
    return buffer.length >= 12 &&
      buffer.toString("ascii", 0, 4) === "RIFF" &&
      buffer.toString("ascii", 8, 12) === "WEBP";
  }
  return false;
}

async function removeUploadedFiles(files) {
  await Promise.all((files || []).map(async (file) => {
    if (!file?.path) return;
    try {
      await fs.unlink(file.path);
    } catch (err) {
      if (err.code !== "ENOENT") console.error("Avatar upload cleanup warning:", err);
    }
  }));
}

function resolveAvatarPath(url, userId) {
  if (typeof url !== "string") return null;
  const prefix = "/uploads/avatars/";
  if (!url.startsWith(prefix)) return null;

  const fileName = url.slice(prefix.length);
  if (!fileName || fileName !== path.posix.basename(fileName)) return null;

  const pattern = new RegExp(
    `^user-${Number(userId)}-(?:avatar|avatarOriginal)-\\d+(?:\\.[a-z0-9]{1,10})?$`
  );
  if (!pattern.test(fileName)) return null;
  return path.join(AVATARS_DIR, fileName);
}

async function removeAvatarUrl(url, userId) {
  const filePath = resolveAvatarPath(url, userId);
  if (!filePath) return;

  try {
    await fs.unlink(filePath);
  } catch (err) {
    if (err.code !== "ENOENT") console.error("Old avatar cleanup warning:", err);
  }
}

async function upsertProfile(req, res) {
  const input = validateProfileInput(req.body);
  if (input.error) return res.status(400).json({ error: input.error });

  try {
    const { fullName, faculty, classYear } = input.value;
    const profile = await saveProfile(req.userId, { fullName, faculty, classYear });
    return res.json({ profile });
  } catch (err) {
    console.error("Profile save error:", err);
    return res.status(500).json({ error: "Something went wrong saving your profile" });
  }
}

async function getProfile(req, res) {
  try {
    const profile = await findProfileByUserId(req.userId);
    return res.json({ profile: profile || null });
  } catch (err) {
    console.error("Get profile error:", err);
    return res.status(500).json({ error: "Something went wrong" });
  }
}

async function uploadAvatar(req, res) {
  const uploadedFiles = Object.values(req.files || {}).flat();
  const croppedFile = req.files?.avatar?.[0];
  const originalFile = req.files?.avatarOriginal?.[0];

  try {
    if (!croppedFile) {
      await removeUploadedFiles(uploadedFiles);
      return res.status(400).json({ error: "No image file received" });
    }

    for (const file of uploadedFiles) {
      const bytes = await fs.readFile(file.path);
      if (!isImageSignature(bytes, file.mimetype)) {
        await removeUploadedFiles(uploadedFiles);
        return res.status(400).json({ error: "Uploaded file content is not a valid image" });
      }
    }

    const zoomResult = parseCropValue(req.body.zoom, { min: 100, max: 300, integer: true });
    const offsetXResult = parseCropValue(req.body.offsetX, { min: -MAX_OFFSET, max: 0 });
    const offsetYResult = parseCropValue(req.body.offsetY, { min: -MAX_OFFSET, max: 0 });
    if (zoomResult.error || offsetXResult.error || offsetYResult.error) {
      await removeUploadedFiles(uploadedFiles);
      return res.status(400).json({ error: "Invalid avatar crop values" });
    }

    const existing = await findProfileByUserId(req.userId);
    if (!existing) {
      await removeUploadedFiles(uploadedFiles);
      return res.status(404).json({ error: "Profile not found" });
    }

    const avatarUrl = `/uploads/avatars/${croppedFile.filename}`;
    let profile;
    if (originalFile) {
      profile = await updateProfileAvatarWithOriginal(req.userId, {
        avatarUrl,
        avatarOriginalUrl: `/uploads/avatars/${originalFile.filename}`,
        zoom: zoomResult.value,
        offsetX: offsetXResult.value,
        offsetY: offsetYResult.value,
      });
    } else {
      profile = await updateProfileAvatarCrop(req.userId, {
        avatarUrl,
        zoom: zoomResult.value,
        offsetX: offsetXResult.value,
        offsetY: offsetYResult.value,
      });
    }

    if (!profile) {
      await removeUploadedFiles(uploadedFiles);
      return res.status(404).json({ error: "Profile not found" });
    }

    await removeAvatarUrl(existing.avatar_url, req.userId);
    if (originalFile) {
      await removeAvatarUrl(existing.avatar_original_url, req.userId);
    }

    return res.json({ profile });
  } catch (err) {
    await removeUploadedFiles(uploadedFiles);
    console.error("Avatar upload error:", err);
    return res.status(500).json({ error: "Something went wrong uploading your photo" });
  }
}

module.exports = { upsertProfile, getProfile, uploadAvatar };
