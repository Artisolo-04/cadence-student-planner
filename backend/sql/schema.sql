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
  day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  group_tag VARCHAR(10) NOT NULL DEFAULT 'all' CHECK (group_tag IN ('all', 'g1', 'g2')),
  room VARCHAR(100),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (timetable_id, slot_id, day_of_week, group_tag)
);

CREATE INDEX IF NOT EXISTS idx_timetable_entries_timetable_id ON timetable_entries(timetable_id);
CREATE INDEX IF NOT EXISTS idx_timetable_entries_subject_id ON timetable_entries(subject_id);
