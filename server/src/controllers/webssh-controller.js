import { deleteSshHost, listSshHosts, saveSshHost } from '../services/webssh-service.js';
import { success } from '../utils/response.js';
export async function listSshHostsController(req, res) { res.json(success(await listSshHosts(req.user))); }
export async function saveSshHostController(req, res) { res.json(success(await saveSshHost(req.user, req.body), 'SSH 主机已保存')); }
export async function deleteSshHostController(req, res) { await deleteSshHost(req.user, Number(req.params.id)); res.json(success(null, 'SSH 主机已删除')); }
