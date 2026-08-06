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
  day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CHECK (end_time > start_time)
);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_timetables_user_id ON timetables(user_id);
CREATE INDEX IF NOT EXISTS idx_timetable_days_timetable_id ON timetable_days(timetable_id);
CREATE INDEX IF NOT EXISTS idx_timetable_slots_timetable_id ON timetable_slots(timetable_id);
