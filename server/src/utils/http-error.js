export class HttpError extends Error {
  constructor(status, message, code = 1) {
    super(message);
    this.status = status;
    this.code = code;
  }
}
