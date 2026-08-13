const path = require("path");
const fs = require("fs");
const {
  createProfile,
  findProfileByUserId,
  updateProfile,
  updateProfileAvatarWithOriginal,
  updateProfileAvatarCrop,
} = require("../models/Profile");

async function upsertProfile(req, res) {
  try {
    const { fullName, faculty, classYear } = req.body;
    if (!fullName || !faculty || !classYear) {
      return res.status(400).json({ error: "Full name, faculty, and class/year are required" });
    }

    const existing = await findProfileByUserId(req.userId);
    let profile;
    if (existing) {
      profile = await updateProfile(req.userId, fullName, faculty, classYear);
    } else {
      profile = await createProfile(req.userId, fullName, faculty, classYear);
    }
    res.json({ profile });
  } catch (err) {
    console.error("Profile save error:", err);
    res.status(500).json({ error: "Something went wrong saving your profile" });
  }
}

async function getProfile(req, res) {
  try {
    const profile = await findProfileByUserId(req.userId);
    res.json({ profile: profile || null });
  } catch (err) {
    console.error("Get profile error:", err);
    res.status(500).json({ error: "Something went wrong" });
  }
}

async function uploadAvatar(req, res) {
  try {
    const croppedFile = req.files?.avatar?.[0];
    const originalFile = req.files?.avatarOriginal?.[0];

    if (!croppedFile) {
      return res.status(400).json({ error: "No image file received" });
    }

    const zoom = req.body.zoom ? Number(req.body.zoom) : null;
    const offsetX = req.body.offsetX ? Number(req.body.offsetX) : null;
    const offsetY = req.body.offsetY ? Number(req.body.offsetY) : null;

    const existing = await findProfileByUserId(req.userId);
    const avatarUrl = `/uploads/avatars/${croppedFile.filename}`;

    let profile;
    if (originalFile) {
      const avatarOriginalUrl = `/uploads/avatars/${originalFile.filename}`;
      profile = await updateProfileAvatarWithOriginal(req.userId, {
        avatarUrl,
        avatarOriginalUrl,
        zoom,
        offsetX,
        offsetY,
      });

      if (existing?.avatar_url) {
        fs.unlink(path.join(__dirname, "..", "..", existing.avatar_url), () => {});
      }
      if (existing?.avatar_original_url) {
        fs.unlink(path.join(__dirname, "..", "..", existing.avatar_original_url), () => {});
      }
    } else {
      profile = await updateProfileAvatarCrop(req.userId, { avatarUrl, zoom, offsetX, offsetY });

      if (existing?.avatar_url) {
        fs.unlink(path.join(__dirname, "..", "..", existing.avatar_url), () => {});
      }
    }

    res.json({ profile });
  } catch (err) {
    console.error("Avatar upload error:", err);
    res.status(500).json({ error: "Something went wrong uploading your photo" });
  }
}

module.exports = { upsertProfile, getProfile, uploadAvatar };
