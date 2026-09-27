import crypto from 'node:crypto';
import { pool } from '../db/pool.js';
import { env } from '../config/env.js';
import { HttpError } from '../utils/http-error.js';

function ensureAdmin(user) { if (user?.role !== 'admin') throw new HttpError(403, '仅系统管理员可使用 WebSSH'); }
function key() { return crypto.scryptSync(env.jwtSecret, 'nextlaunch-webssh-password', 32); }
function encrypt(value) { const iv = crypto.randomBytes(12); const cipher = crypto.createCipheriv('aes-256-gcm', key(), iv); const content = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]); return `${iv.toString('base64')}.${cipher.getAuthTag().toString('base64')}.${content.toString('base64')}`; }
function decrypt(value) { const [iv, tag, content] = value.split('.').map((part) => Buffer.from(part, 'base64')); const decipher = crypto.createDecipheriv('aes-256-gcm', key(), iv); decipher.setAuthTag(tag); return Buffer.concat([decipher.update(content), decipher.final()]).toString('utf8'); }
function normalizePort(value) { const port = Number(value || 22); if (!Number.isInteger(port) || port < 1 || port > 65535) throw new HttpError(400, 'SSH 端口不合法'); return port; }

export async function listSshHosts(user) { ensureAdmin(user); const [rows] = await pool.query('SELECT id, host_name, host, port, username, created_at, updated_at FROM ssh_hosts ORDER BY updated_at DESC, id DESC'); return rows; }
export async function saveSshHost(user, payload) { ensureAdmin(user); const hostName = String(payload.hostName || '').trim(); const host = String(payload.host || '').trim(); const username = String(payload.username || '').trim(); const password = String(payload.password || ''); const port = normalizePort(payload.port); if (!hostName || !host || !username) throw new HttpError(400, '名称、IP 地址和用户名不能为空'); if (password.length < 1) throw new HttpError(400, '请输入 SSH 密码'); const encryptedPassword = encrypt(password); const [result] = await pool.query('INSERT INTO ssh_hosts (host_name, host, port, username, encrypted_password, created_by) VALUES (?, ?, ?, ?, ?, ?)', [hostName, host, port, username, encryptedPassword, user.id]); return { id: result.insertId, hostName, host, port, username }; }
export async function deleteSshHost(user, id) { ensureAdmin(user); const [result] = await pool.query('DELETE FROM ssh_hosts WHERE id = ?', [id]); if (!result.affectedRows) throw new HttpError(404, 'SSH 主机不存在'); }
export async function getSshHostCredentials(user, id) { ensureAdmin(user); const [[row]] = await pool.query('SELECT id, host_name, host, port, username, encrypted_password FROM ssh_hosts WHERE id = ? LIMIT 1', [id]); if (!row) throw new HttpError(404, 'SSH 主机不存在'); return { ...row, password: decrypt(row.encrypted_password) }; }
