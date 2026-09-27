import { pool } from '../db/pool.js';
import { HttpError } from '../utils/http-error.js';
import { buildHelpRequestListScope, buildProjectListScope, buildTaskListScope } from '../utils/permission.js';

export async function globalSearch(user, keyword) {
  const query = String(keyword || '').trim();
  if (query.length < 2) throw new HttpError(400, '请至少输入两个字符');
  if (query.length > 100) throw new HttpError(400, '搜索关键词不能超过100个字符');
  const like = `%${query}%`;
  const helpScope = buildHelpRequestListScope(user, 'hr');
  const projectScope = buildProjectListScope(user, 'p');
  const taskScope = buildTaskListScope(user, 't');
  const [[helpRows], [projectRows], [taskRows]] = await Promise.all([
    pool.query(`SELECT hr.id, hr.request_no AS code, hr.title, hr.status, 'help_request' AS type FROM help_requests hr ${helpScope.clause} AND (hr.request_no LIKE ? OR hr.title LIKE ? OR hr.content LIKE ?) ORDER BY hr.updated_at DESC LIMIT 8`, [...helpScope.params, like, like, like]),
    pool.query(`SELECT p.id, p.project_code AS code, p.project_name AS title, p.status, 'project' AS type FROM projects p ${projectScope.clause} AND (p.project_code LIKE ? OR p.project_name LIKE ? OR p.description LIKE ?) ORDER BY p.updated_at DESC LIMIT 8`, [...projectScope.params, like, like, like]),
    pool.query(`SELECT t.id, t.task_code AS code, t.title, t.status, 'task' AS type FROM tasks t ${taskScope.clause} AND (t.task_code LIKE ? OR t.title LIKE ? OR t.description LIKE ?) ORDER BY t.updated_at DESC LIMIT 8`, [...taskScope.params, like, like, like])
  ]);
  return { keyword: query, items: [...helpRows, ...projectRows, ...taskRows] };
}
