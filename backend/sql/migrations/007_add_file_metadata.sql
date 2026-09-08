ALTER TABLE subject_resources
  ADD COLUMN IF NOT EXISTS file_size_bytes BIGINT,
  ADD COLUMN IF NOT EXISTS mime_type VARCHAR(127),
  ADD COLUMN IF NOT EXISTS page_count INT;

COMMENT ON COLUMN subject_resources.file_size_bytes IS 'True on-disk size in bytes, captured from multer/fs.stat at ingestion time. NULL for link resources.';
COMMENT ON COLUMN subject_resources.mime_type IS 'True MIME type reported by multer at ingestion time. NULL for link resources.';
COMMENT ON COLUMN subject_resources.page_count IS 'Document page count. NULL until computed; NULL permanently for non-paginated types.';
