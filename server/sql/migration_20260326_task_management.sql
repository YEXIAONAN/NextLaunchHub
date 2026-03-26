USE nextlaunch_hub;

CREATE TABLE IF NOT EXISTS tasks (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  task_code VARCHAR(50) NOT NULL UNIQUE,
  project_id BIGINT NOT NULL,
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
  CONSTRAINT fk_tasks_project FOREIGN KEY (project_id) REFERENCES projects(id),
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
  CONSTRAINT fk_task_logs_task FOREIGN KEY (task_id) REFERENCES tasks(id),
  CONSTRAINT fk_task_logs_user FOREIGN KEY (operator_user_id) REFERENCES users(id)
);

CREATE INDEX idx_tasks_project_status ON tasks(project_id, status);
CREATE INDEX idx_tasks_assignee_status ON tasks(assignee_user_id, status);
CREATE INDEX idx_tasks_priority_status ON tasks(priority, status);
CREATE INDEX idx_tasks_updated_at ON tasks(updated_at);
CREATE INDEX idx_task_logs_task_created ON task_logs(task_id, created_at);
