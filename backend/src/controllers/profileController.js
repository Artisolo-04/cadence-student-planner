const { createProfile, findProfileByUserId, updateProfile } = require("../models/Profile");

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

module.exports = { upsertProfile, getProfile };
