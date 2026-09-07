ALTER TABLE subject_resources
  DROP CONSTRAINT subject_resources_resource_type_check;

ALTER TABLE subject_resources
  ADD CONSTRAINT subject_resources_resource_type_check
  CHECK (resource_type IN ('pdf', 'link', 'docx', 'xlsx', 'txt'));
