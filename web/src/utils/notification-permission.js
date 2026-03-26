const PROMPT_FLAG_KEY = 'nextlaunch_hub_notification_prompted';

function isNotificationSupported() {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermission() {
  if (!isNotificationSupported()) {
    return 'unsupported';
  }

  return Notification.permission;
}

export function hasRequestedNotificationPermission() {
  return localStorage.getItem(PROMPT_FLAG_KEY) === '1';
}

function markNotificationPermissionRequested() {
  localStorage.setItem(PROMPT_FLAG_KEY, '1');
}

export async function requestNotificationPermission(options = {}) {
  const { force = false } = options;

  if (!isNotificationSupported()) {
    return 'unsupported';
  }

  const currentPermission = Notification.permission;
  if (currentPermission === 'granted') {
    return currentPermission;
  }

  if (!force && hasRequestedNotificationPermission()) {
    return currentPermission;
  }

  markNotificationPermissionRequested();
  return Notification.requestPermission();
}

export function showSystemNotification(payload) {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return null;
  }

  return new Notification(payload.title, {
    body: payload.body,
    tag: payload.tag || `help-request-${payload.requestId}`,
    renotify: true
  });
}
