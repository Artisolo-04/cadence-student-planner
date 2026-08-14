const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const {
  listHomework,
  createHomework,
  updateHomework,
  updateHomeworkStatus,
  deleteHomework,
} = require("../controllers/homeworkController");

router.get("/", requireAuth, listHomework);
router.post("/", requireAuth, createHomework);
router.patch("/:id", requireAuth, updateHomework);
router.patch("/:id/status", requireAuth, updateHomeworkStatus);
router.delete("/:id", requireAuth, deleteHomework);

module.exports = router;
