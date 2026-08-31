const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const {
  createWorkspace,
  listWorkspaces,
  getWorkspace,
  renameWorkspace,
  updateMyGroup,
  updateDays,
  createSlot,
  editSlot,
  removeSlot,
  removeWorkspace,
  createEntryHandler,
  updateEntryHandler,
  clearEntry,
  batchUpdateEntries,
  checkpointEntries,
  undoEntries,
  redoEntries,
} = require("../controllers/timetableController");
const { getAnalytics } = require("../controllers/timetable/analyticsController");

router.post("/", requireAuth, createWorkspace);
router.get("/", requireAuth, listWorkspaces);
router.get("/:id", requireAuth, getWorkspace);
router.get("/:id/analytics", requireAuth, getAnalytics);
router.patch("/:id", requireAuth, renameWorkspace);
router.patch("/:id/my-group", requireAuth, updateMyGroup);
router.delete("/:id", requireAuth, removeWorkspace);

router.put("/:id/days", requireAuth, updateDays);

router.post("/:id/slots", requireAuth, createSlot);
router.patch("/:id/slots/:slotId", requireAuth, editSlot);
router.delete("/:id/slots/:slotId", requireAuth, removeSlot);

router.post("/:id/entries/batch", requireAuth, batchUpdateEntries);
router.post("/:id/entries/checkpoint", requireAuth, checkpointEntries);
router.post("/:id/entries/undo", requireAuth, undoEntries);
router.post("/:id/entries/redo", requireAuth, redoEntries);
router.post("/:id/entries", requireAuth, createEntryHandler);
router.patch("/:id/entries/:entryId", requireAuth, updateEntryHandler);
router.delete("/:id/entries/:entryId", requireAuth, clearEntry);

module.exports = router;
