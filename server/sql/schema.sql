CREATE DATABASE IF NOT EXISTS nextlaunch_hub DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE nextlaunch_hub;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(100) NOT NULL,
  real_name VARCHAR(50) NOT NULL,
  role VARCHAR(20) NOT NULL,
  status TINYINT NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS help_requests (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  request_no VARCHAR(30) NOT NULL UNIQUE,
  title VARCHAR(120) NOT NULL,
  requester_user_id BIGINT NOT NULL,
  requester_name VARCHAR(50) NOT NULL,
  helper_user_id BIGINT NOT NULL,
  helper_name VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,
  requester_ip VARCHAR(64) NOT NULL,
  request_datetime DATETIME NOT NULL,
  request_date DATE NOT NULL,
  status VARCHAR(30) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_help_requests_requester FOREIGN KEY (requester_user_id) REFERENCES users(id),
  CONSTRAINT fk_help_requests_helper FOREIGN KEY (helper_user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS help_request_logs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  help_request_id BIGINT NOT NULL,
  operator_user_id BIGINT NOT NULL,
  operator_name VARCHAR(50) NOT NULL,
  action_type VARCHAR(50) NOT NULL,
  action_content TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_help_request_logs_request FOREIGN KEY (help_request_id) REFERENCES help_requests(id),
  CONSTRAINT fk_help_request_logs_operator FOREIGN KEY (operator_user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS notifications (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  receiver_user_id BIGINT NOT NULL,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(120) NOT NULL,
  content TEXT NOT NULL,
  related_id BIGINT DEFAULT NULL,
  is_read TINYINT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notifications_receiver FOREIGN KEY (receiver_user_id) REFERENCES users(id)
);

CREATE INDEX idx_help_requests_helper_status ON help_requests(helper_user_id, status);
CREATE INDEX idx_help_requests_request_datetime ON help_requests(request_datetime);
CREATE INDEX idx_help_request_logs_request_id ON help_request_logs(help_request_id);
CREATE INDEX idx_notifications_receiver_created ON notifications(receiver_user_id, created_at);
