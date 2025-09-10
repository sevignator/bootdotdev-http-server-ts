import { eq } from 'drizzle-orm';
import { db } from '../index.js';
import { type User, type NewChirp, type Chirp, chirps } from '../schema.js';

export async function createChirp(body: NewChirp['body'], userId: User['id']) {
  const [result] = await db
    .insert(chirps)
    .values({
      body,
      userId,
    })
    .returning();

  return result;
}

export async function getChirp(id: Chirp['id']) {
  const [result] = await db.select().from(chirps).where(eq(chirps.id, id));

  return result;
}

export async function getAllChirps() {
  const result = await db.select().from(chirps).orderBy(chirps.createdAt);

  return result;
}
