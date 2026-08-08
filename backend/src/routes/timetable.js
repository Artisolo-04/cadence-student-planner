const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const {
  createWorkspace,
  listWorkspaces,
  getWorkspace,
  renameWorkspace,
  updateDays,
  createSlot,
  editSlot,
  removeSlot,
  removeWorkspace,
  setEntry,
  clearEntry,
} = require("../controllers/timetableController");

router.post("/", requireAuth, createWorkspace);
router.get("/", requireAuth, listWorkspaces);
router.get("/:id", requireAuth, getWorkspace);
router.patch("/:id", requireAuth, renameWorkspace);
router.delete("/:id", requireAuth, removeWorkspace);

router.put("/:id/days", requireAuth, updateDays);

router.post("/:id/slots", requireAuth, createSlot);
router.patch("/:id/slots/:slotId", requireAuth, editSlot);
router.delete("/:id/slots/:slotId", requireAuth, removeSlot);

router.put("/:id/entries", requireAuth, setEntry);
router.delete("/:id/entries", requireAuth, clearEntry);

module.exports = router;
