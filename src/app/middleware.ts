import { type Request, type Response, type NextFunction } from 'express';

import { config } from '../config.js';
import { BadRequestError, ForbiddenError } from '../app/utils/errors.js';

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
  if (err instanceof BadRequestError) {
    res.status(400).json({
      error: err.message,
    });
  }
  if (err instanceof ForbiddenError) {
    res.status(403).json({
      error: err.message,
    });
  }
  res.status(500).json({
    error: 'Something went wrong on our end',
  });
}
