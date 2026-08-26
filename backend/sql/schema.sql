CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  faculty VARCHAR(255) NOT NULL,
  class_year VARCHAR(100) NOT NULL,
  avatar_url VARCHAR(500),
  avatar_original_url VARCHAR(500),
  avatar_zoom NUMERIC(6,2),
  avatar_offset_x NUMERIC(8,2),
  avatar_offset_y NUMERIC(8,2),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS timetables (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  my_group VARCHAR(10) CHECK (my_group IN ('g1', 'g2')),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS timetable_days (
  id SERIAL PRIMARY KEY,
  timetable_id INTEGER NOT NULL REFERENCES timetables(id) ON DELETE CASCADE,
  day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  UNIQUE (timetable_id, day_of_week)
);

CREATE TABLE IF NOT EXISTS timetable_slots (
  id SERIAL PRIMARY KEY,
  timetable_id INTEGER NOT NULL REFERENCES timetables(id) ON DELETE CASCADE,
  label VARCHAR(50),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CHECK (end_time > start_time)
);

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_timetables_user_id ON timetables(user_id);
CREATE INDEX IF NOT EXISTS idx_timetable_days_timetable_id ON timetable_days(timetable_id);
CREATE INDEX IF NOT EXISTS idx_timetable_slots_timetable_id ON timetable_slots(timetable_id);
CREATE INDEX IF NOT EXISTS idx_timetable_slots_times ON timetable_slots(timetable_id, start_time, end_time);

CREATE TABLE IF NOT EXISTS subjects (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  color VARCHAR(7) NOT NULL DEFAULT '#14b8a6',
  teacher VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subjects_user_id ON subjects(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS unique_subject_name_per_user
ON subjects (user_id, LOWER(TRIM(name)));

CREATE TABLE IF NOT EXISTS timetable_entries (
  id SERIAL PRIMARY KEY,
  timetable_id INTEGER NOT NULL REFERENCES timetables(id) ON DELETE CASCADE,
  subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  slot_id INTEGER NOT NULL REFERENCES timetable_slots(id) ON DELETE CASCADE,
  end_slot_id INTEGER NOT NULL REFERENCES timetable_slots(id) ON DELETE CASCADE,
  day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  group_tag VARCHAR(10) NOT NULL DEFAULT 'all' CHECK (group_tag IN ('all', 'g1', 'g2')),
  room VARCHAR(100),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT timetable_entries_unique_span
    UNIQUE (timetable_id, slot_id, end_slot_id, day_of_week, group_tag)
);

CREATE INDEX IF NOT EXISTS idx_timetable_entries_timetable_id ON timetable_entries(timetable_id);
CREATE INDEX IF NOT EXISTS idx_timetable_entries_subject_id ON timetable_entries(subject_id);
CREATE INDEX IF NOT EXISTS idx_timetable_entries_day ON timetable_entries(timetable_id, day_of_week);

CREATE TABLE IF NOT EXISTS homework (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject_id INTEGER REFERENCES subjects(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  notes TEXT,
  due_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'todo' CHECK (status IN ('todo','in_progress','done')),
  priority VARCHAR(10) NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high')),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_homework_user_id ON homework(user_id);
CREATE INDEX IF NOT EXISTS idx_homework_subject_id ON homework(subject_id);
CREATE INDEX IF NOT EXISTS idx_homework_due_date ON homework(due_date);

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
