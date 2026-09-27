import { Server } from 'socket.io';
import { env } from '../config/env.js';
import {
  addUserSocket,
  getOnlineUsersSummary,
  getUserSocketIds,
  removeUserSocket
} from './online-user-manager.js';
import { authenticateSocket } from './socket-auth.js';
import { Client } from 'ssh2';
import { getSshHostCredentials } from '../services/webssh-service.js';

let ioInstance = null;

function getCorsOrigins() {
  return env.corsOrigins;
}

export function initRealtime(httpServer) {
  ioInstance = new Server(httpServer, {
    cors: {
      origin: getCorsOrigins(),
      credentials: true
    }
  });

  ioInstance.use(authenticateSocket);

  ioInstance.on('connection', (socket) => {
    const user = socket.data.user;
    addUserSocket(user.userId, socket.id);

    console.log(
      `[realtime] connected userId=${user.userId} username=${user.username} role=${user.role} socketId=${socket.id} totalConnections=${getOnlineUsersSummary().onlineConnectionCount}`
    );

    let sshClient = null;
    let sshStream = null;
    const closeSsh = () => {
      sshStream?.end();
      sshClient?.end();
      sshStream = null;
      sshClient = null;
    };
    socket.on('webssh:connect', async ({ hostId } = {}) => {
      if (user.role !== 'admin') return socket.emit('webssh:error', { message: '仅系统管理员可使用 WebSSH' });
      closeSsh();
      try {
        const host = await getSshHostCredentials({ id: user.userId, role: user.role }, Number(hostId));
        sshClient = new Client();
        sshClient.on('ready', () => {
          sshClient.shell({ term: 'xterm-256color', cols: 120, rows: 32 }, (error, stream) => {
            if (error) return socket.emit('webssh:error', { message: '无法创建终端会话' });
            sshStream = stream;
            stream.on('data', (data) => socket.emit('webssh:data', data.toString('utf8')));
            stream.on('close', () => { socket.emit('webssh:closed'); closeSsh(); });
            socket.emit('webssh:ready', { hostName: host.host_name });
          });
        }).on('error', () => socket.emit('webssh:error', { message: 'SSH 连接失败，请检查 IP、端口、账号和密码' }))
          .connect({ host: host.host, port: host.port, username: host.username, password: host.password, readyTimeout: 12000 });
      } catch (error) { socket.emit('webssh:error', { message: error.message || '无法读取 SSH 主机配置' }); }
    });
    socket.on('webssh:input', (data) => { if (sshStream && typeof data === 'string') sshStream.write(data); });
    socket.on('webssh:resize', ({ cols, rows } = {}) => { if (sshStream) sshStream.setWindow(Number(rows) || 32, Number(cols) || 120, 0, 0); });

    socket.on('disconnect', (reason) => {
      closeSsh();
      removeUserSocket(user.userId, socket.id);
      console.log(
        `[realtime] disconnected userId=${user.userId} username=${user.username} role=${user.role} socketId=${socket.id} reason=${reason} totalConnections=${getOnlineUsersSummary().onlineConnectionCount}`
      );
    });
  });

  return ioInstance;
}

export function emitToUser(userId, event, payload) {
  const normalizedUserId = Number(userId);
  if (!ioInstance || !Number.isInteger(normalizedUserId) || normalizedUserId <= 0) {
    return 0;
  }

  const socketIds = getUserSocketIds(normalizedUserId);
  socketIds.forEach((socketId) => {
    ioInstance.to(socketId).emit(event, payload);
  });

  console.log(
    `[realtime] emit event=${event} userId=${normalizedUserId} connections=${socketIds.length} requestId=${payload?.requestId || ''}`
  );

  return socketIds.length;
}

export function getRealtimeSnapshot() {
  return getOnlineUsersSummary();
}
