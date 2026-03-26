USE nextlaunch_hub;

CREATE TABLE IF NOT EXISTS system_dictionaries (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  dict_type VARCHAR(50) NOT NULL,
  dict_label VARCHAR(100) NOT NULL,
  dict_value VARCHAR(100) NOT NULL,
  sort_no INT NOT NULL DEFAULT 0,
  status TINYINT NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_system_dictionaries_type_value (dict_type, dict_value)
);

CREATE INDEX idx_system_dictionaries_type_status_sort
  ON system_dictionaries(dict_type, status, sort_no, id);

INSERT INTO system_dictionaries (dict_type, dict_label, dict_value, sort_no, status, created_at, updated_at) VALUES
  ('project_status', '未开始', 'not_started', 10, 1, NOW(), NOW()),
  ('project_status', '进行中', 'in_progress', 20, 1, NOW(), NOW()),
  ('project_status', '已暂停', 'paused', 30, 1, NOW(), NOW()),
  ('project_status', '已完成', 'completed', 40, 1, NOW(), NOW()),
  ('project_status', '已归档', 'archived', 50, 1, NOW(), NOW()),

  ('project_priority', '低', 'low', 10, 1, NOW(), NOW()),
  ('project_priority', '中', 'medium', 20, 1, NOW(), NOW()),
  ('project_priority', '高', 'high', 30, 1, NOW(), NOW()),
  ('project_priority', '紧急', 'urgent', 40, 1, NOW(), NOW()),

  ('task_status', '待开始', 'todo', 10, 1, NOW(), NOW()),
  ('task_status', '进行中', 'in_progress', 20, 1, NOW(), NOW()),
  ('task_status', '受阻', 'blocked', 30, 1, NOW(), NOW()),
  ('task_status', '已完成', 'done', 40, 1, NOW(), NOW()),
  ('task_status', '已取消', 'cancelled', 50, 1, NOW(), NOW()),

  ('task_priority', '低', 'low', 10, 1, NOW(), NOW()),
  ('task_priority', '中', 'medium', 20, 1, NOW(), NOW()),
  ('task_priority', '高', 'high', 30, 1, NOW(), NOW()),
  ('task_priority', '紧急', 'urgent', 40, 1, NOW(), NOW()),

  ('help_request_status', '待处理', 'pending', 10, 1, NOW(), NOW()),
  ('help_request_status', '处理中', 'processing', 20, 1, NOW(), NOW()),
  ('help_request_status', '待确认', 'waiting_confirm', 30, 1, NOW(), NOW()),
  ('help_request_status', '已完成', 'completed', 40, 1, NOW(), NOW()),

  ('project_member_role', '产品负责人', 'product_owner', 10, 1, NOW(), NOW()),
  ('project_member_role', '项目经理', 'project_manager', 20, 1, NOW(), NOW()),
  ('project_member_role', '前端开发', 'frontend', 30, 1, NOW(), NOW()),
  ('project_member_role', '后端开发', 'backend', 40, 1, NOW(), NOW()),
  ('project_member_role', '测试', 'qa', 50, 1, NOW(), NOW()),
  ('project_member_role', '设计', 'designer', 60, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE
  dict_label = VALUES(dict_label),
  sort_no = VALUES(sort_no),
  status = VALUES(status),
  updated_at = NOW();
