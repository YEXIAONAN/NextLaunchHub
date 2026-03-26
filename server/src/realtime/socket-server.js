import { Server } from 'socket.io';
import { env } from '../config/env.js';
import {
  addUserSocket,
  getOnlineUsersSummary,
  getUserSocketIds,
  removeUserSocket
} from './online-user-manager.js';
import { authenticateSocket } from './socket-auth.js';

let ioInstance = null;

function getCorsOrigins() {
  return env.corsOrigin.split(',').map((item) => item.trim());
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

    socket.on('disconnect', (reason) => {
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
