import { db } from '../index.js';
import { type NewUser, type NewChirp, chirps } from '../schema.js';

export async function createChirp(
  body: NewChirp['body'],
  userId: NonNullable<NewUser['id']>
) {
  const [result] = await db
    .insert(chirps)
    .values({
      body,
      userId,
    })
    .returning();

  return result;
}
