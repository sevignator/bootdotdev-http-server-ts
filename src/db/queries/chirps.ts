import { asc, desc, eq } from 'drizzle-orm';
import { db } from '../index.js';
import { type User, type NewChirp, type Chirp, chirps } from '../schema.js';

const sortingFns = {
  asc,
  desc,
};

export async function createChirp(
  body: NewChirp['body'],
  userId: User['id']
): Promise<Chirp> {
  const [result] = await db
    .insert(chirps)
    .values({
      body,
      userId,
    })
    .returning();

  return result;
}

export async function getChirp(id: Chirp['id']): Promise<Chirp> {
  const [result] = await db.select().from(chirps).where(eq(chirps.id, id));

  return result;
}

export async function deleteChirp(id: Chirp['id']): Promise<Chirp> {
  const [result] = await db.delete(chirps).where(eq(chirps.id, id)).returning();

  return result;
}

export async function getChirpsByUserId(
  userId: User['id'],
  sort: 'asc' | 'desc'
): Promise<Chirp[]> {
  const result = await db
    .select()
    .from(chirps)
    .where(eq(chirps.userId, userId))
    .orderBy(sortingFns[sort](chirps.createdAt));

  return result;
}

export async function getAllChirps(sort: 'asc' | 'desc'): Promise<Chirp[]> {
  const result = await db
    .select()
    .from(chirps)
    .orderBy(sortingFns[sort](chirps.createdAt));

  return result;
}
