const onlineUserSockets = new Map();

function normalizeUserId(userId) {
  const normalized = Number(userId);
  return Number.isInteger(normalized) && normalized > 0 ? normalized : null;
}

export function addUserSocket(userId, socketId) {
  const normalizedUserId = normalizeUserId(userId);
  if (!normalizedUserId || !socketId) {
    return;
  }

  const existingSockets = onlineUserSockets.get(normalizedUserId) || new Map();
  existingSockets.set(socketId, {
    socketId,
    connectedAt: new Date().toISOString()
  });
  onlineUserSockets.set(normalizedUserId, existingSockets);
}

export function removeUserSocket(userId, socketId) {
  const normalizedUserId = normalizeUserId(userId);
  if (!normalizedUserId || !socketId) {
    return;
  }

  const existingSockets = onlineUserSockets.get(normalizedUserId);
  if (!existingSockets) {
    return;
  }

  existingSockets.delete(socketId);
  if (existingSockets.size === 0) {
    onlineUserSockets.delete(normalizedUserId);
  }
}

export function getUserSocketIds(userId) {
  const normalizedUserId = normalizeUserId(userId);
  if (!normalizedUserId) {
    return [];
  }

  return Array.from(onlineUserSockets.get(normalizedUserId)?.keys() || []);
}

export function getOnlineUsersSummary() {
  const users = Array.from(onlineUserSockets.entries())
    .map(([userId, sockets]) => ({
      userId,
      connectionCount: sockets.size,
      sockets: Array.from(sockets.values())
    }))
    .sort((a, b) => a.userId - b.userId);

  return {
    onlineUserIds: users.map((item) => item.userId),
    onlineUserCount: users.length,
    onlineConnectionCount: users.reduce((total, user) => total + user.connectionCount, 0),
    users
  };
}
