import { type Request, type Response, type NextFunction } from 'express';

import { config } from '../config.js';
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from './errors.js';

export function middlewareLogResponses(
  req: Request,
  res: Response,
  next: NextFunction
) {
  res.on('finish', () => {
    if (res.statusCode !== 200) {
      console.log(
        `[NON-OK] ${req.method} ${req.url} - Status: ${res.statusCode}`
      );
    }
  });
  next();
}

export function middlewareMetricsInc(
  req: Request,
  res: Response,
  next: NextFunction
) {
  config.api.fileserverHits++;
  next();
}

export function middlewareHandleErrors(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  let statusCode: number;
  let errorMessage = err.message;

  switch (true) {
    case err instanceof BadRequestError:
      statusCode = 400;
      break;
    case err instanceof UnauthorizedError:
      statusCode = 401;
      break;
    case err instanceof ForbiddenError:
      statusCode = 403;
      break;
    case err instanceof NotFoundError:
      statusCode = 404;
      break;
    default:
      statusCode = 500;
      errorMessage = 'Something went wrong on our end';
  }

  res.status(statusCode).json({
    error: errorMessage,
  });
}
