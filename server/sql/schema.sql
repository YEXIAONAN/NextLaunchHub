CREATE DATABASE IF NOT EXISTS nextlaunch_hub DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE nextlaunch_hub;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL,
  password VARCHAR(255) NOT NULL,
  real_name VARCHAR(100) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'requester',
  status TINYINT NOT NULL DEFAULT 1,
  is_helper TINYINT(1) NOT NULL DEFAULT 0,
  is_requester TINYINT(1) NOT NULL DEFAULT 0,
  can_login TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_users_username (username),
  KEY idx_users_real_name (real_name),
  KEY idx_users_role_status (role, status),
  KEY idx_users_helper_status (is_helper, status, real_name),
  KEY idx_users_requester_status (is_requester, status, real_name),
  KEY idx_users_can_login_status (can_login, status)
);

CREATE TABLE IF NOT EXISTS projects (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  project_code VARCHAR(50) NOT NULL,
  project_name VARCHAR(100) NOT NULL,
  description TEXT DEFAULT NULL,
  owner_user_id BIGINT NOT NULL,
  owner_name VARCHAR(100) NOT NULL,
  priority VARCHAR(20) NOT NULL DEFAULT 'medium',
  status VARCHAR(30) NOT NULL DEFAULT 'not_started',
  start_date DATE DEFAULT NULL,
  end_date DATE DEFAULT NULL,
  progress INT NOT NULL DEFAULT 0,
  created_by BIGINT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_projects_code (project_code),
  KEY idx_projects_owner_status (owner_user_id, status),
  KEY idx_projects_priority_status (priority, status),
  KEY idx_projects_updated_at (updated_at),
  CONSTRAINT fk_projects_owner FOREIGN KEY (owner_user_id) REFERENCES users(id),
  CONSTRAINT fk_projects_created_by FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS project_members (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  project_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  real_name VARCHAR(100) NOT NULL,
  role_in_project VARCHAR(50) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_project_member (project_id, user_id),
  KEY idx_project_members_user (user_id),
  KEY idx_project_members_project (project_id),
  CONSTRAINT fk_project_members_project FOREIGN KEY (project_id) REFERENCES projects(id),
  CONSTRAINT fk_project_members_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS project_logs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  project_id BIGINT NOT NULL,
  operator_user_id BIGINT NOT NULL,
  operator_name VARCHAR(100) NOT NULL,
  action_type VARCHAR(50) NOT NULL,
  action_content TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_project_logs_project_created (project_id, created_at),
  CONSTRAINT fk_project_logs_project FOREIGN KEY (project_id) REFERENCES projects(id),
  CONSTRAINT fk_project_logs_user FOREIGN KEY (operator_user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS project_iterations (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  project_id BIGINT NOT NULL,
  iteration_name VARCHAR(100) NOT NULL,
  goal TEXT DEFAULT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'not_started',
  start_date DATE DEFAULT NULL,
  end_date DATE DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_project_iterations_project_status (project_id, status),
  KEY idx_project_iterations_date (project_id, start_date, end_date),
  CONSTRAINT fk_project_iterations_project FOREIGN KEY (project_id) REFERENCES projects(id)
);

CREATE TABLE IF NOT EXISTS project_milestones (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  project_id BIGINT NOT NULL,
  milestone_name VARCHAR(100) NOT NULL,
  description TEXT DEFAULT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'pending',
  due_date DATE DEFAULT NULL,
  completed_at DATETIME DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_project_milestones_project_status (project_id, status),
  KEY idx_project_milestones_due_date (project_id, due_date),
  CONSTRAINT fk_project_milestones_project FOREIGN KEY (project_id) REFERENCES projects(id)
);

CREATE TABLE IF NOT EXISTS tasks (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  task_code VARCHAR(50) NOT NULL,
  project_id BIGINT NOT NULL,
  iteration_id BIGINT DEFAULT NULL,
  milestone_id BIGINT DEFAULT NULL,
  title VARCHAR(150) NOT NULL,
  description TEXT DEFAULT NULL,
  assignee_user_id BIGINT DEFAULT NULL,
  assignee_name VARCHAR(100) DEFAULT NULL,
  priority VARCHAR(20) NOT NULL DEFAULT 'medium',
  status VARCHAR(30) NOT NULL DEFAULT 'todo',
  progress INT NOT NULL DEFAULT 0,
  start_date DATE DEFAULT NULL,
  due_date DATE DEFAULT NULL,
  estimated_hours DECIMAL(10, 2) DEFAULT NULL,
  actual_hours DECIMAL(10, 2) DEFAULT NULL,
  created_by BIGINT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_tasks_code (task_code),
  KEY idx_tasks_project_status (project_id, status),
  KEY idx_tasks_assignee_status (assignee_user_id, status),
  KEY idx_tasks_priority_status (priority, status),
  KEY idx_tasks_updated_at (updated_at),
  KEY idx_tasks_iteration_id (iteration_id),
  KEY idx_tasks_milestone_id (milestone_id),
  CONSTRAINT fk_tasks_project FOREIGN KEY (project_id) REFERENCES projects(id),
  CONSTRAINT fk_tasks_iteration FOREIGN KEY (iteration_id) REFERENCES project_iterations(id),
  CONSTRAINT fk_tasks_milestone FOREIGN KEY (milestone_id) REFERENCES project_milestones(id),
  CONSTRAINT fk_tasks_assignee FOREIGN KEY (assignee_user_id) REFERENCES users(id),
  CONSTRAINT fk_tasks_created_by FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS task_logs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  task_id BIGINT NOT NULL,
  operator_user_id BIGINT NOT NULL,
  operator_name VARCHAR(100) NOT NULL,
  action_type VARCHAR(50) NOT NULL,
  action_content TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_task_logs_task_created (task_id, created_at),
  CONSTRAINT fk_task_logs_task FOREIGN KEY (task_id) REFERENCES tasks(id),
  CONSTRAINT fk_task_logs_user FOREIGN KEY (operator_user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS help_requests (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  request_no VARCHAR(30) NOT NULL,
  title VARCHAR(120) NOT NULL,
  requester_user_id BIGINT NOT NULL,
  requester_name VARCHAR(100) NOT NULL,
  helper_user_id BIGINT NOT NULL,
  helper_name VARCHAR(100) NOT NULL,
  project_id BIGINT DEFAULT NULL,
  project_name VARCHAR(100) DEFAULT NULL,
  task_id BIGINT DEFAULT NULL,
  task_title VARCHAR(150) DEFAULT NULL,
  content TEXT NOT NULL,
  requester_ip VARCHAR(64) NOT NULL,
  request_datetime DATETIME NOT NULL,
  request_date DATE NOT NULL,
  expected_handle_hours INT DEFAULT NULL,
  deadline_at DATETIME DEFAULT NULL,
  is_timeout TINYINT NOT NULL DEFAULT 0,
  status VARCHAR(30) NOT NULL,
  requester_confirmed_at DATETIME DEFAULT NULL,
  requester_feedback VARCHAR(255) DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_help_requests_request_no (request_no),
  KEY idx_help_requests_helper_status (helper_user_id, status),
  KEY idx_help_requests_requester_status (requester_user_id, status),
  KEY idx_help_requests_request_datetime (request_datetime),
  KEY idx_help_requests_timeout_status (is_timeout, status, deadline_at),
  KEY idx_help_requests_project_id (project_id),
  KEY idx_help_requests_task_id (task_id),
  CONSTRAINT fk_help_requests_requester FOREIGN KEY (requester_user_id) REFERENCES users(id),
  CONSTRAINT fk_help_requests_helper FOREIGN KEY (helper_user_id) REFERENCES users(id),
  CONSTRAINT fk_help_requests_project FOREIGN KEY (project_id) REFERENCES projects(id),
  CONSTRAINT fk_help_requests_task FOREIGN KEY (task_id) REFERENCES tasks(id)
);

CREATE TABLE IF NOT EXISTS help_request_logs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  help_request_id BIGINT NOT NULL,
  operator_user_id BIGINT NOT NULL,
  operator_name VARCHAR(100) NOT NULL,
  action_type VARCHAR(50) NOT NULL,
  action_content TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_help_request_logs_request_id (help_request_id),
  CONSTRAINT fk_help_request_logs_request FOREIGN KEY (help_request_id) REFERENCES help_requests(id),
  CONSTRAINT fk_help_request_logs_operator FOREIGN KEY (operator_user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS help_request_assistants (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  help_request_id BIGINT NOT NULL,
  assistant_user_id BIGINT NOT NULL,
  assistant_name VARCHAR(100) NOT NULL,
  added_by_user_id BIGINT NOT NULL,
  added_by_name VARCHAR(100) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_help_request_assistant (help_request_id, assistant_user_id),
  KEY idx_help_request_assistants_user (assistant_user_id),
  KEY idx_help_request_assistants_request (help_request_id),
  CONSTRAINT fk_help_request_assistants_request FOREIGN KEY (help_request_id) REFERENCES help_requests(id),
  CONSTRAINT fk_help_request_assistants_user FOREIGN KEY (assistant_user_id) REFERENCES users(id),
  CONSTRAINT fk_help_request_assistants_added_by FOREIGN KEY (added_by_user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS notifications (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  receiver_user_id BIGINT NOT NULL,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(120) NOT NULL,
  content TEXT NOT NULL,
  related_id BIGINT DEFAULT NULL,
  related_type VARCHAR(50) DEFAULT NULL,
  jump_path VARCHAR(255) DEFAULT NULL,
  is_read TINYINT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_notifications_receiver_created (receiver_user_id, created_at),
  KEY idx_notifications_receiver_read_created (receiver_user_id, is_read, created_at),
  KEY idx_notifications_receiver_type_created (receiver_user_id, type, created_at),
  CONSTRAINT fk_notifications_receiver FOREIGN KEY (receiver_user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS system_dictionaries (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  dict_type VARCHAR(50) NOT NULL,
  dict_label VARCHAR(100) NOT NULL,
  dict_value VARCHAR(100) NOT NULL,
  sort_no INT NOT NULL DEFAULT 0,
  status TINYINT NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_system_dictionaries_type_value (dict_type, dict_value),
  KEY idx_system_dictionaries_type_status_sort (dict_type, status, sort_no, id)
);
