import { HttpError } from '../utils/http-error.js';
import { fail } from '../utils/response.js';

export function notFoundHandler(_req, res) {
  res.status(404).json(fail('接口不存在', 404));
}

export function errorHandler(error, _req, res, _next) {
  // 只有我们自己抛的 HttpError 才把消息原样返回给调用方。
  // 其他异常（尤其是 mysql2 的报错）会带上表名、字段名、字段长度等内部信息，
  // 未登录的调用方也能拿它探测库结构，所以只记日志，对外统一回一句通用提示。
  if (error instanceof HttpError) {
    if (error.status >= 500) {
      console.error(error);
    }
    res.status(error.status).json(fail(error.message, error.code));
    return;
  }

  console.error(error);
  res.status(500).json(fail('服务器内部错误', 500));
}
