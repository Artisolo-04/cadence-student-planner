CREATE UNIQUE INDEX IF NOT EXISTS unique_vault_title_per_subject
ON subject_resources (user_id, subject_id, LOWER(TRIM(title)))
WHERE subject_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS unique_vault_title_per_folder
ON subject_resources (user_id, folder_name, LOWER(TRIM(title)))
WHERE folder_name IS NOT NULL;
