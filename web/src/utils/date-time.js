const APP_TIME_ZONE = 'Asia/Shanghai';

function formatParts(value, options) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  const parts = new Intl.DateTimeFormat('zh-CN', {
    timeZone: APP_TIME_ZONE,
    hourCycle: 'h23',
    ...options
  }).formatToParts(date);
  return Object.fromEntries(parts.map((part) => [part.type, part.value]));
}

export function formatDate(value) {
  const parts = formatParts(value, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  if (typeof parts === 'string') {
    return parts;
  }
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function formatDateTime(value) {
  const parts = formatParts(value, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
  if (typeof parts === 'string') {
    return parts;
  }
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}`;
}
