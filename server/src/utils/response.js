export function success(data = null, message = 'success') {
  return {
    code: 0,
    message,
    data
  };
}

export function fail(message = 'error', code = 1, data = null) {
  return {
    code,
    message,
    data
  };
}
