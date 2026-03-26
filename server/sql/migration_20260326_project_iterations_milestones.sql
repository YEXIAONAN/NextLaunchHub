USE nextlaunch_hub;

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
  CONSTRAINT fk_project_milestones_project FOREIGN KEY (project_id) REFERENCES projects(id)
);

ALTER TABLE tasks
  ADD COLUMN iteration_id BIGINT NULL AFTER project_id,
  ADD COLUMN milestone_id BIGINT NULL AFTER iteration_id,
  ADD CONSTRAINT fk_tasks_iteration FOREIGN KEY (iteration_id) REFERENCES project_iterations(id),
  ADD CONSTRAINT fk_tasks_milestone FOREIGN KEY (milestone_id) REFERENCES project_milestones(id);

CREATE INDEX idx_project_iterations_project_status ON project_iterations(project_id, status);
CREATE INDEX idx_project_iterations_date ON project_iterations(project_id, start_date, end_date);
CREATE INDEX idx_project_milestones_project_status ON project_milestones(project_id, status);
CREATE INDEX idx_project_milestones_due_date ON project_milestones(project_id, due_date);
CREATE INDEX idx_tasks_iteration_id ON tasks(iteration_id);
CREATE INDEX idx_tasks_milestone_id ON tasks(milestone_id);
