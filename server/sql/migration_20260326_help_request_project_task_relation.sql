USE nextlaunch_hub;

ALTER TABLE help_requests
  ADD COLUMN project_id BIGINT NULL AFTER helper_name,
  ADD COLUMN project_name VARCHAR(100) NULL AFTER project_id,
  ADD COLUMN task_id BIGINT NULL AFTER project_name,
  ADD COLUMN task_title VARCHAR(150) NULL AFTER task_id;

CREATE INDEX idx_help_requests_project_id ON help_requests(project_id);
CREATE INDEX idx_help_requests_task_id ON help_requests(task_id);
