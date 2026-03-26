USE nextlaunch_hub;

CREATE TABLE IF NOT EXISTS projects (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  project_code VARCHAR(50) NOT NULL UNIQUE,
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
  CONSTRAINT fk_project_members_project FOREIGN KEY (project_id) REFERENCES projects(id),
  CONSTRAINT fk_project_members_user FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE KEY uk_project_member (project_id, user_id)
);

CREATE TABLE IF NOT EXISTS project_logs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  project_id BIGINT NOT NULL,
  operator_user_id BIGINT NOT NULL,
  operator_name VARCHAR(100) NOT NULL,
  action_type VARCHAR(50) NOT NULL,
  action_content TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_project_logs_project FOREIGN KEY (project_id) REFERENCES projects(id),
  CONSTRAINT fk_project_logs_user FOREIGN KEY (operator_user_id) REFERENCES users(id)
);

CREATE INDEX idx_projects_owner_status ON projects(owner_user_id, status);
CREATE INDEX idx_projects_priority_status ON projects(priority, status);
CREATE INDEX idx_projects_updated_at ON projects(updated_at);
CREATE INDEX idx_project_members_user ON project_members(user_id);
CREATE INDEX idx_project_members_project ON project_members(project_id);
CREATE INDEX idx_project_logs_project_created ON project_logs(project_id, created_at);
