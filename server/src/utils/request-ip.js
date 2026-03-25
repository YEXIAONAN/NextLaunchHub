export function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return String(forwarded).split(',')[0].trim();
  }

  const realIp = req.headers['x-real-ip'];
  if (realIp) {
    return String(realIp).trim();
  }

  const socketIp = req.socket?.remoteAddress || '';
  return socketIp.replace('::ffff:', '');
}
