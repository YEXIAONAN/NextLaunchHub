import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { pool } from '../db/pool.js';
import { env } from '../config/env.js';
import { HttpError } from '../utils/http-error.js';
import { canViewHelpRequest } from '../utils/permission.js';

const ALLOWED_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'application/pdf', 'text/plain']);

async function getAccessibleAttachment(user, attachmentId) {
  const [[attachment]] = await pool.query(
    `SELECT a.*, hr.helper_user_id, hr.requester_user_id
     FROM help_request_attachments a JOIN help_requests hr ON hr.id = a.help_request_id
     WHERE a.id = ? LIMIT 1`, [attachmentId]
  );
  if (!attachment) throw new HttpError(404, '附件不存在或无权限访问');
  const [[assistant]] = await pool.query(
    'SELECT id FROM help_request_assistants WHERE help_request_id = ? AND assistant_user_id = ? LIMIT 1',
    [attachment.help_request_id, user.id]
  );
  if (!canViewHelpRequest(user, attachment, assistant ? [user.id] : [])) throw new HttpError(404, '附件不存在或无权限访问');
  return attachment;
}

export async function uploadAttachment(user, helpRequestId, payload) {
  const name = String(payload.name || '').trim().slice(0, 255);
  const mimeType = String(payload.mimeType || '').trim();
  const dataUrl = String(payload.dataUrl || '');
  if (!name || !ALLOWED_MIME_TYPES.has(mimeType)) throw new HttpError(400, '仅支持 PNG、JPG、WebP、PDF 或 TXT 附件');
  const match = dataUrl.match(/^data:([^;]+);base64,([A-Za-z0-9+/=]+)$/);
  if (!match || match[1] !== mimeType) throw new HttpError(400, '附件数据格式不合法');
  const buffer = Buffer.from(match[2], 'base64');
  if (!buffer.length || buffer.length > env.uploadMaxBytes) throw new HttpError(400, `附件大小不能超过 ${Math.floor(env.uploadMaxBytes / 1024 / 1024)}MB`);
  const [[request]] = await pool.query('SELECT id, helper_user_id, requester_user_id FROM help_requests WHERE id = ? LIMIT 1', [helpRequestId]);
  const [[assistant]] = request ? await pool.query('SELECT id FROM help_request_assistants WHERE help_request_id = ? AND assistant_user_id = ? LIMIT 1', [helpRequestId, user.id]) : [[]];
  if (!request || !canViewHelpRequest(user, request, assistant ? [user.id] : [])) throw new HttpError(403, '求助单不存在或无权限上传附件');
  const extension = path.extname(name).replace(/[^.\w-]/g, '').slice(0, 12);
  const storedName = `${crypto.randomUUID()}${extension}`;
  await mkdir(env.uploadDir, { recursive: true });
  await writeFile(path.join(env.uploadDir, storedName), buffer, { flag: 'wx' });
  const [result] = await pool.query(
    `INSERT INTO help_request_attachments (help_request_id, uploaded_by_user_id, original_name, stored_name, mime_type, size_bytes)
     VALUES (?, ?, ?, ?, ?, ?)`, [helpRequestId, user.id, name, storedName, mimeType, buffer.length]
  );
  return { id: result.insertId, original_name: name, mime_type: mimeType, size_bytes: buffer.length, uploaded_by_user_id: user.id };
}

export async function downloadAttachment(user, attachmentId) {
  const attachment = await getAccessibleAttachment(user, attachmentId);
  return { attachment, filePath: path.resolve(env.uploadDir, attachment.stored_name) };
}
