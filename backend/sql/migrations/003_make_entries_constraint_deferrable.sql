BEGIN;

ALTER TABLE timetable_entries
  DROP CONSTRAINT timetable_entries_unique_span;

ALTER TABLE timetable_entries
  ADD CONSTRAINT timetable_entries_unique_span
  UNIQUE (timetable_id, slot_id, end_slot_id, day_of_week, group_tag)
  DEFERRABLE INITIALLY IMMEDIATE;

COMMIT;
