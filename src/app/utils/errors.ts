/**
 * @description
 * Used for 400 Bad Request errors.
 */
export class BadRequestError extends Error {
  constructor(message: string) {
    super(message);
  }
}

/**
 * @description
 * Used for 401 Unauthorized errors.
 */
export class UnauthorizedError extends Error {
  constructor(message: string) {
    super(message);
  }
}

/**
 * @description
 * Used for 403 Forbidden errors.
 */
export class ForbiddenError extends Error {
  constructor(message: string) {
    super(message);
  }
}

/**
 * @description
 * Used for 404 Not Found errors.
 */
export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
  }
}
