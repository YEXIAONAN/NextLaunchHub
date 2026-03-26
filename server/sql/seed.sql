USE nextlaunch_hub;

SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE notifications;
TRUNCATE TABLE help_request_logs;
TRUNCATE TABLE help_requests;
TRUNCATE TABLE users;
SET FOREIGN_KEY_CHECKS = 1;

INSERT INTO users (id, username, password, real_name, role, status, created_at, updated_at) VALUES
  (1, 'admin', '$2b$10$Wdj1lOudt3JXEc6TBI2C6.Wafuv33FRdv9jRd9qtVdPYWmKmbtiTm', '系统管理员', 'admin', 1, '2026-03-20 09:00:00', '2026-03-20 09:00:00'),
  (2, 'helper.chen', '$2b$10$Wdj1lOudt3JXEc6TBI2C6.Wafuv33FRdv9jRd9qtVdPYWmKmbtiTm', '陈志远', 'helper', 1, '2026-03-20 09:05:00', '2026-03-20 09:05:00'),
  (3, 'helper.lin', '$2b$10$Wdj1lOudt3JXEc6TBI2C6.Wafuv33FRdv9jRd9qtVdPYWmKmbtiTm', '林书宁', 'helper', 1, '2026-03-20 09:06:00', '2026-03-20 09:06:00'),
  (4, 'helper.zhou', '$2b$10$Wdj1lOudt3JXEc6TBI2C6.Wafuv33FRdv9jRd9qtVdPYWmKmbtiTm', '周明启', 'helper', 1, '2026-03-20 09:07:00', '2026-03-20 09:07:00'),
  (5, 'req.wang', '$2b$10$Wdj1lOudt3JXEc6TBI2C6.Wafuv33FRdv9jRd9qtVdPYWmKmbtiTm', '王欣怡', 'requester', 1, '2026-03-20 09:10:00', '2026-03-20 09:10:00'),
  (6, 'req.zhang', '$2b$10$Wdj1lOudt3JXEc6TBI2C6.Wafuv33FRdv9jRd9qtVdPYWmKmbtiTm', '张文博', 'requester', 1, '2026-03-20 09:11:00', '2026-03-20 09:11:00'),
  (7, 'req.liu', '$2b$10$Wdj1lOudt3JXEc6TBI2C6.Wafuv33FRdv9jRd9qtVdPYWmKmbtiTm', '刘若晴', 'requester', 1, '2026-03-20 09:12:00', '2026-03-20 09:12:00'),
  (8, 'req.he', '$2b$10$Wdj1lOudt3JXEc6TBI2C6.Wafuv33FRdv9jRd9qtVdPYWmKmbtiTm', '何嘉辰', 'requester', 1, '2026-03-20 09:13:00', '2026-03-20 09:13:00');

INSERT INTO help_requests
  (
    id, request_no, title, requester_user_id, requester_name, helper_user_id, helper_name,
    content, requester_ip, request_datetime, request_date, expected_handle_hours,
    deadline_at, is_timeout, status, requester_confirmed_at, requester_feedback, created_at, updated_at
  )
VALUES
  (1, 'HLP202603250001', '权限开通申请未生效', 5, '王欣怡', 2, '陈志远', '市场部同事已提交权限开通申请，但系统中仍无法查看对应菜单，请协助核查。', '10.20.18.11', '2026-03-25 09:20:00', '2026-03-25', 24, '2026-03-26 09:20:00', 1, 'pending', NULL, NULL, '2026-03-25 09:20:00', '2026-03-25 09:20:00'),
  (2, 'HLP202603250002', '项目清单导出失败', 6, '张文博', 2, '陈志远', '在导出项目清单时页面提示处理失败，多次重试结果一致，请尽快处理。', '10.20.18.35', '2026-03-25 10:10:00', '2026-03-25', 24, '2026-03-26 10:10:00', 1, 'processing', NULL, NULL, '2026-03-25 10:10:00', '2026-03-25 10:25:00'),
  (3, 'HLP202603250003', '日报审批记录缺失', 7, '刘若晴', 3, '林书宁', '昨日提交的日报已审批，但今天无法查询到审批记录，请确认数据是否同步。', '10.20.18.52', '2026-03-25 11:00:00', '2026-03-25', 24, '2026-03-26 11:00:00', 1, 'waiting_confirm', NULL, NULL, '2026-03-25 11:00:00', '2026-03-25 11:30:00'),
  (4, 'HLP202603250004', '登录验证码未发送', 8, '何嘉辰', 4, '周明启', '外部网络访问登录页时验证码短信未收到，影响正常登录，请排查短信通道。', '10.20.18.77', '2026-03-25 13:40:00', '2026-03-25', 24, '2026-03-26 13:40:00', 0, 'completed', '2026-03-25 15:10:00', NULL, '2026-03-25 13:40:00', '2026-03-25 15:10:00'),
  (5, 'HLP202603250005', '合同附件无法预览', 5, '王欣怡', 3, '林书宁', '合同管理页可以上传附件，但点击预览时一直转圈没有内容返回。', '10.20.18.11', '2026-03-25 16:20:00', '2026-03-25', 24, '2026-03-26 16:20:00', 0, 'pending', NULL, NULL, '2026-03-25 16:20:00', '2026-03-25 16:20:00');

INSERT INTO help_request_logs
  (help_request_id, operator_user_id, operator_name, action_type, action_content, created_at)
VALUES
  (1, 5, '王欣怡', 'create', '创建求助单，当前状态：待处理', '2026-03-25 09:20:00'),
  (2, 6, '张文博', 'create', '创建求助单，当前状态：待处理', '2026-03-25 10:10:00'),
  (2, 2, '陈志远', 'status_update', '将状态更新为：处理中', '2026-03-25 10:25:00'),
  (3, 7, '刘若晴', 'create', '创建求助单，当前状态：待处理', '2026-03-25 11:00:00'),
  (3, 3, '林书宁', 'status_update', '将状态更新为：待确认', '2026-03-25 11:30:00'),
  (4, 8, '何嘉辰', 'create', '创建求助单，当前状态：待处理', '2026-03-25 13:40:00'),
  (4, 4, '周明启', 'status_update', '将状态更新为：处理中', '2026-03-25 14:00:00'),
  (4, 4, '周明启', 'status_update', '将状态更新为：已完成', '2026-03-25 15:10:00'),
  (5, 5, '王欣怡', 'create', '创建求助单，当前状态：待处理', '2026-03-25 16:20:00');

INSERT INTO notifications
  (receiver_user_id, type, title, content, related_id, related_type, jump_path, is_read, created_at)
VALUES
  (2, 'help_request_created', '收到新的求助单', '求助单 HLP202603250001 已提交，请及时处理。', 1, 'help_request', '/help-center/1', 0, '2026-03-25 09:20:00'),
  (2, 'help_request_created', '收到新的求助单', '求助单 HLP202603250002 已提交，请及时处理。', 2, 'help_request', '/help-center/2', 1, '2026-03-25 10:10:00'),
  (3, 'help_request_created', '收到新的求助单', '求助单 HLP202603250003 已提交，请及时处理。', 3, 'help_request', '/help-center/3', 0, '2026-03-25 11:00:00'),
  (4, 'help_request_created', '收到新的求助单', '求助单 HLP202603250004 已提交，请及时处理。', 4, 'help_request', '/help-center/4', 1, '2026-03-25 13:40:00'),
  (3, 'help_request_created', '收到新的求助单', '求助单 HLP202603250005 已提交，请及时处理。', 5, 'help_request', '/help-center/5', 0, '2026-03-25 16:20:00');
