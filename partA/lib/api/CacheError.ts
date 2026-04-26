
export enum CacheErrorCode {
  UNSUPPORTED_OPERATION = "UNSUPPORTED_OPERATION",
  INVALID_KEY = "INVALID_KEY",
  INVALID_CAPACITY = "INVALID_CAPACITY",
  INVALID_TTL = "INVALID_TTL",
}

export class CacheError extends Error {
  public readonly code: CacheErrorCode;

  constructor(code: CacheErrorCode, message: string) {
    super(message);
    this.name = "CacheError";
    this.code = code;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}