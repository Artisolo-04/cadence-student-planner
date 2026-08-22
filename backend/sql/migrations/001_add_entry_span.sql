BEGIN;

ALTER TABLE timetable_entries
  ADD COLUMN end_slot_id INTEGER REFERENCES timetable_slots(id) ON DELETE CASCADE;

UPDATE timetable_entries SET end_slot_id = slot_id WHERE end_slot_id IS NULL;

ALTER TABLE timetable_entries
  ALTER COLUMN end_slot_id SET NOT NULL;

ALTER TABLE timetable_entries DROP CONSTRAINT timetable_entries_unique_slot;

ALTER TABLE timetable_entries
  ADD CONSTRAINT timetable_entries_unique_span
  UNIQUE (timetable_id, slot_id, end_slot_id, day_of_week, group_tag);

CREATE INDEX IF NOT EXISTS idx_timetable_entries_day
  ON timetable_entries(timetable_id, day_of_week);

COMMIT;
