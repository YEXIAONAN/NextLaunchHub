import { fail } from '../utils/response.js';

export function notFoundHandler(_req, res) {
  res.status(404).json(fail('接口不存在', 404));
}

export function errorHandler(error, _req, res, _next) {
  const status = error.status || 500;
  const message = error.message || '服务器内部错误';
  const code = error.code || status;

  if (status >= 500) {
    console.error(error);
  }

  res.status(status).json(fail(message, code));
}
