import { type Request } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import { type User } from '../db/schema.js';
import { UnauthorizedError } from './errors.js';

const saltRounds = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, saltRounds);
}

export async function checkPasswordHash(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function makeJWT(
  userId: User['id'],
  expiresIn: number,
  secret: string
): string {
  const iat = Math.floor(Date.now() / 1000);

  const payload: Pick<jwt.JwtPayload, 'iss' | 'sub' | 'iat' | 'exp'> = {
    iss: 'chirpy',
    sub: userId,
    iat,
    exp: iat + expiresIn,
  };

  return jwt.sign(payload, secret);
}

export function validateJWT(tokenString: string, secret: string): string {
  try {
    const payload = jwt.verify(tokenString, secret);

    if (typeof payload.sub !== 'string') {
      throw new Error();
    }

    return payload.sub;
  } catch {
    throw new UnauthorizedError('Your token is invalid.');
  }
}

export function getBearerToken(req: Request): string {
  const authToken = req.get('Authorization');

  if (!authToken) {
    throw new Error('No authentication header was included in the request.');
  }

  return authToken?.replace('Bearer', '').trim();
}
