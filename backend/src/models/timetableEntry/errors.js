class OverlapConflictError extends Error {
  constructor(conflicts) {
    super("Entry overlaps with existing timetable entries");
    this.name = "OverlapConflictError";
    this.status = 409;
    this.conflicts = conflicts;
  }
}

module.exports = { OverlapConflictError };
