USE nextlaunch_hub;

SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE notifications;
TRUNCATE TABLE help_request_assistants;
TRUNCATE TABLE help_request_logs;
TRUNCATE TABLE help_requests;
TRUNCATE TABLE task_logs;
TRUNCATE TABLE tasks;
TRUNCATE TABLE project_milestones;
TRUNCATE TABLE project_iterations;
TRUNCATE TABLE project_logs;
TRUNCATE TABLE project_members;
TRUNCATE TABLE projects;
TRUNCATE TABLE system_dictionaries;
TRUNCATE TABLE users;
SET FOREIGN_KEY_CHECKS = 1;

INSERT INTO users (
  id, username, password, real_name, role, status, is_helper, is_requester, can_login, created_at, updated_at
) VALUES
  (1, 'admin', '$2b$10$Wdj1lOudt3JXEc6TBI2C6.Wafuv33FRdv9jRd9qtVdPYWmKmbtiTm', '系统管理员', 'admin', 1, 0, 0, 1, '2026-03-20 09:00:00', '2026-03-20 09:00:00'),
  (2, 'waiting', '$2b$10$Wdj1lOudt3JXEc6TBI2C6.Wafuv33FRdv9jRd9qtVdPYWmKmbtiTm', 'Waiting', 'helper', 1, 1, 0, 1, '2026-03-20 09:05:00', '2026-03-20 09:05:00'),
  (3, 'xiang', '$2b$10$Wdj1lOudt3JXEc6TBI2C6.Wafuv33FRdv9jRd9qtVdPYWmKmbtiTm', 'Xiang', 'helper', 1, 1, 0, 1, '2026-03-20 09:06:00', '2026-03-20 09:06:00'),
  (4, 'hi-tao', '$2b$10$Wdj1lOudt3JXEc6TBI2C6.Wafuv33FRdv9jRd9qtVdPYWmKmbtiTm', 'Hi-Tao', 'helper', 1, 1, 0, 1, '2026-03-20 09:07:00', '2026-03-20 09:07:00'),
  (5, 'zhouzhaoshuang', '$2b$10$Wdj1lOudt3JXEc6TBI2C6.Wafuv33FRdv9jRd9qtVdPYWmKmbtiTm', '周朝双', 'helper', 1, 1, 1, 1, '2026-03-20 09:08:00', '2026-03-20 09:08:00'),
  (6, 'huangjingwei', '$2b$10$Wdj1lOudt3JXEc6TBI2C6.Wafuv33FRdv9jRd9qtVdPYWmKmbtiTm', '黄警威', 'requester', 1, 0, 1, 0, '2026-03-20 09:10:00', '2026-03-20 09:10:00'),
  (7, 'lijunhao', '$2b$10$Wdj1lOudt3JXEc6TBI2C6.Wafuv33FRdv9jRd9qtVdPYWmKmbtiTm', '李俊昊', 'requester', 1, 0, 1, 0, '2026-03-20 09:11:00', '2026-03-20 09:11:00'),
  (8, 'huangzhengyu', '$2b$10$Wdj1lOudt3JXEc6TBI2C6.Wafuv33FRdv9jRd9qtVdPYWmKmbtiTm', '黄正宇', 'requester', 1, 0, 1, 0, '2026-03-20 09:12:00', '2026-03-20 09:12:00'),
  (9, 'nongqiufeng', '$2b$10$Wdj1lOudt3JXEc6TBI2C6.Wafuv33FRdv9jRd9qtVdPYWmKmbtiTm', '农秋峰', 'requester', 1, 0, 1, 0, '2026-03-20 09:13:00', '2026-03-20 09:13:00'),
  (10, 'chengyuxing', '$2b$10$Wdj1lOudt3JXEc6TBI2C6.Wafuv33FRdv9jRd9qtVdPYWmKmbtiTm', '程语兴', 'requester', 1, 0, 1, 0, '2026-03-20 09:14:00', '2026-03-20 09:14:00'),
  (11, 'chenqitian', '$2b$10$Wdj1lOudt3JXEc6TBI2C6.Wafuv33FRdv9jRd9qtVdPYWmKmbtiTm', '陈启添', 'requester', 1, 0, 1, 0, '2026-03-20 09:15:00', '2026-03-20 09:15:00'),
  (12, 'huangyushan', '$2b$10$Wdj1lOudt3JXEc6TBI2C6.Wafuv33FRdv9jRd9qtVdPYWmKmbtiTm', '黄郁珊', 'requester', 1, 0, 1, 0, '2026-03-20 09:16:00', '2026-03-20 09:16:00'),
  (13, 'liyixuan', '$2b$10$Wdj1lOudt3JXEc6TBI2C6.Wafuv33FRdv9jRd9qtVdPYWmKmbtiTm', '李易萱', 'requester', 1, 0, 1, 0, '2026-03-20 09:17:00', '2026-03-20 09:17:00'),
  (14, 'fufeijin', '$2b$10$Wdj1lOudt3JXEc6TBI2C6.Wafuv33FRdv9jRd9qtVdPYWmKmbtiTm', '付飞谨', 'requester', 1, 0, 1, 0, '2026-03-20 09:18:00', '2026-03-20 09:18:00'),
  (15, 'huangsiyie', '$2b$10$Wdj1lOudt3JXEc6TBI2C6.Wafuv33FRdv9jRd9qtVdPYWmKmbtiTm', '黄思烨', 'requester', 1, 0, 1, 0, '2026-03-20 09:19:00', '2026-03-20 09:19:00'),
  (16, 'liaomingsen', '$2b$10$Wdj1lOudt3JXEc6TBI2C6.Wafuv33FRdv9jRd9qtVdPYWmKmbtiTm', '廖铭森', 'requester', 1, 0, 1, 0, '2026-03-20 09:20:00', '2026-03-20 09:20:00');

