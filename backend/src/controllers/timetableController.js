const {
  createWorkspace,
  listWorkspaces,
  getWorkspace,
  renameWorkspace,
  updateMyGroup,
  updateDays,
  removeWorkspace,
} = require("./timetable/workspaceController");

const { createSlot, editSlot, removeSlot } = require("./timetable/slotController");

const {
  createEntryHandler,
  updateEntryHandler,
  clearEntry,
  batchUpdateEntries,
} = require("./timetable/entryController");

const { checkpointEntries, undoEntries, redoEntries } = require("./timetable/historyController");

module.exports = {
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
};
