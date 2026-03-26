USE nextlaunch_hub;

ALTER TABLE help_requests
  ADD COLUMN expected_handle_hours INT NULL AFTER request_date,
  ADD COLUMN deadline_at DATETIME NULL AFTER expected_handle_hours,
  ADD COLUMN is_timeout TINYINT NOT NULL DEFAULT 0 AFTER deadline_at;

CREATE INDEX idx_help_requests_timeout_status
  ON help_requests(is_timeout, status, deadline_at);

UPDATE help_requests
SET expected_handle_hours = COALESCE(expected_handle_hours, 24),
    deadline_at = COALESCE(
      deadline_at,
      DATE_ADD(request_datetime, INTERVAL COALESCE(expected_handle_hours, 24) HOUR)
    ),
    is_timeout = CASE
      WHEN COALESCE(
        deadline_at,
        DATE_ADD(request_datetime, INTERVAL COALESCE(expected_handle_hours, 24) HOUR)
      ) < NOW()
      AND status <> 'completed'
      THEN 1
      ELSE 0
    END;
