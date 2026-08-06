const express = require("express");
const router = express.Router();
const { upsertProfile, getProfile } = require("../controllers/profileController");
const { requireAuth } = require("../middleware/auth");

router.get("/", requireAuth, getProfile);
router.put("/", requireAuth, upsertProfile);

module.exports = router;
