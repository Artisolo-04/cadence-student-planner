const express = require("express");

const { requireAuth } = require("../middleware/auth");
const { parsePositiveRouteId } = require("../controllers/timetable/validators");
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

const router = express.Router();

router.param("id", (req, res, next, rawId) => {
  const id = parsePositiveRouteId(rawId);
  if (id === null) return res.status(404).json({ error: "Workspace not found" });
  req.params.id = String(id);
  next();
});

router.param("slotId", (req, res, next, rawId) => {
  const id = parsePositiveRouteId(rawId);
  if (id === null) return res.status(404).json({ error: "Slot not found" });
  req.params.slotId = String(id);
  next();
});

router.param("entryId", (req, res, next, rawId) => {
  const id = parsePositiveRouteId(rawId);
  if (id === null) return res.status(404).json({ error: "Entry not found" });
  req.params.entryId = String(id);
  next();
});

router.post("/", requireAuth, createWorkspace);
router.get("/", requireAuth, listWorkspaces);
router.get("/:id", requireAuth, getWorkspace);
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
