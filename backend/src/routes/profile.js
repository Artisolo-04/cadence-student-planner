const express = require("express");
const router = express.Router();
const { upsertProfile, getProfile, uploadAvatar } = require("../controllers/profileController");
const { requireAuth } = require("../middleware/auth");
const uploadAvatarMiddleware = require("../middleware/upload");

router.get("/", requireAuth, getProfile);
router.put("/", requireAuth, upsertProfile);

router.post(
  "/avatar",
  requireAuth,
  (req, res, next) => {
    uploadAvatarMiddleware(req, res, (err) => {
      if (err) return res.status(400).json({ error: err.message });
      next();
    });
  },
  uploadAvatar
);

module.exports = router;
