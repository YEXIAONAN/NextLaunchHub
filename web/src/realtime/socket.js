import { ElNotification } from 'element-plus';
import { io } from 'socket.io-client';
import { useNotificationStore } from '../stores/notifications';
import { useSystemNotificationStore } from '../stores/system-notification';
import { showSystemNotification } from '../utils/notification-permission';

let socketInstance = null;
let routerInstance = null;
let piniaInstance = null;

function getSocketBaseUrl() {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';

  if (apiBaseUrl.startsWith('http://') || apiBaseUrl.startsWith('https://')) {
    return apiBaseUrl.replace(/\/api\/?$/, '');
  }

  return window.location.origin;
}

function buildSystemNotificationBody(payload) {
  return `${payload.requestNo} ${payload.title} ${payload.requesterName}`;
}

function handleHelpRequestJump(requestId) {
  window.focus();
  if (routerInstance) {
    routerInstance.push(`/help-center/${requestId}`);
  }
}

function bindRealtimeEvents(socket) {
  socket.on('new_help_request', async (payload) => {
    const notificationStore = useNotificationStore(piniaInstance);
    const systemNotificationStore = useSystemNotificationStore(piniaInstance);

    ElNotification({
      title: '新的求助请求',
      message: payload.message,
      type: 'info',
      duration: 5000,
      onClick: () => handleHelpRequestJump(payload.requestId)
    });

    systemNotificationStore.refreshPermission();
    const systemNotification = showSystemNotification({
      title: '新的求助请求',
      body: buildSystemNotificationBody(payload),
      requestId: payload.requestId
    });

    if (systemNotification) {
      systemNotification.onclick = () => handleHelpRequestJump(payload.requestId);
    }

    await notificationStore.fetchUnreadCount();
  });

  socket.on('connect', () => {
    console.log(`[realtime] connected socketId=${socket.id}`);
  });

  socket.on('disconnect', (reason) => {
    console.log(`[realtime] disconnected reason=${reason}`);
  });

  socket.on('connect_error', (error) => {
    console.error('[realtime] connect_error', error.message);
  });
}

export function setupRealtime({ router, pinia }) {
  routerInstance = router;
  piniaInstance = pinia;
}

export function connectRealtime(token) {
  if (!token || !routerInstance || !piniaInstance) {
    return null;
  }

  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }

  socketInstance = io(getSocketBaseUrl(), {
    transports: ['websocket', 'polling'],
    auth: {
      token
    }
  });

  bindRealtimeEvents(socketInstance);
  return socketInstance;
}

export function disconnectRealtime() {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}
