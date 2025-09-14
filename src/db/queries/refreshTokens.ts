import { randomBytes } from 'node:crypto';
import { db } from '../index.js';
import { refreshTokens, type RefreshToken } from '../schema.js';
import { User } from '../schema.js';
import { eq } from 'drizzle-orm';

export async function createRefreshToken(userId: User['id']) {
  const token = randomBytes(32).toString('hex');

  const [result] = await db
    .insert(refreshTokens)
    .values({
      token,
      userId,
    })
    .returning();

  return result;
}

export async function getRefreshToken(token: RefreshToken['token']) {
  const [result] = await db
    .select()
    .from(refreshTokens)
    .where(eq(refreshTokens.token, token));

  return result;
}

export async function revokeRefreshToken(token: RefreshToken['token']) {
  const [result] = await db
    .update(refreshTokens)
    .set({
      revokedAt: new Date(),
    })
    .returning();

  return result;
}
