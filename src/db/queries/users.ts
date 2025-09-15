import { eq } from 'drizzle-orm';

import { db } from '../index.js';
import {
  type NewUser,
  type RefreshToken,
  type User,
  users,
} from '../schema.js';
import { hashPassword } from '../../app/auth.js';

/**
 * @description
 * For creating a new user record in the database.
 */
export async function createUser(user: NewUser) {
  const [result] = await db
    .insert(users)
    .values(user)
    .onConflictDoNothing()
    .returning();

  return result;
}

/**
 * @description
 * For modifying the stored email address of a given user.
 * @param userId
 * The ID of a given user.
 * @param email
 * The new email address.
 * @returns
 */
export async function updateUserEmail(
  userId: User['id'],
  email: User['email']
): Promise<User> {
  const [result] = await db
    .update(users)
    .set({
      email,
    })
    .where(eq(users.id, userId))
    .returning();

  return result;
}

/**
 * @description
 * For modifying the stored password of a given user.
 * @param userId
 * The ID of a given user.
 * @param password
 * The new password (it will automatically be hashed by this function).
 * @returns
 */
export async function updateUserPassword(
  userId: User['id'],
  password: string
): Promise<User> {
  const hashedPassword = await hashPassword(password);
  const [result] = await db
    .update(users)
    .set({ hashedPassword })
    .where(eq(users.id, userId))
    .returning();

  return result;
}

/**
 * @description
 * For deleting all user records from the database.
 */
export async function deleteAllUsers() {
  await db.delete(users);
}

export async function getUserById(id: User['id']) {
  const [result] = await db.select().from(users).where(eq(users.id, id));

  return result;
}

export async function getUserByEmail(email: User['email']) {
  const [result] = await db.select().from(users).where(eq(users.email, email));

  return result;
}

export async function getUserFromRefreshToken(
  token: RefreshToken
): Promise<User> {
  const [result] = await db
    .select()
    .from(users)
    .where(eq(users.id, token.userId));

  return result;
}

export async function updateUserChirpyRedStatus(
  id: User['id'],
  isChirpyRed: User['isChirpyRed']
): Promise<User> {
  const [result] = await db
    .update(users)
    .set({
      isChirpyRed,
    })
    .where(eq(users.id, id))
    .returning();

  return result;
}
