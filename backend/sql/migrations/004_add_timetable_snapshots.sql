BEGIN;

ALTER TABLE timetables
  ADD COLUMN IF NOT EXISTS current_version INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS timetable_snapshots (
  id SERIAL PRIMARY KEY,
  timetable_id INTEGER NOT NULL REFERENCES timetables(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  entries_json JSONB NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (timetable_id, version)
);

CREATE INDEX IF NOT EXISTS idx_timetable_snapshots_timetable_id
  ON timetable_snapshots(timetable_id, version);

COMMIT;
