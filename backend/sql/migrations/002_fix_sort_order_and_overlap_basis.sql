BEGIN;

CREATE OR REPLACE FUNCTION resequence_timetable_slots() RETURNS TRIGGER AS $$
BEGIN
  WITH ordered AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY start_time, id) AS rn
    FROM timetable_slots
    WHERE timetable_id = COALESCE(NEW.timetable_id, OLD.timetable_id)
  )
  UPDATE timetable_slots ts
  SET sort_order = ordered.rn
  FROM ordered
  WHERE ts.id = ordered.id
    AND ts.sort_order IS DISTINCT FROM ordered.rn;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_resequence_slots ON timetable_slots;

CREATE TRIGGER trg_resequence_slots
AFTER INSERT OR DELETE OR UPDATE OF start_time ON timetable_slots
FOR EACH ROW EXECUTE FUNCTION resequence_timetable_slots();

UPDATE timetable_slots ts
SET sort_order = ordered.rn
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY timetable_id ORDER BY start_time, id) AS rn
  FROM timetable_slots
) ordered
WHERE ts.id = ordered.id
  AND ts.sort_order IS DISTINCT FROM ordered.rn;

CREATE INDEX IF NOT EXISTS idx_timetable_slots_times
  ON timetable_slots(timetable_id, start_time, end_time);

COMMIT;
