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

export async function deleteChirp(id: Chirp['id']) {
  const [result] = await db.delete(chirps).where(eq(chirps.id, id)).returning();

  return result;
}

export async function getChirpsByUserId(userId: User['id']): Promise<Chirp[]> {
  const result = await db
    .select()
    .from(chirps)
    .where(eq(chirps.userId, userId))
    .orderBy(chirps.createdAt);

  return result;
}

export async function getAllChirps(): Promise<Chirp[]> {
  const result = await db.select().from(chirps).orderBy(chirps.createdAt);

  return result;
}
