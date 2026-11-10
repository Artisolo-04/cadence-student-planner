const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const { getOverview } = require("../controllers/analyticsController");

router.get("/overview", requireAuth, getOverview);

module.exports = router;
