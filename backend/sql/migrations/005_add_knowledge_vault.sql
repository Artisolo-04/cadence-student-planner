CREATE TABLE IF NOT EXISTS subject_resources (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject_id INT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  folder_name VARCHAR(120),
  resource_type VARCHAR(10) NOT NULL CHECK (resource_type IN ('pdf', 'link')),
  title VARCHAR(255) NOT NULL,
  url_path TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT subject_resources_folder_or_subject_chk
    CHECK (subject_id IS NOT NULL OR folder_name IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_subject_resources_user_id ON subject_resources(user_id);
CREATE INDEX IF NOT EXISTS idx_subject_resources_subject_id ON subject_resources(subject_id);