INSERT INTO system_dictionaries (id, dict_type, dict_label, dict_value, sort_no, status, created_at, updated_at) VALUES
  (1, 'project_status', '未开始', 'not_started', 10, 1, NOW(), NOW()),
  (2, 'project_status', '进行中', 'in_progress', 20, 1, NOW(), NOW()),
  (3, 'project_status', '已暂停', 'paused', 30, 1, NOW(), NOW()),
  (4, 'project_status', '已完成', 'completed', 40, 1, NOW(), NOW()),
  (5, 'project_status', '已归档', 'archived', 50, 1, NOW(), NOW()),
  (6, 'project_priority', '低', 'low', 10, 1, NOW(), NOW()),
  (7, 'project_priority', '中', 'medium', 20, 1, NOW(), NOW()),
  (8, 'project_priority', '高', 'high', 30, 1, NOW(), NOW()),
  (9, 'project_priority', '紧急', 'urgent', 40, 1, NOW(), NOW()),
  (10, 'task_status', '待开始', 'todo', 10, 1, NOW(), NOW()),
  (11, 'task_status', '进行中', 'in_progress', 20, 1, NOW(), NOW()),
  (12, 'task_status', '受阻', 'blocked', 30, 1, NOW(), NOW()),
  (13, 'task_status', '已完成', 'done', 40, 1, NOW(), NOW()),
  (14, 'task_status', '已取消', 'cancelled', 50, 1, NOW(), NOW()),
  (15, 'task_priority', '低', 'low', 10, 1, NOW(), NOW()),
  (16, 'task_priority', '中', 'medium', 20, 1, NOW(), NOW()),
  (17, 'task_priority', '高', 'high', 30, 1, NOW(), NOW()),
  (18, 'task_priority', '紧急', 'urgent', 40, 1, NOW(), NOW()),
  (19, 'help_request_status', '待处理', 'pending', 10, 1, NOW(), NOW()),
  (20, 'help_request_status', '处理中', 'processing', 20, 1, NOW(), NOW()),
  (21, 'help_request_status', '待确认', 'waiting_confirm', 30, 1, NOW(), NOW()),
  (22, 'help_request_status', '已完成', 'completed', 40, 1, NOW(), NOW()),
  (23, 'project_member_role', '产品负责人', 'product_owner', 10, 1, NOW(), NOW()),
  (24, 'project_member_role', '项目经理', 'project_manager', 20, 1, NOW(), NOW()),
  (25, 'project_member_role', '前端开发', 'frontend', 30, 1, NOW(), NOW()),
  (26, 'project_member_role', '后端开发', 'backend', 40, 1, NOW(), NOW()),
  (27, 'project_member_role', '测试', 'qa', 50, 1, NOW(), NOW()),
  (28, 'project_member_role', '设计', 'designer', 60, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE
  dict_label = VALUES(dict_label),
  sort_no = VALUES(sort_no),
  status = VALUES(status),
  updated_at = VALUES(updated_at);

INSERT INTO projects (
  id, project_code, project_name, description, owner_user_id, owner_name, priority, status, start_date, end_date, progress, created_by, created_at, updated_at
) VALUES
  (1, 'PRJ202603260001', 'NextLaunch Hub 升级项目', '用于承载帮助中心、项目、任务与通知能力的内部协同平台升级。', 2, 'Waiting', 'high', 'in_progress', '2026-03-20', '2026-04-15', 68, 1, '2026-03-20 10:00:00', '2026-03-26 09:00:00'),
  (2, 'PRJ202603260002', '知识库检索优化', '优化帮助中心检索、状态筛选和详情呈现体验。', 3, 'Xiang', 'medium', 'not_started', '2026-03-27', '2026-04-20', 12, 1, '2026-03-21 11:00:00', '2026-03-26 09:30:00');

INSERT INTO project_members (
  id, project_id, user_id, real_name, role_in_project, created_at
) VALUES
  (1, 1, 2, 'Waiting', 'project_manager', '2026-03-20 10:05:00'),
  (2, 1, 3, 'Xiang', 'backend', '2026-03-20 10:06:00'),
  (3, 1, 4, 'Hi-Tao', 'frontend', '2026-03-20 10:07:00'),
  (4, 1, 5, '周朝双', 'qa', '2026-03-20 10:08:00'),
  (5, 2, 3, 'Xiang', 'project_manager', '2026-03-21 11:05:00'),
  (6, 2, 4, 'Hi-Tao', 'backend', '2026-03-21 11:06:00');

INSERT INTO project_logs (
  id, project_id, operator_user_id, operator_name, action_type, action_content, created_at
) VALUES
  (1, 1, 1, '系统管理员', 'create', '创建项目：NextLaunch Hub 升级项目', '2026-03-20 10:00:00'),
  (2, 1, 1, '系统管理员', 'add_member', '添加项目成员：Xiang，项目角色：backend', '2026-03-20 10:06:00'),
  (3, 2, 1, '系统管理员', 'create', '创建项目：知识库检索优化', '2026-03-21 11:00:00');

INSERT INTO project_iterations (
  id, project_id, iteration_name, goal, status, start_date, end_date, created_at, updated_at
) VALUES
  (1, 1, '迭代一：基础能力打底', '完成求助中心、通知、权限校验等基础能力。', 'completed', '2026-03-20', '2026-03-24', '2026-03-20 10:10:00', '2026-03-24 18:00:00'),
  (2, 1, '迭代二：项目任务整合', '推进项目、任务、导出与字典能力整合。', 'in_progress', '2026-03-25', '2026-03-31', '2026-03-25 09:00:00', '2026-03-26 09:00:00'),
  (3, 2, '迭代一：检索方案设计', '完成检索策略梳理与字段设计。', 'not_started', '2026-03-27', '2026-04-02', '2026-03-21 11:10:00', '2026-03-21 11:10:00');

INSERT INTO project_milestones (
  id, project_id, milestone_name, description, status, due_date, completed_at, created_at, updated_at
) VALUES
  (1, 1, '帮助中心正式可用', '求助提交、列表、详情和状态更新全链路可用。', 'completed', '2026-03-24', '2026-03-24 19:00:00', '2026-03-20 10:20:00', '2026-03-24 19:00:00'),
  (2, 1, '项目任务模块联调', '项目、任务、迭代、里程碑与字典联调通过。', 'in_progress', '2026-03-31', NULL, '2026-03-25 09:20:00', '2026-03-26 09:05:00'),
  (3, 2, '检索方案评审', '完成知识库检索方案评审。', 'pending', '2026-04-02', NULL, '2026-03-21 11:20:00', '2026-03-21 11:20:00');

INSERT INTO tasks (
  id, task_code, project_id, iteration_id, milestone_id, title, description, assignee_user_id, assignee_name, priority, status, progress, start_date, due_date, estimated_hours, actual_hours, created_by, created_at, updated_at
) VALUES
  (1, 'TSK202603260001', 1, 2, 2, '补齐用户管理与固定名单兼容', '梳理 users 结构，兼容固定帮助者与请求帮助者名单。', 2, 'Waiting', 'high', 'in_progress', 75, '2026-03-25', '2026-03-27', 12.00, 8.50, 1, '2026-03-25 09:30:00', '2026-03-26 09:30:00'),
  (2, 'TSK202603260002', 1, 2, 2, '整合 SQL 初始化文件', '将 schema 与 seed 收敛为最终版，移除 migration 文件。', 3, 'Xiang', 'urgent', 'in_progress', 60, '2026-03-25', '2026-03-28', 10.00, 6.00, 1, '2026-03-25 10:00:00', '2026-03-26 09:45:00'),
  (3, 'TSK202603260003', 1, 1, 1, '帮助中心状态流转联调', '验证待处理、处理中、待确认、已完成四个状态流转。', 4, 'Hi-Tao', 'medium', 'done', 100, '2026-03-21', '2026-03-24', 8.00, 8.00, 1, '2026-03-21 09:00:00', '2026-03-24 18:30:00'),
  (4, 'TSK202603260004', 2, 3, 3, '设计知识库搜索字段', '梳理标题、内容、标签的统一检索入口。', 4, 'Hi-Tao', 'medium', 'todo', 10, '2026-03-27', '2026-04-01', 6.00, NULL, 1, '2026-03-21 11:30:00', '2026-03-21 11:30:00');

INSERT INTO task_logs (
  id, task_id, operator_user_id, operator_name, action_type, action_content, created_at
) VALUES
  (1, 1, 1, '系统管理员', 'create', '创建任务：补齐用户管理与固定名单兼容', '2026-03-25 09:30:00'),
  (2, 1, 2, 'Waiting', 'update', '任务进度改为：75%；更新任务描述', '2026-03-26 09:30:00'),
  (3, 2, 1, '系统管理员', 'create', '创建任务：整合 SQL 初始化文件', '2026-03-25 10:00:00'),
  (4, 3, 1, '系统管理员', 'create', '创建任务：帮助中心状态流转联调', '2026-03-21 09:00:00'),
  (5, 3, 4, 'Hi-Tao', 'status_update', '将任务状态从：in_progress 更新为：done', '2026-03-24 18:30:00');

INSERT INTO help_requests (
  id, request_no, title, requester_user_id, requester_name, helper_user_id, helper_name, project_id, project_name, task_id, task_title, content, requester_ip, request_datetime, request_date, expected_handle_hours, deadline_at, is_timeout, status, requester_confirmed_at, requester_feedback, created_at, updated_at
) VALUES
  (1, 'HLP202603250001', '用户列表无法正常筛选', 6, '黄警威', 2, 'Waiting', 1, 'NextLaunch Hub 升级项目', 1, '补齐用户管理与固定名单兼容', '用户管理页按角色筛选后结果为空，请协助排查。', '10.20.18.11', '2026-03-25 09:20:00', '2026-03-25', 24, '2026-03-26 09:20:00', 1, 'processing', NULL, NULL, '2026-03-25 09:20:00', '2026-03-26 08:50:00'),
  (2, 'HLP202603250002', '项目导出文件为空', 7, '李俊昊', 3, 'Xiang', 1, 'NextLaunch Hub 升级项目', 2, '整合 SQL 初始化文件', '项目列表导出成功但表格没有数据。', '10.20.18.35', '2026-03-25 10:10:00', '2026-03-25', 24, '2026-03-26 10:10:00', 1, 'waiting_confirm', NULL, NULL, '2026-03-25 10:10:00', '2026-03-25 14:25:00'),
  (3, 'HLP202603250003', '求助详情日志未显示', 8, '黄正宇', 4, 'Hi-Tao', NULL, NULL, NULL, NULL, '求助单详情中的处理日志区域为空白。', '10.20.18.52', '2026-03-25 11:00:00', '2026-03-25', 24, '2026-03-26 11:00:00', 0, 'pending', NULL, NULL, '2026-03-25 11:00:00', '2026-03-25 11:00:00'),
  (4, 'HLP202603250004', '通知中心未读数不更新', 5, '周朝双', 5, '周朝双', 1, 'NextLaunch Hub 升级项目', 3, '帮助中心状态流转联调', '自己处理后通知角标仍然显示旧数量。', '10.20.18.77', '2026-03-25 13:40:00', '2026-03-25', 24, '2026-03-26 13:40:00', 0, 'completed', '2026-03-25 16:20:00', '已确认处理完成', '2026-03-25 13:40:00', '2026-03-25 16:20:00'),
  (5, 'HLP202603250005', '希望补充固定请求人名单', 10, '程语兴', 2, 'Waiting', NULL, NULL, NULL, NULL, '公共提交页希望请求人从固定名单中选择，不再手输。', '10.20.18.88', '2026-03-25 16:20:00', '2026-03-25', 24, '2026-03-26 16:20:00', 0, 'pending', NULL, NULL, '2026-03-25 16:20:00', '2026-03-25 16:20:00');

INSERT INTO help_request_logs (
  id, help_request_id, operator_user_id, operator_name, action_type, action_content, created_at
) VALUES
  (1, 1, 6, '黄警威', 'create', '创建求助单，当前状态：待处理', '2026-03-25 09:20:00'),
  (2, 1, 2, 'Waiting', 'status_update', '接单并开始处理，当前状态：处理中', '2026-03-25 09:45:00'),
  (3, 2, 7, '李俊昊', 'create', '创建求助单，当前状态：待处理', '2026-03-25 10:10:00'),
  (4, 2, 3, 'Xiang', 'status_update', '将状态从：待处理 更新为：待确认', '2026-03-25 14:25:00'),
  (5, 3, 8, '黄正宇', 'create', '创建求助单，当前状态：待处理', '2026-03-25 11:00:00'),
  (6, 4, 5, '周朝双', 'create', '创建求助单，当前状态：待处理', '2026-03-25 13:40:00'),
  (7, 4, 5, '周朝双', 'status_update', '将状态从：待处理 更新为：已完成', '2026-03-25 16:10:00'),
  (8, 4, 5, '周朝双', 'requester_confirm', '发起人确认已解决，说明：已确认处理完成', '2026-03-25 16:20:00'),
  (9, 5, 10, '程语兴', 'create', '创建求助单，当前状态：待处理', '2026-03-25 16:20:00');

INSERT INTO help_request_assistants (
  id, help_request_id, assistant_user_id, assistant_name, added_by_user_id, added_by_name, created_at
) VALUES
  (1, 1, 1, '系统管理员', 2, 'Waiting', '2026-03-25 10:00:00');

INSERT INTO notifications (
  id, receiver_user_id, type, title, content, related_id, related_type, jump_path, is_read, created_at
) VALUES
  (1, 2, 'help_request_created', '收到新的求助单', '求助单 HLP202603250001 已提交，请及时处理。', 1, 'help_request', '/help-center/1', 0, '2026-03-25 09:20:00'),
  (2, 3, 'help_request_created', '收到新的求助单', '求助单 HLP202603250002 已提交，请及时处理。', 2, 'help_request', '/help-center/2', 0, '2026-03-25 10:10:00'),
  (3, 4, 'help_request_created', '收到新的求助单', '求助单 HLP202603250003 已提交，请及时处理。', 3, 'help_request', '/help-center/3', 0, '2026-03-25 11:00:00'),
  (4, 5, 'help_request_created', '收到新的求助单', '求助单 HLP202603250004 已提交，请及时处理。', 4, 'help_request', '/help-center/4', 1, '2026-03-25 13:40:00'),
  (5, 2, 'help_request_created', '收到新的求助单', '求助单 HLP202603250005 已提交，请及时处理。', 5, 'help_request', '/help-center/5', 0, '2026-03-25 16:20:00'),
  (6, 7, 'help_request_status_changed', '求助单状态已更新', '求助单 HLP202603250002 当前状态为：待确认。', 2, 'help_request', '/help-center/2', 0, '2026-03-25 14:25:00'),
  (7, 2, 'assistant_added', '已被加入协同处理', '您已被加入求助单 HLP202603250001 的协同处理，请及时跟进。', 1, 'help_request', '/help-center/1', 1, '2026-03-25 10:00:00');
