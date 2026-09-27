ALTER TABLE help_requests
  ADD COLUMN IF NOT EXISTS first_response_at DATETIME DEFAULT NULL AFTER expected_handle_hours,
  ADD COLUMN IF NOT EXISTS resolved_at DATETIME DEFAULT NULL AFTER first_response_at,
  ADD COLUMN IF NOT EXISTS sla_breached_at DATETIME DEFAULT NULL AFTER resolved_at;
ALTER TABLE help_requests
  ADD COLUMN IF NOT EXISTS sla_notified_at DATETIME DEFAULT NULL AFTER sla_breached_at;

CREATE TABLE IF NOT EXISTS help_request_attachments (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  help_request_id BIGINT NOT NULL,
  uploaded_by_user_id BIGINT NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  stored_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  size_bytes INT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_help_request_attachments_request (help_request_id, created_at),
  CONSTRAINT fk_help_request_attachments_request FOREIGN KEY (help_request_id) REFERENCES help_requests(id),
  CONSTRAINT fk_help_request_attachments_user FOREIGN KEY (uploaded_by_user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  actor_user_id BIGINT DEFAULT NULL,
  action VARCHAR(80) NOT NULL,
  target_type VARCHAR(80) NOT NULL,
  target_id BIGINT DEFAULT NULL,
  summary VARCHAR(500) NOT NULL,
  ip_address VARCHAR(64) DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_audit_logs_target (target_type, target_id, created_at),
  KEY idx_audit_logs_actor (actor_user_id, created_at),
  CONSTRAINT fk_audit_logs_actor FOREIGN KEY (actor_user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS rate_limit_buckets (
  bucket_key CHAR(64) PRIMARY KEY,
  request_count INT NOT NULL,
  expires_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_rate_limit_buckets_expires (expires_at)
);
