const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const {
  addSubject,
  listSubjects,
  editSubject,
  removeSubject,
} = require("../controllers/subjectController");

router.post("/", requireAuth, addSubject);
router.get("/", requireAuth, listSubjects);
router.patch("/:id", requireAuth, editSubject);
router.delete("/:id", requireAuth, removeSubject);

module.exports = router;
